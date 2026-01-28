"""
Video Model
Handles video metadata and playback token generation
"""
import os
import secrets
import hashlib
from datetime import datetime, timedelta
from bson import ObjectId


class Video:
    """Video model for MongoDB operations"""
    
    COLLECTION_NAME = 'videos'
    
    # Token expiration time in minutes
    TOKEN_EXPIRY_MINUTES = 30
    
    def __init__(self, title, description, youtube_id, thumbnail_url, 
                 is_active=True, created_at=None, _id=None):
        self._id = _id
        self.title = title
        self.description = description
        self.youtube_id = youtube_id  # Never exposed to frontend
        self.thumbnail_url = thumbnail_url
        self.is_active = is_active
        self.created_at = created_at or datetime.utcnow()
    
    def to_dict(self):
        """Convert video to dictionary for MongoDB insertion"""
        return {
            'title': self.title,
            'description': self.description,
            'youtube_id': self.youtube_id,
            'thumbnail_url': self.thumbnail_url,
            'is_active': self.is_active,
            'created_at': self.created_at
        }
    
    def to_json(self, include_token=True, user_id=None):
        """
        Convert video to JSON-serializable dictionary for API response
        NEVER exposes youtube_id - only provides masked video_id and playback_token
        """
        data = {
            'video_id': str(self._id) if self._id else None,
            'title': self.title,
            'description': self.description,
            'thumbnail_url': self.thumbnail_url,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        
        # Generate playback token if requested
        if include_token and self._id and user_id:
            data['playback_token'] = self.generate_playback_token(user_id)
        
        return data
    
    def generate_playback_token(self, user_id):
        """
        Generate a time-limited playback token for video streaming
        Token includes: video_id, user_id, timestamp, signature
        """
        # Get secret key from environment
        secret_key = os.getenv('JWT_SECRET_KEY', 'dev-secret-key')
        
        # Create timestamp (expires in TOKEN_EXPIRY_MINUTES)
        expiry = datetime.utcnow() + timedelta(minutes=self.TOKEN_EXPIRY_MINUTES)
        expiry_ts = int(expiry.timestamp())
        
        # Create token data string
        token_data = f"{str(self._id)}:{user_id}:{expiry_ts}"
        
        # Generate signature using HMAC-like approach with SHA256
        signature = hashlib.sha256(
            f"{token_data}:{secret_key}".encode()
        ).hexdigest()[:16]
        
        # Return base64-like token
        import base64
        token_raw = f"{token_data}:{signature}"
        return base64.urlsafe_b64encode(token_raw.encode()).decode()
    
    @staticmethod
    def validate_playback_token(token, video_id, user_id):
        """
        Validate a playback token
        Returns True if token is valid and not expired
        """
        try:
            import base64
            
            # Decode token
            token_raw = base64.urlsafe_b64decode(token.encode()).decode()
            parts = token_raw.split(':')
            
            if len(parts) != 4:
                return False
            
            token_video_id, token_user_id, expiry_ts, signature = parts
            
            # Verify video_id and user_id match
            if token_video_id != str(video_id) or token_user_id != str(user_id):
                return False
            
            # Check expiration
            expiry = int(expiry_ts)
            if datetime.utcnow().timestamp() > expiry:
                return False
            
            # Verify signature
            secret_key = os.getenv('JWT_SECRET_KEY', 'dev-secret-key')
            token_data = f"{token_video_id}:{token_user_id}:{expiry_ts}"
            expected_signature = hashlib.sha256(
                f"{token_data}:{secret_key}".encode()
            ).hexdigest()[:16]
            
            return signature == expected_signature
            
        except Exception:
            return False
    
    @classmethod
    def from_dict(cls, data):
        """Create Video instance from MongoDB document"""
        if not data:
            return None
        return cls(
            _id=data.get('_id'),
            title=data.get('title'),
            description=data.get('description'),
            youtube_id=data.get('youtube_id'),
            thumbnail_url=data.get('thumbnail_url'),
            is_active=data.get('is_active', True),
            created_at=data.get('created_at')
        )
    
    @classmethod
    def create(cls, mongo_db, title, description, youtube_id, thumbnail_url):
        """Create a new video in the database"""
        video = cls(
            title=title,
            description=description,
            youtube_id=youtube_id,
            thumbnail_url=thumbnail_url
        )
        result = mongo_db.videos.insert_one(video.to_dict())
        video._id = result.inserted_id
        return video
    
    @classmethod
    def find_by_id(cls, mongo_db, video_id):
        """Find a video by its ID"""
        try:
            data = mongo_db.videos.find_one({'_id': ObjectId(video_id)})
            return cls.from_dict(data)
        except Exception:
            return None
    
    @classmethod
    def find_active(cls, mongo_db, limit=2):
        """Find active videos (used for dashboard)"""
        cursor = mongo_db.videos.find({'is_active': True}).limit(limit)
        return [cls.from_dict(doc) for doc in cursor]
    
    @classmethod
    def seed_sample_videos(cls, mongo_db):
        """Seed the database with sample videos if empty"""
        # Check if videos already exist
        if mongo_db.videos.count_documents({}) > 0:
            return False
        
        sample_videos = [
            {
                'title': 'Introduction to Python Programming',
                'description': 'Learn the basics of Python programming language in this comprehensive tutorial.',
                'youtube_id': 'dQw4w9WgXcQ',  # Example ID - never exposed to frontend
                'thumbnail_url': 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg'
            },
            {
                'title': 'Advanced Flask API Development',
                'description': 'Build production-ready APIs with Flask, including authentication and database integration.',
                'youtube_id': 'Z1RJmh_OqeA',  # Example ID - never exposed to frontend
                'thumbnail_url': 'https://img.youtube.com/vi/Z1RJmh_OqeA/maxresdefault.jpg'
            }
        ]
        
        for video_data in sample_videos:
            cls.create(
                mongo_db,
                title=video_data['title'],
                description=video_data['description'],
                youtube_id=video_data['youtube_id'],
                thumbnail_url=video_data['thumbnail_url']
            )
        
        return True

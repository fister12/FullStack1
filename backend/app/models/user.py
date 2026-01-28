"""
User Model
Handles user data operations and password hashing
"""
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from bson import ObjectId


class User:
    """User model for MongoDB operations"""
    
    COLLECTION_NAME = 'users'
    
    def __init__(self, email, name=None, password_hash=None, created_at=None, _id=None):
        self._id = _id
        self.name = name
        self.email = email
        self.password_hash = password_hash
        self.created_at = created_at or datetime.utcnow()
    
    @staticmethod
    def hash_password(password):
        """Generate a secure password hash"""
        return generate_password_hash(password, method='pbkdf2:sha256')
    
    @staticmethod
    def verify_password(password_hash, password):
        """Verify a password against its hash"""
        return check_password_hash(password_hash, password)
    
    def to_dict(self):
        """Convert user to dictionary for MongoDB insertion"""
        return {
            'name': self.name,
            'email': self.email,
            'password_hash': self.password_hash,
            'created_at': self.created_at
        }
    
    def to_json(self):
        """Convert user to JSON-serializable dictionary (excludes password)"""
        return {
            'id': str(self._id) if self._id else None,
            'name': self.name,
            'email': self.email,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    @classmethod
    def from_dict(cls, data):
        """Create User instance from MongoDB document"""
        if not data:
            return None
        return cls(
            _id=data.get('_id'),
            name=data.get('name'),
            email=data.get('email'),
            password_hash=data.get('password_hash'),
            created_at=data.get('created_at')
        )
    
    @classmethod
    def create(cls, mongo_db, email, password, name=None):
        """Create a new user in the database"""
        user = cls(
            name=name,
            email=email,
            password_hash=cls.hash_password(password)
        )
        result = mongo_db.users.insert_one(user.to_dict())
        user._id = result.inserted_id
        return user
    
    @classmethod
    def find_by_email(cls, mongo_db, email):
        """Find a user by email address"""
        data = mongo_db.users.find_one({'email': email})
        return cls.from_dict(data)
    
    @classmethod
    def find_by_id(cls, mongo_db, user_id):
        """Find a user by their ID"""
        try:
            data = mongo_db.users.find_one({'_id': ObjectId(user_id)})
            return cls.from_dict(data)
        except Exception:
            return None

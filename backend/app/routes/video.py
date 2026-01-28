"""
Video Routes
Handles video listing (dashboard) and secure streaming
"""
from flask import Blueprint, request, jsonify, Response
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import mongo
from app.models.video import Video

video_bp = Blueprint('video', __name__)


@video_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard():
    """
    Get dashboard with video tiles
    Returns exactly 2 active video objects with metadata only
    NEVER exposes raw YouTube URLs - only video_id and playback_token
    
    Headers:
        - Authorization: Bearer <access_token>
    
    Returns:
        - videos: Array of video objects with playback tokens
    """
    current_user_id = get_jwt_identity()
    
    # Seed sample videos if database is empty
    Video.seed_sample_videos(mongo.db)
    
    # Get active videos (backend decides which videos to show)
    videos = Video.find_active(mongo.db, limit=2)
    
    # Convert to JSON with playback tokens
    video_list = [
        video.to_json(include_token=True, user_id=current_user_id) 
        for video in videos
    ]
    
    return jsonify({
        'videos': video_list,
        'count': len(video_list)
    }), 200


@video_bp.route('/video/<video_id>/stream', methods=['GET'])
@jwt_required()
def stream_video(video_id):
    """
    Get masked stream URL for video playback
    Validates playback token before returning the embed URL
    
    URL Parameters:
        - video_id: The video ID
    
    Query Parameters:
        - token: The playback token from dashboard
    
    Headers:
        - Authorization: Bearer <access_token>
    
    Returns:
        - embed_url: YouTube embed URL (masked, only accessible via this endpoint)
        - embed_html: Ready-to-use HTML for WebView
    """
    current_user_id = get_jwt_identity()
    playback_token = request.args.get('token')
    
    # Validate token is provided
    if not playback_token:
        return jsonify({'error': 'Playback token is required'}), 400
    
    # Find the video
    video = Video.find_by_id(mongo.db, video_id)
    if not video:
        return jsonify({'error': 'Video not found'}), 404
    
    # Check if video is active (backend decision)
    if not video.is_active:
        return jsonify({'error': 'Video is not available'}), 403
    
    # Validate playback token
    if not Video.validate_playback_token(playback_token, video_id, current_user_id):
        return jsonify({'error': 'Invalid or expired playback token'}), 401
    
    # Generate masked embed URL
    # The YouTube ID is only revealed here, in the backend response
    embed_url = f"https://www.youtube.com/embed/{video.youtube_id}?autoplay=1&rel=0&modestbranding=1"
    
    # Also provide ready-to-use HTML for WebView
    embed_html = f'''
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            * {{ margin: 0; padding: 0; }}
            html, body {{ width: 100%; height: 100%; background: #000; }}
            iframe {{ width: 100%; height: 100%; border: none; }}
        </style>
    </head>
    <body>
        <iframe 
            src="{embed_url}"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen>
        </iframe>
    </body>
    </html>
    '''
    
    return jsonify({
        'video_id': video_id,
        'title': video.title,
        'embed_url': embed_url,
        'embed_html': embed_html
    }), 200


@video_bp.route('/video/<video_id>/embed', methods=['GET'])
def serve_embed_page(video_id):
    """
    Serve the video embed page directly (for WebView usage)
    This endpoint requires the token in query params
    
    This is an alternative approach where the WebView loads this URL directly
    and the backend serves the HTML with the embedded video
    """
    token = request.args.get('token')
    user_id = request.args.get('user_id')
    
    if not token or not user_id:
        return Response(
            '<html><body><h1>Access Denied</h1><p>Missing credentials</p></body></html>',
            status=401,
            mimetype='text/html'
        )
    
    # Find the video
    video = Video.find_by_id(mongo.db, video_id)
    if not video or not video.is_active:
        return Response(
            '<html><body><h1>Video Not Found</h1></body></html>',
            status=404,
            mimetype='text/html'
        )
    
    # Validate token
    if not Video.validate_playback_token(token, video_id, user_id):
        return Response(
            '<html><body><h1>Access Denied</h1><p>Invalid or expired token</p></body></html>',
            status=401,
            mimetype='text/html'
        )
    
    # Serve the embedded player
    embed_url = f"https://www.youtube.com/embed/{video.youtube_id}?autoplay=1&rel=0&modestbranding=1"
    
    html = f'''
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{video.title}</title>
        <style>
            * {{ margin: 0; padding: 0; }}
            html, body {{ width: 100%; height: 100%; background: #000; }}
            iframe {{ width: 100%; height: 100%; border: none; }}
        </style>
    </head>
    <body>
        <iframe 
            src="{embed_url}"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen>
        </iframe>
    </body>
    </html>
    '''
    
    return Response(html, status=200, mimetype='text/html')

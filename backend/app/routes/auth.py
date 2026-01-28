"""
Authentication Routes
Handles user signup, login, logout, and profile retrieval
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity,
    get_jwt
)
from app import mongo
from app.models.user import User

auth_bp = Blueprint('auth', __name__)

# Simple token blocklist (in production, use Redis)
token_blocklist = set()


@auth_bp.route('/signup', methods=['POST'])
def signup():
    """
    Create a new user account
    
    Request Body:
        - name: User's full name
        - email: User's email address
        - password: User's password (will be hashed)
    
    Returns:
        - message: Success message
        - user_id: Created user's ID
    """
    data = request.get_json()
    
    # Validate request data
    if not data:
        return jsonify({'error': 'Request body is required'}), 400
    
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400
    
    # Check if user already exists
    existing_user = User.find_by_email(mongo.db, email)
    if existing_user:
        return jsonify({'error': 'User with this email already exists'}), 409
    
    # Create new user
    try:
        user = User.create(mongo.db, email, password, name=name)
        return jsonify({
            'message': 'User created successfully',
            'user_id': str(user._id)
        }), 201
    except Exception as e:
        return jsonify({'error': f'Failed to create user: {str(e)}'}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Authenticate user and return JWT token
    
    Request Body:
        - email: User's email address
        - password: User's password
    
    Returns:
        - access_token: JWT access token
        - user: User profile data
    """
    data = request.get_json()
    
    # Validate request data
    if not data:
        return jsonify({'error': 'Request body is required'}), 400
    
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400
    
    # Find user by email
    user = User.find_by_email(mongo.db, email)
    if not user:
        return jsonify({'error': 'Invalid email or password'}), 401
    
    # Verify password
    if not User.verify_password(user.password_hash, password):
        return jsonify({'error': 'Invalid email or password'}), 401
    
    # Create access token
    access_token = create_access_token(identity=str(user._id))
    
    return jsonify({
        'access_token': access_token,
        'user': user.to_json()
    }), 200


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """
    Get current authenticated user's profile
    
    Headers:
        - Authorization: Bearer <access_token>
    
    Returns:
        - User profile data
    """
    current_user_id = get_jwt_identity()
    
    user = User.find_by_id(mongo.db, current_user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify(user.to_json()), 200


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """
    Logout user by invalidating the current token
    
    Headers:
        - Authorization: Bearer <access_token>
    
    Returns:
        - message: Success message
    """
    jti = get_jwt()['jti']
    token_blocklist.add(jti)
    
    return jsonify({'message': 'Successfully logged out'}), 200


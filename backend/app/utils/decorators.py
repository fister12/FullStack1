"""
Custom Decorators
Utility decorators for route protection and validation
"""
from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity


def jwt_required_with_user(fn):
    """
    Decorator that requires JWT and injects user_id into the function
    Usage: @jwt_required_with_user
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            return fn(user_id=user_id, *args, **kwargs)
        except Exception as e:
            return jsonify({'error': 'Authentication required'}), 401
    return wrapper


def validate_json(*required_fields):
    """
    Decorator to validate required JSON fields in request
    Usage: @validate_json('email', 'password')
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            from flask import request
            data = request.get_json()
            
            if not data:
                return jsonify({'error': 'Request body is required'}), 400
            
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                return jsonify({
                    'error': f'Missing required fields: {", ".join(missing_fields)}'
                }), 400
            
            return fn(*args, **kwargs)
        return wrapper
    return decorator

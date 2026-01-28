"""
Flask Application Factory
"""
import os
from flask import Flask
from flask_pymongo import PyMongo
from flask_jwt_extended import JWTManager
from flask_cors import CORS

from .config import Config

# Initialize extensions
mongo = PyMongo()
jwt = JWTManager()


def create_app(config_class=Config):
    """Create and configure the Flask application"""
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Initialize extensions with app
    mongo.init_app(app)
    jwt.init_app(app)
    
    # Enable CORS for all routes
    CORS(app, resources={
        r"/*": {
            "origins": "*",
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    
    # Register blueprints
    from .routes.auth import auth_bp
    from .routes.video import video_bp
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(video_bp, url_prefix='')
    
    # Health check route
    @app.route('/health')
    def health_check():
        return {'status': 'healthy', 'message': 'API is running'}
    
    return app

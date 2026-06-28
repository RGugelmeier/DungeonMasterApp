from datetime import timedelta
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_mail import Mail
from dotenv import load_dotenv
import os
from pathlib import Path

env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path, override=True)

from server.database import db

mail = Mail()

from server.api.users import users_bp
from server.api.auth import auth_bp
from server.api.notes import notes_bp
from server.api.genAI import ai_bp
from server.api.characters import characters_bp

# Sets up the server app
def create_app():
    app = Flask(__name__)

    app.config['MAIL_SERVER'] = os.environ['MAIL_SERVER']
    app.config['MAIL_PORT'] = int(os.environ['MAIL_PORT'])
    app.config['MAIL_USE_TLS'] = True
    app.config['MAIL_USERNAME'] = os.environ['MAIL_USERNAME']
    app.config['MAIL_PASSWORD'] = os.environ['MAIL_PASSWORD']
    app.config['MAIL_DEFAULT_SENDER'] = os.environ['MAIL_DEFAULT_SENDER']
    mail.init_app(app)

    # JWT config — JWT_COOKIE_SECURE must be True when served over HTTPS
    app.config["JWT_COOKIE_SECURE"] = os.environ.get('JWT_COOKIE_SECURE', 'true').lower() == 'true'
    app.config["JWT_TOKEN_LOCATION"] = ["cookies"]
    app.config["JWT_SECRET_KEY"] = os.environ['JWT_SECRET']
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=6)
    JWTManager(app)

    app.register_blueprint(users_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(notes_bp)
    app.register_blueprint(ai_bp)
    app.register_blueprint(characters_bp)

    cors_origin = os.environ.get('CORS_ORIGIN', 'http://localhost:5173')
    CORS(app,
        origins=[cors_origin],
        supports_credentials=True,
        methods=["GET", "POST", "PATCH", "DELETE"])

    database_url = os.getenv('DATABASE_URL')
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url

    # For SQLite, disable connection pooling so every request gets a fresh
    # connection with no stale transaction snapshot (important for WAL mode).
    # For other databases, enable pool_pre_ping to validate connections on checkout.
    if database_url and database_url.startswith('sqlite'):
        from sqlalchemy.pool import NullPool
        app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
            'poolclass': NullPool,
            'connect_args': {'check_same_thread': False},
        }
    else:
        app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {'pool_pre_ping': True}

    db.init_app(app)

    with app.app_context():
        db.create_all()

    # Serve the built React frontend — must be registered last so API blueprints take priority
    dist_dir = os.path.join(os.path.dirname(__file__), '..', 'dist')

    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_react(path):
        full_path = os.path.join(dist_dir, path)
        if path and os.path.exists(full_path):
            return send_from_directory(dist_dir, path)
        return send_from_directory(dist_dir, 'index.html')

    return app
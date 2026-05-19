from datetime import timedelta
from flask import Flask, jsonify, request
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

    # JWT config
    app.config["JWT_COOKIE_SECURE"] = False  # TODO: When switching to production, change this to true.
    app.config["JWT_TOKEN_LOCATION"] = ["cookies"]
    app.config["JWT_SECRET_KEY"] = os.environ['JWT_SECRET']
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=6)
    JWTManager(app)

    app.register_blueprint(users_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(notes_bp)
    app.register_blueprint(ai_bp)
    app.register_blueprint(characters_bp)

    CORS(app, 
        origins=["http://localhost:5173"],
        supports_credentials=True,
        methods=["GET", "POST", "PATCH", "DELETE"])

    database_url = os.getenv('DATABASE_URL')
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url

    db.init_app(app)

    with app.app_context():
        db.create_all()

    return app
from datetime import timedelta
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv
import os
from server.database import db
from server.api.users import users_bp
from server.api.auth import auth_bp
from pathlib import Path

env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# Sets up the server app
def create_app():
    app = Flask(__name__)

    # JWT config
    app.config["JWT_COOKIE_SECURE"] = False  # TODO: When switching to production, change this to true.
    app.config["JWT_TOKEN_LOCATION"] = ["cookies"]
    app.config["JWT_SECRET_KEY"] = os.environ['JWT_SECRET']
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=30)
    JWTManager(app)

    app.register_blueprint(users_bp)
    app.register_blueprint(auth_bp)

    CORS(app, 
        origins=["http://localhost:5173"],
        methods=["GET", "POST", "PATCH", "DELETE"])

    database_url = os.getenv('DATABASE_URL')
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url

    db.init_app(app)

    with app.app_context():
        db.create_all()

    return app
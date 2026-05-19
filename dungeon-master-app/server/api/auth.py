from datetime import timedelta, datetime, timezone
import re
from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, jwt_required, get_jwt, get_jwt_identity, set_access_cookies, unset_jwt_cookies
from server.models import Users
import bcrypt
from server.database import db
import secrets
from server.api.services.mail_service import send_reset_email

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")

# Basic email format check for server-side validation.
EMAIL_REGEX = re.compile(r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$")

# This runs after every request due to "after_app_request" and checks to see if a JWT is expiring in the next 10 minutes.
# If it is, it sets access_token as a new JWT
# If there is no valid JWT or some other error happens, simply return the response (seen in the except block)
@auth_bp.after_app_request
def refresh_expiring_jwts(response):
    try:
        exp_timestamp = get_jwt()["exp"]
        now = datetime.now(timezone.utc)
        target_timestamp = datetime.timestamp(now + timedelta(minutes=10))
        if target_timestamp > exp_timestamp:
            access_token = create_access_token(identity=get_jwt_identity())
            set_access_cookies(response, access_token)
        return response
    except(RuntimeError, KeyError):
        return response

@auth_bp.get("/me")
@jwt_required()
def me():
    user_id = int(get_jwt_identity())
    result = Users.query.filter((Users.user_id == user_id)).first()
    return jsonify({
        'user_id': result.user_id,
        'username': result.username,
        'email': result.email,
        'created_at': result.created_at,
        'updated_at': result.updated_at,
        'user_type': result.user_type.value
    })

# Register a new user.
# First, verify the recieved data is valid. If it is, verify the password is long enough (in this case, 8 characters or more)
# Checks if a user already exists with the same email or email. If it does, do not allow a new account to be created.
# Otherwise, add the new user to the database with a hashed password.
@auth_bp.post("/register")
def register_new_user():
    data = request.get_json()
    if not data or 'username' not in data or 'email' not in data or 'password' not in data:
        return jsonify({'error': 'Invalid data when registering user'}), 400

    username = data['username'].strip()
    email = data['email'].strip().lower()
    password = data['password']

    if not EMAIL_REGEX.fullmatch(email):
        return jsonify({'error': 'Invalid email format'}), 400

    if not username:
        return jsonify({'error': 'Username cannot be empty'}), 400
    
    if len(password) < 8:
        return jsonify({'error': 'Password too short'}), 400

    existing_user = Users.query.filter((Users.username == username)| (Users.email == email)).first()
    if existing_user:
        return jsonify({'error': 'Username or email already in use'}), 409
    try:
        password_hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        new_user = Users(username=username, email=email, password_hashed=password_hashed)
        db.session.add(new_user)
        db.session.commit()
        return jsonify({
            'id': new_user.user_id,
            'username': new_user.username,
            'email': new_user.email,
            'created_at': new_user.created_at,
            'updated_at': new_user.updated_at
        }), 201
    except Exception as e:
        db.session.rollback()
        print(f"Registration error: {e}")
        return jsonify({'error': 'Registration failed'}), 500

# Attempts a login. First checks if the user with given email exists in the db.
# If it does, check to see if the hashed password in the db matches the entered password.
# Finally, if the user logs in successfully, creates a jwt and returns it to the client. It also sets the access cookie, which is what the JWT is sent in.
# The JWT uses a string version of user_id as the identity because Flask-jwt-extended's @jwt_required() requires a string when attempting to decode the JWT to find the data.
@auth_bp.post("/login")
def login():
    data = request.get_json()
    if not data or 'email' not in data or 'password' not in data:
        return jsonify({'error': 'Invalid login data'}), 400
    
    login_attempt = Users.query.filter_by(email=data['email']).first()

    if login_attempt:
        if bcrypt.checkpw(data['password'].encode('utf-8'), login_attempt.password_hashed.encode('utf-8')):
            response = jsonify({
                'Status': "Login successful!",
                'user_type': login_attempt.user_type.value
            })
            access_token = create_access_token(identity=str(login_attempt.user_id))
            set_access_cookies(response, access_token)
            return response, 200
    return jsonify({"error": "Invalid email or password"}), 401
    
# This logs out the user.
# First, it requires a jwt which also verifies that it is a valid jwt
# Then, attaches a unset_jwt_cookies response to the response, sending it back to the client
# The client retrieves this response which unsets the jwt, effectively logging out the client.
@auth_bp.post("/logout")
@jwt_required()
def logout():
    response = jsonify({'Status': 'Logout successful'})
    unset_jwt_cookies(response)
    return response, 200

# This creates a reset token and sends it to a user's email through services/mail_service.py
# secrets is used to generate a random token which is then assigned to the user in the db for matching later
@auth_bp.post("/forgot-password")
def forgot_password():
    data = request.get_json()
    if not data or 'email' not in data:
        return jsonify({'error': 'Email required'}), 400

    user = Users.query.filter_by(email=data['email'].strip().lower()).first()
    # Always return 200 to avoid revealing whether the email exists
    if user:
        token = secrets.token_urlsafe(32)
        user.reset_token = token
        user.reset_token_expiry = datetime.now(timezone.utc) + timedelta(minutes=30)
        db.session.commit()
        send_reset_email(user.email, token)

    return jsonify({'status': 'If that email exists, a reset link has been sent.'}), 200

# This actually resets the user's password. This is where reset token verification takes place. 
# First, it checks to see that a token and new password is found in the incoming data
# Next, it finds the user's token assigned in the db, and checks if it matches the token in the incoming data and that it has not expired
# Finally, it performs password difficulty verification and resets the password after hashing it and removing the token from the user's db entry
@auth_bp.post("/reset-password")
def reset_password():
    data = request.get_json()
    if not data or 'token' not in data or 'password' not in data:
        return jsonify({'error': 'Token and password required'}), 400

    user = Users.query.filter_by(reset_token=data['token']).first()
    if not user or user.reset_token_expiry < datetime.now(timezone.utc).replace(tzinfo=None):
        return jsonify({'error': 'Invalid or expired token'}), 400

    if len(data['password']) < 8:
        return jsonify({'error': 'Password too short'}), 400

    user.password_hashed = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    user.reset_token = None
    user.reset_token_expiry = None
    db.session.commit()
    return jsonify({'status': 'Password updated successfully'}), 200
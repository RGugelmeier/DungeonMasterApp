from flask import Blueprint, jsonify, request
from server.models import Users
from server.database import db
from flask_jwt_extended import jwt_required

users_bp = Blueprint("users", __name__, url_prefix="/users")

@users_bp.get("")
@jwt_required()
def get_users():
    users = Users.query.limit(50).all()
    return jsonify([{"user_id": u.user_id, "email": u.email} for u in users])

# Modify a user's username, email, or password
@users_bp.patch("modify")
@jwt_required()
def modify_existing_user():
    data = request.get_json()
    # Check to make sure that the data exists, has a user_id value, and has at least one modifiable value passed
    if not data or 'user_id' not in data or 'new_username' not in data and 'new_password_hashed' not in data and 'new_email' not in data:
        return jsonify({'error': 'Invalid data when modifying user'}), 400
    
    user_to_update = db.session.get(Users, {'user_id': data['user_id']})

    if 'new_username' in data:
        user_to_update.username = data['new_username']
    if 'new_email' in data:
        user_to_update.email = data['new_email']
    if 'new_password_hashed' in data:
        user_to_update.password_hashed = data['new_password_hashed']

    db.session.commit()

    return jsonify({
        'id': user_to_update.user_id,
        'username': user_to_update.username,
        'email': user_to_update.email,
        'password_hashed': user_to_update.password_hashed,
        'created_at': user_to_update.created_at,
        'updated_at': user_to_update.updated_at
    }), 200

# Delete user by user_id
@users_bp.delete("delete")
@jwt_required()
def delete_user():
    data = request.get_json()

    if not data or 'user_id' not in data:
        return jsonify({'error': 'Invalid data when deleting user'}), 400

    user_to_delete = db.session.get(Users, {'user_id': data['user_id']})

    if(user_to_delete):
        db.session.delete(user_to_delete)
    else:
        return jsonify({'error': 'user_to_delete not found'}), 400

    return jsonify({'deleted_user_id': data['user_id']}), 200
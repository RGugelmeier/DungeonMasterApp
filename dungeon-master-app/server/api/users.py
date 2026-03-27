from flask import Blueprint, jsonify, request
from server.models import Users, UserTypes
from server.database import db
from flask_jwt_extended import jwt_required, get_jwt_identity
import bcrypt

users_bp = Blueprint("users", __name__, url_prefix="/users")

@users_bp.get("")
@jwt_required()
def get_users():
    users = Users.query.limit(50).all()
    return jsonify([{"user_id": u.user_id, "email": u.email} for u in users])

# Promotes a user to an admin if they are not already one
# This must only be called by a user that is already an admin
@users_bp.patch("promote")
@jwt_required()
def promote_user():
    data = request.get_json()
    if not data or 'user_id' not in data:
        return jsonify({'error': 'Invalid data when promoting'})
    current_user = get_jwt_identity()
    current_user_data = db.session.get(Users, {'user_id': current_user})
    if current_user_data.user_type != UserTypes.ADMIN:
        return jsonify({'error': 'Invalid user'}), 403
    user_to_update = db.session.get(Users, {'user_id': data['user_id']})
    if(user_to_update.user_type != UserTypes.ADMIN):
        user_to_update.user_type = UserTypes.ADMIN
        db.session.commit()
        return jsonify({'id': user_to_update.user_id,
                        'user_type': user_to_update.user_type}), 200
    else:
        return jsonify({'error': 'User is already admin'}), 400

# Demotes a user to a standard user if they are not already
# This must only be called by a user that is an admin
@users_bp.patch("demote")
@jwt_required()
def demote_user():
    data = request.get_json()
    if not data or 'user_id' not in data:
        return jsonify({'error': 'Invalid data when promoting'})
    current_user = get_jwt_identity()
    current_user_data = db.session.get(Users, {'user_id': current_user})
    if current_user_data.user_type != UserTypes.ADMIN:
        return jsonify({'error': 'Invalid user'}), 403
    user_to_update = db.session.get(Users, {'user_id': data['user_id']})
    if(user_to_update.user_type != UserTypes.STANDARD):
        user_to_update.user_type = UserTypes.STANDARD
        db.session.commit()
        return jsonify({'id': user_to_update.user_id,
                        'user_type': user_to_update.user_type}), 200
    else:
        return jsonify({'error': 'User is already standard'}), 400

# Modify a user's username, email, or password
@users_bp.patch("modify")
@jwt_required()
def modify_existing_user():
    data = request.get_json()
    # Check to make sure that the data exists, has a user_id value, and has at least one modifiable value passed
    if not data or 'user_id' not in data or 'new_username' not in data and 'new_password' not in data and 'new_email' not in data:
        return jsonify({'error': 'Invalid data when modifying user'}), 400
    # Check to make sure that the user who is attempting to modify this user is themself, or an admin
    current_user = get_jwt_identity()
    current_user_data = db.session.get(Users, {'user_id': current_user})
    if current_user != data['user_id'] and current_user_data.user_type != 'admin':
        return jsonify({'error': 'Invalid user'}), 403
    user_to_update = db.session.get(Users, {'user_id': data['user_id']})

    if 'new_username' in data:
        user_to_update.username = data['new_username']
    if 'new_email' in data:
        user_to_update.email = data['new_email']
    if 'new_password' in data:
        new_password_hashed = bcrypt.hashpw(data['new_password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        user_to_update.password_hashed = new_password_hashed

    db.session.commit()

    return jsonify({
        'id': user_to_update.user_id,
        'username': user_to_update.username,
        'email': user_to_update.email,
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
    current_user = get_jwt_identity()
    if current_user != data['user_id']:
        return jsonify({'error': 'Invalid user'}), 403
    user_to_delete = db.session.get(Users, {'user_id': data['user_id']})

    if(user_to_delete):
        db.session.delete(user_to_delete)
        db.session.commit()
    else:
        return jsonify({'error': 'user_to_delete not found'}), 400

    return jsonify({'deleted_user_id': data['user_id']}), 200
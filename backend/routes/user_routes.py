from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, RoleEnum
from werkzeug.security import generate_password_hash

bp = Blueprint("users", __name__, url_prefix="/api/users")

# Helper function to check for Admin role
def is_admin():
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    return user and user.role.name == "ADMIN"

# NEW: Create User (Admin Only)
@bp.route("/", methods=["POST"])
@jwt_required()
def create_user():
    if not is_admin():
        return jsonify({"message": "Unauthorized"}), 403

    try:
        data = request.json
        if User.query.filter_by(email=data["email"]).first():
            return jsonify({"message": "Email already exists"}), 400

        user = User(
            full_name=data["full_name"],
            email=data["email"],
            password_hash=generate_password_hash(data["password"]),
            role=RoleEnum[data.get("role", "DEVELOPER").upper()]
        )
        db.session.add(user)
        db.session.commit()
        return jsonify({"message": "User created successfully", "id": user.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": str(e)}), 400

@bp.route("/", methods=["GET"])
@jwt_required()
def list_users():
    try:
        users = User.query.all()
        result = [{
            "id": u.id,
            "full_name": u.full_name,
            "email": u.email,
            "role": u.role.value
        } for u in users]
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 400

# NEW: Update User Role (Admin Only)
@bp.route("/<int:id>", methods=["PATCH"])
@jwt_required()
def update_user_role(id):
    if not is_admin():
        return jsonify({"message": "Unauthorized"}), 403
    
    try:
        data = request.json
        user_to_update = User.query.get_or_404(id)
        
        if 'role' in data:
            user_to_update.role = RoleEnum[data['role'].upper()]
            
        db.session.commit()
        return jsonify({"message": "User role updated"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": str(e)}), 400

@bp.route("/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_user(id):
    if not is_admin():
        return jsonify({"message": "Unauthorized"}), 403
    
    # NEW: Prevent admin from deleting themselves
    current_user_id = get_jwt_identity()
    if int(current_user_id) == id:
        return jsonify({"message": "You cannot delete your own account."}), 403

    try:
        user_to_delete = User.query.get_or_404(id)
        db.session.delete(user_to_delete)
        db.session.commit()
        return jsonify({"message": "User deleted"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": str(e)}), 400
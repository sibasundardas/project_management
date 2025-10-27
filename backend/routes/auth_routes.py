from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models import db, User, RoleEnum
from datetime import timedelta

bp = Blueprint("auth", __name__, url_prefix="/api/auth")

@bp.route("/register", methods=["POST"])
def register():
    try:
        data = request.json
        print(f"Register request: {data['email']}")
        
        if User.query.filter_by(email=data["email"]).first():
            return jsonify({"message": "Email already registered"}), 400
        
        user = User(
            full_name=data["full_name"],
            email=data["email"],
            password_hash=generate_password_hash(data["password"]),
            role=RoleEnum[data.get("role", "DEVELOPER").upper()]
        )
        db.session.add(user)
        db.session.commit()

        print(f"User registered: {user.email} (ID: {user.id})")
        return jsonify({"message": "User created successfully"}), 201
    except Exception as e:
        print(f"Register error: {str(e)}")
        import traceback
        traceback.print_exc()
        db.session.rollback()
        return jsonify({"message": str(e)}), 400

@bp.route("/login", methods=["POST"])
def login():
    try:
        data = request.json
        print(f"Login attempt: {data.get('email', 'NO EMAIL')}")
        
        user = User.query.filter_by(email=data["email"]).first()
        
        if not user:
            print(f"User not found: {data['email']}")
            return jsonify({"message": "Invalid email or password"}), 401
        
        if not check_password_hash(user.password_hash, data["password"]):
            print(f"Wrong password for: {data['email']}")
            return jsonify({"message": "Invalid email or password"}), 401
        
        # Create JWT token with user ID as STRING (Flask-JWT-Extended requirement)
        access_token = create_access_token(
            identity=str(user.id),  
            expires_delta=timedelta(hours=24)
        )

        print(f"Login successful: {user.email} (ID: {user.id}, Role: {user.role.value})")
        print(f"Token generated with identity: '{str(user.id)}' (string)")

        return jsonify({
            "access_token": access_token,
            "user": {
                "id": user.id,
                "name": user.full_name,
                "email": user.email,
                "role": user.role.value
            }
        }), 200
    except Exception as e:
        print(f"Login error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"message": str(e)}), 400

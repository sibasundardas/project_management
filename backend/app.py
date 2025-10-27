from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config
from models import db

app = Flask(__name__)
app.config.from_object(Config)

# CORS for API
CORS(app, resources={
    r"/api/*": {
        "origins": "*",
        "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "expose_headers": ["Content-Type", "Authorization"],
        "supports_credentials": False
    }
})

jwt = JWTManager(app)

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({"message": "Token has expired. Please login again."}), 401

@jwt.invalid_token_loader
def invalid_token_callback(error):
    return jsonify({"message": "Invalid token. Please login again."}), 422

@jwt.unauthorized_loader
def unauthorized_callback(error):
    return jsonify({"message": "Missing authorization token. Please login."}), 401

@jwt.revoked_token_loader
def revoked_token_callback(jwt_header, jwt_payload):
    return jsonify({"message": "Token has been revoked"}), 401

db.init_app(app)

with app.app_context():
    db.create_all()
    print("=" * 60)
    print("Database tables created successfully!")
    print("=" * 60)

# Import and register blueprints
from routes.auth_routes import bp as auth_bp
from routes.project_routes import bp as projects_bp
from routes.task_routes import bp as tasks_bp
from routes.user_routes import bp as users_bp
from routes.comment_routes import bp as comments_bp
from routes.ai_routes import bp as ai_bp  # NEW

app.register_blueprint(auth_bp)
app.register_blueprint(projects_bp)
app.register_blueprint(tasks_bp)
app.register_blueprint(users_bp)
app.register_blueprint(comments_bp)
app.register_blueprint(ai_bp)  # NEW

@app.route("/")
def home():
    return {"message": "Project Management API running", "status": "OK"}

@app.errorhandler(Exception)
def handle_error(error):
    print(f"Unhandled Error: {str(error)}")
    import traceback
    traceback.print_exc()
    return {"message": f"Server error: {str(error)}"}, 500

if __name__ == "__main__":
    import os
    port = int(os.getenv("PORT", 5000))
    print("=" * 60)
    print("🚀 Starting Flask Server...")
    print("=" * 60)
    app.run(debug=True, host="0.0.0.0", port=port)

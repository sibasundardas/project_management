from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Comment, Task, User
from datetime import datetime

bp = Blueprint("comments", __name__, url_prefix="/api/comments")

@bp.route("/task/<int:task_id>", methods=["GET"])
@jwt_required()
def get_task_comments(task_id):
    try:
        comments = Comment.query.filter_by(task_id=task_id).order_by(Comment.created_at.desc()).all()
        result = []
        for c in comments:
            user = User.query.get(c.user_id)
            result.append({
                "id": c.id,
                "content": c.content,
                "user_name": user.full_name if user else "Unknown",
                "user_role": user.role.value if user else "Unknown",
                "created_at": c.created_at.strftime("%Y-%m-%d %H:%M:%S")
            })
        return jsonify(result), 200
    except Exception as e:
        print(f"Error fetching comments: {str(e)}")
        return jsonify({"message": str(e)}), 400

@bp.route("/task/<int:task_id>", methods=["POST"])
@jwt_required()
def add_comment(task_id):
    try:
        current_user_id = get_jwt_identity()
        data = request.json
        
        # Verify task exists
        task = Task.query.get_or_404(task_id)
        
        # Verify user exists
        user = User.query.get(int(current_user_id))
        if not user:
            return jsonify({"message": "User not found"}), 404

        print(f"Adding comment to task {task_id} by {user.full_name}")

        comment = Comment(
            content=data["content"],
            task_id=task_id,
            user_id=int(current_user_id)
        )
        db.session.add(comment)
        db.session.commit()

        print(f"Comment added (ID: {comment.id})")
        return jsonify({
            "message": "Comment added",
            "id": comment.id
        }), 201
    except Exception as e:
        print(f"Error adding comment: {str(e)}")
        import traceback
        traceback.print_exc()
        db.session.rollback()
        return jsonify({"message": str(e)}), 400

@bp.route("/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_comment(id):
    try:
        current_user_id = get_jwt_identity()
        comment = Comment.query.get_or_404(id)
        
        # Only comment author or Admin can delete
        user = User.query.get(int(current_user_id))
        if comment.user_id != int(current_user_id) and user.role.name != "ADMIN":
            return jsonify({"message": "Unauthorized"}), 403
        
        db.session.delete(comment)
        db.session.commit()
        return jsonify({"message": "Comment deleted"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": str(e)}), 400

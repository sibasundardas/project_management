from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Task, TaskStatusEnum, User
from datetime import datetime, date

bp = Blueprint("tasks", __name__, url_prefix="/api/tasks")

@bp.route("/", methods=["POST"])
@jwt_required()
def create_task():
    try:
        current_user_id = get_jwt_identity()
        print(f"Current user ID from token: {current_user_id}")
        
        user = User.query.get(int(current_user_id))
        if not user:
            return jsonify({"message": "User not found"}), 404
        
        print(f"User found: {user.full_name} (Role: {user.role.value})")

        # Only Admin and Manager can create tasks
        if user.role.name not in ["ADMIN", "MANAGER"]:
            return jsonify({"message": "Unauthorized. Only Admin and Manager can create tasks."}), 403
        
        data = request.json
        print(f"Creating task: {data}")

        t = Task(
            title=data["title"],
            description=data.get("description", ""),
            project_id=data.get("project_id"),
            assigned_to=data.get("assigned_to"),
            deadline=datetime.strptime(data["deadline"], "%Y-%m-%d").date() if data.get("deadline") else None
        )
        db.session.add(t)
        db.session.commit()

        print(f"Task created with ID: {t.id}")
        return jsonify({
            "message": "Task created",
            "id": t.id
        }), 201
    except Exception as e:
        print(f"Error creating task: {str(e)}")
        import traceback
        traceback.print_exc()
        db.session.rollback()
        return jsonify({"message": str(e)}), 400

@bp.route("/", methods=["GET"])
@jwt_required()
def list_tasks():
    try:
        current_user_id = get_jwt_identity()
        print(f"Fetching tasks for user ID: {current_user_id}")
        
        user = User.query.get(int(current_user_id))
        if not user:
            return jsonify({"message": "User not found"}), 404

        print(f"User: {user.full_name} (Role: {user.role.value})")

        # Developers only see their assigned tasks
        if user.role.name == "DEVELOPER":
            tasks = Task.query.filter_by(assigned_to=int(current_user_id)).all()
        else:
            # Admin and Manager see all tasks
            tasks = Task.query.all()
        
        result = []
        for t in tasks:
            assigned_user = User.query.get(t.assigned_to) if t.assigned_to else None
            result.append({
                "id": t.id,
                "title": t.title,
                "description": t.description,
                "status": t.status.value,
                "project_id": t.project_id,
                "assigned_to": t.assigned_to,
                "assigned_to_name": assigned_user.full_name if assigned_user else "Unassigned",
                "deadline": t.deadline.isoformat() if t.deadline else None,
                "is_overdue": t.deadline < date.today() if t.deadline and t.status.name != "DONE" else False
            })

        print(f"Found {len(result)} tasks")
        return jsonify(result), 200
    except Exception as e:
        print(f"Error fetching tasks: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"message": str(e)}), 400

@bp.route("/<int:id>/status", methods=["PATCH"])
@jwt_required()
def update_status(id):
    try:
        current_user_id = get_jwt_identity()
        data = request.json

        print(f"Updating task {id} status to: {data['status']}")

        t = Task.query.get_or_404(id)
        
        # Developers can only update their own tasks
        user = User.query.get(int(current_user_id))
        if user.role.name == "DEVELOPER" and t.assigned_to != int(current_user_id):
            return jsonify({"message": "You can only update your own tasks"}), 403
        
        t.status = TaskStatusEnum[data["status"]]
        db.session.commit()

        print(f"Task {id} status updated")
        return jsonify({"message": "Status updated"}), 200
    except Exception as e:
        print(f"Error updating task status: {str(e)}")
        import traceback
        traceback.print_exc()
        db.session.rollback()
        return jsonify({"message": str(e)}), 400

@bp.route("/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_task(id):
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        # Only Admin and Manager can delete tasks
        if user.role.name not in ["ADMIN", "MANAGER"]:
            return jsonify({"message": "Unauthorized"}), 403
        
        task = Task.query.get_or_404(id)
        db.session.delete(task)
        db.session.commit()
        return jsonify({"message": "Task deleted"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": str(e)}), 400

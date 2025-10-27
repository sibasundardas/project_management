from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Project, Task, User
from datetime import date

bp = Blueprint("projects", __name__, url_prefix="/api/projects")

@bp.route("/", methods=["POST"])
@jwt_required()
def create_project():
    try:
        current_user_id = get_jwt_identity()
        print(f"Current user ID from token: {current_user_id} (type: {type(current_user_id)})")
        
        user = User.query.get(int(current_user_id))
        if not user:
            print(f"User not found with ID: {current_user_id}")
            return jsonify({"message": "User not found"}), 404

        print(f"User found: {user.full_name} (Role: {user.role.value})")

        # Only Admin and Manager can create projects
        if user.role.name not in ["ADMIN", "MANAGER"]:
            print(f"Unauthorized role: {user.role.value}")
            return jsonify({"message": "Unauthorized. Only Admin and Manager can create projects."}), 403
        
        data = request.json
        print(f"Creating project: {data}")

        p = Project(
            title=data["title"], 
            description=data.get("description", ""),
            created_by=int(current_user_id)
        )
        db.session.add(p)
        db.session.commit()

        print(f"Project created with ID: {p.id}")
        return jsonify({
            "message": "Project created",
            "id": p.id
        }), 201
    except Exception as e:
        print(f"Error creating project: {str(e)}")
        import traceback
        traceback.print_exc()
        db.session.rollback()
        return jsonify({"message": str(e)}), 400

@bp.route("/", methods=["GET"])
@jwt_required()
def list_projects():
    try:
        current_user_id = get_jwt_identity()
        print(f"Fetching projects for user ID: {current_user_id}")
        
        projects = Project.query.all()
        result = []
        for p in projects:
            creator = User.query.get(p.created_by) if p.created_by else None
            result.append({
                "id": p.id, 
                "title": p.title, 
                "description": p.description,
                "created_by": creator.full_name if creator else "Unknown",
                "task_count": len(p.tasks)
            })
        print(f"Found {len(result)} projects")
        return jsonify(result), 200
    except Exception as e:
        print(f"Error fetching projects: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"message": str(e)}), 400

@bp.route("/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_project(id):
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        # Only Admin can delete projects
        if user.role.name != "ADMIN":
            return jsonify({"message": "Unauthorized. Only Admin can delete projects."}), 403
        
        project = Project.query.get_or_404(id)
        db.session.delete(project)
        db.session.commit()
        return jsonify({"message": "Project deleted"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": str(e)}), 400

@bp.route("/<int:id>/metrics", methods=["GET"])
@jwt_required()
def metrics(id):
    try:
        project = Project.query.get_or_404(id)
        total = len(project.tasks)
        done = len([t for t in project.tasks if t.status.name == "DONE"])
        in_progress = len([t for t in project.tasks if t.status.name == "IN_PROGRESS"])
        todo = len([t for t in project.tasks if t.status.name == "TODO"])
        overdue = len([t for t in project.tasks if t.deadline and t.deadline < date.today() and t.status.name != "DONE"])
        percent = int((done / total) * 100) if total else 0
        return jsonify({
            "total": total,
            "done": done,
            "in_progress": in_progress,
            "todo": todo,
            "overdue": overdue,
            "progress": percent
        }), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 400

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from groq import Groq
from config import Config
from models import Project, Task

bp = Blueprint("ai", __name__, url_prefix="/api/ai")

def get_groq_client():
    if not Config.GROQ_API_KEY:
        raise RuntimeError("GROQ_API_KEY not set in environment")
    return Groq(api_key=Config.GROQ_API_KEY)

@bp.route("/assist", methods=["POST"])
@jwt_required()
def assist():
    try:
        data = request.get_json() or {}
        prompt = (data.get("prompt") or "").strip()
        project_id = data.get("project_id")
        mode = data.get("mode", "general")  # general | ideas | summary | description

        # Optional context from project/tasks
        context = ""
        if project_id:
            p = Project.query.get(project_id)
            if p:
                tasks = Task.query.filter_by(project_id=project_id).all()
                lines = [f"- {t.title} | {t.status.value} | Deadline: {t.deadline or 'N/A'}" for t in tasks]
                context = f"Project: {p.title}\nDescription: {p.description or 'N/A'}\nTasks:\n" + "\n".join(lines)

        if not prompt and not project_id:
            return jsonify({"message": "Provide 'prompt' or 'project_id'"}), 400

        final_prompt = prompt or f"Summarize the following project and suggest next steps:\n\n{context}"

        client = get_groq_client()
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are an expert project assistant for software teams."},
                {"role": "user", "content": f"Mode: {mode}\n\nContext:\n{context}\n\nUser Prompt:\n{final_prompt}"}
            ],
            temperature=0.4,
            max_completion_tokens=512,
        )

        text = completion.choices[0].message.content if completion.choices else ""
        return jsonify({"message": text}), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 500

from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import enum

db = SQLAlchemy()

class RoleEnum(enum.Enum):
    ADMIN = "Admin"
    MANAGER = "Manager"
    DEVELOPER = "Developer"

class TaskStatusEnum(enum.Enum):
    TODO = "To Do"
    IN_PROGRESS = "In Progress"
    DONE = "Done"

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum(RoleEnum), default=RoleEnum.DEVELOPER, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    # Relationship to tasks assigned to this user
    assigned_tasks = db.relationship("Task", backref="assigned_user", lazy=True, foreign_keys="Task.assigned_to")
    # Relationship to comments
    comments = db.relationship("Comment", backref="author", lazy=True)

class Project(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    created_by = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    tasks = db.relationship("Task", backref="project", cascade="all, delete-orphan")

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    status = db.Column(db.Enum(TaskStatusEnum), default=TaskStatusEnum.TODO)
    project_id = db.Column(db.Integer, db.ForeignKey("project.id"), nullable=True)
    assigned_to = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True)
    deadline = db.Column(db.Date, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    # Relationship to comments
    comments = db.relationship("Comment", backref="task", cascade="all, delete-orphan", lazy=True)

class Comment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    task_id = db.Column(db.Integer, db.ForeignKey("task.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

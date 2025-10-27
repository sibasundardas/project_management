import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { api } from "../api";
import { ai } from "../api";
import { toast } from "react-toastify";

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, todo: 0, inProgress: 0, done: 0, overdue: 0 });

  // Modals
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false); // For Admin to add users

  // Comments
  const [selectedTask, setSelectedTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  // Project form
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDesc, setProjectDesc] = useState("");

  // Task form
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskProjectId, setTaskProjectId] = useState("");
  const [taskAssignedTo, setTaskAssignedTo] = useState("");
  const [taskDeadline, setTaskDeadline] = useState("");

  // User form (for Admin)
  const [newUserFullName, setNewUserFullName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState("DEVELOPER");

  // AI Assistant
  const [aiInput, setAiInput] = useState("");
  const [aiMode, setAiMode] = useState("general");
  const [aiAnswer, setAiAnswer] = useState("");

  const userRole = localStorage.getItem("role");
  const userName = localStorage.getItem("name");
  const userId = localStorage.getItem("userId");
  const isAdmin = userRole === "Admin";
  const isManager = userRole === "Manager";

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      // Fetch all data in parallel
      const [pRes, tRes, uRes] = await Promise.all([
        api.getProjects(),
        api.getTasks(),
        api.getUsers(), // Admins and Managers need this
      ]);

      // Process Projects
      if (pRes.ok) {
        const pData = await pRes.json();
        setProjects(Array.isArray(pData) ? pData : []);
      } else {
        setProjects([]);
      }

      // Process Users
      if (uRes.ok) {
        const uData = await uRes.json();
        setUsers(Array.isArray(uData) ? uData : []);
      } else {
        setUsers([]);
      }
      
      // Process Tasks & Stats
      if (tRes.ok) {
        const tData = await tRes.json();
        const arr = Array.isArray(tData) ? tData : [];
        setTasks(arr);
        const total = arr.length;
        const todo = arr.filter((t) => t.status === "To Do").length;
        const inProgress = arr.filter((t) => t.status === "In Progress").length;
        const done = arr.filter((t) => t.status === "Done").length;
        const overdue = arr.filter((t) => t.is_overdue).length;
        setStats({ total, todo, inProgress, done, overdue });
      } else {
        setTasks([]);
      }
    } catch (err) {
      toast.error(`Error loading data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateProject(e) {
    e.preventDefault();
    try {
      const res = await api.createProject({ title: projectTitle, description: projectDesc });
      const data = await res.json();
      if (res.ok) {
        setShowProjectModal(false);
        setProjectTitle("");
        setProjectDesc("");
        loadData(); // Reload all data
        toast.success("Project created successfully!");
      } else {
        toast.error(`${data.message || "Failed to create project"}`);
      }
    } catch (err) {
      toast.error(`Error: ${err.message}`);
    }
  }

  async function handleCreateTask(e) {
    e.preventDefault();
    try {
      const res = await api.createTask({
        title: taskTitle,
        description: taskDesc,
        project_id: parseInt(taskProjectId),
        assigned_to: taskAssignedTo ? parseInt(taskAssignedTo) : null,
        deadline: taskDeadline || null,
      });
      const data = await res.json();
      if (res.ok) {
        setShowTaskModal(false);
        setTaskTitle("");
        setTaskDesc("");
        setTaskProjectId("");
        setTaskAssignedTo("");
        setTaskDeadline("");
        loadData(); // Reload all data
        toast.success("Task created successfully!");
      } else {
        toast.error(`${data.message || "Failed to create task"}`);
      }
    } catch (err) {
      toast.error(`Error: ${err.message}`);
    }
  }

  async function handleStatusChange(taskId, newStatus) {
    try {
      const res = await api.updateTaskStatus(taskId, newStatus);
      if (res.ok) {
        loadData(); // Reload all data
        toast.success(`Task #${taskId} status updated`);
      } else {
        const error = await res.json();
        toast.error(`${error.message || "Failed to update status"}`);
      }
    } catch (err) {
      toast.error(`Error: ${err.message}`);
    }
  }

  async function handleDeleteProject(id) {
    if (!window.confirm("Are you sure you want to delete this project? This will also delete all its tasks.")) return;
    try {
      const res = await api.deleteProject(id);
      if (res.ok) {
        loadData(); // Reload all data
        toast.success("Project deleted");
      } else {
        const error = await res.json();
        toast.error(`${error.message}`);
      }
    } catch (err) {
      toast.error(`Error: ${err.message}`);
    }
  }

  async function handleDeleteTask(id) {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      const res = await api.deleteTask(id);
      if (res.ok) {
        loadData(); // Reload all data
        toast.success("Task deleted");
      } else {
        const error = await res.json();
        toast.error(`${error.message}`);
      }
    } catch (err) {
      toast.error(`Error: ${err.message}`);
    }
  }

  // --- User Management Handlers (Admin Only) ---
  
  async function handleCreateUser(e) {
    e.preventDefault();
    try {
      const res = await api.createUser({
        full_name: newUserFullName,
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole,
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("User created successfully!");
        setShowUserModal(false);
        setNewUserFullName("");
        setNewUserEmail("");
        setNewUserPassword("");
        setNewUserRole("DEVELOPER");
        loadData(); // Reload all data
      } else {
        toast.error(data.message || "Failed to create user");
      }
    } catch (err) {
      toast.error(`Error: ${err.message}`);
    }
  }

  async function handleUpdateUserRole(userId, newRole) {
    try {
      const res = await api.updateUserRole(userId, newRole);
      const data = await res.json();
      if (res.ok) {
        toast.success("User role updated!");
        loadData(); // Reload all data
      } else {
        toast.error(data.message || "Failed to update role");
      }
    } catch (err) {
      toast.error(`Error: ${err.message}`);
    }
  }

  async function handleDeleteUser(userId) {
    if (!window.confirm("Are you sure you want to delete this user? This is irreversible.")) return;
    try {
      const res = await api.deleteUser(userId);
      const data = await res.json();
      if (res.ok) {
        toast.success("User deleted.");
        loadData(); // Reload all data
      } else {
        toast.error(data.message || "Failed to delete user");
      }
    } catch (err) {
      toast.error(`Error: ${err.message}`);
    }
  }


  // --- Comments Handlers ---
  
  async function loadComments(taskId) {
    try {
      const res = await api.getComments(taskId);
      if (res.ok) {
        const data = await res.json();
        setComments(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error loading comments:", err);
      toast.error(`Error loading comments: ${err.message}`);
    }
  }

  function openComments(task) {
    setSelectedTask(task);
    setShowCommentsModal(true);
    loadComments(task.id);
  }

  async function handleAddComment(e) {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const res = await api.addComment(selectedTask.id, newComment.trim());
      const data = await res.json();
      if (res.ok) {
        setNewComment("");
        loadComments(selectedTask.id); // Reload just comments
      } else {
        toast.error(`${data.message || "Failed to add comment"}`);
      }
    } catch (err) {
      toast.error(`Error: ${err.message}`);
    }
  }

  async function handleDeleteComment(id) {
    if (!window.confirm("Delete this comment?")) return;
    try {
      const res = await api.deleteComment(id);
      const data = await res.json();
      if (res.ok) {
        loadComments(selectedTask.id); // Reload just comments
        toast.success("Comment deleted");
      } else {
        toast.error(`${data.message || "Failed to delete comment"}`);
      }
    } catch (err) {
      toast.error(`Error: ${err.message}`);
    }
  }

  // --- AI Assistant Handlers ---
  
  async function askGroq() {
    if (!aiInput.trim()) {
      return toast.warn("Type a question or choose a project summary.");
    }
    try {
      setAiAnswer("Thinking...");
      const res = await ai.assist({ prompt: aiInput.trim(), mode: aiMode });
      const data = await res.json();
      if (res.ok) setAiAnswer(data.message || "");
      else toast.error(data.message || "AI request failed");
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function summarizeProject(projectId) {
    try {
      setAiAnswer("Summarizing project...");
      const res = await ai.assist({ project_id: projectId, mode: "summary" });
      const data = await res.json();
      if (res.ok) setAiAnswer(data.message || "");
      else toast.error(data.message || "AI request failed");
    } catch (err) {
      toast.error(err.message);
    }
  }

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="dashboard">
          <div style={{ textAlign: "center", padding: "50px", fontSize: "18px", color: "#667eea" }}>
            Loading...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="dashboard">
        {/* Stats */}
        <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "30px" }}>
          <div className="stat-card" style={{ background: "#dbeafe", padding: "20px", borderRadius: "10px" }}>
            <h3 style={{ margin: 0, color: "#1e40af", fontSize: "32px" }}>{stats.total}</h3>
            <p style={{ margin: "5px 0 0", color: "#1e40af" }}>Total Tasks</p>
          </div>
          <div className="stat-card" style={{ background: "#fef3c7", padding: "20px", borderRadius: "10px" }}>
            <h3 style={{ margin: 0, color: "#92400e", fontSize: "32px" }}>{stats.todo}</h3>
            <p style={{ margin: "5px 0 0", color: "#92400e" }}>To Do</p>
          </div>
          <div className="stat-card" style={{ background: "#dbeafe", padding: "20px", borderRadius: "10px" }}>
            <h3 style={{ margin: 0, color: "#1e40af", fontSize: "32px" }}>{stats.inProgress}</h3>
            <p style={{ margin: "5px 0 0", color: "#1e40af" }}>In Progress</p>
          </div>
          <div className="stat-card" style={{ background: "#d1fae5", padding: "20px", borderRadius: "10px" }}>
            <h3 style={{ margin: 0, color: "#065f46", fontSize: "32px" }}>{stats.done}</h3>
            <p style={{ margin: "5px 0 0", color: "#065f46" }}>Done</p>
          </div>
          <div className="stat-card" style={{ background: "#fee2e2", padding: "20px", borderRadius: "10px" }}>
            <h3 style={{ margin: 0, color: "#991b1b", fontSize: "32px" }}>{stats.overdue}</h3>
            <p style={{ margin: "5px 0 0", color: "#991b1b" }}>Overdue</p>
          </div>
        </div>

        <div className="dashboard-grid">
          {/* Projects */}
          <div className="section">
            <div className="section-header">
              <h2>Projects ({projects.length})</h2>
              {(isAdmin || isManager) && (
                <button className="btn-add" onClick={() => setShowProjectModal(true)}>
                  + Add Project
                </button>
              )}
            </div>

            {projects.length === 0 ? (
              <div className="empty-state">
                <p>No projects yet</p>
              </div>
            ) : (
              projects.map((p) => (
                <div key={p.id} className="card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                    <div style={{ flex: 1 }}>
                      <h3>{p.title}</h3>
                      <p>{p.description || "No description"}</p>
                      <p style={{ fontSize: "12px", color: "#999" }}>
                        Created by: {p.created_by} | Tasks: {p.task_count}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => summarizeProject(p.id)}
                        style={{ padding: "6px 12px", fontSize: "12px", background: "#10b981", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}
                      >
                        AI Summary
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteProject(p.id)}
                          style={{ padding: "6px 12px", fontSize: "12px", background: "#ef4444", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Tasks */}
          <div className="section">
            <div className="section-header">
              <h2>Tasks ({tasks.length})</h2>
              {(isAdmin || isManager) && (
                <button
                  className="btn-add"
                  onClick={() => setShowTaskModal(true)}
                  disabled={projects.length === 0}
                  style={{ opacity: projects.length === 0 ? 0.5 : 1 }}
                >
                  + Add Task
                </button>
              )}
            </div>

            {tasks.length === 0 ? (
              <div className="empty-state">
                <p>No tasks yet</p>
              </div>
            ) : (
              tasks.map((t) => {
                // Find the project title from the projects state
                const project = projects.find(p => p.id === t.project_id);
                const projectTitle = project ? project.title : `Project #${t.project_id}`; // Fallback to ID if not found

                return (
                  <div key={t.id} className="card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "10px" }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ marginBottom: "5px" }}>{t.title}</h3>
                        <p style={{ fontSize: "14px", color: "#666", marginBottom: "5px" }}>{t.description}</p>
                        <p style={{ fontSize: "12px", color: "#999" }}>
                          Project: {projectTitle} | Assigned to: {t.assigned_to_name}
                          {t.deadline && ` | Deadline: ${t.deadline}`}
                          {t.is_overdue && <span style={{ color: "#ef4444", fontWeight: "600" }}> (OVERDUE!)</span>}
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => openComments(t)}
                          style={{ padding: "6px 12px", fontSize: "12px", background: "#10b981", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}
                        >
                          Comments
                        </button>
                        {(isAdmin || isManager) && (
                          <button
                            onClick={() => handleDeleteTask(t.id)}
                            style={{ padding: "6px 12px", fontSize: "12px", background: "#ef4444", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                    <select
                      className={`status-badge status-${t.status.toLowerCase().replace(" ", "-")}`}
                      value={t.status.replace(" ", "_").toUpperCase()}
                      onChange={(e) => handleStatusChange(t.id, e.target.value)}
                      style={{ width: "100%" }}
                    >
                      <option value="TODO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="DONE">Done</option>
                    </select>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Team Members (Now with Admin Controls) */}
        {(isAdmin || isManager) && (
          <div className="section" style={{ marginTop: "30px" }}>
            <div className="section-header">
              <h2>Team Members ({users.length})</h2>
              {/* Admin-only button to add new users */}
              {isAdmin && (
                <button className="btn-add" onClick={() => setShowUserModal(true)}>
                  + Add User
                </button>
              )}
            </div>
            {users.length === 0 ? (
              <div className="empty-state">No users yet</div>
            ) : (
              users.map((u) => (
                <div key={u.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h3 style={{ marginBottom: "5px" }}>{u.full_name}</h3>
                    <p style={{ fontSize: "14px", color: "#666" }}>{u.email}</p>
                    {/* Admins see a dropdown to change roles */}
                    {isAdmin ? (
                      <select
                        value={u.role.toUpperCase()}
                        onChange={(e) => handleUpdateUserRole(u.id, e.target.value)}
                        style={{ marginTop: "10px", padding: "8px", borderRadius: "5px", border: "1px solid #ccc" }}
                        disabled={u.id === parseInt(userId)} // Admin cannot change their own role
                      >
                        <option value="ADMIN">Admin</option>
                        <option value="MANAGER">Manager</option>
                        <option value="DEVELOPER">Developer</option>
                      </select>
                    ) : (
                      // Non-admins just see their role as text
                      <span className={`status-badge`}>{u.role}</span>
                    )}
                  </div>
                  {/* Admins see a delete button, but not for their own account */}
                  {isAdmin && u.id !== parseInt(userId) && (
                    <button
                      onClick={() => handleDeleteUser(u.id)}
                      style={{ padding: "6px 12px", fontSize: "12px", background: "#ef4444", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* AI Assistant */}
        <div className="section" style={{ marginTop: 24 }}>
          <div className="section-header">
            <h2>AI Assistant</h2>
          </div>

          <div className="form-group">
            <select value={aiMode} onChange={(e) => setAiMode(e.target.value)}>
              <option value="general">General Q&A</option>
              <option value="ideas">Task ideas</option>
              <option value="summary">Project summary</option>
              <option value="description">Write description</option>
            </select>
          </div>

          <div className="form-group">
            <textarea
              placeholder="Ask anything about your project/tasks, or paste requirements..."
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-submit" onClick={askGroq}>
              Ask Groq
            </button>
          </div>

          {aiAnswer && (
            <div className="card" style={{ whiteSpace: "pre-wrap", marginTop: 12, background: "#f9fafb" }}>
              {aiAnswer}
            </div>
          )}
        </div>
      </div>

      {/* Project Modal */}
      {showProjectModal && (
        <div className="modal-overlay" onClick={() => setShowProjectModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Create New Project</h3>
            <form onSubmit={handleCreateProject}>
              <div className="form-group">
                <input placeholder="Project Title" value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} required />
              </div>
              <div className="form-group">
                <textarea placeholder="Project Description" value={projectDesc} onChange={(e) => setProjectDesc(e.target.value)} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowProjectModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Modal */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Create New Task</h3>
            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <input placeholder="Task Title" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} required />
              </div>
              <div className="form-group">
                <textarea placeholder="Task Description" value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} />
              </div>
              <div className="form-group">
                <select value={taskProjectId} onChange={(e) => setTaskProjectId(e.target.value)} required>
                  <option value="">Select Project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>
              {/* Assign to ANY team member */}
              <div className="form-group">
                <select value={taskAssignedTo} onChange={(e) => setTaskAssignedTo(e.target.value)}>
                  <option value="">Assign to Team Member (Optional)</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "600" }}>
                  Deadline (Optional)
                </label>
                <input type="date" value={taskDeadline} onChange={(e) => setTaskDeadline(e.target.value)} style={{ width: "100%" }} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowTaskModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW: User Modal (for Admin) */}
      {showUserModal && (
        <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Create New User</h3>
            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <input placeholder="Full Name" value={newUserFullName} onChange={(e) => setNewUserFullName(e.target.value)} required />
              </div>
              <div className="form-group">
                <input type="email" placeholder="Email" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <input type="password" placeholder="Password (min 6 chars)" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} required />
              </div>
              <div className="form-group">
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "600" }}>Role</label>
                <select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value)}>
                  <option value="DEVELOPER">Developer</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowUserModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Comments Modal */}
      {showCommentsModal && selectedTask && (
        <div className="modal-overlay" onClick={() => setShowCommentsModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Comments - {selectedTask.title}</h3>

            <form onSubmit={handleAddComment}>
              <div className="form-group">
                <textarea
                  placeholder={`Add a comment as ${userName} (${userRole})`}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowCommentsModal(false)}>
                  Close
                </button>
                <button type="submit" className="btn-submit">Add Comment</button>
              </div>
            </form>

            <div style={{ marginTop: "20px", maxHeight: "300px", overflowY: "auto" }}>
              {comments.length === 0 ? (
                <div className="empty-state">No comments yet</div>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="card" style={{ marginBottom: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{c.user_name} <span style={{ color: "#667eea" }}>({c.user_role})</span></div>
                        <div style={{ fontSize: "12px", color: "#999" }}>{c.created_at}</div>
                      </div>
                      {(isAdmin || c.user_name === userName) && (
                        <button
                          onClick={() => handleDeleteComment(c.id)}
                          style={{ padding: "4px 10px", background: "#ef4444", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    <p style={{ marginTop: "10px" }}>{c.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


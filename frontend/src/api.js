const BASE = process.env.REACT_APP_API_BASE || "http://127.0.0.1:5000";

const headers = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    console.warn("No token found in localStorage");
  }
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token || ""}`,
  };
};

export const api = {
  // Auth
  login: async (data) => {
    try {
      console.log("Login request:", data.email);
      const res = await fetch(`${BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      console.log("Login response:", json);
      return { ok: res.ok, status: res.status, data: json };
    } catch (err) {
      console.error("Login error:", err);
      throw err;
    }
  },

  register: async (data) => {
    try {
      console.log("Register request:", data.email);
      const res = await fetch(`${BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      console.log("Register response:", json);
      return { ok: res.ok, status: res.status, data: json };
    } catch (err) {
      console.error("Register error:", err);
      throw err;
    }
  },

  // Users
  getUsers: () => fetch(`${BASE}/api/users/`, { headers: headers() }),
  
  // NEW: Create User (Admin)
  createUser: (data) =>
    fetch(`${BASE}/api/users/`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(data),
    }),

  // NEW: Update User Role (Admin)
  updateUserRole: (id, role) =>
    fetch(`${BASE}/api/users/${id}`, {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify({ role }),
    }),

  deleteUser: (id) =>
    fetch(`${BASE}/api/users/${id}`, { method: "DELETE", headers: headers() }),

  // Projects
  getProjects: () => fetch(`${BASE}/api/projects/`, { headers: headers() }),
  createProject: (data) =>
    fetch(`${BASE}/api/projects/`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(data),
    }),
  deleteProject: (id) =>
    fetch(`${BASE}/api/projects/${id}`, { method: "DELETE", headers: headers() }),
  getProjectMetrics: (id) =>
    fetch(`${BASE}/api/projects/${id}/metrics`, { headers: headers() }),

  // Tasks
  getTasks: () => fetch(`${BASE}/api/tasks/`, { headers: headers() }),
  createTask: (data) =>
    fetch(`${BASE}/api/tasks/`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(data),
    }),
  updateTaskStatus: (id, status) =>
    fetch(`${BASE}/api/tasks/${id}/status`, {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify({ status }),
    }),
  deleteTask: (id) =>
    fetch(`${BASE}/api/tasks/${id}`, { method: "DELETE", headers: headers() }),

  // Comments (Moved from Dashboard.js)
  getComments: (taskId) =>
    fetch(`${BASE}/api/comments/task/${taskId}`, { headers: headers() }),
  
  addComment: (taskId, content) =>
    fetch(`${BASE}/api/comments/task/${taskId}`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ content }),
    }),

  deleteComment: (commentId) =>
    fetch(`${BASE}/api/comments/${commentId}`, {
      method: "DELETE",
      headers: headers(),
    }),
};

// AI client
export const ai = {
  assist: (payload) =>
    fetch(`${BASE}/api/ai/assist`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(payload),
    }),
};
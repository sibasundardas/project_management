import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { toast } from "react-toastify"; // Import toast

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("DEVELOPER");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    if (isRegister) {
      try {
        const result = await api.register({
          full_name: fullName,
          email,
          password,
          role: role,
        });

        if (result.ok) {
          // Replaced alert with toast
          toast.success("Registration successful. Please login.");
          setIsRegister(false);
          setFullName("");
          setEmail("");
          setPassword("");
          setRole("DEVELOPER");
        } else {
          // Replaced alert with toast
          toast.error(result.data.message || "Registration failed");
        }
      } catch (err) {
        // Replaced alert with toast
        toast.error(`Error: ${err.message}`);
      }
    } else {
      try {
        const result = await api.login({ email, password });

        if (result.ok) {
          console.log("Login successful, saving token...");
          
          // Save to localStorage
          localStorage.setItem("token", result.data.access_token);
          localStorage.setItem("name", result.data.user.name);
          localStorage.setItem("role", result.data.user.role);
          localStorage.setItem("userId", result.data.user.id);

          // Verify saved
          console.log("Token saved:", localStorage.getItem("token") ? "YES" : "NO");
          console.log("Token length:", localStorage.getItem("token")?.length || 0);

          // Navigate to dashboard
          navigate("/dashboard");
        } else {
          // Replaced alert with toast
          toast.error(result.data.message || "Login failed");
        }
      } catch (err) {
        // Replaced alert with toast
        toast.error(`Error: ${err.message}`);
      }
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>{isRegister ? "Create Account" : "Sign In"}</h2>
        <form onSubmit={handleSubmit}>
          {isRegister && (
            <>
              <div className="form-group">
                <input
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "600",
                    color: "#667eea",
                  }}
                >
                  Select Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={{ width: "100%" }}
                >
                  <option value="ADMIN">Admin</option>
                  <option value="MANAGER">Manager</option>
                  <option value="DEVELOPER">Developer</option>
                </select>
              </div>
            </>
          )}

          <div className="form-group">
            <input
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <input
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary">
            {isRegister ? "Register" : "Login"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "20px", color: "#666" }}>
          {isRegister ? "Already have an account? " : "Don't have an account? "}
          <span
            style={{ color: "#667eea", cursor: "pointer", fontWeight: "600" }}
            onClick={() => setIsRegister(!isRegister)}
          >
            {isRegister ? "Login" : "Register"}
          </span>
        </p>
      </div>
    </div>
  );
}


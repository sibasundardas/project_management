import React from "react";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const name = localStorage.getItem("name");

  function logout() {
    localStorage.clear();
    navigate("/");
  }

  return (
    <nav className="navbar">
      <h1>Project Manager</h1>
      <div className="navbar-right">
        {name && <span>Hello, {name}!</span>}
        <button onClick={logout} className="btn-logout">
          Logout
        </button>
      </div>
    </nav>
  );
}

// ============================================
// Login Component
// Epic: E1 - User & Role Management
// Owner: IT24100548 (Galagama S.T)
// Features: Email/Password login, JWT storage
// ============================================

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../../services/authService";
import "./Auth.css";

function Login({ setUser }) {
  const navigate = useNavigate();
  // State Variables
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Handle input changes
  // Event Handlers
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await authService.login(formData);
      setUser(response.user);

      // Redirect based on role
      const adminRoles = [
        "admin",
        "supplier_manager",
        "master_inventory_manager",
        "location_inventory_manager",
        "marketing_manager",
      ];
      if (adminRoles.includes(response.user.role)) {
        navigate("/admin/dashboard");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Login failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Render
  return (
    <div className="auth-container">
      <div className="auth-card card">
        <h2>Login to Your Account</h2>
        <p className="auth-subtitle">
          Welcome back! Please enter your details.
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {/* DEMO: Email Input -  */}
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              name="email"
              className="form-input"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          {/* DEMO: Password Input -  */}
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              className="form-input"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          {/* DEMO: Submit Button -  COLOR */}
          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account? <a href="/register">Register here</a>
        </p>
      </div>
    </div>
  );
}

export default Login;

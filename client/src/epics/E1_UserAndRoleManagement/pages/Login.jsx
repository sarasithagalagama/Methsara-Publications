// ============================================
// Login
// Epic: E1 - User & Role Management
// Owner: IT24100548 (Galagama S.T)
// Purpose: Login page component
// ============================================
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AlertCircle, LogIn } from "lucide-react";
import "./Auth.css";

const Login = () => {
  // ─────────────────────────────────
  // State Variables
  // ─────────────────────────────────
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // ─────────────────────────────────
  // Event Handlers
  // ─────────────────────────────────
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(formData.email, formData.password);

    if (result.success) {
      const { role } = result.user;
      switch (role) {
        case "customer":
          navigate("/customer/dashboard");
          break;
        case "admin":
          navigate("/admin/dashboard");
          break;
        case "supplier_manager":
          navigate("/supplier-manager/dashboard");
          break;
        case "master_inventory_manager":
        case "location_inventory_manager":
          navigate("/inventory-manager/dashboard");
          break;
        case "finance_manager":
          navigate("/finance-manager/dashboard");
          break;
        case "product_manager":
          navigate("/product-manager/dashboard");
          break;
        case "marketing_manager":
          navigate("/marketing-manager/dashboard");
          break;
        default:
          navigate("/");
      }
    } else {
      setError(result.message);
      setLoading(false);
    }
  };

  // ─────────────────────────────────
  // Render
  // ─────────────────────────────────
  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Methsara</h1>
            <p>Welcome back! Please enter your details.</p>
          </div>

          {error && (
            <div className="auth-error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                name="email"
                className="form-input"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter your email"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                name="password"
                className="form-input"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="••••••••"
              />
            </div>

            <div className="auth-extra">
              <div className="remember-me">
                {/* Optional: Add checkbox if needed */}
              </div>
              <Link to="/forgot-password">Forgot password?</Link>
            </div>

            <button
              type="submit"
              className="btn btn-primary auth-submit-btn"
              disabled={loading}
            >
              {loading ? (
                "Verifying..."
              ) : (
                <>
                  Sign In <LogIn size={18} />
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            Don't have an account?{" "}
            <Link to="/register">Create one for free</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

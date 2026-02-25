// ============================================
// Register
// Epic: E1 - User & Role Management
// Owner: IT24100548 (Galagama S.T)
// Purpose: Register page component
// ============================================
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AlertCircle, UserPlus } from "lucide-react";
import "./Auth.css";

const Register = () => {
  // ─────────────────────────────────
  // State Variables
  // ─────────────────────────────────
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  // ─────────────────────────────────
  // Event Handlers
  // ─────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    let newErrors = { ...formErrors };

    switch (name) {
      case "name":
        if (value && !/^[a-zA-Z\s]*$/.test(value)) {
          newErrors.name = "Use letters only";
        } else {
          delete newErrors.name;
        }
        break;
      case "email":
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (value && !emailRegex.test(value)) {
          newErrors.email = "Invalid email";
        } else {
          delete newErrors.email;
        }
        break;
      case "phone":
        if (value && value.length !== 10) {
          newErrors.phone = "Must be 10 digits";
        } else {
          delete newErrors.phone;
        }
        break;
      case "password":
        if (value.length < 6) {
          newErrors.password = "Min 6 characters";
        } else {
          delete newErrors.password;
        }
        break;
      case "confirmPassword":
        if (value !== formData.password) {
          newErrors.confirmPassword = "Mismatch";
        } else {
          delete newErrors.confirmPassword;
        }
        break;
      default:
        break;
    }

    setFormErrors(newErrors);
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (Object.keys(formErrors).length > 0) {
      setError("Please correct the errors.");
      return;
    }

    setLoading(true);
    const result = await register({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      phone: formData.phone,
    });

    if (result.success) {
      navigate("/customer/dashboard");
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
      <div className="auth-container" style={{ maxWidth: "600px" }}>
        <div className="auth-card">
          <div className="auth-header">
            <h1>Create Account</h1>
            <p>Join Methsara and start your journey.</p>
          </div>

          {error && (
            <div className="auth-error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                name="name"
                className={`form-input ${formErrors.name ? "input-error" : ""}`}
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="John Doe"
              />
              {formErrors.name && (
                <small className="form-error">{formErrors.name}</small>
              )}
            </div>

            <div
              className="auth-form-row"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1.5rem",
              }}
            >
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  name="email"
                  className={`form-input ${formErrors.email ? "input-error" : ""}`}
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="john@example.com"
                />
                {formErrors.email && (
                  <small className="form-error">{formErrors.email}</small>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Phone (Optional)</label>
                <input
                  type="tel"
                  name="phone"
                  className={`form-input ${formErrors.phone ? "input-error" : ""}`}
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="07XXXXXXXX"
                  maxLength={10}
                />
                {formErrors.phone && (
                  <small className="form-error">{formErrors.phone}</small>
                )}
              </div>
            </div>

            <div
              className="auth-form-row"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1.5rem",
              }}
            >
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  name="password"
                  className={`form-input ${formErrors.password ? "input-error" : ""}`}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                />
                {formErrors.password && (
                  <small className="form-error">{formErrors.password}</small>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Confirm</label>
                <input
                  type="password"
                  name="confirmPassword"
                  className={`form-input ${formErrors.confirmPassword ? "input-error" : ""}`}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                />
                {formErrors.confirmPassword && (
                  <small className="form-error">
                    {formErrors.confirmPassword}
                  </small>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary auth-submit-btn"
              disabled={loading || Object.keys(formErrors).length > 0}
            >
              {loading ? (
                "Creating..."
              ) : (
                <>
                  Register <UserPlus size={18} />
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            Already have an account? <Link to="/login">Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;

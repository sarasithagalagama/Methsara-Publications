// ============================================
// AuthModals
// Epic: E1 - User & Role Management
// Owner: IT24100548 (Galagama S.T)
// Purpose: AuthModals UI component
// ============================================
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  Mail,
  Lock,
  User,
  Phone,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import "./AuthModals.css";

// Login Modal
export const LoginModal = ({ isOpen, onClose, onSwitchToRegister }) => {
  // State Variables
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // Locks page scroll while any auth modal is open — prevents background scrolling
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setError("");
    } else {
      document.body.style.overflow = "unset";
    }
    // Cleanup: always restore scroll when modal unmounts
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Event Handlers
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(formData.email, formData.password);

    if (result.success) {
      onClose();
      // [E1.6] RBAC routing: customers go to /customer/dashboard, staff go to their role-specific dashboard
      const { role } = result.user;
      if (role === "customer") navigate("/customer/dashboard");
      else if (role === "admin") navigate("/admin/dashboard");
      else navigate(`/${role.replace("_", "-")}/dashboard`);
    } else {
      setError(result.message);
      setLoading(false);
    }
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div
        className="auth-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="auth-modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="auth-modal-content">
          <div className="auth-header">
            <h2>Welcome Back</h2>
            <p>Enter your details to access your account</p>
          </div>

          {error && (
            <div className="auth-error-banner">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={18} />
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  className="form-input"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="auth-toggle-btn"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn auth-submit-btn"
              disabled={loading}
            >
              {loading ? (
                "Signing in..."
              ) : (
                <>
                  Sign In <ArrowRight size={18} style={{ marginLeft: "8px" }} />
                </>
              )}
            </button>
          </form>

          <div className="auth-modal-footer">
            Don't have an account?
            <button onClick={onSwitchToRegister}>Create one</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Register Modal
export const RegisterModal = ({ isOpen, onClose, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setFormData({
        name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
      });
      setErrors({});
      setGeneralError("");
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const validate = (name, value) => {
    let error = "";
    switch (name) {
      case "name":
        if (!value) error = "Full name is required";
        else if (value.length < 3) error = "Too short (min 3 chars)";
        else if (!/^[a-zA-Z\s]*$/.test(value)) error = "Letters only please";
        break;
      case "email":
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value) error = "Email is required";
        else if (!emailRegex.test(value)) error = "Invalid email format";
        break;
      case "phone":
        if (value && !/^\d{10}$/.test(value)) error = "Must be 10 digits";
        break;
      case "password":
        if (!value) error = "Password is required";
        else if (value.length < 8) error = "Min 8 characters required";
        else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value))
          error = "Needs uppercase, lowercase & number";
        break;
      case "confirmPassword":
        if (value !== formData.password) error = "Passwords do not match";
        break;
      default:
        break;
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const error = validate(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError("");

    // Final check for all fields before submitting the registration form
    const newErrors = {};
    Object.keys(formData).forEach((key) => {
      const err = validate(key, formData[key]);
      if (err) newErrors[key] = err;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setGeneralError("Please fix the validation errors.");
      return;
    }

    setLoading(true);
    const result = await register({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
    });

    if (result.success) {
      onClose();
      navigate("/customer/dashboard");
    } else {
      setGeneralError(result.message);
      setLoading(false);
    }
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div
        className="auth-modal-container"
        style={{ maxWidth: "520px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="auth-modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="auth-modal-content">
          <div className="auth-header" style={{ marginBottom: "1.5rem" }}>
            <h2>Create Account</h2>
            <p>Join the Methsara community today</p>
          </div>

          {generalError && (
            <div className="auth-error-banner">
              <AlertCircle size={18} />
              <span>{generalError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div
                className={`input-wrapper ${errors.name ? "input-error-wrapper" : ""}`}
              >
                <User className="input-icon" size={18} />
                <input
                  type="text"
                  name="name"
                  className="form-input"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              {errors.name && (
                <span className="form-error-msg">{errors.name}</span>
              )}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
              }}
            >
              <div className="form-group">
                <label className="form-label">Email</label>
                <div
                  className={`input-wrapper ${errors.email ? "input-error-wrapper" : ""}`}
                >
                  <Mail className="input-icon" size={18} />
                  <input
                    type="email"
                    name="email"
                    className="form-input"
                    placeholder="name@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                {errors.email && (
                  <span className="form-error-msg">{errors.email}</span>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <div
                  className={`input-wrapper ${errors.phone ? "input-error-wrapper" : ""}`}
                >
                  <Phone className="input-icon" size={18} />
                  <input
                    type="tel"
                    name="phone"
                    className="form-input"
                    placeholder="07XXXXXXXX"
                    value={formData.phone}
                    onChange={handleChange}
                    maxLength={10}
                  />
                </div>
                {errors.phone && (
                  <span className="form-error-msg">{errors.phone}</span>
                )}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
              }}
            >
              <div className="form-group">
                <label className="form-label">Password</label>
                <div
                  className={`input-wrapper ${errors.password ? "input-error-wrapper" : ""}`}
                >
                  <Lock className="input-icon" size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    className="form-input"
                    placeholder="Min. 8 characters"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="auth-toggle-btn"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.password && (
                  <span className="form-error-msg">{errors.password}</span>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Confirm</label>
                <div
                  className={`input-wrapper ${errors.confirmPassword ? "input-error-wrapper" : ""}`}
                >
                  <Lock className="input-icon" size={18} />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    className="form-input"
                    placeholder="Repeat password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="auth-toggle-btn"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={15} />
                    ) : (
                      <Eye size={15} />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <span className="form-error-msg">
                    {errors.confirmPassword}
                  </span>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="btn auth-submit-btn"
              disabled={loading}
            >
              {loading ? (
                "Creating account..."
              ) : (
                <>
                  Join Now{" "}
                  <ArrowRight size={18} style={{ marginLeft: "8px" }} />
                </>
              )}
            </button>
          </form>

          <div className="auth-modal-footer">
            Already a member?
            <button onClick={onSwitchToLogin}>Sign In</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Logout Modal
export const LogoutModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div
      className="auth-modal-overlay"
      onClick={onClose}
      style={{ zIndex: 2100 }}
    >
      <div
        className="auth-modal-container"
        style={{ maxWidth: "420px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="auth-modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        <div
          className="auth-modal-content"
          style={{ textAlign: "center", padding: "3rem 2rem" }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              background: "#fee2e2",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.5rem",
              color: "#ef4444",
            }}
          >
            <LogOut size={32} strokeWidth={1.5} />
          </div>

          <div className="auth-header" style={{ marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>
              Sign Out?
            </h2>
            <p>Are you sure you want to end your session?</p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
              marginTop: "2rem",
            }}
          >
            <button
              onClick={onClose}
              style={{
                padding: "0.875rem",
                borderRadius: "12px",
                border: "1.5px solid #e2e8f0",
                background: "white",
                color: "#475569",
                fontWeight: "600",
                fontSize: "0.95rem",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.background = "#f8fafc")
              }
              onMouseOut={(e) => (e.currentTarget.style.background = "white")}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              style={{
                padding: "0.875rem",
                borderRadius: "12px",
                border: "none",
                background: "#ef4444",
                color: "white",
                fontWeight: "600",
                fontSize: "0.95rem",
                cursor: "pointer",
                boxShadow: "0 4px 6px -1px rgba(239, 68, 68, 0.25)",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 8px 12px -3px rgba(239, 68, 68, 0.3)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 4px 6px -1px rgba(239, 68, 68, 0.25)";
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

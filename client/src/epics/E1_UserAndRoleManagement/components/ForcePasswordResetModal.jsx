// ============================================
// Force Password Reset Modal
// Epic: E1 - User & Admin Management
// Purpose: Screen overlay demanding a new password
// ============================================

import React, { useState } from "react";
import axios from "axios";

const ForcePasswordResetModal = ({ onSuccess, logout }) => {
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.newPassword !== formData.confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (formData.newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "/api/auth/force-change-password",
        {
          newPassword: formData.newPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || "Error changing password");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (logout) {
      logout();
      window.location.href = "/";
    }
  };

  return (
    <div className="dash-modal-overlay">
      <div className="dash-modal-content">
        <div className="dash-modal-header">
          <h2>Security Alert: Password Reset Required</h2>
          <p className="dash-modal-subtitle" style={{ color: "#d32f2f" }}>
            An administrator has requested that you change your password. Please
            set a new, secure password to continue using your account.
          </p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              required
              autoFocus
              placeholder="Enter new password (min 6 chars)"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Confirm new password"
            />
          </div>

          <div className="dash-modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleLogout}
              style={{ marginRight: "1rem" }}
            >
              Sign Out Securely
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .dash-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 99999;
          backdrop-filter: blur(4px);
        }
        .dash-modal-content {
          background: white;
          padding: 2.5rem;
          border-radius: 16px;
          max-width: 450px;
          width: 90%;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          animation: modalFadeIn 0.3s ease-out forwards;
        }
        @keyframes modalFadeIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .dash-modal-header {
          margin-bottom: 2rem;
        }
        .dash-modal-header h2 {
          margin: 0 0 0.5rem;
          color: #1a202c;
          font-size: 1.5rem;
          font-weight: 700;
        }
        .dash-modal-subtitle {
          color: #4a5568;
          margin: 0;
          font-size: 0.95rem;
          line-height: 1.5;
        }
        .alert {
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          font-size: 0.9rem;
        }
        .alert-error {
          background: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fecaca;
        }
        .form-group {
          margin-bottom: 1.5rem;
        }
        label {
          display: block;
          margin-bottom: 0.5rem;
          color: #374151;
          font-weight: 600;
          font-size: 0.9rem;
        }
        input {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 1rem;
          transition: all 0.2s;
          box-sizing: border-box;
        }
        input:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
        }
        .dash-modal-actions {
          margin-top: 2.5rem;
          display: flex;
          gap: 1rem;
        }
        .btn-primary,
        .btn-secondary {
          flex: 1;
          padding: 0.875rem;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }
        .btn-primary {
          background: #4f46e5;
          color: white;
        }
        .btn-primary:not(:disabled):hover {
          background: #4338ca;
        }
        .btn-secondary {
          background: #f3f4f6;
          color: #4b5563;
        }
        .btn-secondary:hover {
          background: #e5e7eb;
        }
        button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default ForcePasswordResetModal;

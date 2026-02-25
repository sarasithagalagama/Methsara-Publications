// ============================================
// Change Password Modal
// Epic: E1 - User & Admin Management
// Owner: IT24100548 (Galagama S.T)
// Purpose: Force password change on first login (E1.8)
// ============================================

import React, { useState } from "react";
import axios from "axios";

const ChangePasswordModal = ({ onClose, onSuccess, logout }) => {
  // ─────────────────────────────────
  // State Variables
  // ─────────────────────────────────
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Handle input changes
  // ─────────────────────────────────
  // Event Handlers
  // ─────────────────────────────────
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle password change submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate passwords match
    if (formData.newPassword !== formData.confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    // Validate password length
    if (formData.newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        "/api/auth/change-password",
        {
          currentPassword: formData.currentPassword,
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

  // ─────────────────────────────────
  // Render
  // ─────────────────────────────────
  return (
    <div className="dash-modal-overlay">
      <div className="dash-modal-content">
        <div className="dash-modal-header">
          <h2>Change Password Required</h2>
          <p className="dash-modal-subtitle">
            Please enter the temporary password you received, followed by your
            new password.
          </p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="currentPassword">
              Current Password (Temporary)
            </label>
            <input
              type="password"
              id="currentPassword"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              required
              placeholder="Enter the password provided to you"
            />
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              required
              placeholder="Enter new password (min 6 characters)"
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
              Logout
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Changing..." : "Change Password"}
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
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }
        .dash-modal-content {
          background: white;
          padding: 2.5rem;
          border-radius: 16px;
          max-width: 450px;
          width: 90%;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        .dash-modal-header {
          margin-bottom: 2rem;
        }
        .dash-modal-header h2 {
          margin: 0 0 0.5rem;
          color: #333;
          font-size: 1.75rem;
        }
        .dash-modal-subtitle {
          color: #666;
          margin: 0;
        }
        .alert {
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }
        .alert-error {
          background: #fee;
          color: #c33;
          border: 1px solid #fcc;
        }
        .form-group {
          margin-bottom: 1.5rem;
        }
        label {
          display: block;
          margin-bottom: 0.5rem;
          color: #333;
          font-weight: 500;
        }
        input {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.3s;
        }
        input:focus {
          outline: none;
          border-color: #667eea;
        }
        .dash-modal-actions {
          margin-top: 2rem;
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
          transition: transform 0.2s;
          border: none;
        }
        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        .btn-secondary {
          background: #f3f4f6;
          color: #4b5563;
        }
        .btn-secondary:hover {
          background: #e5e7eb;
          transform: translateY(-2px);
        }
        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
        }
        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default ChangePasswordModal;

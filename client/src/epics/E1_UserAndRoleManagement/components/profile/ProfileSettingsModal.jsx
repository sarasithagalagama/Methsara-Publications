// ============================================
// ProfileSettingsModal
// Epic: E1 - User & Role Management
// Owner: IT24100548 (Galagama S.T)
// Purpose: ProfileSettingsModal UI component
// ============================================
import React, { useState, useEffect } from "react";
import axios from "axios";
import Modal from "../../../../components/common/Modal";
import { useAuth } from "../../context/AuthContext";
import {
  Phone,
  User as UserIcon,
  Shield,
  Monitor,
  Smartphone,
  Globe,
  Lock,
} from "lucide-react";
import "./ProfileSettingsModal.css";

const ProfileSettingsModal = ({ isOpen, onClose }) => {
  const { user, updateProfile, changePassword } = useAuth();
  // State Variables
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [passwordMessage, setPasswordMessage] = useState({
    type: "",
    text: "",
  });

  const [activeTab, setActiveTab] = useState("profile");
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // [E1.3] Pre-fills the form with current user data each time the modal opens or user state updates
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        phone: user.phone || "",
      });
      setFieldErrors({}); // Clear errors when user or modal opens
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordMessage({ type: "", text: "" });
      setMessage({ type: "", text: "" });
    }
  }, [user, isOpen]);

  // [E1.13] Lazy-loads active sessions only when the Security tab is opened (avoids unnecessary API calls)
  useEffect(() => {
    if (activeTab === "security" && isOpen) {
      fetchSessions();
    }
  }, [activeTab, isOpen]);

  // [E1.13] Retrieves all active login sessions across all devices for the current user
  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/auth/sessions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSessions(res.data.sessions || []);
    } catch (error) {
      console.error("Failed to fetch sessions", error);
    } finally {
      setLoadingSessions(false);
    }
  };

  // [E1.13] Terminates a specific device session — e.g., revoke access from a lost or shared device
  const handleRevokeSession = async (sessionId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `/api/auth/sessions/${sessionId}/revoke`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      fetchSessions(); // Refresh list
    } catch (error) {
      console.error("Failed to revoke", error);
    }
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Clear field error as user types
    if (fieldErrors[name]) {
      const newErrors = { ...fieldErrors };
      delete newErrors[name];
      setFieldErrors(newErrors);
    }
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({ ...passwordData, [name]: value });

    // Clear password field error
    if (fieldErrors[name]) {
      const newErrors = { ...fieldErrors };
      delete newErrors[name];
      setFieldErrors(newErrors);
    }
  };

  const validatePasswordForm = () => {
    const errors = {};
    if (!passwordData.currentPassword)
      errors.currentPassword = "Current password is required";
    if (!passwordData.newPassword)
      errors.newPassword = "New password is required";
    if (passwordData.newPassword.length < 6)
      errors.newPassword = "Password must be at least 6 characters";
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!validatePasswordForm()) return;

    setPasswordLoading(true);
    setPasswordMessage({ type: "", text: "" });

    const result = await changePassword({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });

    if (result.success) {
      setPasswordMessage({
        type: "success",
        text: "Password changed successfully!",
      });
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } else {
      setPasswordMessage({ type: "error", text: result.message });
    }
    setPasswordLoading(false);
  };

  const validateForm = () => {
    const errors = {};

    // Name Validation
    if (!formData.name.trim()) {
      errors.name = "Full name is required";
    }

    // Phone Validation (Optional but must be valid if provided)
    if (formData.phone) {
      const phoneRegex = /^(?:\+94|0)7[0-9]{8}$/;
      if (!phoneRegex.test(formData.phone.replace(/\s/g, ""))) {
        errors.phone = "Invalid Sri Lankan phone number (+94 7X XXX XXXX)";
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setMessage({ type: "error", text: "Please fix the validation errors." });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    const result = await updateProfile(formData);

    if (result.success) {
      setMessage({ type: "success", text: "Profile updated successfully!" });
      setTimeout(() => {
        onClose();
        setMessage({ type: "", text: "" });
      }, 1500);
    } else {
      setMessage({ type: "error", text: result.message });
    }
    setLoading(false);
  };

  // Render
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Account Settings" size="lg">
      <div className="settings-tabs">
        <button
          className={`settings-tab ${activeTab === "profile" ? "active" : ""}`}
          onClick={() => setActiveTab("profile")}
        >
          <UserIcon size={18} /> <span>Profile Details</span>
        </button>
        <button
          className={`settings-tab ${activeTab === "security" ? "active" : ""}`}
          onClick={() => setActiveTab("security")}
        >
          <Shield size={18} /> <span>Security & Sessions</span>
        </button>
      </div>

      {activeTab === "profile" && (
        <form onSubmit={handleSubmit} className="profile-settings-form">
          {message.text && (
            <div className={`message-alert ${message.type}`}>
              {message.text}
            </div>
          )}

          <div className="settings-section">
            <h3>
              <UserIcon size={20} className="text-primary-color" /> Personal
              Information
            </h3>
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={fieldErrors.name ? "error-input" : ""}
                required
              />
              {fieldErrors.name && (
                <span className="field-error">{fieldErrors.name}</span>
              )}
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={fieldErrors.phone ? "error-input" : ""}
                placeholder="+94 7X XXX XXXX"
              />
              {fieldErrors.phone && (
                <span className="field-error">{fieldErrors.phone}</span>
              )}
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      )}

      {activeTab === "security" && (
        <div className="security-settings-section">
          <div className="settings-section" style={{ marginBottom: "2rem" }}>
            <h3>
              <Lock size={20} className="text-primary-color" /> Change Password
            </h3>
            <form onSubmit={handlePasswordSubmit}>
              {passwordMessage.text && (
                <div
                  className={`message-alert ${passwordMessage.type}`}
                  style={{ marginBottom: "1.5rem" }}
                >
                  {passwordMessage.text}
                </div>
              )}
              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordInputChange}
                  className={fieldErrors.currentPassword ? "error-input" : ""}
                />
                {fieldErrors.currentPassword && (
                  <span className="field-error">
                    {fieldErrors.currentPassword}
                  </span>
                )}
              </div>
              <div className="form-row">
                <div className="form-group half">
                  <label>New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordInputChange}
                    className={fieldErrors.newPassword ? "error-input" : ""}
                  />
                  {fieldErrors.newPassword && (
                    <span className="field-error">
                      {fieldErrors.newPassword}
                    </span>
                  )}
                </div>
                <div className="form-group half">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordInputChange}
                    className={fieldErrors.confirmPassword ? "error-input" : ""}
                  />
                  {fieldErrors.confirmPassword && (
                    <span className="field-error">
                      {fieldErrors.confirmPassword}
                    </span>
                  )}
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: "1rem",
                }}
              >
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={passwordLoading}
                >
                  {passwordLoading ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>

          <div className="settings-section">
            <h3>
              <Shield size={20} className="text-primary-color" /> Active
              Sessions
            </h3>
            <p className="section-desc">
              These are the devices that have logged into your account. Revoke
              any sessions that you do not recognize.
            </p>

            {loadingSessions ? (
              <p>Loading sessions...</p>
            ) : (
              <div className="sessions-list">
                {sessions.length === 0 ? (
                  <p>No active sessions found.</p>
                ) : (
                  sessions.map((session) => (
                    <div key={session._id} className="session-card">
                      <div className="session-icon">
                        {session.device?.toLowerCase().includes("mobile") ? (
                          <Smartphone size={24} />
                        ) : (
                          <Monitor size={24} />
                        )}
                      </div>
                      <div className="session-details">
                        <h4>{session.device || "Unknown Device"}</h4>
                        <div className="session-meta">
                          <span>
                            <Globe size={14} /> {session.ipAddress}
                          </span>
                          <span>
                            Signed in:{" "}
                            {new Date(session.loginTime).toLocaleDateString()}
                          </span>
                        </div>
                        {session.status === "active" ? (
                          <span className="session-status active">
                            Active Now
                          </span>
                        ) : (
                          <span className="session-status revoked">
                            Revoked / Logged Out
                          </span>
                        )}
                      </div>
                      <div className="session-actions">
                        {session.status === "active" && (
                          <button
                            className="btn-revoke"
                            onClick={() => handleRevokeSession(session._id)}
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ProfileSettingsModal;

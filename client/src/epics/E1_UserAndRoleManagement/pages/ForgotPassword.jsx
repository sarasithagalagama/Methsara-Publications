// ============================================
// Forgot Password Page
// Epic: E1 - User & Role Management
// Owner: IT24100548 (Galagama S.T)
// Purpose: Password reset request (E1.7)
// ============================================

import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { ArrowRight } from "lucide-react";

const ForgotPassword = () => {
  // State Variables
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [resetToken, setResetToken] = useState(""); // Show token
  const [loading, setLoading] = useState(false);

  // [E1.7] Step 1 of 2: user submits their email to receive a 6-digit reset token
  // Step 2 is on the /reset-password page where they enter the token and set a new password
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await axios.post("/api/auth/forgot-password", {
        email,
      });

      setMessage(res.data.message);
      // Dev/demo only: token is displayed on-screen for testing; in production it would be email-only
      setResetToken(res.data.resetToken); // Display token
    } catch (err) {
      setError(err.response?.data?.message || "Error sending reset email");
    } finally {
      setLoading(false);
    }
  };

  // Render
  return (
    <div className="forgot-password-page">
      <div className="forgot-password-container">
        <div className="forgot-password-card">
          <h1>Reset Password</h1>
          <p className="subtitle">
            Enter your email to receive a password reset code
          </p>

          {error && <div className="alert alert-error">{error}</div>}
          {message && (
            <div className="alert alert-success">
              <p>{message}</p>
              {resetToken && (
                <div className="token-display">
                  <strong>Your Reset Code:</strong>
                  <code>{resetToken}</code>
                  <p className="token-note">
                    Copy this code and use it on the reset password page.
                  </p>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
              />
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Code"}
            </button>
          </form>

          <div className="links">
            <Link to="/login">Back to Login</Link>
            {resetToken && (
              <Link to="/reset-password" className="reset-link">
                Reset Password <ArrowRight size={16} />
              </Link>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .forgot-password-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 2rem;
        }
        .forgot-password-container {
          max-width: 450px;
          width: 100%;
        }
        .forgot-password-card {
          background: white;
          padding: 3rem;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        h1 {
          margin: 0 0 0.5rem;
          color: #333;
          font-size: 2rem;
        }
        .subtitle {
          color: #666;
          margin-bottom: 2rem;
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
        .alert-success {
          background: #efe;
          color: #3c3;
          border: 1px solid #cfc;
        }
        .token-display {
          margin-top: 1rem;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 8px;
        }
        .token-display code {
          display: block;
          font-size: 1.5rem;
          font-weight: bold;
          color: #667eea;
          margin: 0.5rem 0;
          letter-spacing: 2px;
        }
        .token-note {
          font-size: 0.85rem;
          color: #666;
          margin-top: 0.5rem;
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
        .btn-primary {
          width: 100%;
          padding: 0.875rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
        }
        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .links {
          margin-top: 1.5rem;
          text-align: center;
          display: flex;
          justify-content: space-between;
        }
        .links a {
          color: #667eea;
          text-decoration: none;
          font-weight: 500;
        }
        .links a:hover {
          text-decoration: underline;
        }
        .reset-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
      `}</style>
    </div>
  );
};

export default ForgotPassword;

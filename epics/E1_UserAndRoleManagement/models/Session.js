// ============================================
// Session Model
// Epic: E1 - User & Role Management
// Owner: IT24100548 (Galagama S.T)
// Purpose: Track active sessions, logins, and IP addresses
// ============================================

const mongoose = require("mongoose");

// [E1.13] Session model: tracks each login event with device info for the active sessions dashboard
const sessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  // [E1.13] Stores the actual JWT so we can revoke specific sessions without invalidating all tokens
  token: {
    type: String,
    required: true,
  },
  ipAddress: {
    type: String,
    required: true,
  },
  userAgent: {
    type: String,
  },
  // [E1.13] Human-readable device string built from UAParser (e.g. "Chrome on Windows")
  device: {
    type: String, // Extracted from userAgent
  },
  loginTime: {
    type: Date,
    default: Date.now,
  },
  lastActive: {
    type: Date,
    default: Date.now,
  },
  // [E1.13] status: active → logged_out (user action) or revoked (admin kills session remotely)
  status: {
    type: String,
    enum: ["active", "logged_out", "revoked"],
    default: "active",
  },
  // [E1.13] TTL index: MongoDB auto-deletes session documents after 30 days (keeps collection lean)
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 30 * 24 * 60 * 60, // Automatically delete sessions after 30 days
  },
});

module.exports = mongoose.model("Session", sessionSchema);

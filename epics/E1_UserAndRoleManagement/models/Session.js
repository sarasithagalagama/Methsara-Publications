// ============================================
// Session Model
// Epic: E1 - User & Role Management
// Owner: IT24101266 (Perera M.U.E) / IT24100548 (Galagama S.T)
// Purpose: Track active sessions, logins, and IP addresses
// ============================================

const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
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
  status: {
    type: String,
    enum: ["active", "logged_out", "revoked"],
    default: "active",
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 30 * 24 * 60 * 60, // Automatically delete sessions after 30 days
  },
});

module.exports = mongoose.model("Session", sessionSchema);

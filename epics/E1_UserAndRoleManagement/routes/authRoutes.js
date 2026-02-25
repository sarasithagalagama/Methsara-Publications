// ============================================
// Auth Routes
// Epic: E1 - User & Admin Management
// Owner: IT24100548 (Galagama S.T)
// Purpose: Authentication and user management routes
// ============================================

const express = require("express");
const router = express.Router();
const {
  register,
  login,
  getMe,
  createStaff,
  getAllUsers,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  deactivateUser,
  updateUser,
  getSessions,
  logout,
  revokeSession,
  getSecurityLogs,
  requestPasswordReset,
  forceChangePassword,
} = require("../controllers/authController");
const { protect, authorize } = require("../middleware/auth");

// Public routes
router.post("/register", register); // E1.1 - Customer registration
router.post("/login", login); // E1.2 - Login
router.post("/forgot-password", forgotPassword); // E1.7 - Request password reset
router.post("/reset-password", resetPassword); // E1.7 - Reset password with token

// Protected routes
router.post("/logout", protect, logout); // Log out active session
router.get("/me", protect, getMe); // Get current user profile
router.put("/profile", protect, updateProfile); // E1.3 - Update profile
router.put("/change-password", protect, changePassword); // E1.8 - Change password
router.get("/sessions", protect, getSessions); // E1.13 - View active sessions
router.post("/sessions/:id/revoke", protect, revokeSession); // E1.13 - Revoke session
router.post("/force-change-password", protect, forceChangePassword); // User force password reset

// Admin-only routes
router.post("/create-staff", protect, authorize("admin"), createStaff); // E1.4 - Create staff
router.get(
  "/users",
  protect,
  authorize("admin", "finance_manager"),
  getAllUsers,
); // E1.9 - Get all users
router.put(
  "/users/:id",
  protect,
  authorize("admin", "finance_manager"),
  updateUser,
); // Admin update user
router.put(
  "/users/:id/deactivate",
  protect,
  authorize("admin"),
  deactivateUser,
); // E1.10 - Deactivate user
router.post(
  "/users/:id/force-reset",
  protect,
  authorize("admin"),
  requestPasswordReset,
); // Admin force password reset
router.get("/logs", protect, authorize("admin"), getSecurityLogs); // E1.11 - Security logs

module.exports = router;

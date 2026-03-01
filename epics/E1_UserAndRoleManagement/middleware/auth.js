// ============================================
// Authentication Middleware
// Epic: E1 - User & Role Management
// Owner: IT24100548 (Galagama S.T)
// Purpose: Protect routes and verify JWT tokens
// ============================================

const jwt = require("jsonwebtoken");
const User = require("../models/User");

// [E1.2] protect: verifies every incoming JWT on private routes (used across all epics)
exports.protect = async (req, res, next) => {
  try {
    let token;

    // [E1.2] Extract Bearer token from Authorization header (standard HTTP auth format)
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // [E1.2] Reject request immediately if no token is provided
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to access this route. Please login.",
      });
    }

    // [E1.2] Verify token signature and expiry using JWT_SECRET from .env
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // [E1.2] Attach full user doc to req.user (excluding password hash) for downstream use
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // [E1.8] Reject deactivated staff accounts even if token is still valid
    if (!req.user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account has been deactivated",
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Not authorized to access this route",
      error: error.message,
    });
  }
};

// [E1.3] authorize: RBAC closure — accepts a whitelist of allowed roles, returns middleware
// Usage: router.delete('/product', protect, authorize('admin','product_manager'), ...)
exports.authorize = (...roles) => {
  return (req, res, next) => {
    // [E1.3] 403 Forbidden (not 401) — user IS authenticated but lacks the required role
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`,
      });
    }
    next();
  };
};

// [E5.1] authorizeLocation: scopes inventory managers to their assigned branch [E1.4 role setup]
exports.authorizeLocation = (req, res, next) => {
  const requestedLocation = req.params.location || req.body.location;

  // [E5.1] master_inventory_manager has cross-branch access (assignedLocation = "All")
  if (
    req.user.role === "master_inventory_manager" ||
    req.user.assignedLocation === "All"
  ) {
    return next();
  }

  // [E5.2] location_inventory_manager is restricted to their single assigned branch
  if (req.user.role === "location_inventory_manager") {
    if (req.user.assignedLocation !== requestedLocation) {
      return res.status(403).json({
        success: false,
        message: `You are only authorized to access ${req.user.assignedLocation} location`,
      });
    }
  }

  next();
};

// [E3.3] optionalProtect: enables guest checkout — attaches user if token present, continues either way
exports.optionalProtect = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
    }
    next();
  } catch (error) {
    // If token is invalid, we still continue but without user
    next();
  }
};

// [E1.2] generateToken: issues a signed JWT (expires in JWT_EXPIRE env var, default 7 days)
exports.generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

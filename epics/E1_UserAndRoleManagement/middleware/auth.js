// ============================================
// Authentication Middleware
// Epic: E1 - User & Role Management
// Owner: IT24100548 (Galagama S.T)
// Purpose: Protect routes and verify JWT tokens
// ============================================

const jwt = require("jsonwebtoken");
const User = require('../models/User');

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check if token exists in headers
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to access this route. Please login.",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if user is active
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

// Role-Based Access Control (RBAC)
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`,
      });
    }
    next();
  };
};

// Location-Based Access Control (for inventory managers)
exports.authorizeLocation = (req, res, next) => {
  const requestedLocation = req.params.location || req.body.location;

  // Master inventory manager can access all locations
  if (
    req.user.role === "master_inventory_manager" ||
    req.user.assignedLocation === "All"
  ) {
    return next();
  }

  // Location-specific manager can only access their location
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

// Optional protect - populate req.user if token is present, but continue if not
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

// Generate JWT Token
exports.generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

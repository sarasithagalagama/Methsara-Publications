// ============================================
// Auth Controller
// Epic: E1 - User & Role Management
// Owner: IT24100548 (Galagama S.T)
// Features: Register, Login, RBAC
// ============================================

const User = require("../models/User");
const Session = require("../models/Session");
const { generateToken } = require("../middleware/auth");
const UAParser = require("ua-parser-js");

// Customer Registration (E1.1)
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // [E1.1] Prevent duplicate accounts by checking email uniqueness before creation
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // [E1.1] New customers always get role='customer'; isEmailVerified=true (TODO: real email service)
    const user = await User.create({
      name,
      email,
      password,
      phone,
      userType: "customer",
      role: "customer",
      isEmailVerified: true, // TODO: Implement email verification service
    });

    // [E1.2] Issue JWT immediately after registration so user is logged in straight away
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message,
    });
  }
};

// Login (E1.2)
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    // [E1.2] Must use .select("+password") because password has select:false in the User schema
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // [E1.2] comparePassword uses bcrypt.compare to safely check plaintext against stored hash
    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // [E1.8] Block login for deactivated accounts even when password is correct
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account has been deactivated. Please contact administrator.",
      });
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save();

    // [E1.2] Sign a new JWT bound to this user's _id
    const token = generateToken(user._id);

    // [E1.13] Parse the User-Agent header to generate a human-readable device string for the sessions dashboard
    const parser = new UAParser(req.headers["user-agent"]);
    const browser = parser.getBrowser();
    const os = parser.getOS();
    const deviceStr = `${browser.name || "Unknown Browser"} on ${os.name || "Unknown OS"}`;

    // [E1.13] Create a Session record so the user can see and revoke their active sessions
    await Session.create({
      user: user._id,
      token,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers["user-agent"],
      device: deviceStr,
    });

    // [E1.8] mustChangePassword is included in response so frontend can redirect to forced-reset screen
    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        userType: user.userType,
        assignedLocation: user.assignedLocation,
        mustChangePassword: user.mustChangePassword,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
};

// Get Current User Profile
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get user profile",
      error: error.message,
    });
  }
};

// [E1.4] Create Staff Account (Admin only) — sets userType='staff', role from payload, mustChangePassword=true
exports.createStaff = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      role,
      assignedLocation,
      nic,
      dateOfBirth,
      address,
      emergencyContactName,
      emergencyContactPhone,
      hireDate,
      nicFrontImage,
      nicBackImage,
      city,
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Validate date of birth
    if (dateOfBirth) {
      const birthDate = new Date(dateOfBirth);
      const today = new Date();

      // Check if date is valid
      if (isNaN(birthDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid date of birth format",
        });
      }

      // Check if date is not in the future
      if (birthDate >= today) {
        return res.status(400).json({
          success: false,
          message: "Date of birth cannot be today or in the future",
        });
      }

      // Calculate age
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }

      // Check minimum age (18 years)
      if (age < 18) {
        return res.status(400).json({
          success: false,
          message: "User must be at least 18 years old",
        });
      }

      // Check maximum age (100 years - reasonable upper bound)
      if (age > 100) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid date of birth",
        });
      }
    }

    // Create staff account
    const user = await User.create({
      name,
      email,
      password,
      phone,
      userType: "staff",
      role,
      assignedLocation: assignedLocation || null,
      nic,
      dateOfBirth,
      address,
      city,
      emergencyContactName,
      emergencyContactPhone,
      hireDate: hireDate || Date.now(),
      nicFrontImage,
      nicBackImage,
      mustChangePassword: true, // Force password change on first login
      isEmailVerified: true,
    });

    res.status(201).json({
      success: true,
      message: "Staff account created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        assignedLocation: user.assignedLocation,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create staff account",
      error: error.message,
    });
  }
};

// Get All Users (Admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get users",
      error: error.message,
    });
  }
};

// Update User Profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, addresses } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, phone, addresses },
      { new: true, runValidators: true },
    );

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message,
    });
  }
};

// Change Password (E1.8 - Force change on first login)
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    // Get user with password field
    const user = await User.findById(req.user.id).select("+password");

    // Verify current password
    const isPasswordMatch = await user.comparePassword(currentPassword);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Validate new password length
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters",
      });
    }

    // Update password and clear mustChangePassword flag
    user.password = newPassword;
    user.mustChangePassword = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Error changing password",
    });
  }
};

// Forgot Password - Request Reset (E1.7)
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with that email address",
      });
    }

    // Generate reset token (6-digit code for simplicity)
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash token and set expiry (1 hour)
    const crypto = require("crypto");
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour

    await user.save();

    // TODO: Send email with reset token
    // Note: return the token in response
    // In production, this should be sent via email
    res.status(200).json({
      success: true,
      message: "Password reset token sent to email",
      resetToken, // TODO: Remove in production after email service is integrated
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Error processing password reset request",
    });
  }
};

// Reset Password with Token (E1.7)
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Token and new password are required",
      });
    }

    // Hash the provided token to compare
    const crypto = require("crypto");
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    // Update password
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message:
        "Password reset successful. Please login with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Error resetting password",
    });
  }
};

// Deactivate User (E1.10 - Admin only)
exports.deactivateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prevent deactivating self
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "You cannot deactivate your own account",
      });
    }

    user.isActive = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: "User deactivated successfully",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deactivating user",
      error: error.message,
    });
  }
};

// Update user (Admin)
exports.updateUser = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      role,
      userType,
      assignedLocation,
      nic,
      dateOfBirth,
      address,
      city,
      emergencyContactName,
      emergencyContactPhone,
      hireDate,
      nicFrontImage,
      nicBackImage,
    } = req.body;

    // ---- Validation ----
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\d{10}$/;
    const nicOldRegex = /^\d{9}[VXvx]$/;
    const nicNewRegex = /^\d{12}$/;

    if (!name || !name.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Name is required" });
    }
    if (!/^[a-zA-Z\s]+$/.test(name.trim())) {
      return res.status(400).json({
        success: false,
        message: "Name must only contain letters and spaces",
      });
    }
    if (!email || !emailRegex.test(email)) {
      return res
        .status(400)
        .json({ success: false, message: "Valid email is required" });
    }
    if (phone && !phoneRegex.test(phone)) {
      return res
        .status(400)
        .json({ success: false, message: "Phone must be exactly 10 digits" });
    }
    if (nic && nic.trim() && !nicOldRegex.test(nic) && !nicNewRegex.test(nic)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid NIC format (Old: 9 digits + V/X (required), e.g., 123456789V | New: 12 digits, e.g., 200331810088)",
      });
    }
    if (emergencyContactPhone && !phoneRegex.test(emergencyContactPhone)) {
      return res.status(400).json({
        success: false,
        message: "Emergency contact phone must be 10 digits",
      });
    }

    // Validate date of birth if provided
    if (dateOfBirth) {
      const birthDate = new Date(dateOfBirth);
      const today = new Date();

      // Check if date is valid
      if (isNaN(birthDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid date of birth format",
        });
      }

      // Check if date is not in the future
      if (birthDate >= today) {
        return res.status(400).json({
          success: false,
          message: "Date of birth cannot be today or in the future",
        });
      }

      // Calculate age
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }

      // Check minimum age (18 years)
      if (age < 18) {
        return res.status(400).json({
          success: false,
          message: "User must be at least 18 years old",
        });
      }

      // Check maximum age (100 years - reasonable upper bound)
      if (age > 100) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid date of birth",
        });
      }
    }
    // ---- End Validation ----

    // Check if email is already taken by another user
    const existingUser = await User.findOne({
      email,
      _id: { $ne: req.params.id },
    });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email is already in use by another account",
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prevent admins from editing customer accounts
    if (user.userType === "customer") {
      return res.status(403).json({
        success: false,
        message: "Cannot edit customer accounts from staff management panel",
      });
    }

    user.name = name.trim();
    user.email = email.toLowerCase().trim();
    user.role = role || user.role;
    user.userType = userType || user.userType;
    user.phone = phone || user.phone;
    user.nic = nic || user.nic;
    user.dateOfBirth = dateOfBirth || user.dateOfBirth;
    user.address = address || user.address;
    user.city = city || user.city;
    user.emergencyContactName =
      emergencyContactName || user.emergencyContactName;
    user.emergencyContactPhone =
      emergencyContactPhone || user.emergencyContactPhone;
    user.hireDate = hireDate || user.hireDate;
    user.nicFrontImage = nicFrontImage || user.nicFrontImage;
    user.nicBackImage = nicBackImage || user.nicBackImage;

    if (assignedLocation !== undefined) {
      user.assignedLocation = assignedLocation;
    }

    if (req.body.salary !== undefined) {
      const parsedSalary = parseFloat(req.body.salary);
      if (isNaN(parsedSalary) || parsedSalary < 0) {
        return res.status(400).json({
          success: false,
          message: "Salary must be a valid non-negative number",
        });
      }
      user.salary = parsedSalary;
    }

    await user.save();

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// ============================================
// Session Management (E1.11, E1.13)
// ============================================

// Get Active Sessions for Current User
exports.getSessions = async (req, res) => {
  try {
    const sessions = await Session.find({ user: req.user.id }).sort({
      loginTime: -1,
    });

    res.status(200).json({
      success: true,
      count: sessions.length,
      sessions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch sessions",
    });
  }
};

// Logout (Deactivate Current Session)
exports.logout = async (req, res) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (token) {
      await Session.findOneAndUpdate(
        { token },
        { status: "logged_out", lastActive: Date.now() },
      );
    }

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
};

// Revoke a specific session
exports.revokeSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res
        .status(404)
        .json({ success: false, message: "Session not found" });
    }

    // Ensure user owns the session OR is an admin
    if (session.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to revoke this session",
      });
    }

    session.status = "revoked";
    await session.save();

    res.status(200).json({
      success: true,
      message: "Session revoked successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to revoke session",
    });
  }
};

// Get Global Security Logs (Admin Only)
exports.getSecurityLogs = async (req, res) => {
  try {
    const logs = await Session.find()
      .populate("user", "name email role userType")
      .sort({ loginTime: -1 })
      .limit(100); // Limit to last 100 for performance

    res.status(200).json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch security logs",
    });
  }
};

// Request Password Reset (Admin-Triggered)
exports.requestPasswordReset = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.mustChangePassword = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset requested for user",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to request password reset",
      error: error.message,
    });
  }
};

// Force Change Password (User action after Admin triggers reset)
exports.forceChangePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Optional but good practice: ensure they don't reuse the same password
    // Handled intrinsically if we wanted, but not explicitly required

    user.password = req.body.newPassword;
    user.mustChangePassword = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update password",
      error: error.message,
    });
  }
};

module.exports = exports;

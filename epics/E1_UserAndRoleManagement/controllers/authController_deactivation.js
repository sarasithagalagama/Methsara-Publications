// ============================================
// Account Deactivation Endpoint
// Epic: E1 - User & Admin Management
// Owner: IT24100191 (Jayasinghe D.B.P)
// Purpose: Deactivate user accounts (E1.10)
// ============================================

// Add to authController.js

// Deactivate Account (E1.10)
exports.deactivateAccount = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    user.isActive = false;
    user.deactivationReason = reason || "Deactivated by admin";
    user.deactivatedAt = Date.now();
    await user.save();

    res.status(200).json({
      success: true,
      message: "Account deactivated successfully",
      user: {
        id: user._id,
        email: user.email,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Deactivate account error:", error);
    res
      .status(500)
      .json({ success: false, message: "Error deactivating account" });
  }
};

// Reactivate Account (E1.10)
exports.reactivateAccount = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    user.isActive = true;
    user.deactivationReason = undefined;
    user.deactivatedAt = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Account reactivated successfully",
      user: {
        id: user._id,
        email: user.email,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Reactivate account error:", error);
    res
      .status(500)
      .json({ success: false, message: "Error reactivating account" });
  }
};

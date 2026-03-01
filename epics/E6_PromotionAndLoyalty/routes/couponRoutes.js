// ============================================
// Coupon Routes
// Epic: E6 - Promotion & Loyalty
// Owner: IT24101266 (Perera M.U.E)
// Purpose: Coupon and promotion API endpoints
// ============================================

const express = require("express");
const router = express.Router();
const {
  createCoupon,
  getAllCoupons,
  validateCoupon,
  applyCoupon,
  deleteCoupon,
  updateCoupon,
  createCampaign,
  getActiveCampaigns,
  getActivePublicCampaigns,
  deleteCampaign,
  updateCampaign,
  getMarketingAnalytics,
} = require('../controllers/couponController');
const { protect, authorize } = require('../../E1_UserAndRoleManagement/middleware/auth');

// Public routes MUST be defined before protect middleware
router.get("/campaigns/active", getActivePublicCampaigns);

// Protect all routes
router.use(protect);

// Coupon Routes
router.post("/", authorize("marketing_manager", "admin"), createCoupon);
router.get("/", authorize("marketing_manager", "admin"), getAllCoupons);
router.delete("/:id", authorize("marketing_manager", "admin"), deleteCoupon);
router.put("/:id", authorize("marketing_manager", "admin"), updateCoupon);
router.post("/validate", validateCoupon);
router.post("/apply", applyCoupon);

// Campaign Routes (using same controller/base path for simplicity)
router.post(
  "/campaigns",
  authorize("marketing_manager", "admin"),
  createCampaign,
);
router.get("/campaigns", getActiveCampaigns); // Public or protected? Keeping it protected for now as dashboard use
router.delete(
  "/campaigns/:id",
  authorize("marketing_manager", "admin"),
  deleteCampaign,
);
router.put(
  "/campaigns/:id",
  authorize("marketing_manager", "admin"),
  updateCampaign,
);

router.get(
  "/analytics",
  authorize("marketing_manager", "admin"),
  getMarketingAnalytics,
);

module.exports = router;

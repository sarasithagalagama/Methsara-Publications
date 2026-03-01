// ============================================
// Review Routes
// Epic: E2 - Product Catalog
// Owner: IT24101314 (Appuhami H A P L)
// Purpose: Product reviews API endpoints
// ============================================

const express = require("express");
const router = express.Router();
const { getReviews } = require("../controllers/reviewController");
const {
  protect,
  authorize,
} = require("../../E1_UserAndRoleManagement/middleware/auth");

router.use(protect);

// Product Manager and Admin — read-only view
router.get("/", authorize("product_manager", "admin"), getReviews);

module.exports = router;

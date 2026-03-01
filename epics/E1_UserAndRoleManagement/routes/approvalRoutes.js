// ============================================
// Approval Routes
// Epic: E1 - User & Role Management
// Owner: IT24100548 (Galagama S.T)
// Purpose: Admin approval workflow API endpoints
// ============================================

const express = require("express");
const router = express.Router();
const {
  getPendingRequests,
  reviewRequest,
} = require("../controllers/approvalController");
const { protect, authorize } = require("../middleware/auth");

// Only Admin can access these routes
router.use(protect);
router.use(authorize("admin", "master_inventory_manager"));

router.route("/").get(getPendingRequests);
router.route("/:id").put(reviewRequest);

module.exports = router;

const express = require("express");
const router = express.Router();
const {
  requestTransfer,
  approveTransfer,
  getAllTransfers,
} = require('../controllers/stockTransferController');
const { protect, authorize } = require('../../E1_UserAndRoleManagement/middleware/auth');

// All routes require authentication
router.use(protect);

// Request a stock transfer (Inventory Managers)
router.post(
  "/request",
  authorize("master_inventory_manager", "location_inventory_manager", "admin"),
  requestTransfer,
);

// Approve or Reject a stock transfer (Master Inventory Manager or Admin)
// Note: Location managers might approve transfers TO their location, but for simplicity, let's restrict to Master/Admin or receiving location manager.
// For now, based on controller logic, we keep it broad but could be refined.
router.put(
  "/:id/approve",
  authorize("master_inventory_manager", "location_inventory_manager", "admin"),
  approveTransfer,
);

// Get all transfers (All Inventory Managers)
router.get(
  "/",
  authorize("master_inventory_manager", "location_inventory_manager", "admin"),
  getAllTransfers,
);

module.exports = router;

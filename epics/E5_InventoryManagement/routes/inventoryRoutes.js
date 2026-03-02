// ============================================
// Inventory Routes
// Epic: E5 - Inventory Management
// Owner: IT24100264 (Bandara N W C D)
// Purpose: Stock management across locations
// ============================================

const express = require("express");
const router = express.Router();
const {
  getStockByLocation,
  adjustStock,
  getLowStockAlerts,
  syncAllStock,
  getStockMovements,
  updateInventorySettings,
  getInventoryStats,
} = require("../controllers/inventoryController");
const {
  protect,
  authorize,
} = require("../../E1_UserAndRoleManagement/middleware/auth");

// All routes require inventory manager or admin role
router.use(protect);
router.use(
  authorize(
    "master_inventory_manager",
    "location_inventory_manager",
    "admin",
    "supplier_manager",
  ),
);

router.get("/location/:location", getStockByLocation); // E5.1, E5.2 - View stock
router.post("/adjust", adjustStock); // E5.3 - Adjust stock
router.get("/alerts", getLowStockAlerts); // E5.9 - Low stock alerts
router.get("/movements", getStockMovements); // E5.10 - Stock movements log
router.get("/stats", getInventoryStats); // Dashboard summary stats
router.get("/sync-all", syncAllStock); // Manual sync utility
router.put("/:id", updateInventorySettings); // E5.7 - Update inventory settings

module.exports = router;

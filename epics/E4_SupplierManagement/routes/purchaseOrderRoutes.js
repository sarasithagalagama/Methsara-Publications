// ============================================
// Purchase Order Routes
// Epic: E4 - Supplier Management
// Owner: IT24100799 (Gawrawa G H Y)
// Purpose: PO API endpoints
// ============================================

const express = require("express");
const router = express.Router();
const {
  createPurchaseOrder,
  getAllPurchaseOrders,
  updatePOStatus,
  getPurchaseOrder,
  requestPayment,
  emailPurchaseOrder,
  verifyDelivery,
} = require("../controllers/purchaseOrderController");
const {
  protect,
  authorize,
} = require("../../E1_UserAndRoleManagement/middleware/auth");

// Base authentication applies to all PO routes
router.use(protect);

router.post("/", authorize("supplier_manager", "admin"), createPurchaseOrder);
router.get(
  "/",
  authorize(
    "supplier_manager",
    "admin",
    "master_inventory_manager",
    "location_inventory_manager",
    "finance_manager",
  ),
  getAllPurchaseOrders,
);
router.get(
  "/:id",
  authorize(
    "supplier_manager",
    "admin",
    "master_inventory_manager",
    "location_inventory_manager",
    "finance_manager",
  ),
  getPurchaseOrder,
);
router.put(
  "/:id/status",
  authorize(
    "supplier_manager",
    "admin",
    "master_inventory_manager",
    "location_inventory_manager",
  ),
  updatePOStatus,
);
router.put(
  "/:id/request-payment",
  authorize("supplier_manager", "admin", "finance_manager"),
  requestPayment,
);
router.post(
  "/:id/email",
  authorize("supplier_manager", "admin"),
  emailPurchaseOrder,
);
router.put(
  "/:id/verify-delivery",
  authorize(
    "supplier_manager",
    "admin",
    "master_inventory_manager",
    "location_inventory_manager",
  ),
  verifyDelivery,
);

module.exports = router;

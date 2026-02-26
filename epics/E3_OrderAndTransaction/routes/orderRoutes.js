// ============================================
// Order Routes
// Epic: E3 - Order & Transaction
// Owner: IT24100191 (Jayasinghe D.B.P)
// ============================================

const express = require("express");
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, authorize, optionalProtect } = require('../../E1_UserAndRoleManagement/middleware/auth');

// Public routes (guest checkout supported via optionalProtect)
router.post("/", optionalProtect, orderController.createOrder);

// Protected routes
router.get("/my-orders", protect, orderController.getMyOrders);
router.get(
  "/stats",
  protect,
  authorize("admin"),
  orderController.getDashboardStats,
); // Dashboard Stats
router.get("/:id", protect, orderController.getOrder);

// Admin/Manager routes
router.get(
  "/",
  protect,
  authorize(
    "admin",
    "finance_manager",
    "master_inventory_manager",
    "location_inventory_manager",
    "product_manager",
  ),
  orderController.getAllOrders,
);

router.put(
  "/:id/status",
  protect,
  authorize(
    "admin",
    "master_inventory_manager",
    "location_inventory_manager",
    "product_manager",
  ),
  orderController.updateOrderStatus,
);

router.put(
  "/:id/payment",
  protect,
  authorize("admin", "finance_manager"),
  orderController.updatePaymentStatus,
);

module.exports = router;

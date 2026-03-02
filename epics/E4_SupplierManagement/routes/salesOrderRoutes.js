// ============================================
// Sales Order Routes
// Epic: E4 - Supplier Management (Customer Orders)
// Owner: IT24100799 (Gawrawa G H Y)
// Purpose: Sales Order API endpoints for Distributors & Bookshops
// ============================================

const express = require("express");
const router = express.Router();
const {
  createSalesOrder,
  getAllSalesOrders,
  getSalesOrder,
  updateSOStatus,
  recordPaymentForSO,
  cancelSalesOrder,
  getSalesOrderAnalytics,
  getPendingSODispatchRequests,
  approveSODispatch,
  rejectSODispatch,
} = require("../controllers/salesOrderController");
const {
  protect,
  authorize,
} = require("../../E1_UserAndRoleManagement/middleware/auth");

// All routes require supplier_manager or admin role
router.use(protect);
router.use(
  authorize(
    "supplier_manager",
    "admin",
    "finance_manager",
    "master_inventory_manager",
  ),
);

// Sales Order CRUD
router.get("/", getAllSalesOrders); // List all sales orders with filters
router.get("/analytics", getSalesOrderAnalytics); // Sales order analytics
router.get("/pending-dispatch", getPendingSODispatchRequests); // Pending dispatch requests for IM
router.get("/:id", getSalesOrder); // Get single sales order
router.post("/", createSalesOrder); // Create new sales order
router.put("/:id/status", updateSOStatus); // Update sales order status
router.post("/:id/payment", recordPaymentForSO); // Record customer payment
router.put("/:id/cancel", cancelSalesOrder); // Cancel sales order

// Dispatch approval/rejection — master_inventory_manager or admin only
router.post(
  "/:id/approve-dispatch",
  authorize("master_inventory_manager", "admin"),
  approveSODispatch,
);
router.post(
  "/:id/reject-dispatch",
  authorize("master_inventory_manager", "admin"),
  rejectSODispatch,
);

module.exports = router;

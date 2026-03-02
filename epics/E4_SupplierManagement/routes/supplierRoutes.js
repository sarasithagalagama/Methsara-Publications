// ============================================
// Supplier Routes
// Epic: E4 - Supplier Management
// Owner: IT24100799 (Gawrawa G H Y)
// Purpose: Supplier management API endpoints
// ============================================

const express = require("express");
const router = express.Router();
const {
  getAllSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getTerminatedSuppliers,
  terminateSupplier,
  restoreSupplier,
  getSupplierAnalytics,
  recordPaymentToVendor,
  recordPaymentFromCustomer,
  getPartnersWithDebt,
} = require("../controllers/supplierController");
const {
  protect,
  authorize,
} = require("../../E1_UserAndRoleManagement/middleware/auth");

// All routes require supplier_manager or admin role
router.use(protect);
router.use(authorize("supplier_manager", "admin", "finance_manager"));

router.get("/", getAllSuppliers); // E4.1 - List active suppliers
router.get("/terminated", getTerminatedSuppliers); // E4.1 - List terminated suppliers
router.get("/analytics", getSupplierAnalytics); // E4.6 - Analytics
router.get("/debt", getPartnersWithDebt); // E4.5 - Get partners with outstanding debt
router.get("/:id", getSupplier); // E4.1 - Get single supplier by ID
router.post("/", createSupplier); // E4.1 - Create supplier
router.put("/:id", updateSupplier); // E4.1 - Update supplier
router.put("/:id/terminate", terminateSupplier); // E4.1 - Terminate supplier
router.put("/:id/restore", restoreSupplier); // E4.1 - Restore terminated supplier
router.post("/:id/payment-to-vendor", recordPaymentToVendor); // E4.5 - Record payment to vendor (we pay them)
router.post("/:id/payment-from-customer", recordPaymentFromCustomer); // E4.5 - Record payment from customer (they pay us)
router.delete("/:id", deleteSupplier); // E4.1 - Hard delete (admin only, kept for safety)

module.exports = router;

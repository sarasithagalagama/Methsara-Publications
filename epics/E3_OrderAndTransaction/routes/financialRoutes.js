// ============================================
// Financial Routes
// Epic: E3 - Order & Transaction
// Owner: IT24100191 (Jayasinghe D.B.P)
// Purpose: Financial management endpoints
// ============================================

const express = require("express");
const router = express.Router();
const {
  getFinancialDashboard,
  generateInvoice,
  processRefund,
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  payPurchaseOrder,
  generateFinancialPDF,
  generateFinancialCSV,
} = require('../controllers/financialController');
const { protect, authorize } = require('../../E1_UserAndRoleManagement/middleware/auth');

// All routes require finance_manager or admin role
router.use(protect);
router.use(authorize("finance_manager", "admin"));

router.get("/dashboard", getFinancialDashboard); // E3.9 - Financial dashboard
router.get("/invoices/:orderId", generateInvoice); // E3.10 - Generate invoice
router.get("/reports/pdf", generateFinancialPDF); // Backend PDF Report
router.get("/reports/csv", generateFinancialCSV); // Backend CSV Export
router.post("/refunds/:orderId", processRefund); // E3.11 - Process refund

// CRUD: Transactions
router.get("/transactions", getTransactions);
router.post("/transactions", createTransaction);
router.put("/transactions/:id", updateTransaction);
router.delete("/transactions/:id", deleteTransaction);

// Purchase Order Payment
router.put("/purchase-orders/:id/pay", payPurchaseOrder);

module.exports = router;

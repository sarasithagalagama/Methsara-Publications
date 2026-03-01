// ============================================
// Gift Voucher Routes
// Epic: E6 - Promotion & Loyalty
// Owner: IT24101266 (Perera M.U.E)
// Purpose: Gift voucher API endpoints (E6.4)
// ============================================

const express = require("express");
const router = express.Router();
const {
  createVoucher,
  getAllVouchers,
  validateVoucher,
  getVoucherProducts,
  createVoucherProduct,
  updateVoucherProduct,
  deleteVoucherProduct,
  deleteVoucher,
} = require("../controllers/giftVoucherController");
const {
  protect,
  authorize,
} = require("../../E1_UserAndRoleManagement/middleware/auth");

// Public routes
router.post("/validate", validateVoucher);
router.get("/products", getVoucherProducts);

// Protected routes (Managers/Admin)
router.use(protect);
router
  .route("/")
  .get(authorize("marketing_manager", "admin"), getAllVouchers)
  .post(authorize("marketing_manager", "admin"), createVoucher);

router
  .route("/products")
  .post(authorize("marketing_manager", "admin"), createVoucherProduct);

router
  .route("/products/:id")
  .put(authorize("marketing_manager", "admin"), updateVoucherProduct)
  .delete(authorize("marketing_manager", "admin"), deleteVoucherProduct);

router.delete("/:id", authorize("marketing_manager", "admin"), deleteVoucher);

module.exports = router;

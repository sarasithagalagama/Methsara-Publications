// ============================================
// Cart Routes
// Epic: E3 - Order & Transaction
// Owner: IT24100191 (Jayasinghe D.B.P)
// Purpose: Shopping cart API endpoints
// ============================================

const express = require("express");
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} = require('../controllers/cartController');
const { protect } = require('../../E1_UserAndRoleManagement/middleware/auth');

// All cart routes require authentication
router.use(protect);

router.get("/", getCart); // E3.1 - Get cart
router.post("/add", addToCart); // E3.1 - Add to cart
router.put("/update", updateCartItem); // E3.2 - Update quantity
router.delete("/remove/:productId", removeFromCart); // E3.2 - Remove item
router.delete("/clear", clearCart); // Clear cart

module.exports = router;

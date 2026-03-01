// ============================================
// Product Routes
// Epic: E2 - Product Catalog
// Owner: IT24101314 (Appuhami H A P L)
// Purpose: Product catalog API endpoints
// ============================================

const express = require("express");
const router = express.Router();
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  addReview,
  moderateReview,
  getRelatedProducts,
  getCategories,
  createCategory,
  renameCategory,
  deleteCategory,
  toggleReviewHelpful,
  getProductAnalytics,
  archiveProduct,
  unarchiveProduct,
} = require("../controllers/productController");
const {
  protect,
  authorize,
} = require("../../E1_UserAndRoleManagement/middleware/auth");

// Public routes
router.get("/", getProducts); // E2.1, E2.4, E2.5, E2.7 - Browse with search/filter/sort
router.get("/categories", getCategories); // E2 - List all categories with product count
router.post(
  "/categories",
  protect,
  authorize("product_manager", "admin"),
  createCategory,
); // E2 - Create a new category
router.get("/:id/related", getRelatedProducts); // E2.10 - Related products
router.get("/:id", getProduct); // E2.2, E2.6 - View product details

// Customer routes (protected)
router.post("/:id/reviews", protect, authorize("customer"), addReview); // E2.8 - Submit review
router.put("/:id/reviews/:reviewId/helpful", protect, toggleReviewHelpful); // E2.12 - Mark review helpful

// Product Manager routes
router.post(
  "/",
  protect,
  authorize("product_manager", "admin", "marketing_manager"),
  createProduct,
); // E2.3 - Create product
router.put(
  "/:id",
  protect,
  authorize("product_manager", "admin", "marketing_manager"),
  updateProduct,
); // E2.3 - Update product
router.delete(
  "/:id",
  protect,
  authorize("product_manager", "admin", "marketing_manager"),
  deleteProduct,
); // E2.3 - Delete product
router.put(
  "/:id/archive",
  protect,
  authorize("product_manager", "admin"),
  archiveProduct,
); // Archive
router.put(
  "/:id/unarchive",
  protect,
  authorize("product_manager", "admin"),
  unarchiveProduct,
); // Unarchive
router.put(
  "/reviews/:reviewId/moderate",
  protect,
  authorize("product_manager", "admin"),
  moderateReview,
); // E2.9 - Moderate review
router.get(
  "/:id/analytics",
  protect,
  authorize("product_manager", "admin"),
  getProductAnalytics,
); // E2.11 - Analytics

// Category management routes (product_manager / admin only)
router.put(
  "/categories/rename",
  protect,
  authorize("product_manager", "admin"),
  renameCategory,
); // E2 - Rename category bulk
router.delete(
  "/categories/:name",
  protect,
  authorize("product_manager", "admin"),
  deleteCategory,
); // E2 - Delete empty category

module.exports = router;

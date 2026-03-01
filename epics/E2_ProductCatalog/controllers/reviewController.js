// ============================================
// Review Controller
// Epic: E2 - Product Catalog
// Owner: IT24101314 (Appuhami H A P L)
// Purpose: Product reviews and ratings (E2.8)
// ============================================

const Review = require("../models/Review");
const Product = require("../models/Product");

// Get all reviews (admin/product manager view)
exports.getReviews = async (req, res) => {
  try {
    const { productId } = req.query;
    let query = {};
    if (productId) query.product = productId;

    const reviews = await Review.find(query)
      .populate("product", "title isbn price")
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch reviews",
      error: error.message,
    });
  }
};

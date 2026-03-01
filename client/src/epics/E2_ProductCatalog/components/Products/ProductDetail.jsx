// ============================================
// Product Detail Component
// Epic: E2 - Product Catalog
// Owner: IT24101314 (Appuhami H A P L)
// Features: Full product info, Reviews
// ============================================

import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import productService from "../../services/productService";
import {
  Star,
  Eye,
  BookOpen,
  Layers,
  Printer,
  MessageSquare,
} from "lucide-react";
import "./Products.css";

function ProductDetail() {
  const { id } = useParams();
  // State Variables
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [cartMessage, setCartMessage] = useState("");

  // Side Effects
  useEffect(() => {
    loadProduct();
  }, [id]);

  // Event Handlers
  const loadProduct = async () => {
    try {
      setLoading(true);
      const response = await productService.getProduct(id);
      setProduct(response.product);
    } catch (err) {
      setError("Failed to load product details");
    } finally {
      setLoading(false);
    }
  };

  const addToCart = () => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existingItem = cart.find((item) => item.product._id === product._id);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({ product, quantity, itemModel: "Product" });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    setCartMessage(`${quantity} × ${product.title} added to cart!`);
    setTimeout(() => setCartMessage(""), 3000);
  };

  if (loading)
    // Render
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  if (error)
    return (
      <div className="container" style={{ marginTop: "100px" }}>
        <div className="alert alert-error">{error}</div>
      </div>
    );
  if (!product)
    return (
      <div className="container" style={{ marginTop: "100px" }}>
        <p>Book not found</p>
      </div>
    );

  return (
    <div
      className="container detail-container"
      style={{ marginTop: "100px", marginBottom: "50px" }}
    >
      <div className="product-detail">
        {/* Product Images Section */}
        <div className="product-detail-image-section">
          <div className="product-detail-image card">
            <img
              src={
                product.image ||
                "https://via.placeholder.com/400x600?text=Book+Cover"
              }
              alt={product.title}
            />
          </div>
          {product.backCoverImage && (
            <div
              className="product-detail-image back-cover card"
              style={{ marginTop: "20px" }}
            >
              <img
                src={product.backCoverImage}
                alt={`${product.title} Back Cover`}
              />
              <span className="image-label">Back Cover</span>
            </div>
          )}
        </div>

        {/* Product Information Section */}
        <div className="product-detail-info">
          <div className="product-badges">
            <span className="badge badge-info">{product.grade}</span>
            <span className="badge badge-success">{product.subject}</span>
            <span className="badge badge-warning">{product.category}</span>
            {product.isFlashSale && (
              <span className="badge badge-danger">Flash Sale</span>
            )}
          </div>

          <h1 className="detail-title">{product.title}</h1>
          {product.titleSinhala && (
            <h2 className="detail-title-sinhala">{product.titleSinhala}</h2>
          )}

          <div className="author-block">
            <span>
              By <strong>{product.author}</strong>
            </span>
            <span className="dot-separator">•</span>
            <span>
              Published by <strong>{product.publisher}</strong>
            </span>
          </div>

          <div className="product-stats-bar">
            {product.rating > 0 && (
              <div className="stat-item">
                <Star size={18} fill="gold" stroke="none" />
                <span>
                  <strong>{product.rating.toFixed(1)}</strong> (
                  {product.totalReviews || 0} reviews)
                </span>
              </div>
            )}
            <div className="stat-item">
              <Eye size={18} />
              <span>{product.viewCount} views</span>
            </div>
          </div>

          <div className="book-specs-grid">
            <div className="spec-item">
              <BookOpen size={16} />
              <span>
                <strong>ISBN:</strong> {product.isbn || "N/A"}
              </span>
            </div>
            <div className="spec-item">
              <Layers size={16} />
              <span>
                <strong>Pages:</strong> {product.pageCount || "N/A"}
              </span>
            </div>
            <div className="spec-item">
              <Printer size={16} />
              <span>
                <strong>Edition:</strong> {product.examType}
              </span>
            </div>
          </div>

          <div className="description-section">
            <h3>Book Description</h3>
            <p className="product-description">{product.description}</p>
          </div>

          <div className="purchase-section">
            <div className="price-tag">
              <span className="currency">Rs.</span>
              <span className="amount">{product.price}</span>
            </div>

            <div className="quantity-selector-block">
              <label>Quantity</label>
              <div className="quantity-controls">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="qty-btn"
                >
                  -
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                  }
                  className="qty-input"
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="qty-btn"
                >
                  +
                </button>
              </div>
            </div>

            <button onClick={addToCart} className="btn-add-to-cart">
              🛒 Add to Cart
            </button>

            {cartMessage && (
              <div
                style={{
                  marginTop: "0.75rem",
                  padding: "0.6rem 1rem",
                  background: "#d4edda",
                  border: "1px solid #c3e6cb",
                  borderRadius: "8px",
                  color: "#155724",
                  fontSize: "0.9rem",
                  fontWeight: 500,
                }}
              >
                ✓ {cartMessage}
              </div>
            )}
          </div>

          {/* Reviews Section */}
          <div className="reviews-detail-section">
            <h3>Reader Reviews</h3>
            {product.reviews && product.reviews.length > 0 ? (
              <div className="reviews-list">
                {product.reviews.map((review, index) => (
                  <div key={index} className="review-card">
                    <div className="review-user-info">
                      <strong>{review.user?.name || "Customer"}</strong>
                      <div className="review-stars">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            fill={i < review.rating ? "gold" : "none"}
                            stroke={i < review.rating ? "gold" : "#ccc"}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="review-text">{review.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-reviews">
                <MessageSquare size={32} />
                <p>
                  No reviews yet. Be the first reader to share your thoughts!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;

// ============================================
// ProductDetail Component (Premium Redesign v2)
// Epic: E2 - Product Catalog
// Owner: IT24101314 (Appuhami H A P L)
// Purpose: View product details and reviews (E2.6, E2.8)
// ============================================

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../E1_UserAndRoleManagement/context/AuthContext";
import {
  Star,
  ShoppingCart,
  ChevronLeft,
  ShieldCheck,
  Truck,
  RefreshCw,
  ThumbsUp,
  BookOpen,
  Hash,
  Tag,
  GraduationCap,
  FileText,
  Globe,
} from "lucide-react";
import toast from "react-hot-toast";
import "./ProductDetail.css";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { refreshCounts } = useAuth();

  // State Variables
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState("main");
  const [activeTab, setActiveTab] = useState("synopsis");

  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: "",
  });
  const [hoveredRating, setHoveredRating] = useState(0);
  const [hasPurchased, setHasPurchased] = useState(false);
  // [E2.8] hasPurchased gates the review form — only customers with a 'Delivered' order can write a review

  // Side Effects
  // [id] dependency restarts all three fetches when the URL changes (navigating between product pages)
  useEffect(() => {
    fetchProductDetails();
    fetchRelatedProducts();
    checkPurchaseStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // [E2.8] Review gating: scan the customer's order history for any 'Delivered' order containing this product
  // This prevents fake reviews from users who never received the book
  const checkPurchaseStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await axios.get("/api/orders/my-orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const orders = res.data.orders || [];
      const purchased = orders.some(
        (order) =>
          order.orderStatus === "Delivered" &&
          order.items.some((item) => {
            const productId = item.product?._id || item.product;
            return productId?.toString() === id;
          }),
      );
      setHasPurchased(purchased);
    } catch (e) {
      // If error, treat as not purchased
      setHasPurchased(false);
    }
  };

  // Event Handlers
  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/products/${id}`);
      setProduct(res.data.product);
      setReviews(res.data.reviews || []);
      setActiveImage("main");
      setQuantity(1);
      window.scrollTo(0, 0);
    } catch (error) {
      console.error("Error fetching product:", error);
    } finally {
      setLoading(false);
    }
  };

  // [E2.10] Related products — fetched from a separate backend endpoint based on same grade/subject
  const fetchRelatedProducts = async () => {
    try {
      const res = await axios.get(`/api/products/${id}/related`);
      setRelatedProducts(res.data.products || []);
    } catch (error) {
      console.error("Error fetching related products:", error);
    }
  };

  const handleAddToCart = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        let guestCart = JSON.parse(localStorage.getItem("guestCart")) || {
          items: [],
          totalAmount: 0,
        };
        const existingItemIndex = guestCart.items.findIndex(
          (item) => item.product._id === product._id,
        );
        if (existingItemIndex > -1) {
          guestCart.items[existingItemIndex].quantity += quantity;
        } else {
          guestCart.items.push({
            product: {
              _id: product._id,
              title: product.title,
              image: product.image,
              grade: product.grade,
              author: product.author,
            },
            quantity,
            price: product.price,
          });
        }
        guestCart.totalAmount = guestCart.items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0,
        );
        localStorage.setItem("guestCart", JSON.stringify(guestCart));
        refreshCounts();
        toast.success("Added to cart!");
        return;
      }
      await axios.post(
        "/api/cart/add",
        { productId: id, quantity },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      refreshCounts();
      toast.success("Added to cart!");
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error(
        "Error adding to cart: " +
          (error.response?.data?.message || error.message),
      );
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please login to submit a review");
        navigate("/login");
        return;
      }
      await axios.post(`/api/products/${id}/reviews`, reviewForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Review submitted!");
      setReviewForm({ rating: 5, comment: "" });
      fetchProductDetails();
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Error: " + (error.response?.data?.message || error.message));
    }
  };

  const handleToggleHelpful = async (reviewId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please login to vote on reviews");
        navigate("/login");
        return;
      }
      const res = await axios.put(
        `/api/products/${id}/reviews/${reviewId}/helpful`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setReviews(
        reviews.map((review) => {
          if (review._id === reviewId) {
            const currentUserId = JSON.parse(atob(token.split(".")[1])).id;
            let newHelpfulVotes = [...(review.helpfulVotes || [])];
            if (res.data.isHelpful) {
              newHelpfulVotes.push(currentUserId);
            } else {
              newHelpfulVotes = newHelpfulVotes.filter(
                (uid) => uid !== currentUserId,
              );
            }
            return { ...review, helpfulVotes: newHelpfulVotes };
          }
          return review;
        }),
      );
    } catch (error) {
      console.error("Error toggling helpful vote:", error);
      toast.error(
        "Error: " + (error.response?.data?.message || "Failed to submit vote"),
      );
    }
  };

  // Render
  if (loading) {
    return (
      <div className="pd2-loading">
        <div className="pd2-spinner"></div>
        <p>Loading book details…</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="pd2-error">
        <BookOpen size={48} />
        <h2>Book not found</h2>
        <button onClick={() => navigate("/books")} className="pd2-btn-primary">
          Return to Catalog
        </button>
      </div>
    );
  }

  const avgRating = Number(product.averageRating || 0);
  const totalReviews = product.totalReviews || 0;
  // Decode JWT payload (base64 middle segment) to extract the current user's ID without an extra API call
  const currentUserId = (() => {
    try {
      const token = localStorage.getItem("token");
      return token ? JSON.parse(atob(token.split(".")[1])).id : null;
    } catch {
      return null;
    }
  })();

  return (
    <div className="pd2-page">
      {/* ── HERO SECTION ── */}
      <div className="pd2-hero">
        {/* Blurred BG from cover */}
        <div
          className="pd2-hero-blur-bg"
          style={{ backgroundImage: `url(${product.image})` }}
        />
        <div className="pd2-hero-overlay" />

        {/* Breadcrumb */}
        <div className="pd2-breadcrumb">
          <button onClick={() => navigate("/books")} className="pd2-back-btn">
            <ChevronLeft size={18} />
            <span>All Books</span>
          </button>
          <span className="pd2-breadcrumb-sep">/</span>
          <span className="pd2-breadcrumb-item">{product.grade}</span>
          <span className="pd2-breadcrumb-sep">/</span>
          <span className="pd2-breadcrumb-item pd2-breadcrumb-current">
            {product.title}
          </span>
        </div>

        {/* Main Product Card */}
        <div className="pd2-hero-card">
          {/* Left: Book Cover */}
          <div className="pd2-cover-section">
            {product.isFlashSale && (
              <div className="pd2-flash-badge">🔥 Flash Sale</div>
            )}
            <div className="pd2-cover-frame">
              <img
                src={
                  activeImage === "main"
                    ? product.image
                    : product.backCoverImage || product.image
                }
                alt={product.title}
                className="pd2-cover-img"
              />
            </div>
            {product.backCoverImage && (
              <div className="pd2-cover-switcher">
                <button
                  className={`pd2-cover-btn ${activeImage === "main" ? "active" : ""}`}
                  onClick={() => setActiveImage("main")}
                >
                  Front
                </button>
                <button
                  className={`pd2-cover-btn ${activeImage === "back" ? "active" : ""}`}
                  onClick={() => setActiveImage("back")}
                >
                  Back
                </button>
              </div>
            )}
          </div>

          {/* Right: Info */}
          <div className="pd2-info-section">
            <div className="pd2-grade-pill">{product.grade}</div>

            <h1 className="pd2-title">{product.title}</h1>
            {product.titleSinhala && (
              <h2 className="pd2-title-si">{product.titleSinhala}</h2>
            )}
            <p className="pd2-author">
              by <strong>{product.author}</strong>
            </p>

            {/* Stars */}
            <div className="pd2-rating-row">
              <div className="pd2-stars">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={18}
                    fill={i < Math.round(avgRating) ? "#f59e0b" : "none"}
                    stroke={i < Math.round(avgRating) ? "#f59e0b" : "#6b7280"}
                  />
                ))}
              </div>
              <span className="pd2-rating-num">{avgRating.toFixed(1)}</span>
              <a href="#reviews" className="pd2-rating-link">
                ({totalReviews} review{totalReviews !== 1 ? "s" : ""})
              </a>
            </div>

            {/* Price */}
            <div className="pd2-price-block">
              {product.hasDiscount && (
                <span className="pd2-price-was">
                  Rs. {Number(product.originalPrice).toLocaleString()}
                </span>
              )}
              <span className="pd2-price-now">
                Rs. {Number(product.price).toLocaleString()}
              </span>
              {product.hasDiscount && (
                <span className="pd2-discount-tag">
                  Save{" "}
                  {Math.round(
                    ((product.originalPrice - product.price) /
                      product.originalPrice) *
                      100,
                  )}
                  %
                </span>
              )}
            </div>

            {/* Stock */}
            <div
              className={`pd2-stock ${product.stock > 0 ? "in-stock" : "out-stock"}`}
            >
              <span className="pd2-stock-dot" />
              {product.stock > 0
                ? `In Stock — ${product.stock} copies available`
                : "Out of Stock"}
            </div>

            {/* Qty + Cart */}
            <div className="pd2-actions">
              <div className="pd2-qty">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={product.stock === 0}
                  className="pd2-qty-btn"
                >
                  −
                </button>
                <span className="pd2-qty-val">{quantity}</span>
                <button
                  onClick={() =>
                    setQuantity(Math.min(product.stock, quantity + 1))
                  }
                  disabled={product.stock === 0 || quantity >= product.stock}
                  className="pd2-qty-btn"
                >
                  +
                </button>
              </div>
              <button
                className={`pd2-cart-btn ${product.stock === 0 ? "disabled" : ""}`}
                onClick={handleAddToCart}
                disabled={product.stock === 0}
              >
                <ShoppingCart size={20} />
                {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
              </button>
              <button
                className={`pd2-buynow-btn ${product.stock === 0 ? "disabled" : ""}`}
                onClick={async () => {
                  if (product.stock === 0) return;
                  await handleAddToCart();
                  navigate("/checkout");
                }}
                disabled={product.stock === 0}
              >
                Buy Now
              </button>
            </div>

            {/* Trust Pills */}
            <div className="pd2-trust">
              <div className="pd2-trust-item">
                <ShieldCheck size={16} />
                <span>Authentic</span>
              </div>
              <div className="pd2-trust-item">
                <Truck size={16} />
                <span>Island-wide Delivery</span>
              </div>
              <div className="pd2-trust-item">
                <RefreshCw size={16} />
                <span>Easy Returns</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── DETAIL TABS ── */}
      <div className="pd2-tabs-section">
        <div className="pd2-tabs-container">
          <div className="pd2-tab-bar">
            {["synopsis", "details", "reviews"].map((tab) => (
              <button
                key={tab}
                className={`pd2-tab ${activeTab === tab ? "active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab === "reviews" && totalReviews > 0 && (
                  <span className="pd2-tab-badge">{totalReviews}</span>
                )}
              </button>
            ))}
          </div>

          {/* Synopsis Tab */}
          {activeTab === "synopsis" && (
            <div className="pd2-tab-panel">
              <div className="pd2-synopsis-content">
                <h3 className="pd2-panel-title">About This Book</h3>
                <p className="pd2-synopsis-text">
                  {product.description ||
                    "No description available for this title."}
                </p>
              </div>
            </div>
          )}

          {/* Details Tab */}
          {activeTab === "details" && (
            <div className="pd2-tab-panel">
              <h3 className="pd2-panel-title">Publication Details</h3>
              <div className="pd2-specs-grid">
                <div className="pd2-spec-item">
                  <div className="pd2-spec-icon">
                    <Hash size={18} />
                  </div>
                  <div>
                    <span className="pd2-spec-label">ISBN</span>
                    <span className="pd2-spec-val">
                      {product.isbn || "N/A"}
                    </span>
                  </div>
                </div>
                <div className="pd2-spec-item">
                  <div className="pd2-spec-icon">
                    <GraduationCap size={18} />
                  </div>
                  <div>
                    <span className="pd2-spec-label">Grade / Level</span>
                    <span className="pd2-spec-val">{product.grade}</span>
                  </div>
                </div>
                <div className="pd2-spec-item">
                  <div className="pd2-spec-icon">
                    <Tag size={18} />
                  </div>
                  <div>
                    <span className="pd2-spec-label">Subject</span>
                    <span className="pd2-spec-val">
                      {product.subject || "N/A"}
                    </span>
                  </div>
                </div>
                {product.examType && (
                  <div className="pd2-spec-item">
                    <div className="pd2-spec-icon">
                      <BookOpen size={18} />
                    </div>
                    <div>
                      <span className="pd2-spec-label">Exam Type</span>
                      <span className="pd2-spec-val">{product.examType}</span>
                    </div>
                  </div>
                )}
                {product.pageCount > 0 && (
                  <div className="pd2-spec-item">
                    <div className="pd2-spec-icon">
                      <FileText size={18} />
                    </div>
                    <div>
                      <span className="pd2-spec-label">Pages</span>
                      <span className="pd2-spec-val">{product.pageCount}</span>
                    </div>
                  </div>
                )}
                <div className="pd2-spec-item">
                  <div className="pd2-spec-icon">
                    <Globe size={18} />
                  </div>
                  <div>
                    <span className="pd2-spec-label">Language</span>
                    <span className="pd2-spec-val">Sinhala / English</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === "reviews" && (
            <div className="pd2-tab-panel" id="reviews">
              <div className="pd2-reviews-layout">
                {/* Rating Summary */}
                <div className="pd2-rating-summary">
                  <div className="pd2-rating-big">{avgRating.toFixed(1)}</div>
                  <div className="pd2-stars pd2-stars-lg">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={22}
                        fill={i < Math.round(avgRating) ? "#f59e0b" : "none"}
                        stroke={
                          i < Math.round(avgRating) ? "#f59e0b" : "#d1d5db"
                        }
                      />
                    ))}
                  </div>
                  <p className="pd2-rating-count">{totalReviews} Reviews</p>

                  {/* Write Review Form */}
                  <div className="pd2-review-form-card">
                    <h4>Write a Review</h4>
                    {hasPurchased ? (
                      <form onSubmit={handleSubmitReview}>
                        <div className="pd2-star-picker">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={28}
                              className="pd2-star-pick"
                              fill={
                                star <= (hoveredRating || reviewForm.rating)
                                  ? "#f59e0b"
                                  : "none"
                              }
                              stroke={
                                star <= (hoveredRating || reviewForm.rating)
                                  ? "#f59e0b"
                                  : "#d1d5db"
                              }
                              onMouseEnter={() => setHoveredRating(star)}
                              onMouseLeave={() => setHoveredRating(0)}
                              onClick={() =>
                                setReviewForm({ ...reviewForm, rating: star })
                              }
                            />
                          ))}
                        </div>
                        <textarea
                          className="pd2-review-textarea"
                          value={reviewForm.comment}
                          onChange={(e) =>
                            setReviewForm({
                              ...reviewForm,
                              comment: e.target.value,
                            })
                          }
                          placeholder="Share your experience with this book…"
                          required
                          rows={4}
                        />
                        <button
                          type="submit"
                          className="pd2-btn-primary pd2-review-submit"
                        >
                          Publish Review
                        </button>
                      </form>
                    ) : (
                      <div className="pd2-purchase-gate">
                        <ShoppingCart size={28} />
                        <p>
                          Only customers who have{" "}
                          <strong>purchased and received</strong> this book can
                          leave a review.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Reviews Feed */}
                <div className="pd2-reviews-feed">
                  {reviews.length === 0 ? (
                    <div className="pd2-no-reviews">
                      <Star size={32} />
                      <p>
                        No reviews yet. Be the first to share your thoughts!
                      </p>
                    </div>
                  ) : (
                    reviews.map((review) => {
                      const voted =
                        currentUserId &&
                        Array.isArray(review.helpfulVotes) &&
                        review.helpfulVotes.includes(currentUserId);
                      return (
                        <div key={review._id} className="pd2-review-card">
                          <div className="pd2-review-header">
                            <div className="pd2-reviewer-avatar">
                              {(review.user?.name || "A")[0].toUpperCase()}
                            </div>
                            <div className="pd2-reviewer-meta">
                              <span className="pd2-reviewer-name">
                                {review.user?.name || "Anonymous"}
                              </span>
                              <span className="pd2-review-date">
                                {new Date(review.createdAt).toLocaleDateString(
                                  undefined,
                                  {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  },
                                )}
                              </span>
                            </div>
                            <div className="pd2-review-stars">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={14}
                                  fill={i < review.rating ? "#f59e0b" : "none"}
                                  stroke={
                                    i < review.rating ? "#f59e0b" : "#d1d5db"
                                  }
                                />
                              ))}
                            </div>
                          </div>
                          <p className="pd2-review-body">{review.comment}</p>
                          <div className="pd2-review-footer">
                            <button
                              className={`pd2-helpful-btn ${voted ? "voted" : ""}`}
                              onClick={() => handleToggleHelpful(review._id)}
                            >
                              <ThumbsUp size={14} />
                              Helpful ({review.helpfulVotes?.length || 0})
                            </button>
                            <span className="pd2-verified">✓ Verified</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── RELATED BOOKS ── */}
      {relatedProducts.length > 0 && (
        <div className="pd2-discovery">
          <div className="pd2-discovery-section">
            <h2 className="pd2-discovery-title">You May Also Like</h2>
            <div className="pd2-discovery-grid">
              {relatedProducts.slice(0, 4).map((item) => (
                <div
                  key={item._id}
                  className="pd2-discovery-card"
                  onClick={() => navigate(`/books/${item._id}`)}
                >
                  <div className="pd2-disc-img-wrap">
                    <img
                      src={item.image || "https://via.placeholder.com/200"}
                      alt={item.title}
                    />
                  </div>
                  <div className="pd2-disc-info">
                    <h4>{item.title}</h4>
                    <span>Rs. {Number(item.price).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;

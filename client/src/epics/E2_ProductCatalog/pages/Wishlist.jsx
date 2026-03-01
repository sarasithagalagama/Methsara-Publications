// ============================================
// Wishlist
// Epic: E2 - Product Catalog
// Owner: IT24101314 (Appuhami H A P L)
// Purpose: Wishlist page component
// ============================================
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Heart,
  ShoppingCart,
  Trash2,
  ArrowLeft,
  BookOpen,
  ChevronRight,
  X,
  ShoppingBag,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../E1_UserAndRoleManagement/context/AuthContext";
import "./Wishlist.css";

// Skeleton card
const SkeletonWishlistCard = () => (
  <div className="wl-card wl-skeleton">
    <div className="wl-skel-img" />
    <div className="wl-card-body">
      <div className="wl-skel-line short" />
      <div className="wl-skel-line" />
      <div className="wl-skel-line thin" />
      <div className="wl-skel-line btn-line" />
    </div>
  </div>
);

const Wishlist = () => {
  const navigate = useNavigate();
  const { refreshCounts } = useAuth();

  // State Variables
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(null); // productId being added
  const [removingItem, setRemovingItem] = useState(null); // productId being removed

  // [E2.9] Wishlist stored in localStorage — persists across sessions without requiring login
  // Load wishlist from localStorage
  // Side Effects
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("wishlist")) || [];
    setWishlistItems(stored);
    setLoading(false);
  }, []);

  // Persist wishlist changes to localStorage and refresh header badge count
  const persistWishlist = (updated) => {
    setWishlistItems(updated);
    localStorage.setItem("wishlist", JSON.stringify(updated));
    refreshCounts();
  };

  // Remove a single item from wishlist
  // Event Handlers
  const handleRemove = (productId) => {
    setRemovingItem(productId);
    setTimeout(() => {
      const updated = wishlistItems.filter((item) => item._id !== productId);
      persistWishlist(updated);
      setRemovingItem(null);
      toast.success("Removed from wishlist");
    }, 300);
  };

  // Clear the entire wishlist
  const handleClearAll = () => {
    persistWishlist([]);
    toast.success("Wishlist cleared");
  };

  // Add a single item to cart
  const handleAddToCart = async (item) => {
    setAddingToCart(item._id);
    try {
      const token = localStorage.getItem("token");
      // [E3.1] Guest cart (localStorage) vs authenticated cart (server API) — branch on JWT token presence
      if (!token) {
        let guestCart = JSON.parse(localStorage.getItem("guestCart")) || {
          items: [],
          totalAmount: 0,
        };
        const existingIndex = guestCart.items.findIndex(
          (ci) => ci.product._id === item._id,
        );
        if (existingIndex > -1) {
          guestCart.items[existingIndex].quantity += 1;
        } else {
          guestCart.items.push({
            product: {
              _id: item._id,
              title: item.title,
              image: item.image,
            },
            quantity: 1,
            price: item.price,
          });
        }
        guestCart.totalAmount = guestCart.items.reduce(
          (sum, ci) => sum + ci.price * ci.quantity,
          0,
        );
        localStorage.setItem("guestCart", JSON.stringify(guestCart));
        refreshCounts();
        toast.success("Added to cart!");
      } else {
        await axios.post(
          "/api/cart/add",
          { productId: item._id, quantity: 1 },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        refreshCounts();
        toast.success("Added to cart!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add to cart");
    } finally {
      setAddingToCart(null);
    }
  };

  // Add a single item to cart and remove from wishlist
  const handleMoveToCart = async (item) => {
    await handleAddToCart(item);
    const updated = wishlistItems.filter((wi) => wi._id !== item._id);
    persistWishlist(updated);
  };

  // Move all items to cart
  const handleMoveAllToCart = async () => {
    for (const item of wishlistItems) {
      await handleAddToCart(item);
    }
    persistWishlist([]);
    toast.success("All items moved to cart!");
    navigate("/cart");
  };

  // Total value of wishlisted items
  const totalValue = wishlistItems.reduce(
    (sum, item) => sum + (item.price || 0),
    0,
  );

  // Render
  return (
    <div className="wl-page">
      {/* ── Banner ── */}
      <div className="wl-banner">
        <div className="container">
          <div className="wl-banner-content">
            <Link to="/books" className="wl-back-link">
              <ArrowLeft size={16} /> Back to Books
            </Link>
            <h1>
              My <span className="wl-gold">Wishlist</span>
            </h1>
            <p>Save books you love — add to cart whenever you're ready.</p>
            {!loading && wishlistItems.length > 0 && (
              <div className="wl-counter-badge">
                <Heart size={16} fill="currentColor" />
                {wishlistItems.length}{" "}
                {wishlistItems.length === 1 ? "item" : "items"} saved
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container wl-container">
        {loading ? (
          /* Skeleton */
          <div className="wl-grid">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonWishlistCard key={i} />
            ))}
          </div>
        ) : wishlistItems.length === 0 ? (
          /* Empty State */
          <div className="wl-empty">
            <div className="wl-empty-icon">
              <Heart size={52} strokeWidth={1.5} />
            </div>
            <h2>Your wishlist is empty</h2>
            <p>
              Browse our catalog and tap the{" "}
              <Heart
                size={16}
                style={{ display: "inline", verticalAlign: "middle" }}
              />{" "}
              on any book to save it here.
            </p>
            <Link to="/books" className="wl-cta-btn">
              <BookOpen size={18} /> Explore Books
            </Link>
          </div>
        ) : (
          <>
            {/* ── Action Bar ── */}
            <div className="wl-action-bar">
              <div className="wl-action-info">
                <span className="wl-total-value">
                  Total value:{" "}
                  <strong>Rs. {totalValue.toLocaleString()}</strong>
                </span>
              </div>
              <div className="wl-action-btns">
                <button className="wl-btn-outline" onClick={handleClearAll}>
                  <Trash2 size={16} /> Clear All
                </button>
                <button
                  className="wl-btn-primary"
                  onClick={handleMoveAllToCart}
                >
                  <ShoppingBag size={16} /> Move All to Cart
                </button>
              </div>
            </div>

            {/* ── Grid ── */}
            <div className="wl-grid">
              {wishlistItems.map((item) => (
                <div
                  key={item._id}
                  className={`wl-card ${removingItem === item._id ? "wl-card--removing" : ""}`}
                >
                  {/* Remove button */}
                  <button
                    className="wl-remove-btn"
                    onClick={() => handleRemove(item._id)}
                    title="Remove from wishlist"
                    aria-label="Remove from wishlist"
                  >
                    <X size={16} />
                  </button>

                  {/* Book Image */}
                  <Link to={`/books/${item._id}`} className="wl-img-link">
                    <div className="wl-img-box">
                      <img
                        src={
                          item.image ||
                          `https://via.placeholder.com/300x400/f7f5f0/5D4037?text=${encodeURIComponent(item.title || "Book")}`
                        }
                        alt={item.title}
                        className="wl-book-img"
                        loading="lazy"
                      />
                      <div className="wl-img-overlay">
                        <span className="wl-view-label">
                          View Details <ChevronRight size={14} />
                        </span>
                      </div>
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="wl-card-body">
                    {item.grade && (
                      <span className="wl-grade-badge">{item.grade}</span>
                    )}
                    <Link to={`/books/${item._id}`} className="wl-title-link">
                      <h3 className="wl-book-title">{item.title}</h3>
                    </Link>
                    {item.author && <p className="wl-author">{item.author}</p>}
                    <div className="wl-price-row">
                      {item.originalPrice &&
                        item.originalPrice > item.price && (
                          <span className="wl-original-price">
                            Rs. {Number(item.originalPrice).toLocaleString()}
                          </span>
                        )}
                      <span className="wl-price">
                        Rs. {Number(item.price).toLocaleString()}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="wl-card-actions">
                      <button
                        className="wl-add-cart-btn"
                        onClick={() => handleAddToCart(item)}
                        disabled={addingToCart === item._id}
                      >
                        {addingToCart === item._id ? (
                          <span className="wl-spinner" />
                        ) : (
                          <ShoppingCart size={16} />
                        )}
                        {addingToCart === item._id
                          ? "Adding..."
                          : "Add to Cart"}
                      </button>
                      <button
                        className="wl-move-btn"
                        onClick={() => handleMoveToCart(item)}
                        disabled={addingToCart === item._id}
                        title="Add to cart and remove from wishlist"
                      >
                        Move
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Footer CTA ── */}
            <div className="wl-footer-cta">
              <Link to="/books" className="wl-continue-link">
                <ArrowLeft size={16} /> Continue browsing
              </Link>
              <Link to="/cart" className="wl-view-cart-link">
                View Cart <ChevronRight size={16} />
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Wishlist;

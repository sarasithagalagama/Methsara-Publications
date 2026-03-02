// ============================================
// Cart
// Epic: E3 - Order & Transaction
// Owner: IT24100191 (Jayasinghe D.B.P)
// Purpose: Cart page component
// ============================================
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../E1_UserAndRoleManagement/context/AuthContext";
import {
  X,
  Trash2,
  ArrowLeft,
  ShoppingBag,
  ChevronRight,
  Minus,
  Plus,
  ShieldCheck,
  RotateCcw,
  BadgeCheck,
} from "lucide-react";
import "./Cart.css";

const CHECKOUT_STEPS = ["Browse", "Cart", "Checkout", "Success"];
// [E3.1] Visual stepper shows the customer's progress through the purchase funnel

const Cart = () => {
  // State Variables
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const { refreshCounts } = useAuth();
  const navigate = useNavigate();

  // Side Effects
  useEffect(() => {
    fetchCart();
  }, []);

  // Event Handlers
  // [E3.1] Cart fetch: branches on token presence — guest uses localStorage, auth user uses server-side cart
  const fetchCart = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        const guestCart = JSON.parse(localStorage.getItem("guestCart")) || {
          items: [],
          totalAmount: 0,
          discount: 0,
        };
        setCart(guestCart);
        setLoading(false);
        return;
      }
      const res = await axios.get("/api/cart", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCart(res.data.cart);
    } catch (error) {
      console.error("Error fetching cart:", error);
    } finally {
      setLoading(false);
      refreshCounts();
    }
  };

  // [E3.2] Update quantity: mirrors the same guest/auth branch pattern as fetchCart
  const updateQuantity = async (
    productId,
    newQuantity,
    itemModel = "Product",
  ) => {
    if (newQuantity < 1) return;
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        let guestCart = JSON.parse(localStorage.getItem("guestCart")) || {
          items: [],
          totalAmount: 0,
          discount: 0,
        };
        const itemIndex = guestCart.items.findIndex(
          (item) =>
            item.product._id === productId &&
            (item.itemModel || "Product") === itemModel,
        );
        if (itemIndex > -1) {
          guestCart.items[itemIndex].quantity = newQuantity;
          guestCart.totalAmount = guestCart.items.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0,
          );
          localStorage.setItem("guestCart", JSON.stringify(guestCart));
          fetchCart();
        }
        return;
      }
      await axios.put(
        "/api/cart/update",
        { productId, quantity: newQuantity, itemModel },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      fetchCart();
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
  };

  const removeItem = async (productId, itemModel = "Product") => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        let guestCart = JSON.parse(localStorage.getItem("guestCart")) || {
          items: [],
          totalAmount: 0,
          discount: 0,
        };
        guestCart.items = guestCart.items.filter(
          (item) =>
            !(
              item.product._id === productId &&
              (item.itemModel || "Product") === itemModel
            ),
        );
        guestCart.totalAmount = guestCart.items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0,
        );
        localStorage.setItem("guestCart", JSON.stringify(guestCart));
        fetchCart();
        return;
      }
      await axios.delete(
        `/api/cart/remove/${productId}?itemModel=${itemModel}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      fetchCart();
    } catch (error) {
      console.error("Error removing item:", error);
    }
  };

  const clearCart = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        localStorage.removeItem("guestCart");
        setCart({ items: [], totalAmount: 0, discount: 0 });
        return;
      }
      const res = await axios.delete("/api/cart/clear", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCart(res.data.cart);
      refreshCounts();
    } catch (error) {
      console.error("Error clearing cart:", error);
    }
  };

  if (loading) {
    // Render
    return (
      <div className="cart-modern-page">
        <div className="checkout-progress-modern">
          {/* Progress bar loader skeleton could go here */}
        </div>
        <div
          className="container"
          style={{
            minHeight: "50vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <p style={{ color: "var(--text-secondary)" }}>Loading your bag...</p>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="cart-modern-page">
        <div className="container empty-cart-modern animate-fade-in-up">
          <div className="empty-cart-icon-modern">
            <ShoppingBag size={56} strokeWidth={1.5} />
          </div>
          <h2>Your Bag is Empty</h2>
          <p>
            It seems like you haven't added any books to your cart yet. Explore
            our collection and find your next great read!
          </p>
          <Link to="/books" className="btn-modern-primary mt-2">
            Start Exploring <ChevronRight size={18} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-modern-page">
      {/* ── Progress Bar ── */}
      <div className="checkout-progress-modern">
        <div className="container">
          <div className="progress-steps-modern">
            {CHECKOUT_STEPS.map((step, i) => (
              <div
                key={step}
                className={`progress-step-modern ${i === 1 ? "active" : i < 1 ? "done" : ""}`}
              >
                <div className="step-circle-modern">{i < 1 ? "✓" : i + 1}</div>
                <span className="step-label-modern">{step}</span>
                {i < CHECKOUT_STEPS.length - 1 && (
                  <div
                    className={`step-connector-modern ${i < 1 ? "filled" : ""}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container animate-fade-in-up">
        {/* ── Header ── */}
        <div className="cart-header-modern">
          <h1>
            Shopping <span className="text-gradient">Bag</span>
          </h1>
          <button onClick={clearCart} className="clear-cart-btn-modern">
            <Trash2 size={16} /> Clear Bag
          </button>
        </div>

        {/* ── Content Grid ── */}
        <div className="cart-content-modern">
          {/* List */}
          <div className="cart-items-list-modern">
            {cart.items.map((item) => (
              <div key={item._id} className="cart-item-card-modern">
                <div className="item-thumb-box-modern">
                  <img
                    src={
                      item.product?.image ||
                      `https://via.placeholder.com/150x200/fdfbf7/5D4037?text=${encodeURIComponent(item.product?.title || "Book")}`
                    }
                    alt={item.product?.title}
                    className="item-thumb-img-modern"
                  />
                </div>

                <div className="item-main-info-modern">
                  <span className="item-meta-modern">
                    {item.itemModel === "Product"
                      ? `${item.product?.grade || "Education"} • ${item.product?.author || "Various Authors"}`
                      : "Gift Voucher Catalog"}
                  </span>
                  <h3>{item.product?.title || item.product?.name}</h3>
                  <p className="item-unit-price-modern">
                    LKR{" "}
                    {Number(item.price).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>

                <div className="item-qty-modern">
                  <button
                    onClick={() =>
                      updateQuantity(
                        item.product._id,
                        item.quantity - 1,
                        item.itemModel,
                      )
                    }
                    disabled={item.quantity <= 1}
                  >
                    <Minus size={14} />
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    onClick={() =>
                      updateQuantity(
                        item.product._id,
                        item.quantity + 1,
                        item.itemModel,
                      )
                    }
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <div className="item-total-modern">
                  LKR{" "}
                  {(item.price * item.quantity).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </div>

                <button
                  onClick={() => removeItem(item.product._id, item.itemModel)}
                  className="remove-btn-modern"
                  title="Remove Item"
                >
                  <X size={20} />
                </button>
              </div>
            ))}
          </div>

          {/* ── Order Summary Sidebar ── */}
          <aside className="cart-summary-modern">
            <h2>Order Summary</h2>

            <div className="summary-details-modern">
              <div className="summary-row-modern">
                <span>
                  Subtotal (
                  {cart.items.reduce((acc, curr) => acc + curr.quantity, 0)}{" "}
                  items)
                </span>
                <span>
                  LKR{" "}
                  {cart.totalAmount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div
                className="summary-row-modern"
                style={{ color: "var(--text-light)" }}
              >
                <span>Delivery</span>
                <span>Calculated at checkout</span>
              </div>

              {cart.discount > 0 && (
                <div
                  className="summary-row-modern"
                  style={{ color: "#10b981" }}
                >
                  <span>Discount</span>
                  <span>
                    - LKR{" "}
                    {cart.discount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              )}

              <div className="summary-row-modern grand-total-modern">
                <span>Total</span>
                <span>
                  LKR{" "}
                  {cart.totalAmount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>

            <button
              onClick={() => navigate("/checkout")}
              className="btn-modern-primary w-100"
              style={{ padding: "1.25rem", fontSize: "1.1rem" }}
            >
              Proceed to Checkout <ChevronRight size={20} />
            </button>

            <Link to="/books" className="back-to-shop-modern">
              <ArrowLeft size={16} /> Continue Shopping
            </Link>

            {/* Trust Badges */}
            <div className="trust-badges-modern">
              <div className="trust-badge-modern">
                <div className="badge-icon-modern">
                  <ShieldCheck size={20} />
                </div>
                <div className="badge-text-modern">
                  <strong>Secure Payment</strong>
                  <span>256-bit SSL encryption</span>
                </div>
              </div>
              <div className="trust-badge-modern">
                <div className="badge-icon-modern">
                  <RotateCcw size={20} />
                </div>
                <div className="badge-text-modern">
                  <strong>Easy Returns</strong>
                  <span>14-day return policy</span>
                </div>
              </div>
              <div className="trust-badge-modern">
                <div className="badge-icon-modern">
                  <BadgeCheck size={20} />
                </div>
                <div className="badge-text-modern">
                  <strong>Authentic Books</strong>
                  <span>Original publications</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Cart;

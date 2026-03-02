// ============================================
// Checkout Component
// Epic: E3 - Order & Transaction
// Owner: IT24100191 (Jayasinghe D.B.P)
// Features: Delivery address, Payment, Coupon
// ============================================

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import orderService from "../../services/orderService";
import couponService from "../../../E6_PromotionAndLoyalty/services/couponService";
import authService from "../../../E1_UserAndRoleManagement/services/authService";
import "./Orders.css";

function Checkout() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  // State Variables
  const [cartItems] = useState(
    JSON.parse(localStorage.getItem("cart") || "[]"),
  );

  const [formData, setFormData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    street: "",
    city: "",
    postalCode: "",
    paymentMethod: "COD",
    couponCode: "",
  });

  const [couponDiscount, setCouponDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Event Handlers
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // [E6.3] [E3.12] Coupon application: validateCoupon calls backend which checks code validity, expiry, usage limits
  const validateCoupon = async () => {
    if (!formData.couponCode) return;

    try {
      const subtotal = calculateSubtotal();
      const response = await couponService.validateCoupon(
        formData.couponCode,
        subtotal,
      );
      setCouponDiscount(response.coupon.discount);
      alert(`Coupon applied! You saved Rs. ${response.coupon.discount}`);
    } catch (err) {
      alert(err.response?.data?.message || "Invalid coupon code");
      setCouponDiscount(0);
    }
  };

  const calculateSubtotal = () => {
    return cartItems.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0,
    );
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const deliveryFee = 300;
    return subtotal + deliveryFee - couponDiscount;
  };

  // Place order
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const orderData = {
        items: cartItems.map((item) => ({
          product: item.product._id,
          quantity: item.quantity,
        })),
        deliveryAddress: {
          name: formData.name,
          phone: formData.phone,
          street: formData.street,
          city: formData.city,
          postalCode: formData.postalCode,
        },
        paymentMethod: formData.paymentMethod,
        couponCode: formData.couponCode || undefined,
        fulfillmentLocation: "Main",
      };

      if (!user) {
        orderData.guestEmail = prompt("Please enter your email:");
        orderData.guestName = formData.name;
      }

      await orderService.createOrder(orderData);
      localStorage.removeItem("cart");
      alert("Order placed successfully!");
      navigate("/orders");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    // Render
    return (
      <div className="container">
        <div className="alert alert-warning">
          Your cart is empty. Please add items before checkout.
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Checkout</h1>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="checkout-layout">
        {/* DEMO: Checkout Form */}
        <form onSubmit={handleSubmit} className="checkout-form">
          <div className="card">
            <h2>Delivery Information</h2>

            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                name="name"
                className="form-input"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                name="phone"
                className="form-input"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Street Address</label>
              <input
                type="text"
                name="street"
                className="form-input"
                value={formData.street}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">City</label>
                <input
                  type="text"
                  name="city"
                  className="form-input"
                  value={formData.city}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Postal Code</label>
                <input
                  type="text"
                  name="postalCode"
                  className="form-input"
                  value={formData.postalCode}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="card">
            <h2>Payment Method</h2>

            <div className="payment-methods">
              <label className="payment-option">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="COD"
                  checked={formData.paymentMethod === "COD"}
                  onChange={handleChange}
                />
                <span>Cash on Delivery</span>
              </label>

              <label className="payment-option">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="Bank Transfer"
                  checked={formData.paymentMethod === "Bank Transfer"}
                  onChange={handleChange}
                />
                <span>Bank Transfer</span>
              </label>
            </div>
          </div>

          <div className="card">
            <h2>Coupon Code</h2>

            <div className="coupon-input-group">
              <input
                type="text"
                name="couponCode"
                className="form-input"
                placeholder="Enter coupon code"
                value={formData.couponCode}
                onChange={handleChange}
              />
              <button
                type="button"
                onClick={validateCoupon}
                className="btn btn-outline"
              >
                Apply
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-large"
            disabled={loading}
          >
            {loading
              ? "Placing Order..."
              : `Place Order - Rs. ${calculateTotal()}`}
          </button>
        </form>

        {/* DEMO: Order Summary */}
        <div className="checkout-summary card">
          <h2>Order Summary</h2>

          <div className="summary-items">
            {cartItems.map((item, index) => (
              <div key={index} className="summary-item">
                <span>
                  {item.quantity}x {item.product.name}
                </span>
                <span>Rs. {item.product.price * item.quantity}</span>
              </div>
            ))}
          </div>

          <div className="summary-calculations">
            <div className="summary-row">
              <span>Subtotal</span>
              <span>Rs. {calculateSubtotal()}</span>
            </div>

            <div className="summary-row">
              <span>Delivery Fee</span>
              <span>Rs. 300</span>
            </div>

            {couponDiscount > 0 && (
              <div className="summary-row discount">
                <span>Coupon Discount</span>
                <span>- Rs. {couponDiscount}</span>
              </div>
            )}

            <div className="summary-total">
              <span>Total</span>
              <span>Rs. {calculateTotal()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Checkout;

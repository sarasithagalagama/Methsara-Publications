// ============================================
// Gift Vouchers Page
// Epic: E6 - Promotion & Loyalty
// Owner: IT24101266 (Perera M.U.E)
// Purpose: Purchase and manage gift vouchers (E6.4)
// ============================================

import React, { useState, useEffect } from "react";
import axios from "axios";
import { ShoppingCart, Gift } from "lucide-react";
import { useAuth } from "../../E1_UserAndRoleManagement/context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import "./GiftVouchers.css";

const GiftVouchers = () => {
  // State Variables
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, refreshCounts } = useAuth();
  const navigate = useNavigate();

  // On mount, load all available voucher products.
  // These are special items without shipping that generate digital codes.
  // Side Effects
  useEffect(() => {
    fetchVouchers();
  }, []);

  // [Epic E6.2] - Voucher Discovery
  // Pull voucher details (value, pricing, images) from the promotion API endpoint.
  // Event Handlers
  const fetchVouchers = async () => {
    try {
      const res = await axios.get("/api/gift-vouchers/products");
      setVouchers(res.data.products || []);
    } catch (error) {
      console.error("Error fetching vouchers:", error);
    } finally {
      setLoading(false);
    }
  };

  // [E6.4] Voucher add-to-cart: uses itemModel='VoucherProduct' so backend distinguishes from regular books
  const handleAddToCart = async (voucher) => {
    if (!user) {
      toast.error("Please login to purchase gift vouchers");
      navigate("/?login=true");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "/api/cart/add",
        { productId: voucher._id, quantity: 1, itemModel: "VoucherProduct" },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (refreshCounts) refreshCounts();
      toast.success("Gift Voucher added to cart!");
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error(error.response?.data?.message || "Failed to add to cart");
    }
  };

  // Render
  return (
    <div className="gift-vouchers-page">
      <div className="vouchers-hero">
        <div className="container">
          <div className="banner-content">
            <h1 className="animate-fade-in-up">
              Give the Gift of <span className="gold-text">Knowledge</span>
            </h1>
            <p className="animate-fade-in-up delay-1">
              Methsara Publications Gift Vouchers are the perfect present for
              students. Choose a digital gift card and let them pick the books
              they need for their success.
            </p>
          </div>
        </div>
      </div>

      <div className="container">
        {loading ? (
          <div className="voucher-loading">
            <div
              className="checkout-progress-modern"
              style={{ width: "200px" }}
            ></div>
          </div>
        ) : (
          <div className="vouchers-grid">
            {vouchers.length === 0 ? (
              <div className="voucher-empty">
                <div className="empty-icon-modern">
                  <Gift size={48} />
                </div>
                <h3>No Vouchers Available</h3>
                <p>Check back soon for new gift possibilities.</p>
              </div>
            ) : (
              vouchers.map((voucher) => (
                <div key={voucher._id} className="voucher-card">
                  <div className="voucher-visual-container">
                    <div className="voucher-visual">
                      <div className="voucher-pattern"></div>
                      <div className="voucher-card-chip"></div>
                      <div className="voucher-card-logo">METHSARA</div>
                      {voucher.image ? (
                        <img
                          src={voucher.image}
                          alt={voucher.name}
                          className="voucher-img"
                        />
                      ) : (
                        <Gift size={64} className="voucher-icon" />
                      )}
                      <div className="voucher-value-badge">
                        Rs.{" "}
                        {voucher.price.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="voucher-content">
                    <h3>{voucher.name}</h3>
                    <p>
                      {voucher.description ||
                        "A digital gift card valid for all books currently available on our comprehensive educational platform."}
                    </p>

                    <button
                      className="voucher-btn"
                      onClick={() => handleAddToCart(voucher)}
                    >
                      <ShoppingCart size={20} /> Pack & Add to Cart
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GiftVouchers;

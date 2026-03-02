// ============================================
// Checkout Page
// Epic: E3 - Order & Transaction
// Owner: IT24100191 (Jayasinghe D.B.P)
// Purpose: Final checkout step - shipping, payment, verification
// ============================================

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Truck,
  ChevronLeft,
  Package,
  Check,
  Banknote,
  ShieldCheck,
  User,
} from "lucide-react";
import StatusModal from "../../../components/common/StatusModal";
import "./Checkout.css";

const CHECKOUT_STEPS = ["Browse", "Cart", "Checkout", "Success"];
// [E3.3] [E3.4] Final checkout step — handles COD, Bank Transfer, coupon/voucher application

const Checkout = () => {
  const navigate = useNavigate();
  // State Variables
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discount, setDiscount] = useState(0);

  // [E6.4] Gift Voucher State — vouchers apply as a separate discount on top of coupons
  // Epic E6.4 Gift Voucher State
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [orderRef, setOrderRef] = useState(null);
  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    type: "error",
    title: "",
    message: "",
  });

  const [formData, setFormData] = useState({
    guestName: "",
    guestEmail: "",
    deliveryAddress: {
      street: "",
      city: "",
      postalCode: "",
      phone: "",
    },
    paymentMethod: "COD",
    bankSlip: null,
  });

  const [isGuest, setIsGuest] = useState(false);

  // [E3.3] isGuest flag drives conditional rendering: guest must fill name/email, auth user sees pre-filled form
  // On mount, we identify if the user is a registered customer or a guest.
  // This determines how we fetch their cart and validate their data.
  // Side Effects
  useEffect(() => {
    fetchCart();
    setIsGuest(!localStorage.getItem("token"));
  }, []);

  // [Epic E3.1] - Synchronizing the Cart
  // We pull the latest items to ensure the user is paying the correct amount
  // and that items are still in stock.
  // Event Handlers
  const fetchCart = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        const guestCart = JSON.parse(localStorage.getItem("guestCart")) || {
          items: [],
          totalAmount: 0,
        };
        if (guestCart.items.length === 0) {
          navigate("/cart");
        } else {
          setCart(guestCart);
        }
        setLoading(false);
        return;
      }
      const res = await axios.get("/api/cart", {
        headers: { Authorization: "Bearer " + token },
      });
      setCart(res.data.cart);
    } catch (error) {
      console.error("Error fetching cart:", error);
      navigate("/cart");
    } finally {
      setLoading(false);
    }
  };

  // [Epic E3.4] - Coupon Validation
  // Users can apply promo codes to get discounts.
  // We validate these codes on the server to prevent fraud.
  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "/api/coupons/apply",
        { code: couponCode, orderAmount: cart.totalAmount },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setAppliedCoupon(res.data.coupon);
      setDiscount(res.data.discount);
    } catch (error) {
      setStatusModal({
        isOpen: true,
        type: "error",
        title: "Coupon Error",
        message: error.response?.data?.message || "Invalid or expired coupon",
      });
    }
  };

  // [Epic E6.4] - Gift Voucher Validation
  const handleApplyVoucher = async () => {
    if (!voucherCode) return;
    try {
      const res = await axios.post("/api/gift-vouchers/validate", {
        code: voucherCode,
      });
      setAppliedVoucher(res.data.voucher);
    } catch (error) {
      setStatusModal({
        isOpen: true,
        type: "error",
        title: "Voucher Error",
        message: error.response?.data?.message || "Invalid or expired voucher",
      });
    }
  };

  // For Bank Transfers, we allow users to upload a high-res image
  // of their deposit slip as proof of payment.
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, bankSlip: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  // Deep validation to ensure we have a valid shipping address
  // and phone number before accepting the order.
  const validateForm = () => {
    const errors = {};
    const phoneRegex = /^0\d{9}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (isGuest) {
      if (!formData.guestName.trim()) errors.guestName = "Required";
      if (!formData.guestEmail.trim()) {
        errors.guestEmail = "Required";
      } else if (!emailRegex.test(formData.guestEmail)) {
        errors.guestEmail = "Invalid email";
      }
    }

    const postalRegex = /^\d{5}$/;

    if (!formData.deliveryAddress.street.trim()) errors.street = "Required";
    if (!formData.deliveryAddress.city.trim()) errors.city = "Required";

    if (!formData.deliveryAddress.postalCode?.trim())
      errors.postalCode = "Required";
    else if (!postalRegex.test(formData.deliveryAddress.postalCode))
      errors.postalCode = "Must be 5 digits";

    if (!formData.deliveryAddress.phone.trim()) errors.phone = "Required";
    else if (
      !phoneRegex.test(formData.deliveryAddress.phone.replace(/\s/g, ""))
    )
      errors.phone = "Invalid format (07XXXXXXXX)";

    if (formData.paymentMethod === "Bank Transfer" && !formData.bankSlip)
      errors.bankSlip = "Please upload payment proof";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // [Epic E3.2] - Placing the Order
  // This is where the magic happens. We package up all cart items,
  // shipping info, and payment details into a single transaction.
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const orderData = {
        items: cart.items.map((item) => ({
          product: item.product._id,
          itemModel: item.itemModel || "Product",
          quantity: item.quantity,
          price: item.price,
        })),
        deliveryAddress: formData.deliveryAddress,
        paymentMethod: formData.paymentMethod,
        bankSlipUrl: formData.bankSlip,
        couponCode: appliedCoupon?.code,
        giftVoucherCode: appliedVoucher?.code,
        taxRate, // [E3.9] pass VAT rate so backend stores it on the order
      };

      if (isGuest) {
        orderData.guestName = formData.guestName;
        orderData.guestEmail = formData.guestEmail;
      }

      const headers = token ? { Authorization: "Bearer " + token } : {};
      const res = await axios.post("/api/orders", orderData, { headers });

      if (isGuest) localStorage.removeItem("guestCart");

      setOrderRef(res.data.order?._id?.slice(-8).toUpperCase() || "ORD-DONE");
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error placing order:", error);
      console.log("FULL ERROR RESPONSE:", error.response?.data);
      setStatusModal({
        isOpen: true,
        type: "error",
        title: "Order Error",
        message: error.response?.data?.message || "Failed to place order",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading)
    // Render
    return (
      <div className="loading-modern">
        <div className="spinner-modern"></div>
      </div>
    );

  const deliveryFee = 350;
  const subtotal = cart?.totalAmount || 0;

  // [E3.9] Tax from Finance Manager's Tax Configuration (JSON stored in localStorage)
  const taxConfig = (() => {
    try {
      return JSON.parse(localStorage.getItem("taxConfig") || "{}");
    } catch {
      return {};
    }
  })();
  const taxRate = taxConfig.applyToInvoices
    ? Math.max(0, parseFloat(taxConfig.vatRate || "0"))
    : 0;
  const taxAmount = Math.round((subtotal * taxRate) / 100);
  const taxName = taxConfig.taxName || "VAT";

  const totalBeforeVoucher = subtotal + taxAmount - discount + deliveryFee;
  const calculatedVoucherDiscount = appliedVoucher
    ? Math.min(appliedVoucher.balance, totalBeforeVoucher)
    : 0;
  const total = totalBeforeVoucher - calculatedVoucherDiscount;

  return (
    <div className="checkout-modern-page">
      {/* ── Progress Bar ── */}
      <div className="checkout-progress-modern">
        <div className="container">
          <div className="progress-steps-modern">
            {CHECKOUT_STEPS.map((step, i) => (
              <div
                key={step}
                className={`progress-step-modern ${i === 2 ? "active" : i < 2 ? "done" : ""}`}
              >
                <div className="step-circle-modern">
                  {i < 2 ? <Check size={18} /> : i + 1}
                </div>
                <span className="step-label-modern">{step}</span>
                {i < CHECKOUT_STEPS.length - 1 && (
                  <div
                    className={`step-connector-modern ${i < 2 ? "filled" : ""}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container">
        <button className="btn-back-modern" onClick={() => navigate("/cart")}>
          <ChevronLeft size={18} /> Return to Cart
        </button>
        <h1 className="checkout-title-modern">
          Checkout{" "}
          <span style={{ color: "var(--secondary-color)" }}>Order</span>
        </h1>

        <div className="checkout-grid-modern">
          <main className="checkout-main-modern">
            <form onSubmit={handlePlaceOrder} noValidate>
              {isGuest && (
                <div className="checkout-card-modern">
                  <div className="form-header-modern">
                    <span className="step-num-modern">
                      <User size={18} />
                    </span>
                    <h2>Contact Information</h2>
                  </div>
                  <div className="form-row-modern">
                    <div className="form-group-modern">
                      <label>Full Name *</label>
                      <input
                        type="text"
                        className={formErrors.guestName ? "input-error" : ""}
                        value={formData.guestName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            guestName: e.target.value,
                          })
                        }
                      />
                      {formErrors.guestName && (
                        <p className="field-error-modern">
                          {formErrors.guestName}
                        </p>
                      )}
                    </div>
                    <div className="form-group-modern">
                      <label>Email Address *</label>
                      <input
                        type="email"
                        className={formErrors.guestEmail ? "input-error" : ""}
                        value={formData.guestEmail}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            guestEmail: e.target.value,
                          })
                        }
                      />
                      {formErrors.guestEmail && (
                        <p className="field-error-modern">
                          {formErrors.guestEmail}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="checkout-card-modern">
                <div className="form-header-modern">
                  <span className="step-num-modern">1</span>
                  <h2>Shipping Destination</h2>
                </div>

                <div className="form-group-modern">
                  <label>Street Address *</label>
                  <input
                    type="text"
                    className={formErrors.street ? "input-error" : ""}
                    placeholder="House number and street name"
                    value={formData.deliveryAddress.street}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        deliveryAddress: {
                          ...formData.deliveryAddress,
                          street: e.target.value,
                        },
                      })
                    }
                  />
                  {formErrors.street && (
                    <p className="field-error-modern">{formErrors.street}</p>
                  )}
                </div>

                <div className="form-row-modern">
                  <div className="form-group-modern">
                    <label>District *</label>
                    <select
                      className={`modern-select ${formErrors.city ? "input-error" : ""}`}
                      value={formData.deliveryAddress.city}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          deliveryAddress: {
                            ...formData.deliveryAddress,
                            city: e.target.value,
                          },
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "0.875rem 1rem",
                        borderRadius: "10px",
                        border: "1px solid var(--border-color)",
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "0.95rem",
                        backgroundColor: "var(--bg-color)",
                        color: "var(--text-color)",
                      }}
                    >
                      <option value="">Select District</option>
                      <option value="Ampara">Ampara</option>
                      <option value="Anuradhapura">Anuradhapura</option>
                      <option value="Badulla">Badulla</option>
                      <option value="Batticaloa">Batticaloa</option>
                      <option value="Colombo">Colombo</option>
                      <option value="Galle">Galle</option>
                      <option value="Gampaha">Gampaha</option>
                      <option value="Hambantota">Hambantota</option>
                      <option value="Jaffna">Jaffna</option>
                      <option value="Kalutara">Kalutara</option>
                      <option value="Kandy">Kandy</option>
                      <option value="Kegalle">Kegalle</option>
                      <option value="Kilinochchi">Kilinochchi</option>
                      <option value="Kurunegala">Kurunegala</option>
                      <option value="Mannar">Mannar</option>
                      <option value="Matale">Matale</option>
                      <option value="Matara">Matara</option>
                      <option value="Moneragala">Moneragala</option>
                      <option value="Mullaitivu">Mullaitivu</option>
                      <option value="Nuwara Eliya">Nuwara Eliya</option>
                      <option value="Polonnaruwa">Polonnaruwa</option>
                      <option value="Puttalam">Puttalam</option>
                      <option value="Ratnapura">Ratnapura</option>
                      <option value="Trincomalee">Trincomalee</option>
                      <option value="Vavuniya">Vavuniya</option>
                    </select>
                    {formErrors.city && (
                      <p className="field-error-modern">{formErrors.city}</p>
                    )}
                  </div>
                  <div className="form-group-modern">
                    <label>Postal Code *</label>
                    <input
                      type="text"
                      className={formErrors.postalCode ? "input-error" : ""}
                      placeholder="e.g. 00300"
                      value={formData.deliveryAddress.postalCode}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          deliveryAddress: {
                            ...formData.deliveryAddress,
                            postalCode: e.target.value
                              .replace(/[^0-9]/g, "")
                              .slice(0, 5),
                          },
                        })
                      }
                      maxLength={5}
                    />
                    {formErrors.postalCode && (
                      <p className="field-error-modern">
                        {formErrors.postalCode}
                      </p>
                    )}
                  </div>
                </div>

                <div className="form-group-modern">
                  <label>Contact Phone *</label>
                  <input
                    type="tel"
                    className={formErrors.phone ? "input-error" : ""}
                    placeholder="07XXXXXXXX"
                    value={formData.deliveryAddress.phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        deliveryAddress: {
                          ...formData.deliveryAddress,
                          phone: e.target.value
                            .replace(/[^0-9]/g, "")
                            .slice(0, 10),
                        },
                      })
                    }
                  />
                  {formErrors.phone && (
                    <p className="field-error-modern">{formErrors.phone}</p>
                  )}
                </div>

                <div className="delivery-estimate-modern">
                  <Package size={20} />
                  <span>
                    Colombo & Suburbs: 1-2 Days | Island-wide deliveries: 3-5
                    Days via local courier.
                  </span>
                </div>
              </div>

              <div className="checkout-card-modern">
                <div className="form-header-modern">
                  <span className="step-num-modern">2</span>
                  <h2>Payment Selection</h2>
                </div>

                <div className="payment-grid-modern">
                  <div
                    className={`payment-method-modern ${formData.paymentMethod === "COD" ? "selected" : ""}`}
                    onClick={() =>
                      setFormData({ ...formData, paymentMethod: "COD" })
                    }
                  >
                    <div className="method-icon-modern">
                      <Truck size={24} />
                    </div>
                    <span>Cash on Delivery</span>
                    {formData.paymentMethod === "COD" && (
                      <div className="method-check-modern">
                        <Check size={14} />
                      </div>
                    )}
                  </div>

                  <div
                    className={`payment-method-modern ${formData.paymentMethod === "Bank Transfer" ? "selected" : ""}`}
                    onClick={() =>
                      setFormData({
                        ...formData,
                        paymentMethod: "Bank Transfer",
                      })
                    }
                  >
                    <div className="method-icon-modern">
                      <Banknote size={24} />
                    </div>
                    <span>Bank Transfer</span>
                    {formData.paymentMethod === "Bank Transfer" && (
                      <div className="method-check-modern">
                        <Check size={14} />
                      </div>
                    )}
                  </div>
                </div>

                {formData.paymentMethod === "Bank Transfer" && (
                  <div className="bank-info-modern">
                    <div className="bank-details-row">
                      <span>Bank:</span> <strong>Commercial Bank</strong>
                    </div>
                    <div className="bank-details-row">
                      <span>Account Name:</span>{" "}
                      <strong>Methsara Publications</strong>
                    </div>
                    <div className="bank-details-row">
                      <span>Account No:</span> <strong>1234 5678 9012</strong>
                    </div>
                    <p className="bank-note-modern">
                      * Upload your bank deposit slip or screenshot below for
                      verification.
                    </p>
                    <div
                      className="form-group-modern"
                      style={{ marginTop: "1.5rem" }}
                    >
                      <input
                        type="file"
                        className={formErrors.bankSlip ? "input-error" : ""}
                        accept="image/*,.pdf"
                        onChange={handleFileChange}
                      />
                      {formErrors.bankSlip && (
                        <p className="field-error-modern">
                          {formErrors.bankSlip}
                        </p>
                      )}
                      {formData.bankSlip && (
                        <p className="file-success-modern">
                          ✓ Document attached successfully
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="checkout-privacy-banner-modern">
                <ShieldCheck size={24} color="var(--primary-dark)" />
                <p>
                  Your security is our priority. We use encrypted processing to
                  ensure your order information is handled safely and according
                  to privacy standards.
                </p>
              </div>

              {/* This block is assumed to be part of the handlePlaceOrder function or similar logic */}
              {/* For the purpose of this edit, it's placed here as per the instruction's context. */}
              {/* In a real React component, this would be inside a function like handleSubmit. */}
              {/* const orderData = {
                items: cart.items.map((item) => ({
                  product: item.product._id,
                  itemModel: item.itemModel || "Product",
                  quantity: item.quantity,
                  price: item.price,
                })),
                deliveryAddress: formData.deliveryAddress,
                paymentMethod: formData.paymentMethod,
                bankSlipUrl: formData.bankSlip,
                couponCode: appliedCoupon?.code,
                giftVoucherCode: appliedVoucher?.code,
              }; */}

              <button
                type="submit"
                className="place-order-btn-modern"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Processing..." : "Confirm My Order"}
              </button>
            </form>
          </main>

          <aside className="checkout-summary-modern">
            <h2>Order Details</h2>

            <div className="summary-items-modern">
              {cart?.items.map((item) => (
                <div key={item._id} className="summary-item-row-modern">
                  <div className="summary-item-title-modern">
                    {item.product?.title || item.product?.name}{" "}
                    <span className="qty-muted">× {item.quantity}</span>
                  </div>
                  <div className="summary-item-price-modern">
                    Rs. {(item.price * item.quantity).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            <div className="coupon-box-modern">
              <label>Promo Code</label>
              <div className="coupon-flex-modern">
                <input
                  type="text"
                  placeholder="Enter code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                />
                <button
                  type="button"
                  className="coupon-btn-modern"
                  onClick={handleApplyCoupon}
                >
                  Apply
                </button>
              </div>
              {appliedCoupon && (
                <div className="coupon-success-msg-modern">
                  <Check size={14} strokeWidth={3} /> Coupon "
                  {appliedCoupon.code}" active
                </div>
              )}
            </div>

            <div className="coupon-box-modern">
              <label>Gift Voucher</label>
              <div className="coupon-flex-modern">
                <input
                  type="text"
                  placeholder="Enter GV code"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                />
                <button
                  type="button"
                  className="coupon-btn-modern"
                  onClick={handleApplyVoucher}
                  style={{
                    backgroundColor: "transparent",
                    color: "var(--primary-color)",
                    border: "1px solid var(--primary-color)",
                  }}
                >
                  redeem
                </button>
              </div>
              {appliedVoucher && (
                <div className="coupon-success-msg-modern">
                  <Check size={14} strokeWidth={3} /> Voucher "
                  {appliedVoucher.code}" active (Balance: Rs.{" "}
                  {appliedVoucher.balance})
                </div>
              )}
            </div>

            <div className="checkout-totals-modern">
              <div className="totals-row-modern">
                <span>Items Subtotal</span>
                <span>Rs. {subtotal.toLocaleString()}</span>
              </div>
              <div className="totals-row-modern">
                <span>Shipping Fee</span>
                <span>Rs. {deliveryFee.toLocaleString()}</span>
              </div>
              {taxAmount > 0 && (
                <div className="totals-row-modern">
                  <span>
                    {taxName} ({taxRate}%)
                  </span>
                  <span>Rs. {taxAmount.toLocaleString()}</span>
                </div>
              )}
              {discount > 0 && (
                <div className="totals-row-modern discount-row-modern">
                  <span>Loyalty Promo</span>
                  <span>- Rs. {discount.toLocaleString()}</span>
                </div>
              )}
              {calculatedVoucherDiscount > 0 && (
                <div className="totals-row-modern discount-row-modern">
                  <span>Gift Voucher</span>
                  <span>
                    - Rs. {calculatedVoucherDiscount.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="grand-total-modern">
                <span>Rs. {total.toLocaleString()}</span>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <StatusModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          navigate("/customer/dashboard");
        }}
        type="success"
        title="Order Success!"
        message={`Reference: #${orderRef}. ${formData.paymentMethod === "Bank Transfer" ? "Please ensure your bank transfer is completed today." : "Our team will contact you for confirmation shortly."}`}
        actions={
          <div
            className="success-actions-modern"
            style={{ width: "100%", marginTop: "1rem" }}
          >
            <button
              className="btn btn-primary"
              style={{
                width: "100%",
                justifyContent: "center",
                padding: "1rem",
                borderRadius: "12px",
              }}
              onClick={() => navigate("/customer/dashboard")}
            >
              Order History
            </button>
            <button
              className="btn btn-outline-dark"
              style={{
                width: "100%",
                justifyContent: "center",
                color: "var(--primary-dark)",
                borderColor: "var(--primary-dark)",
                marginTop: "0.5rem",
                padding: "1rem",
                borderRadius: "12px",
              }}
              onClick={() => navigate("/books")}
            >
              Continue Shopping
            </button>
          </div>
        }
      />
      <StatusModal
        isOpen={statusModal.isOpen}
        onClose={() => setStatusModal({ ...statusModal, isOpen: false })}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
      />
    </div>
  );
};

export default Checkout;

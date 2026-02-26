// ============================================
// Invoice
// Epic: E3 - Order & Transaction
// Owner: IT24100191 (Jayasinghe D.B.P)
// Purpose: Invoice UI component
// ============================================
import React, { useRef } from "react";
import { X, Printer } from "lucide-react";
import "./Invoice.css";

const Invoice = ({ order, onClose }) => {
  const invoiceRef = useRef();

  const handlePrint = () => {
    window.print();
  };

  if (!order) return null;

  // ─────────────────────────────────
  // Render
  // ─────────────────────────────────
  return (
    <div className="invoice-overlay">
      <div className="invoice-container">
        <div className="invoice-actions no-print">
          <button onClick={handlePrint} className="btn-print">
            <Printer size={16} /> Print Invoice
          </button>
          <button onClick={onClose} className="btn-close">
            <X size={20} />
          </button>
        </div>

        <div className="invoice-content" ref={invoiceRef}>
          {/* Header */}
          <header className="invoice-header">
            <div className="company-logo">
              <img
                src="/assets/Logo.png"
                alt="Methsara Publications"
                style={{ height: "60px" }}
              />
            </div>
            <div className="invoice-title">
              <h1>INVOICE</h1>
              <p>#{order._id.slice(-6).toUpperCase()}</p>
            </div>
          </header>

          {/* Company Info & Client Info */}
          <div className="invoice-details-grid">
            <div className="company-info">
              <h3>Methsara Publications</h3>
              <p>No. 123, Main Street</p>
              <p>Colombo, Sri Lanka</p>
              <p>Phone: +94 11 234 5678</p>
              <p>Email: info@methsarapublications.com</p>
            </div>
            <div className="client-info">
              <h3>Bill To:</h3>
              <p>
                <strong>
                  {order.guestName || order.user?.name || "Guest Customer"}
                </strong>
              </p>
              <p>{order.deliveryAddress?.street}</p>
              <p>
                {order.deliveryAddress?.city},{" "}
                {order.deliveryAddress?.postalCode}
              </p>
              <p>Phone: {order.deliveryAddress?.phone}</p>
              <p>Email: {order.guestEmail || order.user?.email}</p>
            </div>
            <div className="order-meta">
              <p>
                <strong>Date:</strong>{" "}
                {new Date(order.createdAt).toLocaleDateString()}
              </p>
              <p>
                <strong>Payment Method:</strong> {order.paymentMethod}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                {order.paymentStatus || (order.isPaid ? "Paid" : "Pending")}
              </p>
            </div>
          </div>

          {/* Items Table */}
          <table className="invoice-items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, index) => (
                <tr key={index}>
                  <td>
                    <div className="item-desc">
                      <span className="item-title">
                        {item.productTitle || item.product?.title}
                      </span>
                      <span className="item-isbn">
                        ISBN: {item.productISBN || item.product?.isbn}
                      </span>
                    </div>
                  </td>
                  <td>{item.quantity}</td>
                  <td>Rs. {Number(item.price).toLocaleString()}</td>
                  <td>Rs. {(item.price * item.quantity).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="invoice-totals">
            <div className="total-row">
              <span>Subtotal:</span>
              <span>
                Rs.{" "}
                {order.subtotal?.toLocaleString() ||
                  order.totalAmount?.toLocaleString()}
              </span>
            </div>
            {order.couponDiscount > 0 && (
              <div className="total-row discount">
                <span>Discount:</span>
                <span>- Rs. {order.couponDiscount.toLocaleString()}</span>
              </div>
            )}
            <div className="total-row">
              <span>Delivery Fee:</span>
              <span>Rs. {order.deliveryFee?.toLocaleString() || "0"}</span>
            </div>
            <div className="total-row grand-total">
              <span>Total:</span>
              <span>
                Rs.{" "}
                {order.total?.toLocaleString() ||
                  order.totalAmount?.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Footer */}
          <footer className="invoice-footer">
            <p>Thank you for your business!</p>
            <p className="small-text">
              For any inquiries, please contact us within 7 days of receiving
              your order.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Invoice;

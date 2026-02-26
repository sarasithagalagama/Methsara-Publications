// ============================================
// Order List Component
// Epic: E3 - Order & Transaction
// Owner: IT24100191 (Jayasinghe D.B.P)
// Features: View order history, Track orders
// ============================================

import React, { useState, useEffect } from "react";
import orderService from "../../services/orderService";
import "./Orders.css";

function OrderList() {
  // ─────────────────────────────────
  // State Variables
  // ─────────────────────────────────
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ─────────────────────────────────
  // Side Effects
  // ─────────────────────────────────
  useEffect(() => {
    loadOrders();
  }, []);

  // ─────────────────────────────────
  // Event Handlers
  // ─────────────────────────────────
  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await orderService.getMyOrders();
      setOrders(response.orders || []);
    } catch (err) {
      setError("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  // Status badge color
  const getStatusBadge = (status) => {
    const statusClasses = {
      Pending: "badge-warning",
      Processing: "badge-info",
      Shipped: "badge-info",
      Delivered: "badge-success",
      Cancelled: "badge-error",
    };
    return `badge ${statusClasses[status] || "badge-info"}`;
  };

  if (loading)
    // ─────────────────────────────────
    // Render
    // ─────────────────────────────────
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );

  return (
    <div className="container">
      <h1>My Orders</h1>

      {error && <div className="alert alert-error">{error}</div>}

      {orders.length === 0 ? (
        <div className="card">
          <p>You haven't placed any orders yet.</p>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order._id} className="order-card card">
              <div className="order-header">
                <div>
                  <h3>Order #{order._id.substring(0, 8)}</h3>
                  <p className="order-date">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className={getStatusBadge(order.orderStatus)}>
                  {order.orderStatus}
                </span>
              </div>

              <div className="order-items">
                {order.items.map((item, index) => (
                  <div key={index} className="order-item">
                    <span>
                      {item.quantity}x {item.product?.name || "Product"}
                    </span>
                    <span>Rs. {item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="order-footer">
                <div className="order-info">
                  <p>
                    <strong>Payment:</strong> {order.paymentMethod}
                  </p>
                  <p>
                    <strong>Delivery:</strong> {order.deliveryAddress.city}
                  </p>
                </div>
                <div className="order-total">
                  <strong>Total: Rs. {order.totalAmount}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default OrderList;

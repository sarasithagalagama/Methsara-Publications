// ============================================
// OrderHistory Component
// Epic: E3 - Order & Transaction
// Purpose: Customer order history - UI
// ============================================

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  Package,
  Calendar,
  ChevronRight,
  ShoppingBag,
  Truck,
  FileText,
} from "lucide-react";
import "./OrderHistory.css";
import Invoice from "../components/Order/Invoice";

const OrderHistory = () => {
  // ─────────────────────────────────
  // State Variables
  // ─────────────────────────────────
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // ─────────────────────────────────
  // Side Effects
  // ─────────────────────────────────
  useEffect(() => {
    fetchOrders();
  }, []);

  // ─────────────────────────────────
  // Event Handlers
  // ─────────────────────────────────
  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/orders/my-orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(res.data.orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status) => {
    const styles = {
      Pending: { bg: "#fef3c7", color: "#d97706" },
      Processing: { bg: "#e0e7ff", color: "#4f46e5" },
      Shipped: { bg: "#f3e8ff", color: "#9333ea" },
      Delivered: { bg: "#d1fae5", color: "#059669" },
      Cancelled: { bg: "#fee2e2", color: "#dc2626" },
    };
    return styles[status] || { bg: "#f3f4f6", color: "#4b5563" };
  };

  if (loading) {
    // ─────────────────────────────────
    // Render
    // ─────────────────────────────────
    return (
      <div className="orders-loading-modern">
        <div className="spinner-modern"></div>
        <p>Loading your orders...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="orders-empty-modern">
        <div className="empty-icon-wrapper">
          <ShoppingBag size={48} strokeWidth={1.5} />
        </div>
        <h2>No orders found</h2>
        <p>Looks like you haven't made your first purchase yet.</p>
        <Link to="/books" className="btn-primary-modern">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="order-history-page-modern">
      <div className="container">
        <div className="page-header-modern">
          <h1>My Orders</h1>
          <p className="subtitle-modern">Track, return, or buy items again</p>
        </div>

        <div className="orders-grid-modern">
          {orders.map((order) => {
            const statusStyle = getStatusStyle(order.orderStatus);
            return (
              <div key={order._id} className="order-card-modern">
                <div className="order-card-header">
                  <div className="order-meta-info">
                    <div className="meta-item">
                      <span className="meta-label">Order Number</span>
                      <span className="meta-value">
                        #{order._id.slice(-8).toUpperCase()}
                      </span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Date Placed</span>
                      <span className="meta-value flex-align">
                        <Calendar size={14} className="icon-mr" />
                        {new Date(order.orderDate).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Total Amount</span>
                      <span className="meta-value highlight">
                        Rs. {order.total.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="order-status-wrapper">
                    <span
                      className="status-badge-modern"
                      style={{
                        backgroundColor: statusStyle.bg,
                        color: statusStyle.color,
                      }}
                    >
                      {order.orderStatus}
                    </span>
                  </div>
                </div>

                <div className="order-card-body">
                  <div className="order-items-preview">
                    {order.items.map((item, index) => (
                      <div key={index} className="item-preview-row">
                        <div className="item-image-wrapper">
                          <img
                            src={
                              item.product?.image ||
                              "https://via.placeholder.com/60"
                            }
                            alt={item.productTitle || "Product"}
                            onError={(e) => {
                              e.target.src =
                                "https://via.placeholder.com/60?text=No+Image";
                            }}
                          />
                        </div>
                        <div className="item-details-modern">
                          <h4>{item.productTitle || "Unknown Product"}</h4>
                          <p className="item-qty-price">
                            Qty: {item.quantity} Ã— Rs.{" "}
                            {item.price.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="order-card-footer">
                  <div className="delivery-status">
                    <Truck size={16} className="icon-mr text-muted" />
                    <span className="text-muted">
                      {order.orderStatus === "Delivered"
                        ? `Delivered on ${new Date(order.deliveryDate || order.updatedAt).toLocaleDateString()}`
                        : "Expected Delivery: 3-5 Business Days"}
                    </span>
                  </div>
                  <div
                    className="order-actions-modern"
                    style={{ display: "flex", gap: "1rem" }}
                  >
                    <Link
                      to={`/orders/${order._id}`}
                      className="view-details-link"
                    >
                      View Order Details <ChevronRight size={16} />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {selectedOrder && (
        <Invoice order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
};

export default OrderHistory;

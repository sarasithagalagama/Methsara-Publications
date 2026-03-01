// ============================================
// CustomerDashboard
// Epic: E1 - User & Role Management
// Owner: IT24100548 (Galagama S.T)
// Purpose: CustomerDashboard page component
// ============================================
// Purpose: Customer portal for orders, wishlist, profile

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../epics/E1_UserAndRoleManagement/context/AuthContext";
import {
  ShoppingBag,
  Bell,
  Settings,
  LogOut,
  User,
  MapPin,
  Mail,
  Phone,
  LayoutDashboard,
  Box,
  FileText,
  Calendar,
  Truck,
  ChevronRight,
} from "lucide-react";
import ProfileSettingsModal from "../../../epics/E1_UserAndRoleManagement/components/profile/ProfileSettingsModal";
import { LogoutModal } from "../../../epics/E1_UserAndRoleManagement/components/Auth/AuthModals";
import Invoice from "../../../epics/E3_OrderAndTransaction/components/Order/Invoice";
import "../../../epics/E3_OrderAndTransaction/pages/OrderHistory.css";
import "./CustomerDashboard.css";

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  // State Variables
  const [activeTab, setActiveTab] = useState("overview");
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    deliveredOrders: 0,
  });
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Side Effects
  useEffect(() => {
    fetchCustomerData();
  }, []);

  // [E3.6] Fetches the customer's order history and calculates summary stats for the overview tab
  const fetchCustomerData = async () => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const ordersRes = await axios.get("/api/orders/my-orders", config);
      const userOrders = ordersRes.data.orders || [];

      setOrders(userOrders);
      setStats({
        totalOrders: userOrders.length,
        deliveredOrders: userOrders.filter((o) => o.orderStatus === "Delivered")
          .length,
      });
      setLoading(false);
    } catch (error) {
      console.error("Error fetching customer data:", error);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    logout();
    navigate("/");
  };

  // Maps order status strings to CSS class names for the coloured status badge in the orders table
  const getStatusColor = (status) => {
    const colors = {
      Pending: "status-pending",
      Processing: "status-processing",
      Shipped: "status-shipped",
      Delivered: "status-delivered",
      Cancelled: "status-cancelled",
    };
    return colors[status] || "status-default";
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Pending":
        return { bg: "#fff7ed", color: "#c2410c" };
      case "Processing":
        return { bg: "#f0f9ff", color: "#0369a1" };
      case "Shipped":
        return { bg: "#eff6ff", color: "#1d4ed8" };
      case "Delivered":
        return { bg: "#f0fdf4", color: "#15803d" };
      case "Cancelled":
        return { bg: "#fef2f2", color: "#b91c1c" };
      default:
        return { bg: "#f3f4f6", color: "#374151" };
    }
  };

  if (loading) {
    // Render
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="customer-dashboard-layout">
      {/* Sidebar */}
      <aside className="customer-sidebar">
        <div className="user-profile-summary">
          <div className="profile-avatar">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <h3 className="profile-name">{user?.name}</h3>
          <p className="profile-email">{user?.email}</p>
        </div>

        <nav className="customer-nav">
          <button
            className={`customer-nav-item ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <LayoutDashboard size={20} />
            <span>Overview</span>
          </button>
          <button
            className={`customer-nav-item ${activeTab === "orders" ? "active" : ""}`}
            onClick={() => setActiveTab("orders")}
          >
            <Box size={20} />
            <span>My Orders</span>
          </button>
          <button
            className="customer-nav-item"
            onClick={() => setShowProfileModal(true)}
          >
            <Settings size={20} />
            <span>Settings</span>
          </button>
        </nav>

        <div className="customer-sidebar-footer">
          <button
            className="customer-nav-item customer-logout-btn"
            onClick={handleLogout}
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="customer-main">
        {activeTab === "overview" && (
          <div className="overview-content">
            {/* Welcome Banner */}
            <div className="welcome-banner">
              <div className="welcome-text">
                <h1>Welcome back, {user?.name}!</h1>
                <p>
                  Manage your profile, check your orders, and update settings.
                </p>
              </div>
            </div>

            <div className="customer-content-grid">
              {/* Profile Info Card */}
              <div className="customer-info-card profile-info-card">
                <div className="customer-card-header">
                  <User size={20} className="card-icon" />
                  <h3>Profile Information</h3>
                </div>
                <div className="card-body">
                  <div className="info-row">
                    <Mail size={16} />
                    <span>{user?.email}</span>
                  </div>
                  <div className="info-row">
                    <Phone size={16} />
                    <span>{user?.phone || "No phone number added"}</span>
                  </div>
                  <div className="info-row address-row">
                    <MapPin size={16} />
                    <span>
                      {user?.address
                        ? `${user.address.street}, ${user.address.city}, ${user.address.postalCode}`
                        : "No address added"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Stats Card */}
              <div className="customer-info-card customer-stats-card">
                <div className="customer-card-header">
                  <Box size={20} className="customer-card-icon" />
                  <h3>Order Stats</h3>
                </div>
                <div className="customer-stats-grid">
                  <div className="customer-stat-item">
                    <span className="stat-value">{stats.totalOrders}</span>
                    <span className="stat-label">TOTAL ORDERS</span>
                  </div>
                  <div className="customer-stat-item success">
                    <span className="stat-value">{stats.deliveredOrders}</span>
                    <span className="stat-label">DELIVERED</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="customer-recent-orders-section">
              <div className="customer-section-header">
                <h3>Recent Orders</h3>
                <button
                  className="customer-view-all-btn"
                  onClick={() => setActiveTab("orders")}
                >
                  View All
                </button>
              </div>

              {orders.length === 0 ? (
                <div className="empty-orders">
                  <p>No orders placed yet.</p>
                  <Link to="/books" className="start-shopping-btn">
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <div className="recent-orders-list">
                  {orders.slice(0, 3).map((order) => (
                    <div key={order._id} className="customer-mini-order-card">
                      <div className="order-info">
                        <h4>Order #{order._id.slice(-6).toUpperCase()}</h4>
                        <span className="order-date">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="order-meta">
                        <span
                          className={`customer-status-pill ${getStatusColor(order.orderStatus)}`}
                        >
                          {order.orderStatus}
                        </span>
                        <span className="order-amount">
                          Rs. {order.total.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "orders" && (
          <div className="orders-tab-content">
            <div className="tab-header">
              <h2>My Orders</h2>
              <p>Track your order history and status</p>
            </div>

            <div className="orders-grid-modern" style={{ padding: 0 }}>
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
                            {new Date(order.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              },
                            )}
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
                              <h4>
                                {item.productTitle ||
                                  item.product?.title ||
                                  "Unknown Product"}
                              </h4>
                              <p className="item-qty-price">
                                Qty: {item.quantity} &times; Rs.{" "}
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
        )}
      </main>

      <ProfileSettingsModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
      />
      {selectedOrder && (
        <Invoice order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
};

export default CustomerDashboard;

// ============================================
// AdminDashboard
// Epic: E1 - User & Role Management
// Owner: IT24100548 (Galagama S.T)
// Purpose: AdminDashboard page component
// ============================================
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  Users,
  ShoppingBag,
  DollarSign,
  Package,
  UserPlus,
  ArrowRight,
  CheckCircle,
  XCircle,
  FileSignature,
  Bell,
} from "lucide-react";
import { useAuth } from "../../../epics/E1_UserAndRoleManagement/context/AuthContext";
import toast from "react-hot-toast";
import StatCard from "../../../components/dashboard/StatCard";
import DashboardHeader from "../../../components/dashboard/DashboardHeader";
import RevenueChart from "../../../components/dashboard/charts/RevenueChart";
import SalesChart from "../../../components/dashboard/charts/SalesChart";
import DashboardSection from "../../../components/dashboard/DashboardSection";
import DashboardTable from "../../../components/dashboard/DashboardTable";
import Modal from "../../../components/common/Modal";
import ConfirmModal from "../../../components/common/ConfirmModal";
import "../../../components/dashboard/dashboard.css";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const { logout } = useAuth();
  // ─────────────────────────────────
  // State Variables
  // ─────────────────────────────────
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState({
    revenue: [],
    sales: { labels: [], data: [] },
  });

  // Modal State for Approvals
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [approvalRemarks, setApprovalRemarks] = useState("");

  // ─────────────────────────────────
  // Side Effects
  // ─────────────────────────────────
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // ─────────────────────────────────
  // Event Handlers
  // ─────────────────────────────────
  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const results = await Promise.allSettled([
        axios.get("/api/auth/users", config),
        axios.get("/api/orders", config),
        axios.get("/api/products", config),
        axios.get("/api/orders/stats", config),
        axios.get("/api/approvals", config),
        axios.get("/api/inventory/alerts", config),
      ]);

      const [
        usersRes,
        ordersRes,
        productsRes,
        statsRes,
        approvalsRes,
        alertsRes,
      ] = results;

      const allUsers =
        usersRes.status === "fulfilled" ? usersRes.value.data.users || [] : [];
      const allOrders =
        ordersRes.status === "fulfilled"
          ? ordersRes.value.data.orders || []
          : [];

      setRecentUsers(allUsers.slice(0, 5));
      setRecentOrders(allOrders.slice(0, 5));

      if (approvalsRes.status === "fulfilled") {
        setPendingApprovals(approvalsRes.value.data.requests || []);
      }

      if (alertsRes.status === "fulfilled") {
        setLowStockCount(alertsRes.value.data.alerts?.length || 0);
      }

      const totalOrders = allOrders.length;
      const totalRevenue = allOrders
        .filter((order) => order.paymentStatus === "Paid")
        .reduce((sum, order) => sum + (order.total || 0), 0);
      const totalProducts =
        productsRes.status === "fulfilled"
          ? productsRes.value.data.products?.length || 0
          : 0;

      setStats({
        totalUsers: allUsers.length,
        totalOrders,
        totalRevenue,
        totalProducts,
      });

      if (statsRes.status === "fulfilled") {
        setStatsData({
          revenue: statsRes.value.data.revenue || [],
          sales: statsRes.value.data.sales || { labels: [], data: [] },
        });
      }

      setLoading(false);
    } catch (error) {
      console.error("Error loading dashboard:", error);
      setLoading(false);
    }
  };

  const handleReviewRequest = async (status) => {
    if (!selectedRequest) return;
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `/api/approvals/${selectedRequest._id}`,
        { status, remarks: approvalRemarks },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success(`Request ${status} successfully`);
      setShowApprovalModal(false);
      setApprovalRemarks("");
      setSelectedRequest(null);
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to review request");
    }
  };

  const recentUserColumns = [
    { header: "Name", accessor: "name" },
    { header: "Email", accessor: "email" },
    {
      header: "Role",
      accessor: "role",
      render: (user) => (
        <span className={`role-badge role-${user.role}`}>
          {user.role.replace(/_/g, " ")}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: "isActive",
      render: (user) => (
        <span
          className={`status-badge ${user.isActive ? "active" : "inactive"}`}
        >
          {user.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
  ];

  const recentOrderColumns = [
    {
      header: "Order ID",
      accessor: "_id",
      render: (order) => <strong>#{order._id.slice(-6).toUpperCase()}</strong>,
    },
    {
      header: "Customer",
      accessor: "customer",
      render: (order) => order.customer?.name || order.guestName || "Guest",
    },
    {
      header: "Total",
      accessor: "total",
      render: (order) => `Rs. ${order.total.toLocaleString()}`,
    },
    {
      header: "Status",
      accessor: "orderStatus",
      render: (order) => (
        <span className={`status-badge ${order.orderStatus.toLowerCase()}`}>
          {order.orderStatus}
        </span>
      ),
    },
  ];

  const pendingApprovalColumns = [
    {
      header: "Module",
      accessor: "module",
      render: (req) => (
        <span className="status-badge active">{req.module}</span>
      ),
    },
    {
      header: "Action",
      accessor: "action",
      render: (req) => <strong>{req.action}</strong>,
    },
    {
      header: "Requested By",
      accessor: "requestedBy",
      render: (req) => (
        <div>
          {req.requestedBy?.name || "Unknown"}
          <div className="text-xs text-muted">
            {req.requestedBy?.role?.replace(/_/g, " ")}
          </div>
        </div>
      ),
    },
    {
      header: "Date",
      accessor: "createdAt",
      render: (req) => new Date(req.createdAt).toLocaleString(),
    },
    {
      header: "Actions",
      accessor: "actions",
      render: (req) => (
        <button
          className="btn btn-primary btn-sm"
          onClick={() => {
            setSelectedRequest(req);
            setApprovalRemarks("");
            setShowApprovalModal(true);
          }}
        >
          Review
        </button>
      ),
    },
  ];

  if (loading) {
    // ─────────────────────────────────
    // Render
    // ─────────────────────────────────
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <DashboardHeader
        title="Admin Dashboard"
        subtitle="System overview and recent activity"
        actions={[
          {
            label: "Manage Users",
            icon: <UserPlus size={18} />,
            onClick: () => (window.location.href = "/admin/users"),
            variant: "primary",
          },
        ]}
      />

      {/* Stats Grid */}
      <div className="dashboard-grid compact-grid dashboard-grid-4">
        <StatCard
          icon={<FileSignature size={24} />}
          label="Pending Approvals"
          value={pendingApprovals.length}
          change={pendingApprovals.length > 0 ? "Action Required" : "All clear"}
          trend={pendingApprovals.length > 0 ? "down" : "up"}
          variant="warning"
          className="stat-card-compact"
        />
        <StatCard
          icon={<Users size={24} />}
          label="Total Users"
          value={stats.totalUsers}
          change="+12%"
          trend="up"
          variant="primary"
          className="stat-card-compact"
        />
        <StatCard
          icon={<ShoppingBag size={24} />}
          label="Total Orders"
          value={stats.totalOrders}
          change="+8%"
          trend="up"
          variant="warning"
          className="stat-card-compact"
        />
        <StatCard
          icon={<DollarSign size={24} />}
          label="Revenue"
          value={`Rs. ${stats.totalRevenue.toLocaleString()}`}
          change="+15%"
          trend="up"
          variant="primary"
          className="stat-card-compact"
        />
        <StatCard
          icon={<Bell size={24} />}
          label="Low Stock Alerts"
          value={lowStockCount}
          change={lowStockCount > 0 ? "Action Required" : "All Clear"}
          trend={lowStockCount > 0 ? "down" : "neutral"}
          variant={lowStockCount > 0 ? "danger" : "primary"}
          className="stat-card-compact"
        />
      </div>

      {pendingApprovals.length > 0 && (
        <DashboardSection title="Pending Approvals (Security & Edits)">
          <DashboardTable
            columns={pendingApprovalColumns}
            data={pendingApprovals}
            searchable={false}
            rowsPerPage={5}
          />
        </DashboardSection>
      )}

      {/* Charts */}
      <div className="dashboard-grid dashboard-grid-2">
        <DashboardSection>
          <RevenueChart data={statsData.revenue} />
        </DashboardSection>
        <DashboardSection>
          <SalesChart
            data={statsData.sales.data}
            labels={statsData.sales.labels}
          />
        </DashboardSection>
      </div>

      {/* Recent Users */}
      <DashboardSection
        title="Recent Users"
        action={
          <Link to="/admin/users" className="card-action">
            View All <ArrowRight size={16} />
          </Link>
        }
      >
        <DashboardTable
          columns={recentUserColumns}
          data={recentUsers}
          searchable={false}
          rowsPerPage={5}
          emptyMessage="No users found."
        />
      </DashboardSection>

      {/* Recent Orders */}
      <DashboardSection
        title="Recent Orders"
        action={
          <Link to="/admin/orders" className="card-action">
            View All <ArrowRight size={16} />
          </Link>
        }
      >
        <DashboardTable
          columns={recentOrderColumns}
          data={recentOrders}
          searchable={false}
          rowsPerPage={5}
          emptyMessage="No orders found."
        />
      </DashboardSection>

      {/* Approval Details Modal */}
      {selectedRequest && (
        <Modal
          isOpen={showApprovalModal}
          onClose={() => setShowApprovalModal(false)}
          title="Review Edit Request"
          size="lg"
        >
          <div className="request-details">
            <div className="grid-2col mb-4">
              <div>
                <strong>Module:</strong> {selectedRequest.module}
              </div>
              <div>
                <strong>Action:</strong> {selectedRequest.action}
              </div>
              <div>
                <strong>Requested By:</strong>{" "}
                {selectedRequest.requestedBy?.name} (
                {selectedRequest.requestedBy?.role})
              </div>
              <div>
                <strong>Record ID:</strong> {selectedRequest.documentId}
              </div>
            </div>

            <div className="details-section mb-4">
              <h4
                style={{
                  marginBottom: "1rem",
                  color: "var(--text-color)",
                  fontWeight: "600",
                }}
              >
                Requested Changes:
              </h4>
              <div
                style={{
                  background: "white",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                  overflow: "hidden",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    textAlign: "left",
                  }}
                >
                  <tbody>
                    {Object.entries(selectedRequest.targetData || {}).map(
                      ([key, value]) => (
                        <tr
                          key={key}
                          style={{
                            borderBottom: "1px solid var(--border-color)",
                          }}
                        >
                          <td
                            style={{
                              padding: "1rem 1.25rem",
                              fontWeight: "600",
                              width: "35%",
                              borderRight: "1px solid var(--border-color)",
                              color: "#6b7280",
                              fontSize: "0.95rem",
                            }}
                          >
                            {key
                              .replace(/([A-Z])/g, " $1")
                              .trim()
                              .replace(/^./, (str) => str.toUpperCase())}
                          </td>
                          <td
                            style={{
                              padding: "1rem 1.25rem",
                              fontWeight: "500",
                              color: "#111827",
                              fontSize: "0.95rem",
                            }}
                          >
                            {typeof value === "object"
                              ? JSON.stringify(value)
                              : String(value)}
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="form-group mb-4">
              <label>Admin Remarks (Optional)</label>
              <textarea
                className="form-control"
                value={approvalRemarks}
                onChange={(e) => setApprovalRemarks(e.target.value)}
                placeholder="Enter any notes about this approval or rejection..."
                rows="3"
              />
            </div>

            <div
              className="modal-actions"
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "flex-end",
              }}
            >
              <button
                className="btn btn-outline"
                onClick={() => setShowApprovalModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                style={{ display: "flex", alignItems: "center", gap: "5px" }}
                onClick={() => handleReviewRequest("Rejected")}
              >
                <XCircle size={16} /> Reject
              </button>
              <button
                className="btn btn-primary"
                style={{ display: "flex", alignItems: "center", gap: "5px" }}
                onClick={() => handleReviewRequest("Approved")}
              >
                <CheckCircle size={16} /> Approve Changes
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminDashboard;

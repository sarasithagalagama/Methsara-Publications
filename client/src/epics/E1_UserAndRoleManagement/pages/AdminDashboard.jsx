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
  // State Variables
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [stockAlerts, setStockAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState({
    revenue: [],
    sales: { labels: [], data: [] },
  });

  // Modal State for Approvals
  // [Approval workflow] Managers submit change requests; the admin reviews and approves/rejects them here
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [approvalRemarks, setApprovalRemarks] = useState("");
  const [currentDocData, setCurrentDocData] = useState(null);
  const [loadingCurrentDoc, setLoadingCurrentDoc] = useState(false);

  // Side Effects
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Event Handlers
  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // allSettled (not Promise.all) — if one API fails, the rest still load (fault-tolerant)
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
        setStockAlerts(alertsRes.value.data.alerts || []);
      }

      const totalOrders = allOrders.length;
      // Only count revenue from paid orders (not pending/COD unpaid)
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

  // Fetch current document and open the diff modal
  const openApprovalModal = async (req) => {
    setSelectedRequest(req);
    setApprovalRemarks("");
    setCurrentDocData(null);
    setShowApprovalModal(true);

    const moduleEndpoints = {
      Supplier: `/api/suppliers/${req.documentId}`,
      Product: `/api/products/${req.documentId}`,
      FinancialTransaction: `/api/financial/transactions/${req.documentId}`,
    };
    const endpoint = moduleEndpoints[req.module];
    if (endpoint) {
      setLoadingCurrentDoc(true);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Handle varying response shapes
        const doc =
          res.data.supplier ||
          res.data.product ||
          res.data.transaction ||
          res.data.data ||
          res.data;
        setCurrentDocData(doc);
      } catch (e) {
        console.warn("Could not fetch current document for diff", e);
      } finally {
        setLoadingCurrentDoc(false);
      }
    }
  };

  // Sends an approve/reject decision for a pending manager change request
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
          onClick={() => openApprovalModal(req)}
        >
          Review
        </button>
      ),
    },
  ];

  if (loading) {
    // Render
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
      <div className="dashboard-grid compact-grid dashboard-grid-5">
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
          value={stockAlerts.length}
          change={stockAlerts.length > 0 ? "Action Required" : "All Clear"}
          trend={stockAlerts.length > 0 ? "down" : "neutral"}
          variant={stockAlerts.length > 0 ? "danger" : "primary"}
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

      {stockAlerts.length > 0 && (
        <DashboardSection
          title={`Low Stock Alerts (${stockAlerts.length})`}
          action={
            <Link to="/inventory-manager/alerts" className="card-action">
              View All <ArrowRight size={16} />
            </Link>
          }
        >
          <DashboardTable
            columns={[
              {
                header: "Product",
                accessor: "product",
                render: (alert) => (
                  <div>
                    <strong>
                      {alert.product?.title || alert.productTitle || "Unknown"}
                    </strong>
                    {alert.product?.isbn && (
                      <div className="text-xs text-muted">
                        ISBN: {alert.product.isbn}
                      </div>
                    )}
                  </div>
                ),
              },
              {
                header: "Location",
                accessor: "location",
                render: (alert) => (
                  <span className="status-badge active">{alert.location}</span>
                ),
              },
              {
                header: "Current Stock",
                accessor: "currentStock",
                render: (alert) => (
                  <span
                    style={{
                      color:
                        alert.currentStock === 0
                          ? "var(--danger-color)"
                          : "var(--warning-color)",
                      fontWeight: 700,
                    }}
                  >
                    {alert.currentStock ?? alert.availableQuantity ?? 0} units
                  </span>
                ),
              },
              {
                header: "Reorder Level",
                accessor: "reorderLevel",
                render: (alert) => (
                  <span>
                    {alert.reorderLevel ??
                      alert.reorderPoint ??
                      alert.lowStockThreshold ??
                      0}{" "}
                    units
                  </span>
                ),
              },
              {
                header: "Status",
                accessor: "status",
                render: (alert) => {
                  const stock =
                    alert.currentStock ?? alert.availableQuantity ?? 0;
                  return (
                    <span
                      className={`status-badge ${
                        stock === 0 ? "inactive" : "pending"
                      }`}
                    >
                      {stock === 0 ? "Out of Stock" : "Low Stock"}
                    </span>
                  );
                },
              },
            ]}
            data={stockAlerts.slice(0, 10)}
            searchable={false}
            rowsPerPage={10}
            emptyMessage="No low stock alerts."
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
      {selectedRequest &&
        (() => {
          // Fields that are system-managed and should never be shown in a diff
          const SKIP_FIELDS = new Set([
            "_id",
            "__v",
            "createdAt",
            "updatedAt",
            "isActive",
            "isVerified",
            "totalOrders",
            "totalValue",
            "totalPaid",
            "outstandingBalance",
            "rating",
            "hasDebt",
            "paymentHistory",
            "totalPaidToUs",
            "totalPaymentsReceived",
            // FinancialTransaction system fields
            "processedBy",
            "isArchived",
            "date",
            "relatedId",
          ]);

          // Humanise a camelCase key, e.g. "bankDetails" → "Bank Details"
          const labelOf = (key) =>
            key
              .replace(/([A-Z])/g, " $1")
              .trim()
              .replace(/^./, (s) => s.toUpperCase());

          // Render a single value (object → readable lines, bool → Yes/No, empty → —)
          const renderVal = (val) => {
            if (val === null || val === undefined || val === "")
              return <em style={{ color: "#9ca3af" }}>—</em>;
            if (typeof val === "boolean") return val ? "Yes" : "No";
            if (typeof val === "object") {
              const entries = Object.entries(val).filter(
                ([, v]) => v !== "" && v !== null && v !== undefined,
              );
              if (entries.length === 0)
                return <em style={{ color: "#9ca3af" }}>—</em>;
              return (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                  }}
                >
                  {entries.map(([k, v]) => (
                    <span key={k}>
                      <span style={{ color: "#6b7280", fontSize: "0.8rem" }}>
                        {labelOf(k)}:{" "}
                      </span>
                      {String(v)}
                    </span>
                  ))}
                </div>
              );
            }
            return String(val);
          };

          // Build list of changed fields only
          const proposed = selectedRequest.targetData || {};
          const current = currentDocData || {};
          const changedFields = Object.entries(proposed).filter(
            ([key, newVal]) => {
              if (SKIP_FIELDS.has(key)) return false;
              const oldVal = current[key];
              return JSON.stringify(newVal) !== JSON.stringify(oldVal);
            },
          );

          return (
            <Modal
              isOpen={showApprovalModal}
              onClose={() => setShowApprovalModal(false)}
              title="Review Edit Request"
              size="lg"
            >
              <div className="request-details">
                {/* Request metadata */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "0.5rem 2rem",
                    background: "#f9fafb",
                    border: "1px solid var(--border-color)",
                    borderRadius: "8px",
                    padding: "1rem 1.25rem",
                    marginBottom: "1.5rem",
                    fontSize: "0.9rem",
                  }}
                >
                  <div>
                    <span style={{ color: "#6b7280" }}>Module:</span>{" "}
                    <strong>{selectedRequest.module}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#6b7280" }}>Action:</span>{" "}
                    <strong>{selectedRequest.action}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#6b7280" }}>Requested By:</span>{" "}
                    <strong>{selectedRequest.requestedBy?.name}</strong>{" "}
                    <span style={{ color: "#6b7280" }}>
                      ({selectedRequest.requestedBy?.role?.replace(/_/g, " ")})
                    </span>
                  </div>
                  <div>
                    <span style={{ color: "#6b7280" }}>Date:</span>{" "}
                    <strong>
                      {new Date(selectedRequest.createdAt).toLocaleString()}
                    </strong>
                  </div>
                </div>

                {/* Changes diff table */}
                <h4
                  style={{
                    marginBottom: "0.75rem",
                    color: "var(--text-color)",
                    fontWeight: "600",
                  }}
                >
                  {loadingCurrentDoc
                    ? "Loading comparison..."
                    : changedFields.length === 0
                      ? currentDocData
                        ? "No fields were changed."
                        : "Requested Changes:"
                      : `${changedFields.length} field${changedFields.length > 1 ? "s" : ""} changed:`}
                </h4>

                <div
                  style={{
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    overflow: "hidden",
                    marginBottom: "1.5rem",
                  }}
                >
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      textAlign: "left",
                    }}
                  >
                    <thead>
                      <tr style={{ background: "#f3f4f6" }}>
                        <th
                          style={{
                            padding: "0.65rem 1rem",
                            fontWeight: "600",
                            fontSize: "0.82rem",
                            color: "#374151",
                            width: "25%",
                            borderBottom: "1px solid var(--border-color)",
                          }}
                        >
                          FIELD
                        </th>
                        {currentDocData && (
                          <th
                            style={{
                              padding: "0.65rem 1rem",
                              fontWeight: "600",
                              fontSize: "0.82rem",
                              color: "#374151",
                              width: "37.5%",
                              borderBottom: "1px solid var(--border-color)",
                              borderLeft: "1px solid var(--border-color)",
                            }}
                          >
                            CURRENT VALUE
                          </th>
                        )}
                        <th
                          style={{
                            padding: "0.65rem 1rem",
                            fontWeight: "600",
                            fontSize: "0.82rem",
                            color: "#374151",
                            borderBottom: "1px solid var(--border-color)",
                            borderLeft: "1px solid var(--border-color)",
                          }}
                        >
                          NEW VALUE
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(changedFields.length > 0
                        ? changedFields
                        : Object.entries(proposed).filter(
                            ([k]) => !SKIP_FIELDS.has(k),
                          )
                      ).map(([key, newVal], idx) => {
                        const oldVal = current[key];
                        const isChanged =
                          currentDocData &&
                          JSON.stringify(newVal) !== JSON.stringify(oldVal);
                        return (
                          <tr
                            key={key}
                            style={{
                              borderBottom: "1px solid var(--border-color)",
                              background: isChanged ? "#fffbeb" : "white",
                            }}
                          >
                            <td
                              style={{
                                padding: "0.85rem 1rem",
                                fontWeight: "600",
                                color: "#374151",
                                fontSize: "0.88rem",
                                verticalAlign: "top",
                              }}
                            >
                              {labelOf(key)}
                              {isChanged && (
                                <span
                                  style={{
                                    display: "block",
                                    fontSize: "0.7rem",
                                    color: "#d97706",
                                    fontWeight: "500",
                                    marginTop: "2px",
                                  }}
                                >
                                  CHANGED
                                </span>
                              )}
                            </td>
                            {currentDocData && (
                              <td
                                style={{
                                  padding: "0.85rem 1rem",
                                  color: "#6b7280",
                                  fontSize: "0.88rem",
                                  borderLeft: "1px solid var(--border-color)",
                                  verticalAlign: "top",
                                  textDecoration: isChanged
                                    ? "line-through"
                                    : "none",
                                }}
                              >
                                {renderVal(oldVal)}
                              </td>
                            )}
                            <td
                              style={{
                                padding: "0.85rem 1rem",
                                fontWeight: "500",
                                color: isChanged ? "#065f46" : "#111827",
                                fontSize: "0.88rem",
                                borderLeft: "1px solid var(--border-color)",
                                background: isChanged
                                  ? "#ecfdf5"
                                  : "transparent",
                                verticalAlign: "top",
                              }}
                            >
                              {renderVal(newVal)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
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
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                    onClick={() => handleReviewRequest("Rejected")}
                  >
                    <XCircle size={16} /> Reject
                  </button>
                  <button
                    className="btn btn-primary"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                    onClick={() => handleReviewRequest("Approved")}
                  >
                    <CheckCircle size={16} /> Approve Changes
                  </button>
                </div>
              </div>
            </Modal>
          );
        })()}
    </div>
  );
};

export default AdminDashboard;

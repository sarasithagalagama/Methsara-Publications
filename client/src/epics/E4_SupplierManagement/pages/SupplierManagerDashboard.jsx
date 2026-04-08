// ============================================
// SupplierManagerDashboard
// Epic: E4 - Supplier Management
// Owner: IT24100799 (Gawrawa G H Y)
// Purpose: SupplierManagerDashboard page component
// ============================================
// Purpose: Supplier and purchase order management

import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../../epics/E1_UserAndRoleManagement/context/AuthContext";
import {
  Building,
  ClipboardList,
  CheckCircle,
  Plus,
  FileText,
  Edit,
  Eye,
  BarChart2,
  Calendar,
  ArrowRight,
  Briefcase,
  X,
  Phone,
  Mail,
  MapPin,
  Globe,
  Send,
  PackageCheck,
  Search,
  Trash2,
  ShoppingBag,
  TrendingDown,
} from "lucide-react";
import StatCard from "../../../components/dashboard/StatCard";
import DashboardHeader from "../../../components/dashboard/DashboardHeader";
import Modal from "../../../components/common/Modal";
import ConfirmModal from "../../../components/common/ConfirmModal";
import toast from "react-hot-toast";
import SupplierFormModal from "../../../epics/E4_SupplierManagement/components/Suppliers/SupplierFormModal";

const SupplierManagerDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const poSectionRef = useRef(null);

  // State
  const [stats, setStats] = useState({
    totalSuppliers: 0,
    bookshops: 0,
    distributors: 0,
    activePOs: 0,
  });
  const [suppliers, setSuppliers] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [supplierSearch, setSupplierSearch] = useState("");

  // Action states
  const [pendingPOs, setPendingPOs] = useState([]);
  const [approvedPOs, setApprovedPOs] = useState([]);

  // Modal state
  const [showViewModal, setShowViewModal] = useState(false);
  const [showPOViewModal, setShowPOViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [selectedPO, setSelectedPO] = useState(null);
  const [activeTab, setActiveTab] = useState("All"); // Categories: All, Material Suppliers, Distributors, Bookshops
  const [verifyItems, setVerifyItems] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  // [E4.4] emailingPO tracks which PO is being emailed to prevent double-send while the request is in-flight
  const [emailingPO, setEmailingPO] = useState(null);
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    confirmText: "Confirm",
    variant: "primary",
  });

  const closeConfirm = () =>
    setConfirmState((prev) => ({ ...prev, isOpen: false }));
  // Side Effects
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Event Handlers
  // [E4.1] [E4.2] Parallel fetch: suppliers + purchase orders loaded together to populate dashboard stats
  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [suppliersRes, posRes] = await Promise.all([
        axios.get("/api/suppliers", config),
        axios.get("/api/purchase-orders", config),
      ]);

      const allSuppliers = suppliersRes.data.suppliers || [];
      const allPOs = posRes.data.purchaseOrders || [];

      const activePOs = allPOs.filter(
        (po) => po.status !== "Received" && po.status !== "Cancelled",
      ).length;

      setStats({
        totalSuppliers: allSuppliers.length,
        bookshops: allSuppliers.filter((s) => s.category === "Bookshop").length,
        distributors: allSuppliers.filter((s) => s.category === "Distributor")
          .length,
        activePOs,
      });

      setPendingPOs(
        allPOs.filter((po) => po.status === "Pending" || po.status === "Draft")
      );
      setApprovedPOs(allPOs.filter((po) => po.status === "Approved"));

      setSuppliers(allSuppliers);
      setPurchaseOrders(allPOs.slice(0, 10)); // [E4.3] Only the 10 most recent POs shown in dashboard table; full list is in PurchaseOrderList page
      setLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setLoading(false);
    }
  };

  const handleDeleteSupplier = (supplier) => {
    setConfirmState({
      isOpen: true,
      title: "Remove Partner",
      message: `Are you sure you want to remove ${supplier.name}? This action will mark them as inactive in the system.`,
      confirmText: "Yes, Remove",
      variant: "danger",
      onConfirm: async () => {
        closeConfirm();
        try {
          const token = localStorage.getItem("token");
          await axios.delete(`/api/suppliers/${supplier._id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          toast.success("Partner removed successfully");
          fetchDashboardData();
        } catch (error) {
          console.error("Error deleting supplier:", error);
          toast.error(
            error.response?.data?.message || "Failed to remove partner",
          );
        }
      },
    });
  };

  // Supplier handlers
  const handleViewSupplier = (supplier) => {
    setSelectedSupplier(supplier);
    setShowViewModal(true);
  };

  const handleEditSupplier = (supplier) => {
    setSelectedSupplier(supplier);
    setShowEditModal(true);
  };

  const handleSaveEdit = async (data) => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `/api/suppliers/${selectedSupplier._id}`,
        data,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (res.data.pendingApproval) {
        toast.success(
          "Edit request submitted for Admin approval. It will take effect once approved.",
          { duration: 4000 },
        );
      } else {
        toast.success("Supplier updated successfully");
      }

      setShowEditModal(false);
      fetchDashboardData();
    } catch (error) {
      console.error("Error updating supplier:", error);
      toast.error(error.response?.data?.message || "Failed to update supplier");
    } finally {
      setIsSaving(false);
    }
  };

  // E4.1 — Add new supplier
  const handleAddSupplier = async (data) => {
    setIsAdding(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post("/api/suppliers", data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Supplier added successfully!");
      setShowAddModal(false);
      fetchDashboardData();
    } catch (error) {
      console.error("Error adding supplier:", error);
      toast.error(error.response?.data?.message || "Failed to add supplier");
    } finally {
      setIsAdding(false);
    }
  };

  // E4.4 — Email PO to supplier
  const handleEmailPO = (po) => {
    setConfirmState({
      isOpen: true,
      title: "Send Email",
      message: `Send PO #${po.poNumber} to ${po.supplier?.name || "supplier"} via email?`,
      confirmText: "Send Email",
      variant: "primary",
      onConfirm: async () => {
        closeConfirm();
        setEmailingPO(po._id);
        try {
          const token = localStorage.getItem("token");
          await axios.post(
            `/api/purchase-orders/${po._id}/email`,
            {},
            { headers: { Authorization: `Bearer ${token}` } },
          );
          toast.success("PO emailed to supplier successfully!");
        } catch (error) {
          console.error("Error emailing PO:", error);
          toast.error(error.response?.data?.message || "Failed to email PO");
        } finally {
          setEmailingPO(null);
        }
      },
    });
  };

  const handleStatusUpdate = (id, newStatus) => {
    setConfirmState({
      isOpen: true,
      title: "Confirm Status Update",
      message: `Mark this PO as ${newStatus}?`,
      confirmText: "Yes, Update",
      variant: "primary",
      onConfirm: async () => {
        closeConfirm();
        try {
          const token = localStorage.getItem("token");
          await axios.put(
            `/api/purchase-orders/${id}/status`,
            { status: newStatus },
            { headers: { Authorization: `Bearer ${token}` } },
          );
          toast.success(`Purchase Order ${newStatus} successfully`);
          fetchDashboardData();
        } catch (error) {
          console.error("Error updating PO status:", error);
          toast.error(
            error.response?.data?.message || "Failed to update PO status",
          );
        }
      },
    });
  };

  const handleViewPO = (po) => {
    setSelectedPO(po);
    setShowPOViewModal(true);
  };

  // E4.7 — Verify delivery against PO
  const handleVerifyDelivery = (po) => {
    setSelectedPO(po);
    setVerifyItems(
      (po.items || []).map((item) => ({
        ...item,
        receivedQty: item.quantity,
        verified: false,
      })),
    );
    setShowVerifyModal(true);
  };

  const processVerifyDelivery = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `/api/purchase-orders/${selectedPO._id}/verify-delivery`,
        { items: verifyItems },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success("Delivery verified successfully!");
      setShowVerifyModal(false);
      fetchDashboardData();
    } catch (error) {
      console.error("Error verifying delivery:", error);
      toast.error(error.response?.data?.message || "Failed to verify delivery");
    }
  };

  const handleConfirmVerification = () => {
    const allVerified = verifyItems.every((item) => item.verified);
    if (!allVerified) {
      setConfirmState({
        isOpen: true,
        title: "Warning: Missing Verification",
        message:
          "Some items are not marked as verified. Confirm delivery anyway?",
        confirmText: "Yes, Confirm",
        variant: "warning",
        onConfirm: () => {
          closeConfirm();
          processVerifyDelivery();
        },
      });
      return;
    }
    processVerifyDelivery();
  };

  // Filtered suppliers
  const filteredSuppliers = suppliers.filter((s) => {
    const q = supplierSearch.toLowerCase();
    const matchesSearch =
      !supplierSearch ||
      s.name?.toLowerCase().includes(q) ||
      s.contactPerson?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.address?.city?.toLowerCase().includes(q);

    const matchesTab =
      activeTab === "All" ||
      (activeTab === "Material Suppliers" &&
        s.category === "Material Supplier") ||
      (activeTab === "Distributors" && s.category === "Distributor") ||
      (activeTab === "Bookshops" && s.category === "Bookshop");

    return matchesSearch && matchesTab;
  });

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
        title="Partner Management"
        subtitle="Manage Suppliers, Distributors, and Bookshops"
        actions={[
          {
            label: "Add Partner",
            icon: <Plus size={18} />,
            onClick: () => setShowAddModal(true),
            variant: "warning", // Maps to the brown theme
          },
        ]}
      />

      {/* Action Required Priority Banner */}
      {(pendingPOs.length > 0 || approvedPOs.length > 0) && (
        <div className="dashboard-grid dashboard-grid-2" style={{ marginBottom: "1.5rem" }}>
          {pendingPOs.length > 0 && (
            <div
              className="dashboard-card"
              style={{
                borderLeft: "4px solid var(--warning-color)",
                padding: "1.25rem",
                display: "flex",
                flexDirection: "column",
                marginBottom: 0
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--warning-color)" }}>
                  <ClipboardList size={20} />
                  <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>Needs Approval</span>
                </div>
                <span className="badge warning" style={{ fontSize: "1.1rem" }}>{pendingPOs.length}</span>
              </div>
              <p className="text-muted text-sm" style={{ margin: "0 0 1rem 0" }}>Purchase orders waiting for manager approval</p>
              <button 
                className="btn btn-secondary" 
                style={{ alignSelf: "flex-start", padding: "0.25rem 0.75rem", fontSize: "0.85rem" }}
                onClick={() => {
                  poSectionRef.current?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Review POs <ArrowRight size={14} style={{ marginLeft: "4px" }} />
              </button>
            </div>
          )}

          {approvedPOs.length > 0 && (
            <div
              className="dashboard-card"
              style={{
                borderLeft: "4px solid var(--success-color)",
                padding: "1.25rem",
                display: "flex",
                flexDirection: "column",
                marginBottom: 0
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--success-color)" }}>
                  <PackageCheck size={20} />
                  <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>Delivery Verification</span>
                </div>
                <span className="badge success" style={{ fontSize: "1.1rem" }}>{approvedPOs.length}</span>
              </div>
              <p className="text-muted text-sm" style={{ margin: "0 0 1rem 0" }}>Approved POs awaiting delivery and verification</p>
              <button 
                className="btn btn-secondary" 
                style={{ alignSelf: "flex-start", padding: "0.25rem 0.75rem", fontSize: "0.85rem" }}
                onClick={() => {
                  poSectionRef.current?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Verify Deliveries <ArrowRight size={14} style={{ marginLeft: "4px" }} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="dashboard-grid dashboard-grid-4">
        <StatCard
          icon={<Building size={24} />}
          label="TOTAL PARTNERS"
          value={
            stats.totalSuppliers > 0
              ? stats.totalSuppliers.toLocaleString()
              : "0"
          }
          variant="info"
          onClick={() => setActiveTab("All")}
          subtitle="Registered vendors"
        />
        <StatCard
          icon={<Briefcase size={24} />}
          label="DISTRIBUTORS"
          value={
            stats.distributors > 0 ? stats.distributors.toLocaleString() : "0"
          }
          variant="primary"
          onClick={() => setActiveTab("Distributors")}
          subtitle="Wholesale partners"
        />
        <StatCard
          icon={<Building size={24} />}
          label="BOOKSHOPS"
          value={stats.bookshops > 0 ? stats.bookshops.toLocaleString() : "0"}
          variant="warning"
          onClick={() => setActiveTab("Bookshops")}
          subtitle="Retail partners"
        />
        <StatCard
          icon={<ClipboardList size={24} />}
          label="ACTIVE POS"
          value={stats.activePOs > 0 ? stats.activePOs.toLocaleString() : "0"}
          variant="success"
          onClick={() =>
            poSectionRef.current?.scrollIntoView({ behavior: "smooth" })
          }
          subtitle="Orders in progress"
        />
        </div>

      {/* Quick Actions (E4.2 Shortcuts) */}
      <div
        className="dashboard-grid dashboard-grid-3"
        style={{ marginBottom: "2rem" }}
      >
        <div className="dashboard-card action-card">
          <div className="action-icon">
            <FileText size={24} />
          </div>
          <h3 className="card-title">Create PO</h3>
          <p className="text-sm text-muted" style={{ marginBottom: "1rem" }}>
            Generate new PO for suppliers
          </p>
          <Link
            to="/supplier-manager/purchase-orders/create"
            className="action-link"
            style={{ marginTop: "auto" }}
          >
            Create PO <ArrowRight size={16} />
          </Link>
        </div>
        <div className="dashboard-card action-card">
          <div
            className="action-icon"
            style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}
          >
            <ShoppingBag size={24} />
          </div>
          <h3 className="card-title">Sales Orders</h3>
          <p className="text-sm text-muted" style={{ marginBottom: "1rem" }}>
            Bulk distributor orders
          </p>
          <Link
            to="/supplier-manager/sales-orders"
            className="action-link"
            style={{ marginTop: "auto" }}
          >
            View Sales <ArrowRight size={16} />
          </Link>
        </div>
        <div className="dashboard-card action-card">
          <div
            className="action-icon"
            style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}
          >
            <TrendingDown size={24} />
          </div>
          <h3 className="card-title">Debt Tracker</h3>
          <p className="text-sm text-muted" style={{ marginBottom: "1rem" }}>
            Payables & receivables
          </p>
          <Link
            to="/supplier-manager/debt-tracker"
            className="action-link"
            style={{ marginTop: "auto" }}
          >
            Track Debts <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="dashboard-controls">
        <div className="dashboard-tabs">
          {["All", "Material Suppliers", "Distributors", "Bookshops"].map(
            (tab) => (
              <button
                key={tab}
                className={`tab-btn ${activeTab === tab ? "active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === "All" ? "All Partners" : tab}
              </button>
            ),
          )}
        </div>
      </div>

      {/* ── Supplier Directory Card ── */}
      <div className="dashboard-card">
        {filteredSuppliers.length === 0 ? (
          <div className="table-empty-state" style={{ padding: "4rem 2rem" }}>
            <div className="text-muted" style={{ fontSize: "1.1rem" }}>
              No partners found in this category.
            </div>
          </div>
        ) : (
          <>
            <div className="dashboard-card-header">
              <h2 className="card-title">
                {activeTab === "All"
                  ? "Partner Directory"
                  : `${activeTab} Directory`}
              </h2>
              <div className="card-header-actions">
                <div className="search-bar" style={{ maxWidth: "240px" }}>
                  <Search size={16} className="detail-label-icon" />
                  <input
                    type="text"
                    placeholder="Search partners…"
                    value={supplierSearch}
                    onChange={(e) => setSupplierSearch(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Partner Name</th>
                    <th>Category</th>
                    <th>District</th>
                    <th>Contact</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSuppliers.map((supplier) => (
                    <tr key={supplier._id}>
                      <td>
                        <strong>{supplier.name}</strong>
                        {new Date() - new Date(supplier.createdAt) <
                          7 * 24 * 60 * 60 * 1000 && (
                          <span
                            style={{
                              marginLeft: "8px",
                              padding: "2px 6px",
                              background: "var(--success-color)",
                              color: "#fff",
                              borderRadius: "4px",
                              fontSize: "0.65rem",
                              fontWeight: 700,
                              textTransform: "uppercase",
                              verticalAlign: "middle",
                            }}
                          >
                            New
                          </span>
                        )}
                        {supplier.businessRegistration && (
                          <div className="text-muted text-xs">
                            BR: {supplier.businessRegistration}
                          </div>
                        )}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            supplier.category
                              ? supplier.category
                                  .replace(/\s+/g, "-")
                                  .toLowerCase()
                              : "default"
                          }`}
                        >
                          {supplier.category || "Supplier"}
                        </span>
                      </td>
                      <td>{supplier.address?.city || "-"}</td>
                      <td>{supplier.contactPerson}</td>
                      <td>{supplier.phone}</td>
                      <td>
                        <span
                          className={`status-badge ${
                            supplier.isActive ? "active" : "inactive"
                          }`}
                        >
                          {supplier.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="btn-icon"
                            title="Edit Supplier"
                            onClick={() => handleEditSupplier(supplier)}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            className="btn-icon"
                            title="View Details"
                            onClick={() => handleViewSupplier(supplier)}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            className="btn-icon error"
                            title="Remove Partner"
                            onClick={() => handleDeleteSupplier(supplier)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ── Recent Purchase Orders Table — E4.3 ── */}
      <div className="dashboard-card" ref={poSectionRef}>
        <div className="dashboard-card-header">
          <h2 className="card-title">Recent Purchase Orders</h2>
          <Link to="/supplier-manager/purchase-orders" className="card-action">
            View All <ArrowRight size={16} />
          </Link>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Supplier</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {purchaseOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    style={{ textAlign: "center", padding: "2rem" }}
                    className="text-muted"
                  >
                    No purchase orders yet.{" "}
                    <Link to="/supplier-manager/purchase-orders/create">
                      Create your first PO
                    </Link>
                  </td>
                </tr>
              ) : (
                purchaseOrders.map((po) => (
                  <tr key={po._id}>
                    <td>
                      <strong>#{po.poNumber}</strong>
                    </td>
                    <td>{po.supplier?.name || "N/A"}</td>
                    <td>{po.items?.length || 0} item(s)</td>
                    <td>Rs. {(po.totalAmount || 0).toLocaleString()}</td>
                    <td>
                      <span
                        className={`status-badge ${
                          po.status === "Received"
                            ? "success"
                            : po.status === "Approved"
                              ? "active"
                              : po.status === "Cancelled"
                                ? "error"
                                : "warning"
                        }`}
                      >
                        {po.status}
                      </span>
                    </td>
                    <td>{new Date(po.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="table-actions">
                        {/* E4.4 — Email PO */}
                        <button
                          className="btn-icon"
                          title="Email PO to Supplier"
                          onClick={() => handleEmailPO(po)}
                          disabled={emailingPO === po._id}
                        >
                          <Send size={16} />
                        </button>
                        {(po.status === "Pending" || po.status === "Draft") && (
                          <button
                            className="btn-icon success"
                            title="Approve Order"
                            onClick={() =>
                              handleStatusUpdate(po._id, "Approved")
                            }
                          >
                            <CheckCircle size={16} />
                          </button>
                        )}
                        {/* E4.7 — Verify Delivery */}
                        {po.status === "Approved" && (
                          <button
                            className="btn-icon success"
                            title="Verify Delivery"
                            onClick={() => handleVerifyDelivery(po)}
                          >
                            <PackageCheck size={16} />
                          </button>
                        )}
                        <button
                          className="btn-icon"
                          title="View PO Details"
                          onClick={() => handleViewPO(po)}
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          MODALS
      ════════════════════════════════════════════════════════ */}

      {/* View Supplier Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Partner Details"
        size="md"
      >
        {selectedSupplier && (
          <div className="view-details-grid">
            <div className="view-section">
              <div className="detail-item">
                <label>Company Name</label>
                <span>{selectedSupplier.name}</span>
              </div>
              <div className="detail-item">
                <label>Category</label>
                <span>
                  <span
                    className={`badge ${selectedSupplier.category
                      ?.replace(/\s+/g, "-")
                      .toLowerCase()}`}
                  >
                    {selectedSupplier.category || "Supplier"}
                  </span>
                </span>
              </div>
              <div className="detail-item">
                <label>Business Registration</label>
                <span>{selectedSupplier.businessRegistration || "—"}</span>
              </div>
              <div className="detail-item">
                <label>Status</label>
                <span
                  className={`status-badge ${
                    selectedSupplier.isActive ? "active" : "inactive"
                  }`}
                >
                  {selectedSupplier.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
            <div className="view-section">
              <div className="detail-item">
                <label>
                  <Phone size={12} className="detail-label-icon" />
                  Contact Person
                </label>
                <span>{selectedSupplier.contactPerson || "—"}</span>
              </div>
              <div className="detail-item">
                <label>
                  <Phone size={12} className="detail-label-icon" />
                  Phone
                </label>
                <span>{selectedSupplier.phone || "—"}</span>
              </div>
              <div className="detail-item">
                <label>
                  <Mail size={12} className="detail-label-icon" />
                  Email
                </label>
                <span>{selectedSupplier.email || "—"}</span>
              </div>
              <div className="detail-item">
                <label>
                  <Globe size={12} className="detail-label-icon" />
                  Website
                </label>
                <span>{selectedSupplier.website || "—"}</span>
              </div>
              <div className="detail-item">
                <label>
                  <MapPin size={12} className="detail-label-icon" />
                  Address
                </label>
                <span>
                  {[
                    selectedSupplier.address?.street,
                    selectedSupplier.address?.city,
                    selectedSupplier.address?.district,
                  ]
                    .filter(Boolean)
                    .join(", ") || "—"}
                </span>
              </div>
            </div>
          </div>
        )}
        <div className="dash-modal-actions">
          <button
            className="btn btn-secondary"
            onClick={() => setShowViewModal(false)}
          >
            Close
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              setShowViewModal(false);
              handleEditSupplier(selectedSupplier);
            }}
          >
            <Edit size={16} /> Edit Partner
          </button>
        </div>
      </Modal>

      {/* View Purchase Order Modal */}
      <Modal
        isOpen={showPOViewModal}
        onClose={() => setShowPOViewModal(false)}
        title={`Purchase Order Details — #${selectedPO?.poNumber}`}
        size="lg"
      >
        {selectedPO && (
          <div className="po-details-view">
            <div
              className="dashboard-grid dashboard-grid-2"
              style={{ marginBottom: "2rem" }}
            >
              <div className="detail-group">
                <label className="text-muted text-xs uppercase font-bold">
                  Supplier Information
                </label>
                <p className="font-bold">{selectedPO.supplier?.name}</p>
                <p className="text-sm">{selectedPO.supplier?.email}</p>
                <p className="text-sm">{selectedPO.supplier?.phone}</p>
              </div>
              <div className="detail-group">
                <label className="text-muted text-xs uppercase font-bold">
                  Order Metadata
                </label>
                <p className="text-sm">
                  <strong>Status:</strong>{" "}
                  <span
                    className={`status-badge ${selectedPO.status === "Received" ? "success" : "warning"}`}
                  >
                    {selectedPO.status}
                  </span>
                </p>
                <p className="text-sm">
                  <strong>Expected:</strong>{" "}
                  {selectedPO.expectedDeliveryDate
                    ? new Date(
                        selectedPO.expectedDeliveryDate,
                      ).toLocaleDateString()
                    : "Not specified"}
                </p>
                <p className="text-sm">
                  <strong>Location:</strong> {selectedPO.location}
                </p>
              </div>
            </div>

            <h4 style={{ marginBottom: "1rem" }}>Order Items</h4>
            <div className="table-container" style={{ marginBottom: "2rem" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th style={{ textAlign: "right" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPO.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.product?.title || "Unknown Product"}</td>
                      <td>{item.quantity}</td>
                      <td>Rs. {item.unitPrice?.toLocaleString()}</td>
                      <td style={{ textAlign: "right" }}>
                        Rs. {item.totalPrice?.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td
                      colSpan="3"
                      style={{ textAlign: "right", fontWeight: "bold" }}
                    >
                      Grand Total
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        fontWeight: "bold",
                        color: "var(--primary-color)",
                      }}
                    >
                      Rs. {selectedPO.totalAmount?.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {selectedPO.notes && (
              <div className="notes-section">
                <label className="text-muted text-xs uppercase font-bold">
                  Internal Notes
                </label>
                <p
                  style={{
                    padding: "1rem",
                    background: "#f9fafb",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  {selectedPO.notes}
                </p>
              </div>
            )}
          </div>
        )}
        <div className="dash-modal-actions">
          <button
            className="btn btn-secondary"
            onClick={() => setShowPOViewModal(false)}
          >
            Close
          </button>
          {selectedPO?.status === "Approved" && (
            <button
              className="btn btn-success"
              onClick={() => {
                setShowPOViewModal(false);
                handleVerifyDelivery(selectedPO);
              }}
            >
              <PackageCheck size={16} /> Verify Delivery
            </button>
          )}
        </div>
      </Modal>

      {/* Modals are handled below using centralized components */}

      {/* Centralized Supplier Form Modal */}
      {(showAddModal || showEditModal) && (
        <SupplierFormModal
          isOpen={showAddModal || showEditModal}
          onClose={() => {
            setShowAddModal(false);
            setShowEditModal(false);
            setSelectedSupplier(null);
          }}
          onSave={showAddModal ? handleAddSupplier : handleSaveEdit}
          initialData={showEditModal ? selectedSupplier : null}
        />
      )}

      {/* Delivery Verification Modal — E4.7 */}
      <Modal
        isOpen={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
        title={`Verify Delivery — PO #${selectedPO?.poNumber}`}
        size="lg"
      >
        <p
          className="text-muted"
          style={{ marginBottom: "1rem", fontSize: "0.9rem" }}
        >
          Check each item received against the PO. Update received quantities if
          there are discrepancies.
        </p>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Ordered Qty</th>
                <th>Received Qty</th>
                <th>Verified</th>
              </tr>
            </thead>
            <tbody>
              {verifyItems.map((item, idx) => (
                <tr key={idx}>
                  <td>
                    <strong>{item.product?.title || "Unknown"}</strong>
                    <div className="text-muted text-xs">
                      ISBN: {item.product?.isbn || "N/A"}
                    </div>
                  </td>
                  <td>{item.quantity}</td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      className="form-control"
                      style={{ width: "80px" }}
                      value={item.receivedQty}
                      onChange={(e) => {
                        const updated = [...verifyItems];
                        updated[idx] = {
                          ...updated[idx],
                          receivedQty: parseInt(e.target.value) || 0,
                        };
                        setVerifyItems(updated);
                      }}
                    />
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={item.verified}
                      onChange={(e) => {
                        const updated = [...verifyItems];
                        updated[idx] = {
                          ...updated[idx],
                          verified: e.target.checked,
                        };
                        setVerifyItems(updated);
                      }}
                      style={{
                        width: "18px",
                        height: "18px",
                        cursor: "pointer",
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="dash-modal-actions" style={{ marginTop: "1.5rem" }}>
          <button
            className="btn btn-secondary"
            onClick={() => setShowVerifyModal(false)}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleConfirmVerification}
          >
            <CheckCircle size={16} /> Confirm Delivery
          </button>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={closeConfirm}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        variant={confirmState.variant}
      />
    </div>
  );
};

export default SupplierManagerDashboard;

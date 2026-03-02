// ============================================
// SalesOrderList
// Epic: E4 - Supplier Management
// Owner: IT24100799 (Gawrawa G H Y)
// Purpose: View and manage Sales Orders for Customers (Distributors / Bookshops)
//          SO lifecycle: Draft → Confirmed → Processing → DispatchRequested → (IM approves) → Dispatched → Delivered
// ============================================
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Eye,
  CheckCircle,
  XCircle,
  Truck,
  DollarSign,
  Search,
  PackageCheck,
  Clock,
} from "lucide-react";
import DashboardHeader from "../../../../components/dashboard/DashboardHeader";
import ConfirmModal from "../../../../components/common/ConfirmModal";
import StatusModal from "../../../../components/common/StatusModal";
import PaymentModal from "../../components/Suppliers/PaymentModal";
import supplierService from "../../services/supplierService";
import "../../../../components/dashboard/dashboard.css";

const STATUS_FLOW = {
  Draft: ["Confirmed", "Cancelled"],
  Confirmed: ["Processing", "Cancelled"],
  Processing: ["Dispatched", "Cancelled"], // "Dispatched" here creates a DispatchRequested on the server
  DispatchRequested: [], // Awaiting IM approval — supplier manager cannot transition further
  Dispatched: ["Delivered"],
  Delivered: [],
  Cancelled: [],
};

const STATUS_COLOR = {
  Draft: "warning",
  Confirmed: "info",
  Processing: "warning",
  DispatchRequested: "info", // Pending IM approval
  Dispatched: "primary",
  Delivered: "success",
  Cancelled: "error",
};

const PAYMENT_STATUS_COLOR = {
  Unpaid: "error",
  Partial: "warning", // SalesOrder model stores "Partial" (not "Partially Paid")
  Paid: "success",
};

// Human-readable label overrides for status badges
const STATUS_LABEL = {
  DispatchRequested: "Dispatch Pending ⏳",
};

const SalesOrderList = () => {
  const navigate = useNavigate();

  // ─── State ────────────────────────────────────────────────────────────────
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedSO, setSelectedSO] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [paymentModal, setPaymentModal] = useState({
    isOpen: false,
    order: null,
  });

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    soId: null,
    status: null,
    title: "",
    message: "",
  });
  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });

  // ─── Load ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [orders, statusFilter, search]);

  const fetchOrders = async () => {
    try {
      const data = await supplierService.getSalesOrders();
      setOrders(data.salesOrders || []);
    } catch (err) {
      console.error("Error fetching sales orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = orders;
    if (statusFilter !== "All") {
      filtered = filtered.filter((o) => o.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.soNumber?.toLowerCase().includes(q) ||
          o.customer?.name?.toLowerCase().includes(q),
      );
    }
    setFilteredOrders(filtered);
  };

  // ─── Status update ────────────────────────────────────────────────────────
  const handleStatusChange = (so, newStatus) => {
    const isDispatch = newStatus === "Dispatched";
    setConfirmModal({
      isOpen: true,
      soId: so._id,
      status: newStatus,
      title: isDispatch ? "Request Dispatch" : `Mark as ${newStatus}`,
      message: isDispatch
        ? `Submit a dispatch request for SO #${so.soNumber}?\n\nThe inventory manager will review and approve stock deduction. No inventory changes at this stage.`
        : `Mark Sales Order #${so.soNumber} as ${newStatus}?`,
    });
  };

  const confirmStatusChange = async () => {
    const { soId, status } = confirmModal;
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
    try {
      const result = await supplierService.updateSalesOrderStatus(soId, status);
      const wasRedirectedToRequest = result?.dispatchRequested === true;
      setStatusModal({
        isOpen: true,
        type: "success",
        title: wasRedirectedToRequest
          ? "Dispatch Request Submitted"
          : "Status Updated",
        message: wasRedirectedToRequest
          ? "Your dispatch request has been submitted. The inventory manager will approve or reject it."
          : `Order has been marked as ${status}.`,
      });
      fetchOrders();
    } catch (err) {
      setStatusModal({
        isOpen: true,
        type: "error",
        title: "Update Failed",
        message: err.response?.data?.message || "Failed to update SO status.",
      });
    }
  };

  // ─── Payment ──────────────────────────────────────────────────────────────
  const handlePaymentSaved = () => {
    setPaymentModal({ isOpen: false, order: null });
    fetchOrders();
    setStatusModal({
      isOpen: true,
      type: "success",
      title: "Payment Recorded",
      message: "Payment recorded and customer balance updated.",
    });
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  if (loading)
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );

  return (
    <div className="dashboard-container">
      <DashboardHeader
        title="Sales Orders"
        subtitle="Manage bulk orders from Distributors and Bookshops"
        actions={[
          {
            label: "New Sales Order",
            icon: <Plus size={18} />,
            onClick: () => navigate("/supplier-manager/sales-orders/create"),
            variant: "primary",
          },
        ]}
      />

      {/* ── Filters ── */}
      <div
        className="dashboard-card"
        style={{ marginBottom: "1rem", padding: "1rem 1.25rem" }}
      >
        <div
          style={{
            display: "flex",
            gap: "1rem",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          {/* Search */}
          <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
            <Search
              size={16}
              style={{
                position: "absolute",
                left: "0.75rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
              }}
            />
            <input
              type="text"
              placeholder="Search by SO# or customer name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "0.5rem 0.75rem 0.5rem 2.25rem",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-md)",
                fontSize: "0.9rem",
              }}
            />
          </div>

          {/* Status filter chips */}
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            {[
              "All",
              "Draft",
              "Confirmed",
              "Processing",
              "DispatchRequested",
              "Dispatched",
              "Delivered",
              "Cancelled",
            ].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                style={{
                  padding: "0.35rem 0.85rem",
                  borderRadius: "999px",
                  border: "1.5px solid",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "0.78rem",
                  borderColor:
                    statusFilter === s
                      ? "var(--primary-color)"
                      : "var(--border-color)",
                  background:
                    statusFilter === s
                      ? "rgba(184,134,11,0.12)"
                      : "transparent",
                  color:
                    statusFilter === s
                      ? "var(--primary-color)"
                      : "var(--text-secondary)",
                  transition: "all 0.15s",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="dashboard-card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>SO Number</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Location</th>
                <th>Total (Rs.)</th>
                <th>Paid (Rs.)</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan="9"
                    className="table-empty-state text-center"
                    style={{ padding: "4rem 2rem" }}
                  >
                    No Sales Orders found.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((so) => (
                  <tr key={so._id}>
                    <td>
                      <strong>
                        #{so.soNumber || so._id.slice(-6).toUpperCase()}
                      </strong>
                    </td>
                    <td>
                      <div>{so.customer?.name || "N/A"}</div>
                      <small style={{ color: "var(--text-muted)" }}>
                        {so.customer?.category}
                      </small>
                    </td>
                    <td>{new Date(so.createdAt).toLocaleDateString()}</td>
                    <td>
                      <small>{so.location || "—"}</small>
                    </td>
                    <td>
                      <strong>
                        Rs. {(so.totalAmount || 0).toLocaleString()}
                      </strong>
                    </td>
                    <td>Rs. {(so.amountPaid || 0).toLocaleString()}</td>
                    <td>
                      <span
                        className={`status-badge ${STATUS_COLOR[so.status] || "warning"}`}
                      >
                        {STATUS_LABEL[so.status] || so.status}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`status-badge ${PAYMENT_STATUS_COLOR[so.paymentStatus] || "warning"}`}
                      >
                        {so.paymentStatus || "Unpaid"}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        {/* Status transitions */}
                        {STATUS_FLOW[so.status]?.map((next) => (
                          <button
                            key={next}
                            className={`btn-icon ${next === "Cancelled" ? "error" : next === "Dispatched" ? "warning" : "success"}`}
                            title={
                              next === "Dispatched"
                                ? "Request Dispatch (needs inventory manager approval)"
                                : `Mark as ${next}`
                            }
                            onClick={() => handleStatusChange(so, next)}
                          >
                            {next === "Cancelled" ? (
                              <XCircle size={16} />
                            ) : next === "Dispatched" ? (
                              <Clock size={16} />
                            ) : next === "Delivered" ? (
                              <PackageCheck size={16} />
                            ) : (
                              <CheckCircle size={16} />
                            )}
                          </button>
                        ))}

                        {/* Record payment */}
                        {so.status !== "Cancelled" &&
                          so.paymentStatus !== "Paid" && (
                            <button
                              className="btn-icon"
                              title="Record Payment"
                              style={{ color: "#10b981" }}
                              onClick={() =>
                                setPaymentModal({ isOpen: true, order: so })
                              }
                            >
                              <DollarSign size={16} />
                            </button>
                          )}

                        {/* View details */}
                        <button
                          className="btn-icon"
                          title="View Details"
                          onClick={() => {
                            setSelectedSO(so);
                            setShowViewModal(true);
                          }}
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

      {/* ── SO View Modal ── */}
      {showViewModal && selectedSO && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "white",
              padding: "2rem",
              borderRadius: "12px",
              maxWidth: "820px",
              width: "90%",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "1.5rem",
              }}
            >
              <div>
                <h3>Sales Order #{selectedSO.soNumber}</h3>
                <small style={{ color: "var(--text-muted)" }}>
                  {new Date(selectedSO.createdAt).toLocaleString()}
                </small>
              </div>
              <button
                onClick={() => setShowViewModal(false)}
                className="btn-icon"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1.5rem",
                marginBottom: "1.5rem",
              }}
            >
              <div>
                <label
                  style={{
                    fontWeight: 700,
                    fontSize: "0.8rem",
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                  }}
                >
                  Customer
                </label>
                <p style={{ fontWeight: 700 }}>{selectedSO.customer?.name}</p>
                <p style={{ fontSize: "0.85rem" }}>
                  {selectedSO.customer?.email}
                </p>
                <p style={{ fontSize: "0.85rem" }}>
                  {selectedSO.customer?.phone}
                </p>
              </div>
              <div>
                <label
                  style={{
                    fontWeight: 700,
                    fontSize: "0.8rem",
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                  }}
                >
                  Order Info
                </label>
                <p style={{ fontSize: "0.9rem" }}>
                  <strong>Status:</strong> {selectedSO.status}
                </p>
                <p style={{ fontSize: "0.9rem" }}>
                  <strong>Payment:</strong> {selectedSO.paymentStatus}
                </p>
                <p style={{ fontSize: "0.9rem" }}>
                  <strong>Location:</strong> {selectedSO.location}
                </p>
                <p style={{ fontSize: "0.9rem" }}>
                  <strong>Terms:</strong> {selectedSO.paymentTerms}
                </p>
              </div>
            </div>

            {/* Items */}
            <table className="data-table" style={{ marginBottom: "1.5rem" }}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedSO.items?.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.product?.title || "Product"}</td>
                    <td>{item.quantity}</td>
                    <td>Rs. {item.unitPrice?.toLocaleString()}</td>
                    <td>Rs. {item.totalPrice?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Payment summary */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "2rem",
                marginBottom: "1rem",
                fontWeight: 600,
              }}
            >
              <span>Total: Rs. {selectedSO.totalAmount?.toLocaleString()}</span>
              <span style={{ color: "#10b981" }}>
                Paid: Rs. {selectedSO.amountPaid?.toLocaleString()}
              </span>
              <span style={{ color: "#ef4444" }}>
                Due: Rs. {selectedSO.amountDue?.toLocaleString()}
              </span>
            </div>

            {/* Payment history */}
            {selectedSO.paymentHistory?.length > 0 && (
              <div>
                <h4 style={{ marginBottom: "0.5rem" }}>Payment History</h4>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Amount (Rs.)</th>
                      <th>Method</th>
                      <th>Reference</th>
                      <th>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSO.paymentHistory.map((p, idx) => (
                      <tr key={idx}>
                        <td>
                          {p.paymentDate
                            ? new Date(p.paymentDate).toLocaleDateString()
                            : "—"}
                        </td>
                        <td>{p.amount?.toLocaleString()}</td>
                        <td>{p.paymentMethod || "—"}</td>
                        <td>{p.reference || "—"}</td>
                        <td>{p.note || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {selectedSO.notes && (
              <div
                style={{
                  marginTop: "1rem",
                  padding: "0.75rem",
                  background: "var(--bg-surface)",
                  borderRadius: "var(--radius-md)",
                  fontSize: "0.9rem",
                }}
              >
                <strong>Notes:</strong> {selectedSO.notes}
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "1.5rem",
              }}
            >
              <button
                className="btn btn-primary"
                onClick={() => setShowViewModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm status change */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((p) => ({ ...p, isOpen: false }))}
        onConfirm={confirmStatusChange}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Yes, Confirm"
        variant={confirmModal.status === "Dispatched" ? "primary" : "primary"}
      />

      {/* Payment modal */}
      <PaymentModal
        isOpen={paymentModal.isOpen}
        onClose={() => setPaymentModal({ isOpen: false, order: null })}
        onSaved={handlePaymentSaved}
        mode="so"
        order={paymentModal.order}
      />

      {/* Result notification */}
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

export default SalesOrderList;

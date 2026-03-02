// ============================================
// DebtTracker
// Epic: E4 - Supplier Management
// Owner: IT24100799 (Gawrawa G H Y)
// Purpose: Display outstanding balances for Vendors (payables) and Customers (receivables)
//   Vendors:   We owe THEM → show what we need to pay
//   Customers: They owe US  → show what we need to collect
// ============================================
import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  DollarSign,
  Calendar,
} from "lucide-react";
import DashboardHeader from "../../../../components/dashboard/DashboardHeader";
import PaymentModal from "../../components/Suppliers/PaymentModal";
import StatusModal from "../../../../components/common/StatusModal";
import supplierService from "../../services/supplierService";
import "../../../../components/dashboard/dashboard.css";

const DebtTracker = () => {
  // ─── State ────────────────────────────────────────────────────────────────
  const [vendors, setVendors] = useState([]); // Partners we owe (payables)
  const [customers, setCustomers] = useState([]); // Partners who owe us (receivables)
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("vendors"); // "vendors" | "customers"
  const [paymentModal, setPaymentModal] = useState({
    isOpen: false,
    mode: "vendor",
    partner: null,
  });
  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });

  // ─── Load ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [vendorData, customerData] = await Promise.all([
        supplierService.getPartnersWithDebt("Vendor"),
        supplierService.getPartnersWithDebt("Customer"),
      ]);
      setVendors(vendorData.partners || []);
      setCustomers(customerData.partners || []);
    } catch (err) {
      console.error("Error loading debt data:", err);
    } finally {
      setLoading(false);
    }
  };

  // ─── Summary totals ───────────────────────────────────────────────────────
  const totalPayable = vendors.reduce(
    (sum, v) => sum + (v.outstandingBalance || 0),
    0,
  );
  const totalReceivable = customers.reduce(
    (sum, c) => sum + (c.outstandingBalance || 0),
    0,
  );
  const netPosition = totalReceivable - totalPayable;

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const daysSince = (dateStr) => {
    if (!dateStr) return null;
    const diff = Date.now() - new Date(dateStr).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const getAgeColor = (days) => {
    if (days === null) return "var(--text-muted)";
    if (days <= 7) return "#10b981";
    if (days <= 30) return "#f59e0b";
    return "#ef4444";
  };

  const handlePaymentSaved = () => {
    setPaymentModal({ isOpen: false, mode: "vendor", partner: null });
    loadData();
    setStatusModal({
      isOpen: true,
      type: "success",
      title: "Payment Recorded",
      message: "Outstanding balance has been updated.",
    });
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  if (loading)
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );

  const currentList = activeTab === "vendors" ? vendors : customers;

  return (
    <div className="dashboard-container">
      <DashboardHeader
        title="Debt Tracker"
        subtitle="Monitor outstanding payables (Vendors) and receivables (Customers)"
        actions={[
          {
            label: "Refresh",
            icon: <RefreshCw size={16} />,
            onClick: loadData,
            variant: "secondary",
          },
        ]}
      />

      {/* ── Summary Cards ── */}
      <div
        className="dashboard-grid dashboard-grid-3"
        style={{ marginBottom: "1.5rem" }}
      >
        <div
          className="dashboard-card"
          style={{
            borderLeft: "4px solid #ef4444",
            display: "flex",
            flexDirection: "column",
            gap: "0.4rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              color: "#ef4444",
            }}
          >
            <TrendingDown size={20} />
            <span
              style={{
                fontWeight: 700,
                textTransform: "uppercase",
                fontSize: "0.8rem",
              }}
            >
              Total Payable
            </span>
          </div>
          <div
            style={{ fontSize: "1.6rem", fontWeight: 700, color: "#b91c1c" }}
          >
            Rs. {totalPayable.toLocaleString()}
          </div>
          <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
            {vendors.length} vendor{vendors.length !== 1 ? "s" : ""} with
            outstanding debt
          </div>
        </div>

        <div
          className="dashboard-card"
          style={{
            borderLeft: "4px solid #10b981",
            display: "flex",
            flexDirection: "column",
            gap: "0.4rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              color: "#10b981",
            }}
          >
            <TrendingUp size={20} />
            <span
              style={{
                fontWeight: 700,
                textTransform: "uppercase",
                fontSize: "0.8rem",
              }}
            >
              Total Receivable
            </span>
          </div>
          <div
            style={{ fontSize: "1.6rem", fontWeight: 700, color: "#065f46" }}
          >
            Rs. {totalReceivable.toLocaleString()}
          </div>
          <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
            {customers.length} customer{customers.length !== 1 ? "s" : ""} with
            outstanding balance
          </div>
        </div>

        <div
          className="dashboard-card"
          style={{
            borderLeft: `4px solid ${netPosition >= 0 ? "#10b981" : "#ef4444"}`,
            display: "flex",
            flexDirection: "column",
            gap: "0.4rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              color: netPosition >= 0 ? "#10b981" : "#ef4444",
            }}
          >
            <DollarSign size={20} />
            <span
              style={{
                fontWeight: 700,
                textTransform: "uppercase",
                fontSize: "0.8rem",
              }}
            >
              Net Position
            </span>
          </div>
          <div
            style={{
              fontSize: "1.6rem",
              fontWeight: 700,
              color: netPosition >= 0 ? "#065f46" : "#b91c1c",
            }}
          >
            Rs. {Math.abs(netPosition).toLocaleString()}
          </div>
          <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
            {netPosition >= 0
              ? "Net receivable position (customers owe us more)"
              : "Net payable position (we owe vendors more)"}
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="dashboard-card">
        <div
          style={{
            display: "flex",
            borderBottom: "2px solid var(--border-color)",
            marginBottom: "1.5rem",
            gap: "0.5rem",
          }}
        >
          <button
            onClick={() => setActiveTab("vendors")}
            style={{
              padding: "0.75rem 1.5rem",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.95rem",
              borderBottom:
                activeTab === "vendors"
                  ? "3px solid #ef4444"
                  : "3px solid transparent",
              color:
                activeTab === "vendors" ? "#b91c1c" : "var(--text-secondary)",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              transition: "all 0.15s",
            }}
          >
            <TrendingDown size={18} />
            Vendors We Owe ({vendors.length})
            {vendors.length > 0 && (
              <span
                style={{
                  padding: "0.15rem 0.5rem",
                  background: "#ef4444",
                  color: "#fff",
                  borderRadius: "999px",
                  fontSize: "0.75rem",
                }}
              >
                {
                  vendors.filter(
                    (v) =>
                      daysSince(v.lastPaymentDate) > 30 || !v.lastPaymentDate,
                  ).length
                }{" "}
                overdue
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("customers")}
            style={{
              padding: "0.75rem 1.5rem",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.95rem",
              borderBottom:
                activeTab === "customers"
                  ? "3px solid #10b981"
                  : "3px solid transparent",
              color:
                activeTab === "customers" ? "#065f46" : "var(--text-secondary)",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              transition: "all 0.15s",
            }}
          >
            <TrendingUp size={18} />
            Customers Who Owe Us ({customers.length})
          </button>
        </div>

        {currentList.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "4rem 2rem",
              color: "var(--text-muted)",
            }}
          >
            <AlertTriangle
              size={48}
              style={{ marginBottom: "1rem", opacity: 0.4 }}
            />
            <p>
              No outstanding{" "}
              {activeTab === "vendors" ? "payables" : "receivables"} found.
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Partner</th>
                  <th>Category</th>
                  <th>Outstanding (Rs.)</th>
                  <th>Last Payment</th>
                  <th>Days Since Payment</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {currentList.map((partner) => {
                  const days = daysSince(partner.lastPaymentDate);
                  const ageColor = getAgeColor(days);
                  return (
                    <tr key={partner._id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{partner.name}</div>
                        <small style={{ color: "var(--text-muted)" }}>
                          {partner.email}
                        </small>
                      </td>
                      <td>
                        <span
                          className={`badge ${partner.category?.replace(/\s+/g, "-").toLowerCase()}`}
                        >
                          {partner.category}
                        </span>
                      </td>
                      <td>
                        <strong
                          style={{
                            color:
                              activeTab === "vendors" ? "#b91c1c" : "#065f46",
                            fontSize: "1rem",
                          }}
                        >
                          Rs.{" "}
                          {(partner.outstandingBalance || 0).toLocaleString()}
                        </strong>
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.4rem",
                            color: "var(--text-secondary)",
                            fontSize: "0.88rem",
                          }}
                        >
                          <Calendar size={14} />
                          {partner.lastPaymentDate
                            ? new Date(
                                partner.lastPaymentDate,
                              ).toLocaleDateString()
                            : "Never paid"}
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            color: ageColor,
                            fontWeight: 600,
                            fontSize: "0.9rem",
                          }}
                        >
                          {days === null
                            ? "—"
                            : `${days} day${days !== 1 ? "s" : ""} ago`}
                        </span>
                        {days !== null && days > 30 && (
                          <span
                            style={{
                              marginLeft: "0.4rem",
                              color: "#ef4444",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                            }}
                          >
                            Overdue
                          </span>
                        )}
                      </td>
                      <td>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() =>
                            setPaymentModal({
                              isOpen: true,
                              mode:
                                activeTab === "vendors" ? "vendor" : "customer",
                              partner,
                            })
                          }
                        >
                          <DollarSign size={14} />{" "}
                          {activeTab === "vendors"
                            ? "Record Payment"
                            : "Record Collection"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={paymentModal.isOpen}
        onClose={() =>
          setPaymentModal({ isOpen: false, mode: "vendor", partner: null })
        }
        onSaved={handlePaymentSaved}
        mode={paymentModal.mode}
        partner={paymentModal.partner}
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

export default DebtTracker;

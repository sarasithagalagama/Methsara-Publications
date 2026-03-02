// ============================================
// PaymentModal
// Epic: E4 - Supplier Management
// Owner: IT24100799 (Gawrawa G H Y)
// Purpose: Reusable modal for recording payments
//   mode="vendor" → record payment WE make TO a Vendor
//   mode="customer" → record payment WE receive FROM a Customer (direct, not tied to SO)
//   mode="so" → record payment received FOR a specific Sales Order
// ============================================
import React, { useState, useEffect } from "react";
import Modal from "../../../../components/common/Modal";
import { DollarSign, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import supplierService from "../../services/supplierService";

const PAYMENT_METHODS = [
  "Cash",
  "Bank Transfer",
  "Cheque",
  "Online Payment",
  "Other",
];

const initialForm = {
  amount: "",
  method: "Bank Transfer",
  reference: "",
  note: "",
  date: new Date().toISOString().split("T")[0],
};

const PaymentModal = ({ isOpen, onClose, onSaved, mode, partner, order }) => {
  // mode: "vendor" | "customer" | "so"
  // partner: supplier/customer object (for vendor/customer mode)
  // order: salesOrder object (for so mode)

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm({
        ...initialForm,
        date: new Date().toISOString().split("T")[0],
      });
      setErrors({});
    }
  }, [isOpen]);

  // ─── Validation ───────────────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    const amount = parseFloat(form.amount);

    if (!form.amount || isNaN(amount) || amount <= 0)
      errs.amount = "Amount must be a positive number";

    // For SO mode, don't allow payment > amountDue
    if (mode === "so" && order) {
      const due =
        order.amountDue ?? order.totalAmount - (order.amountPaid || 0);
      if (amount > due) {
        errs.amount = `Payment (Rs. ${amount.toLocaleString()}) cannot exceed amount due (Rs. ${due.toLocaleString()})`;
      }
    }

    // For vendor/customer mode, don't allow payment > outstandingBalance
    if ((mode === "vendor" || mode === "customer") && partner) {
      if (amount > (partner.outstandingBalance || 0)) {
        errs.amount = `Payment cannot exceed outstanding balance (Rs. ${(partner.outstandingBalance || 0).toLocaleString()})`;
      }
    }

    if (!form.method) errs.method = "Payment method is required";

    if (!form.date) errs.date = "Date is required";
    else {
      const today = new Date().toISOString().split("T")[0];
      if (form.date > today) errs.date = "Payment date cannot be in the future";
    }

    if (form.reference && form.reference.length > 100)
      errs.reference = "Reference too long (max 100 chars)";

    if (form.note && form.note.length > 300)
      errs.note = "Note too long (max 300 chars)";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ─── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        amount: parseFloat(form.amount),
        method: form.method,
        reference: form.reference,
        note: form.note,
        date: form.date,
      };

      if (mode === "so" && order) {
        await supplierService.recordSalesOrderPayment(order._id, payload);
      } else if (mode === "vendor" && partner) {
        await supplierService.recordPaymentToVendor(partner._id, payload);
      } else if (mode === "customer" && partner) {
        await supplierService.recordPaymentFromCustomer(partner._id, payload);
      }

      onSaved && onSaved();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Failed to record payment. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const getTitle = () => {
    if (mode === "so") return `Record Payment — SO #${order?.soNumber || ""}`;
    if (mode === "vendor") return `Pay Vendor: ${partner?.name || ""}`;
    return `Record Collection from: ${partner?.name || ""}`;
  };

  const getContextColor = () => (mode === "vendor" ? "#ef4444" : "#10b981");

  const getAmountDue = () => {
    if (mode === "so" && order)
      return order.amountDue ?? order.totalAmount - (order.amountPaid || 0);
    if (partner) return partner.outstandingBalance || 0;
    return null;
  };

  const amountDue = getAmountDue();

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={getTitle()} size="sm">
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
      >
        {/* Context banner */}
        {amountDue !== null && (
          <div
            style={{
              padding: "0.75rem 1rem",
              background: `${getContextColor()}14`,
              border: `1px solid ${getContextColor()}66`,
              borderRadius: "var(--radius-md)",
              fontSize: "0.88rem",
              color: mode === "vendor" ? "#b91c1c" : "#065f46",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <DollarSign size={16} />
            {mode === "so"
              ? `Amount Due: Rs. ${amountDue.toLocaleString()} (Paid so far: Rs. ${(order?.amountPaid || 0).toLocaleString()})`
              : mode === "vendor"
                ? `Outstanding Payable (we owe them): Rs. ${amountDue.toLocaleString()}`
                : `Outstanding Receivable (they owe us): Rs. ${amountDue.toLocaleString()}`}
          </div>
        )}

        {/* Amount */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "var(--text-secondary)",
              marginBottom: "0.4rem",
              textTransform: "uppercase",
              letterSpacing: "0.025em",
            }}
          >
            Amount (Rs.) *
          </label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            value={form.amount}
            onChange={(e) => {
              setForm({ ...form, amount: e.target.value });
              if (errors.amount) setErrors({ ...errors, amount: "" });
            }}
            style={{
              width: "100%",
              padding: "0.7rem 1rem",
              border: `1px solid ${errors.amount ? "var(--danger-color)" : "var(--border-color)"}`,
              borderRadius: "var(--radius-md)",
              fontSize: "1rem",
            }}
          />
          {errors.amount && (
            <span
              style={{
                color: "var(--danger-color)",
                fontSize: "0.75rem",
                marginTop: "0.25rem",
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
              }}
            >
              <AlertCircle size={13} /> {errors.amount}
            </span>
          )}
        </div>

        {/* Method + Date row */}
        <div style={{ display: "flex", gap: "1rem" }}>
          <div style={{ flex: 1 }}>
            <label
              style={{
                display: "block",
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "var(--text-secondary)",
                marginBottom: "0.4rem",
                textTransform: "uppercase",
                letterSpacing: "0.025em",
              }}
            >
              Payment Method *
            </label>
            <select
              value={form.method}
              onChange={(e) => setForm({ ...form, method: e.target.value })}
              style={{
                width: "100%",
                padding: "0.7rem 1rem",
                border: `1px solid ${errors.method ? "var(--danger-color)" : "var(--border-color)"}`,
                borderRadius: "var(--radius-md)",
                fontSize: "0.95rem",
              }}
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            {errors.method && (
              <span
                style={{ color: "var(--danger-color)", fontSize: "0.75rem" }}
              >
                {errors.method}
              </span>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <label
              style={{
                display: "block",
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "var(--text-secondary)",
                marginBottom: "0.4rem",
                textTransform: "uppercase",
                letterSpacing: "0.025em",
              }}
            >
              Payment Date *
            </label>
            <input
              type="date"
              max={new Date().toISOString().split("T")[0]}
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              style={{
                width: "100%",
                padding: "0.7rem 1rem",
                border: `1px solid ${errors.date ? "var(--danger-color)" : "var(--border-color)"}`,
                borderRadius: "var(--radius-md)",
                fontSize: "0.95rem",
              }}
            />
            {errors.date && (
              <span
                style={{ color: "var(--danger-color)", fontSize: "0.75rem" }}
              >
                {errors.date}
              </span>
            )}
          </div>
        </div>

        {/* Reference */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "var(--text-secondary)",
              marginBottom: "0.4rem",
              textTransform: "uppercase",
              letterSpacing: "0.025em",
            }}
          >
            Reference / Cheque No. (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. CHQ-00123 or TXN-456"
            value={form.reference}
            onChange={(e) => setForm({ ...form, reference: e.target.value })}
            maxLength={100}
            style={{
              width: "100%",
              padding: "0.7rem 1rem",
              border: `1px solid ${errors.reference ? "var(--danger-color)" : "var(--border-color)"}`,
              borderRadius: "var(--radius-md)",
              fontSize: "0.95rem",
            }}
          />
          {errors.reference && (
            <span style={{ color: "var(--danger-color)", fontSize: "0.75rem" }}>
              {errors.reference}
            </span>
          )}
        </div>

        {/* Note */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "var(--text-secondary)",
              marginBottom: "0.4rem",
              textTransform: "uppercase",
              letterSpacing: "0.025em",
            }}
          >
            Note (Optional)
          </label>
          <textarea
            placeholder="Additional remarks..."
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            rows={2}
            maxLength={300}
            style={{
              width: "100%",
              padding: "0.7rem 1rem",
              border: `1px solid ${errors.note ? "var(--danger-color)" : "var(--border-color)"}`,
              borderRadius: "var(--radius-md)",
              fontSize: "0.95rem",
              resize: "vertical",
            }}
          />
          {errors.note && (
            <span style={{ color: "var(--danger-color)", fontSize: "0.75rem" }}>
              {errors.note}
            </span>
          )}
          <small style={{ color: "var(--text-muted)" }}>
            {form.note.length}/300
          </small>
        </div>

        {/* Actions */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "1rem",
            paddingTop: "0.75rem",
            borderTop: "1px solid var(--border-color)",
          }}
        >
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Recording..." : "Record Payment"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default PaymentModal;

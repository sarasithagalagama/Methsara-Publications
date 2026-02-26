// ============================================
// StockAdjustmentModal
// Epic: E5 - Inventory Management
// Owner: IT24100264 (Bandara N W C D)
// Purpose: StockAdjustmentModal UI component
// ============================================
import React, { useState, useEffect } from "react";
import axios from "axios";
import Modal from "../../../../components/common/Modal";
import { Input, Select, Button, TextArea } from "../../../../components/common/Forms";

const StockAdjustmentModal = ({
  isOpen,
  onClose,
  onConfirm,
  item,
  location,
}) => {
  // ─────────────────────────────────
  // State Variables
  // ─────────────────────────────────
  const [action, setAction] = useState("add"); // "add" or "remove"
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [allInventory, setAllInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reorderPoint, setReorderPoint] = useState("");

  // ─────────────────────────────────
  // Event Handlers
  // ─────────────────────────────────
  const fetchAllInventory = async () => {
    if (!location) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`/api/inventory/location/${location}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllInventory(res.data.inventory || []);
    } catch (error) {
      console.error("Error fetching inventory for adjustment:", error);
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────
  // Side Effects
  // ─────────────────────────────────
  useEffect(() => {
    if (isOpen && !item) {
      fetchAllInventory();
    }
    if (item) {
      setSelectedProductId(item._id);
      setReorderPoint(item.reorderPoint || item.lowStockThreshold || 0);
    }
  }, [isOpen, item, location]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || !reason || !selectedProductId) return;

    const parsedAmount = parseInt(amount);
    if (parsedAmount <= 0) {
      alert("Amount must be a positive number");
      return;
    }

    const currentItem =
      item || allInventory.find((inv) => inv._id === selectedProductId);

    if (
      action === "remove" &&
      currentItem &&
      parsedAmount > (currentItem.availableQuantity ?? currentItem.quantity)
    ) {
      alert(
        `Cannot remove ${parsedAmount} items. Only ${currentItem.availableQuantity ?? currentItem.quantity} items are available in stock.`,
      );
      return;
    }

    // Convert to signed integer based on action
    const adjustmentAmount =
      action === "add" ? Math.abs(parsedAmount) : -Math.abs(parsedAmount);

    onConfirm(
      selectedProductId,
      adjustmentAmount,
      reason,
      parseInt(reorderPoint),
    );
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setAmount("");
    setReason("");
    setAction("add");
    setReorderPoint("");
    if (!item) setSelectedProductId("");
  };

  const currentItem =
    item || allInventory.find((inv) => inv._id === selectedProductId);

  // ─────────────────────────────────
  // Render
  // ─────────────────────────────────
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        resetForm();
        onClose();
      }}
      title={`Adjust Stock Level - ${location}`}
      size="md"
    >
      <form onSubmit={handleSubmit}>
        {!item && (
          <div style={{ marginBottom: "1.5rem" }}>
            <Select
              label="Product to Adjust"
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              required
              options={[
                ...allInventory.map((inv) => ({
                  value: inv._id,
                  label: `${inv.product?.title} (Available: ${inv.availableQuantity ?? inv.quantity})`,
                })),
              ]}
              helperText={
                loading
                  ? `Loading products for ${location}...`
                  : `Select product from ${location} inventory`
              }
            />
          </div>
        )}

        {currentItem && (
          <div
            style={{
              background: "var(--bg-secondary)",
              padding: "1rem",
              borderRadius: "var(--radius-md)",
              marginBottom: "1.5rem",
              border: "1px solid var(--border-color)",
            }}
          >
            <p
              style={{
                margin: "0 0 0.5rem 0",
                color: "var(--text-primary)",
                fontWeight: 600,
              }}
            >
              {currentItem.product?.title}
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.85rem",
                color: "var(--text-secondary)",
              }}
            >
              <span>ISBN: {currentItem.product?.isbn}</span>
              <span>
                Available Stock:{" "}
                <strong>
                  {currentItem.availableQuantity ?? currentItem.quantity} Units
                </strong>
              </span>
            </div>
          </div>
        )}

        <div
          className="form-row"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem",
          }}
        >
          <Select
            label="Action"
            value={action}
            onChange={(e) => setAction(e.target.value)}
            options={[
              { value: "add", label: "Add Stock (+)" },
              { value: "remove", label: "Remove Stock (-)" },
            ]}
          />
          <Input
            label="Quantity"
            type="number"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            required
            autoFocus
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <Input
            label="Reorder Level (Threshold)"
            type="number"
            min="0"
            value={reorderPoint}
            onChange={(e) => setReorderPoint(e.target.value)}
            placeholder="Critical stock level"
          />
        </div>

        <TextArea
          label="Reason for Adjustment"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g., Stock count correction, Damaged items, etc."
          required
          rows={3}
        />

        <div className="dash-modal-actions" style={{ marginTop: "2rem" }}>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Update Stock Level
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default StockAdjustmentModal;

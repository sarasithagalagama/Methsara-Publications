// ============================================
// CreatePurchaseOrder
// Epic: E4 - Supplier Management
// Owner: IT24100799 (Gawrawa G H Y)
// Purpose: CreatePurchaseOrder page component
// ============================================
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  AlertCircle,
  ShoppingBag,
} from "lucide-react";
import DashboardHeader from "../../../../components/dashboard/DashboardHeader";
import StatusModal from "../../../../components/common/StatusModal";
import "../../../../components/dashboard/dashboard.css";

const CreatePurchaseOrder = () => {
  const navigate = useNavigate();
  // State Variables
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    supplier: "",
    location: "Main Warehouse",
    expectedDeliveryDate: "",
    notes: "",
    items: [{ itemName: "", quantity: 1, unitPrice: 0 }],
  });
  const [formErrors, setFormErrors] = useState({});
  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Side Effects
  useEffect(() => {
    fetchData();
  }, []);

  // Event Handlers
  // [E4.2] Fetch vendors for the PO form dropdown
  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const suppliersRes = await axios.get(
        "/api/suppliers?supplierType=Vendor",
        config,
      );
      setSuppliers(suppliersRes.data.suppliers || []);
    } catch (error) {
      console.error("Error fetching vendors:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { itemName: "", quantity: 1, unitPrice: 0 }],
    });
  };

  const removeItem = (index) => {
    if (formData.items.length === 1) return;
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotal = () => {
    return formData.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );
  };

  // [E4.3] Validates supplier selection, delivery date, and all line items before API call
  const validateForm = () => {
    const errors = {};
    if (!formData.supplier) errors.supplier = "Please select a vendor";

    if (formData.expectedDeliveryDate) {
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];
      if (formData.expectedDeliveryDate < todayStr) {
        errors.date = "Delivery date cannot be in the past";
      }
    }

    if (!formData.items || formData.items.length === 0) {
      errors.items = "At least one item is required";
    } else {
      let hasBlank = false;
      let hasBadQty = false;
      let hasBadPrice = false;

      formData.items.forEach((item) => {
        if (!item.itemName || !item.itemName.trim()) hasBlank = true;
        if (item.quantity < 1) hasBadQty = true;
        if (item.unitPrice < 0) hasBadPrice = true;
      });

      if (hasBlank) errors.items = "All items must have a description";
      else if (hasBadQty) errors.items = "Quantity must be at least 1";
      else if (hasBadPrice) errors.items = "Unit price cannot be negative";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      const payload = { ...formData };

      await axios.post("/api/purchase-orders", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStatusModal({
        isOpen: true,
        type: "success",
        title: "Purchase Order Created",
        message: "The purchase order has been submitted successfully.",
      });
    } catch (error) {
      console.error("Error creating PO:", error);
      setStatusModal({
        isOpen: true,
        type: "error",
        title: "Failed to Create PO",
        message:
          error.response?.data?.details ||
          error.response?.data?.message ||
          error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading)
    // Render
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );

  return (
    <div className="dashboard-container">
      <DashboardHeader
        title="Create Purchase Order"
        subtitle="Order books and materials from a registered Vendor"
      />

      <div className="dashboard-card">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            marginBottom: "1.5rem",
            padding: "0.75rem 1rem",
            background: "rgba(59,130,246,0.08)",
            borderRadius: "var(--radius-md)",
            border: "1px solid #93c5fd",
            color: "#1e40af",
            fontSize: "0.88rem",
          }}
        >
          <ShoppingBag size={18} />
          Purchase Orders are for <strong>Vendors</strong> (printers, paper
          suppliers, etc.) from whom we buy raw materials and supplies. Describe
          items freely — they are not linked to our book catalog.
        </div>

        <form onSubmit={handleSubmit}>
          {/* Row 1: Vendor */}
          <div className="form-row">
            <div className="form-group">
              <label>Select Vendor *</label>
              <select
                value={formData.supplier}
                onChange={(e) =>
                  setFormData({ ...formData, supplier: e.target.value })
                }
                className={`form-control ${
                  formErrors.supplier ? "is-invalid" : ""
                }`}
              >
                <option value="">Choose Vendor...</option>
                {suppliers.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} — {s.category}
                  </option>
                ))}
              </select>
              {formErrors.supplier && (
                <div className="error-message">{formErrors.supplier}</div>
              )}
              {suppliers.length === 0 && (
                <div className="error-message" style={{ marginTop: "0.25rem" }}>
                  No vendors found. Add a partner with type "Vendor" first.
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Expected Delivery Date */}
          <div className="form-row">
            <div className="form-group">
              <label>Expected Delivery Date (Optional)</label>
              <input
                type="date"
                min={new Date().toISOString().split("T")[0]}
                value={formData.expectedDeliveryDate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    expectedDeliveryDate: e.target.value,
                  })
                }
                className={`form-control ${
                  formErrors.date ? "is-invalid" : ""
                }`}
              />
              {formErrors.date && (
                <div className="error-message">{formErrors.date}</div>
              )}
            </div>
            <div className="form-group" />
          </div>

          <div className="form-section">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3>Order Items</h3>
              {formErrors.items && (
                <div
                  className="error-message"
                  style={{ display: "flex", alignItems: "center", gap: "5px" }}
                >
                  <AlertCircle size={16} /> {formErrors.items}
                </div>
              )}
            </div>
            <table className="items-table">
              <thead>
                <tr>
                  <th>Item Description</th>
                  <th>Quantity</th>
                  <th>Unit Price (Rs.)</th>
                  <th>Total (Rs.)</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {formData.items.map((item, index) => (
                  <tr key={index}>
                    <td>
                      <input
                        type="text"
                        required
                        value={item.itemName}
                        onChange={(e) =>
                          handleItemChange(index, "itemName", e.target.value)
                        }
                        className="form-control"
                        placeholder="e.g. A4 Paper 80gsm, HP Ink, Print Job..."
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="1"
                        required
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            "quantity",
                            parseInt(e.target.value) || 0,
                          )
                        }
                        className="form-control qty-input"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        required
                        value={item.unitPrice}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            "unitPrice",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        className="form-control price-input"
                      />
                    </td>
                    <td>{(item.quantity * item.unitPrice).toLocaleString()}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="btn-icon error"
                        disabled={formData.items.length === 1}
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button type="button" onClick={addItem} className="btn-text">
              <Plus size={16} /> Add Another Item
            </button>
          </div>

          <div className="form-summary-card">
            <div className="form-summary-notes">
              <label className="stat-label">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                className="form-control"
                rows="3"
                placeholder="Additional instructions..."
              />
            </div>
            <div className="total-display">
              <span className="total-display-label">Total Estimated Cost:</span>
              <span className="total-display-amount">
                Rs. {calculateTotal().toLocaleString()}
              </span>
            </div>
          </div>

          <div className="form-actions-bar">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              <Save size={18} />{" "}
              {isSubmitting ? "Submitting..." : "Create Purchase Order"}
            </button>
          </div>
        </form>
      </div>

      <StatusModal
        isOpen={statusModal.isOpen}
        onClose={() => {
          if (statusModal.type === "success") {
            navigate("/supplier-manager/purchase-orders");
          } else {
            setStatusModal({ ...statusModal, isOpen: false });
          }
        }}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
      />
    </div>
  );
};

export default CreatePurchaseOrder;

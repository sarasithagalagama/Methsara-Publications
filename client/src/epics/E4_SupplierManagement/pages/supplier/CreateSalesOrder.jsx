// ============================================
// CreateSalesOrder
// Epic: E4 - Supplier Management
// Owner: IT24100799 (Gawrawa G H Y)
// Purpose: Create bulk Sales Orders for Customers (Distributors / Bookshops)
//          Customers BUY from us → they owe us money (receivables)
// ============================================
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import supplierService from "../../services/supplierService";
import axios from "axios";
import "../../../../components/dashboard/dashboard.css";

const CreateSalesOrder = () => {
  const navigate = useNavigate();

  // ─── State ────────────────────────────────────────────────────────────────
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [stockMap, setStockMap] = useState({}); // productId → availableQuantity
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    customer: "",
    expectedDispatchDate: "",
    expectedDeliveryDate: "",
    deliveryAddress: { street: "", city: "", postalCode: "" },
    notes: "",
    items: [{ product: "", quantity: 1, unitPrice: 0 }],
  });

  const [formErrors, setFormErrors] = useState({});
  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });

  // ─── Load data ───────────────────────────────────────────────────────────
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Only fetch Customers (Distributors / Bookshops) — supplierType=Customer
      const [customersRes, productsRes, locationsRes] = await Promise.all([
        axios.get("/api/suppliers?supplierType=Customer", config),
        axios.get("/api/products?limit=200", config),
        axios.get("/api/locations", config),
      ]);

      setCustomers(customersRes.data.suppliers || []);
      setProducts(productsRes.data.products || []);

      // Find the main warehouse location name from DB
      const locations = locationsRes.data.locations || [];
      const mainWarehouse =
        locations.find((l) => l.isMainWarehouse) || locations[0];
      if (mainWarehouse) {
        const inventoryRes = await axios.get(
          `/api/inventory/location/${encodeURIComponent(mainWarehouse.name)}`,
          config,
        );
        // Build productId → available stock map
        // Use quantity - reservedQuantity for accuracy (availableQuantity can be stale)
        const map = {};
        (inventoryRes.data.inventory || []).forEach((inv) => {
          if (inv.product?._id) {
            const qty = inv.quantity ?? 0;
            const reserved = inv.reservedQuantity ?? 0;
            map[inv.product._id] = Math.max(0, qty - reserved);
          }
        });
        setStockMap(map);
      }
    } catch (err) {
      console.error("Error loading form data:", err);
    } finally {
      setLoading(false);
    }
  };

  // ─── Item helpers ─────────────────────────────────────────────────────────
  const handleItemChange = (index, field, value) => {
    const updated = [...formData.items];
    updated[index][field] = value;
    // Auto-fill unit price from product catalog
    if (field === "product") {
      const found = products.find((p) => p._id === value);
      if (found) updated[index].unitPrice = found.price || 0;
    }
    setFormData({ ...formData, items: updated });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product: "", quantity: 1, unitPrice: 0 }],
    });
  };

  const removeItem = (index) => {
    if (formData.items.length === 1) return;
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const calculateTotal = () =>
    formData.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

  // ─── Validation ───────────────────────────────────────────────────────────
  const validateForm = () => {
    const errors = {};

    if (!formData.customer) errors.customer = "Please select a customer";

    const addr = formData.deliveryAddress;
    if (!addr.street?.trim())
      errors.street = "Street / address line is required";
    if (!addr.city?.trim()) errors.city = "City is required";

    const today = new Date().toISOString().split("T")[0];

    if (formData.expectedDispatchDate) {
      if (formData.expectedDispatchDate < today)
        errors.dispatchDate = "Dispatch date cannot be in the past";
    }

    if (formData.expectedDeliveryDate) {
      if (formData.expectedDeliveryDate < today)
        errors.deliveryDate = "Delivery date cannot be in the past";
      else if (
        formData.expectedDispatchDate &&
        formData.expectedDeliveryDate < formData.expectedDispatchDate
      )
        errors.deliveryDate =
          "Delivery date must be on or after the dispatch date";
    }

    if (!formData.items.length) {
      errors.items = "At least one item is required";
    } else {
      const productIds = new Set();
      let hasBlankProduct = false;
      let hasBadQty = false;
      let hasBadPrice = false;
      let hasDuplicates = false;

      formData.items.forEach((item) => {
        if (!item.product) hasBlankProduct = true;
        if (item.quantity < 1) hasBadQty = true;
        if (item.unitPrice < 0) hasBadPrice = true;
        if (item.product) {
          if (productIds.has(item.product)) hasDuplicates = true;
          productIds.add(item.product);
          // Stock check
          const available = stockMap[item.product] ?? Infinity;
          if (item.quantity > available) {
            errors[`stock_${item.product}`] =
              `Only ${available} units available in Main Warehouse`;
          }
        }
      });

      if (hasBlankProduct)
        errors.items = "All items must have a product selected";
      else if (hasBadQty) errors.items = "Quantity must be at least 1";
      else if (hasBadPrice) errors.items = "Unit price cannot be negative";
      else if (hasDuplicates)
        errors.items = "Duplicate products found — combine them into one line";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ─── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);

    try {
      await supplierService.createSalesOrder({
        customer: formData.customer,
        items: formData.items,
        expectedDispatchDate: formData.expectedDispatchDate || undefined,
        expectedDeliveryDate: formData.expectedDeliveryDate || undefined,
        deliveryAddress: formData.deliveryAddress,
        notes: formData.notes,
      });

      setStatusModal({
        isOpen: true,
        type: "success",
        title: "Sales Order Created",
        message:
          "The Sales Order has been submitted successfully. Customer's outstanding balance has been updated.",
      });
    } catch (err) {
      setStatusModal({
        isOpen: true,
        type: "error",
        title: "Failed to Create SO",
        message:
          err.response?.data?.details ||
          err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to create Sales Order. Check inventory availability.",
      });
    } finally {
      setIsSubmitting(false);
    }
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
        title="Create Sales Order"
        subtitle="Sell books in bulk to a registered Customer (Distributor / Bookshop)"
      />

      <div className="dashboard-card">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            marginBottom: "1.5rem",
            padding: "0.75rem 1rem",
            background: "rgba(16,185,129,0.08)",
            borderRadius: "var(--radius-md)",
            border: "1px solid #6ee7b7",
            color: "#065f46",
            fontSize: "0.88rem",
          }}
        >
          <ShoppingBag size={18} />
          Sales Orders are for{" "}
          <strong>Customers (Distributors / Bookshops)</strong> who buy books
          from us in bulk. Inventory will be reserved and reduced when the order
          is dispatched.
        </div>

        <form onSubmit={handleSubmit}>
          {/* ── Row 1: Customer ── */}
          <div className="form-row">
            <div className="form-group">
              <label>Customer (Distributor / Bookshop) *</label>
              <select
                value={formData.customer}
                onChange={(e) =>
                  setFormData({ ...formData, customer: e.target.value })
                }
                className={`form-control ${formErrors.customer ? "is-invalid" : ""}`}
              >
                <option value="">Choose Customer...</option>
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} — {c.category}
                  </option>
                ))}
              </select>
              {formErrors.customer && (
                <div className="error-message">{formErrors.customer}</div>
              )}
              {customers.length === 0 && (
                <div className="error-message" style={{ marginTop: "0.25rem" }}>
                  No customers found. Add a partner with type “Customer” first.
                </div>
              )}
            </div>
            <div className="form-group" />
          </div>

          {/* ── Row 2: Dispatch Date + Delivery Date ── */}
          <div className="form-row">
            <div className="form-group">
              <label>Expected Dispatch Date (Optional)</label>
              <input
                type="date"
                min={new Date().toISOString().split("T")[0]}
                value={formData.expectedDispatchDate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    expectedDispatchDate: e.target.value,
                  })
                }
                className={`form-control ${formErrors.dispatchDate ? "is-invalid" : ""}`}
              />
              {formErrors.dispatchDate && (
                <div className="error-message">{formErrors.dispatchDate}</div>
              )}
            </div>
            <div className="form-group">
              <label>Expected Delivery Date (Optional)</label>
              <input
                type="date"
                min={
                  formData.expectedDispatchDate ||
                  new Date().toISOString().split("T")[0]
                }
                value={formData.expectedDeliveryDate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    expectedDeliveryDate: e.target.value,
                  })
                }
                className={`form-control ${formErrors.deliveryDate ? "is-invalid" : ""}`}
              />
              {formErrors.deliveryDate && (
                <div className="error-message">{formErrors.deliveryDate}</div>
              )}
            </div>
          </div>

          {/* ── Delivery Address (Required) ── */}
          <div className="form-section" style={{ marginBottom: "1rem" }}>
            <h3 style={{ marginBottom: "0.75rem", fontSize: "0.95rem" }}>
              Delivery Address <span style={{ color: "#ef4444" }}>*</span>
            </h3>
            <div className="form-row">
              <div className="form-group" style={{ flex: 2 }}>
                <label>Street / Address Line *</label>
                <input
                  type="text"
                  value={formData.deliveryAddress.street}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      deliveryAddress: {
                        ...formData.deliveryAddress,
                        street: e.target.value,
                      },
                    })
                  }
                  className={`form-control ${formErrors.street ? "is-invalid" : ""}`}
                  placeholder="e.g. 45, Galle Road"
                />
                {formErrors.street && (
                  <div className="error-message">{formErrors.street}</div>
                )}
              </div>
              <div className="form-group">
                <label>City *</label>
                <input
                  type="text"
                  value={formData.deliveryAddress.city}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      deliveryAddress: {
                        ...formData.deliveryAddress,
                        city: e.target.value,
                      },
                    })
                  }
                  className={`form-control ${formErrors.city ? "is-invalid" : ""}`}
                  placeholder="e.g. Colombo"
                />
                {formErrors.city && (
                  <div className="error-message">{formErrors.city}</div>
                )}
              </div>
              <div className="form-group">
                <label>Postal Code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={formData.deliveryAddress.postalCode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      deliveryAddress: {
                        ...formData.deliveryAddress,
                        postalCode: e.target.value.replace(/\D/g, ""),
                      },
                    })
                  }
                  className="form-control"
                  placeholder="e.g. 00300"
                />
              </div>
            </div>
          </div>

          {/* ── Items Table ── */}
          <div className="form-section">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.75rem",
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
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Unit Price (Rs.)</th>
                  <th>Total (Rs.)</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {formData.items.map((item, index) => {
                  const available =
                    item.product != null && item.product !== ""
                      ? (stockMap[item.product] ?? null)
                      : null;
                  const stockError = item.product
                    ? formErrors[`stock_${item.product}`]
                    : null;
                  return (
                    <tr key={index}>
                      <td>
                        <select
                          value={item.product}
                          onChange={(e) =>
                            handleItemChange(index, "product", e.target.value)
                          }
                          className={`form-control ${stockError ? "is-invalid" : ""}`}
                          required
                        >
                          <option value="">Select Product...</option>
                          {products.map((p) => (
                            <option key={p._id} value={p._id}>
                              {p.title}
                              {p.author ? ` — ${p.author}` : ""}
                            </option>
                          ))}
                        </select>
                        {available !== null && (
                          <div
                            style={{
                              fontSize: "0.75rem",
                              marginTop: "3px",
                              color:
                                available === 0
                                  ? "#ef4444"
                                  : available < 10
                                    ? "#f59e0b"
                                    : "#16a34a",
                              fontWeight: 500,
                            }}
                          >
                            Stock: {available} available
                          </div>
                        )}
                        {stockError && (
                          <div
                            className="error-message"
                            style={{ fontSize: "0.75rem" }}
                          >
                            {stockError}
                          </div>
                        )}
                      </td>
                      <td>
                        <input
                          type="number"
                          min="1"
                          max={available !== null ? available : undefined}
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "quantity",
                              parseInt(e.target.value) || 1,
                            )
                          }
                          className={`form-control qty-input ${stockError ? "is-invalid" : ""}`}
                          required
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "unitPrice",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="form-control price-input"
                          required
                        />
                      </td>
                      <td>
                        Rs. {(item.quantity * item.unitPrice).toLocaleString()}
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="btn-icon error"
                          disabled={formData.items.length === 1}
                          title="Remove item"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <button type="button" onClick={addItem} className="btn-text">
              <Plus size={16} /> Add Another Item
            </button>
          </div>

          {/* ── Notes + Total ── */}
          <div className="form-summary-card">
            <div className="form-summary-notes">
              <label className="stat-label">
                Notes / Dispatch Instructions
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                className="form-control"
                rows="3"
                placeholder="Special instructions for dispatch or packaging..."
              />
            </div>
            <div className="total-display">
              <span className="total-display-label">Total Order Value:</span>
              <span className="total-display-amount">
                Rs. {calculateTotal().toLocaleString()}
              </span>
            </div>
          </div>

          <div
            style={{
              padding: "0.75rem 1rem",
              background: "rgba(245,158,11,0.08)",
              borderRadius: "var(--radius-md)",
              border: "1px solid #fcd34d",
              color: "#92400e",
              fontSize: "0.85rem",
              marginBottom: "1.5rem",
            }}
          >
            Creating this order will add{" "}
            <strong>Rs. {calculateTotal().toLocaleString()}</strong> to the
            customer's outstanding receivable balance. Inventory will be reduced
            when the order is <strong>Dispatched</strong>.
          </div>

          <div className="form-actions-bar">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-secondary"
            >
              <ArrowLeft size={16} /> Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              <Save size={18} />{" "}
              {isSubmitting ? "Creating..." : "Create Sales Order"}
            </button>
          </div>
        </form>
      </div>

      <StatusModal
        isOpen={statusModal.isOpen}
        onClose={() => {
          if (statusModal.type === "success") {
            navigate("/supplier-manager/sales-orders");
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

export default CreateSalesOrder;

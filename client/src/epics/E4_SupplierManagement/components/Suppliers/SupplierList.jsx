// ============================================
// Supplier List Component
// Epic: E4 - Supplier Management
// Owner: IT24100799 (Gawrawa G H Y)
// Features: View suppliers, Add/Edit/Terminate/Restore, Tabs
// ============================================

import React, { useState, useEffect } from "react";
import supplierService from "../../services/supplierService";
import SupplierFormModal from "./SupplierFormModal";
import ConfirmModal from "../../../../components/common/ConfirmModal";
import StatusModal from "../../../../components/common/StatusModal";
import toast from "react-hot-toast";
import {
  Plus,
  Edit,
  Archive,
  RotateCcw,
  MapPin,
  Phone,
  Building,
  Search,
} from "lucide-react";
import DashboardHeader from "../../../../components/dashboard/DashboardHeader";
import "../../../../components/dashboard/dashboard.css";
import "./SupplierList.css";

function SupplierList() {
  // [E4.1] [E4.5] Category tabs: Material Supplier, Distributor, Bookshop — re-filters on tab or search change
  // State Variables
  const [suppliers, setSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [terminatedSuppliers, setTerminatedSuppliers] = useState([]);
  const [filteredTerminated, setFilteredTerminated] = useState([]);
  const [activeTab, setActiveTab] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All"); // "All" | "Vendor" | "Customer"
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [supplierSearch, setSupplierSearch] = useState("");
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    id: null,
    action: null, // 'terminate' | 'restore'
  });
  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });

  const closeConfirm = () =>
    setConfirmModal({ isOpen: false, id: null, action: null });

  // Side Effects
  useEffect(() => {
    loadSuppliers();
    loadTerminatedSuppliers();
  }, []);

  useEffect(() => {
    filterSuppliers(activeTab);
  }, [suppliers, activeTab, supplierSearch]);

  useEffect(() => {
    if (supplierSearch) {
      const q = supplierSearch.toLowerCase();
      setFilteredTerminated(
        terminatedSuppliers.filter(
          (s) =>
            s.name?.toLowerCase().includes(q) ||
            s.contactPerson?.toLowerCase().includes(q) ||
            s.email?.toLowerCase().includes(q) ||
            s.address?.city?.toLowerCase().includes(q),
        ),
      );
    } else {
      setFilteredTerminated(terminatedSuppliers);
    }
  }, [terminatedSuppliers, supplierSearch]);

  // Event Handlers
  // [E4.1] Load all suppliers on mount; filtering happens client-side via filterSuppliers
  const loadSuppliers = async () => {
    try {
      const response = await supplierService.getSuppliers();
      setSuppliers(response.suppliers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadTerminatedSuppliers = async () => {
    try {
      const response = await supplierService.getTerminatedSuppliers();
      setTerminatedSuppliers(response.suppliers || []);
    } catch (err) {
      console.error(err);
    }
  };

  const filterSuppliers = (tab) => {
    let filtered = suppliers;

    // Supplier type filter first (Vendor / Customer)
    if (typeFilter !== "All") {
      filtered = filtered.filter((s) => s.supplierType === typeFilter);
    }

    // Category tab filtering
    if (tab !== "All") {
      filtered = filtered.filter((s) => s.category === tab);
    }

    // Search filtering
    if (supplierSearch) {
      const q = supplierSearch.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name?.toLowerCase().includes(q) ||
          s.contactPerson?.toLowerCase().includes(q) ||
          s.email?.toLowerCase().includes(q) ||
          s.address?.city?.toLowerCase().includes(q),
      );
    }

    setFilteredSuppliers(filtered);
  };

  // Re-filter when typeFilter changes
  useEffect(() => {
    filterSuppliers(activeTab);
  }, [typeFilter]);

  const handleSave = async (data) => {
    try {
      if (editingSupplier) {
        const result = await supplierService.updateSupplier(
          editingSupplier._id,
          data,
        );
        if (result.pendingApproval) {
          toast.success(
            "Edit request submitted for Admin approval. Changes will take effect once approved.",
            { duration: 4000 },
          );
        } else {
          toast.success("Partner updated successfully");
        }
      } else {
        await supplierService.createSupplier(data);
        toast.success("Partner added successfully");
      }
      loadSuppliers();
      setShowModal(false);
      setEditingSupplier(null);
    } catch (err) {
      setStatusModal({
        isOpen: true,
        type: "error",
        title: "Save Failed",
        message: "Failed to save partner details. Please try again.",
      });
    }
  };

  const handleTerminate = (id) => {
    setConfirmModal({ isOpen: true, id, action: "terminate" });
  };

  const handleRestore = (id) => {
    setConfirmModal({ isOpen: true, id, action: "restore" });
  };

  const processConfirm = async () => {
    const { id, action } = confirmModal;
    closeConfirm();
    try {
      if (action === "terminate") {
        await supplierService.terminateSupplier(id);
      } else {
        await supplierService.restoreSupplier(id);
      }
      loadSuppliers();
      loadTerminatedSuppliers();
    } catch (err) {
      setStatusModal({
        isOpen: true,
        type: "error",
        title: action === "terminate" ? "Terminate Failed" : "Restore Failed",
        message: `Failed to ${action} partner. Please try again.`,
      });
    }
  };

  const openAddModal = () => {
    setEditingSupplier(null);
    setShowModal(true);
  };

  const openEditModal = (supplier) => {
    setEditingSupplier(supplier);
    setShowModal(true);
  };

  if (loading)
    // Render
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );

  return (
    <div className="dashboard-container">
      <DashboardHeader
        title="Partner Directory"
        subtitle="Detailed directory of Suppliers, Distributors, and Bookshops"
        actions={[
          ...(activeTab !== "Terminated"
            ? [
                {
                  label: "Add Partner",
                  icon: <Plus size={18} />,
                  onClick: openAddModal,
                  variant: "primary",
                },
              ]
            : []),
        ]}
      />

      <div className="dashboard-controls" style={{ marginTop: "1rem" }}>
        {/* Supplier Type Toggle */}
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            marginBottom: "0.75rem",
            flexWrap: "wrap",
          }}
        >
          {["All", "Vendor", "Customer"].map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              style={{
                padding: "0.4rem 1rem",
                borderRadius: "999px",
                border: "2px solid",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.8rem",
                borderColor:
                  typeFilter === type
                    ? type === "Vendor"
                      ? "#ef4444"
                      : type === "Customer"
                        ? "#10b981"
                        : "var(--primary-color)"
                    : "var(--border-color)",
                background:
                  typeFilter === type
                    ? type === "Vendor"
                      ? "rgba(239,68,68,0.1)"
                      : type === "Customer"
                        ? "rgba(16,185,129,0.1)"
                        : "rgba(184,134,11,0.1)"
                    : "transparent",
                color:
                  typeFilter === type
                    ? type === "Vendor"
                      ? "#b91c1c"
                      : type === "Customer"
                        ? "#065f46"
                        : "var(--primary-color)"
                    : "var(--text-secondary)",
                transition: "all 0.2s",
              }}
            >
              {type === "All"
                ? "All Types"
                : type === "Vendor"
                  ? "Vendors (We Pay Them)"
                  : "Customers (They Pay Us)"}
            </button>
          ))}
        </div>

        <div className="dashboard-tabs">
          {[
            "All",
            "Material Supplier",
            "Distributor",
            "Bookshop",
            "Publisher",
            "Terminated",
          ].map((tab) => (
            <button
              key={tab}
              className={`tab-btn ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "All"
                ? "All Partners"
                : tab === "Terminated"
                  ? "Terminated"
                  : `${tab}s`}
            </button>
          ))}
        </div>
      </div>

      <div className="printable-content">
        <h2 className="print-only">
          {activeTab === "All" ? "Full Partner Directory" : `${activeTab} List`}
        </h2>

        {activeTab === "Terminated" ? (
          filteredTerminated.length === 0 ? (
            <div className="dashboard-card">
              <div
                className="table-empty-state text-center"
                style={{ padding: "4rem 2rem" }}
              >
                <p className="text-muted" style={{ fontSize: "1.1rem" }}>
                  No terminated partners found.
                </p>
              </div>
            </div>
          ) : (
            <div className="dashboard-grid dashboard-grid-2">
              {filteredTerminated.map((supplier) => (
                <div
                  key={supplier._id}
                  className="dashboard-card supplier-card"
                  style={{ opacity: 0.75 }}
                >
                  <div className="card-header">
                    <div>
                      <h3 style={{ color: "#888" }}>{supplier.name}</h3>
                      <span
                        className={`badge ${supplier.category ? supplier.category.replace(/\s+/g, "-").toLowerCase() : "default"}`}
                      >
                        {supplier.category || "Supplier"}
                      </span>
                      <span
                        className="badge"
                        style={{
                          marginLeft: "0.4rem",
                          background: "#fce8e8",
                          color: "#c0392b",
                        }}
                      >
                        Terminated
                      </span>
                    </div>
                    <div className="card-actions no-print">
                      <button
                        onClick={() => handleRestore(supplier._id)}
                        className="btn-icon"
                        title="Restore Partner"
                      >
                        <RotateCcw size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="info-row">
                      <Building size={16} />
                      <span>{supplier.contactPerson}</span>
                    </div>
                    <div className="info-row">
                      <Phone size={16} />
                      <span>{supplier.phone}</span>
                    </div>
                    <div className="info-row">
                      <MapPin size={16} />
                      <span>
                        {supplier.address ? (
                          <>
                            {supplier.address.city && (
                              <strong>{supplier.address.city}, </strong>
                            )}
                            {supplier.address.street}
                          </>
                        ) : (
                          "No Address"
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : filteredSuppliers.length === 0 ? (
          <div className="dashboard-card">
            <div
              className="table-empty-state text-center"
              style={{ padding: "4rem 2rem" }}
            >
              <p className="text-muted" style={{ fontSize: "1.1rem" }}>
                No partners found in this category.
              </p>
            </div>
          </div>
        ) : (
          <div className="dashboard-grid dashboard-grid-2">
            {filteredSuppliers.map((supplier) => (
              <div key={supplier._id} className="dashboard-card supplier-card">
                <div className="card-header">
                  <div>
                    <h3>{supplier.name}</h3>
                    <span
                      className={`badge ${supplier.category ? supplier.category.replace(/\s+/g, "-").toLowerCase() : "default"}`}
                    >
                      {supplier.category || "Supplier"}
                    </span>
                    {supplier.supplierType && (
                      <span
                        className="badge"
                        style={{
                          marginLeft: "0.4rem",
                          background:
                            supplier.supplierType === "Vendor"
                              ? "rgba(239,68,68,0.1)"
                              : "rgba(16,185,129,0.1)",
                          color:
                            supplier.supplierType === "Vendor"
                              ? "#b91c1c"
                              : "#065f46",
                        }}
                      >
                        {supplier.supplierType}
                      </span>
                    )}
                    {supplier.hasDebt && (
                      <span
                        className="badge"
                        style={{
                          marginLeft: "0.4rem",
                          background: "rgba(245,158,11,0.15)",
                          color: "#92400e",
                        }}
                      >
                        Debt: Rs.{" "}
                        {(supplier.outstandingBalance || 0).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="card-actions no-print">
                    <button
                      onClick={() => openEditModal(supplier)}
                      className="btn-icon"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleTerminate(supplier._id)}
                      className="btn-icon danger"
                      title="Terminate Partner"
                    >
                      <Archive size={16} />
                    </button>
                  </div>
                </div>

                <div className="card-body">
                  <div className="info-row">
                    <Building size={16} />
                    <span>{supplier.contactPerson}</span>
                  </div>
                  <div className="info-row">
                    <Phone size={16} />
                    <span>{supplier.phone}</span>
                  </div>
                  <div className="info-row">
                    <MapPin size={16} />
                    <span>
                      {supplier.address ? (
                        <>
                          {supplier.address.city && (
                            <strong>{supplier.address.city}, </strong>
                          )}
                          {supplier.address.street}
                        </>
                      ) : (
                        "No Address"
                      )}
                    </span>
                  </div>
                  {supplier.businessRegistration && (
                    <div className="legal-info">
                      {supplier.businessRegistration && (
                        <small>BR: {supplier.businessRegistration}</small>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <StatusModal
        isOpen={statusModal.isOpen}
        onClose={() => setStatusModal({ ...statusModal, isOpen: false })}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
      />

      <SupplierFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
        initialData={editingSupplier}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirm}
        onConfirm={processConfirm}
        title={
          confirmModal.action === "restore"
            ? "Restore Partner"
            : "Terminate Partner"
        }
        message={
          confirmModal.action === "restore"
            ? "Are you sure you want to restore this partner? They will appear as active again."
            : "Are you sure you want to terminate this partner? They will be moved to the Terminated list."
        }
        confirmText={
          confirmModal.action === "restore"
            ? "Restore Partner"
            : "Terminate Partner"
        }
        variant={confirmModal.action === "restore" ? "primary" : "danger"}
      />
    </div>
  );
}

export default SupplierList;

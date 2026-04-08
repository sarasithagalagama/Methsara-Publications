// ============================================
// AdminSettings
// Epic: E1 - User & Role Management
// Owner: IT24100548 (Galagama S.T)
// Purpose: AdminSettings page component
// ============================================
// Purpose: Admin System Settings Page

import React, { useState, useEffect } from "react";
import {
  Shield,
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  Truck,
  BarChart2,
  Tag,
  Activity,
  Globe,
  Monitor,
  Smartphone,
  RefreshCcw,
} from "lucide-react";
import DashboardHeader from "../../../components/dashboard/DashboardHeader";
import DashboardSection from "../../../components/dashboard/DashboardSection";
import DashboardTable from "../../../components/dashboard/DashboardTable";
import Modal from "../../../components/common/Modal";
import StatusModal from "../../../components/common/StatusModal";
import ConfirmModal from "../../../components/common/ConfirmModal";
import { Input, Button, TextArea } from "../../../components/common/Forms";
import axios from "axios";
import toast from "react-hot-toast";
import "../../../components/dashboard/dashboard.css";
import "./AdminSettings.css";

// [E1.6] All 8 system roles — displayed in the Settings overview to explain the RBAC structure
const roles = [
  {
    icon: <Shield size={20} />,
    name: "Administrator",
    description:
      "Full system access. Can manage all users, products, orders, and settings.",
    color: "#DC2626",
    bg: "#FEE2E2",
  },
  {
    icon: <Users size={20} />,
    name: "Location Inventory Manager",
    description:
      "Manages stock levels and inventory movements for a specific branch.",
    color: "#2563EB",
    bg: "#DBEAFE",
  },
  {
    icon: <Users size={20} />,
    name: "Master Inventory Manager",
    description: "Oversees inventory across all locations.",
    color: "#2563EB",
    bg: "#DBEAFE",
  },
  {
    icon: <DollarSign size={20} />,
    name: "Finance Manager",
    description: "Manages financial transactions, payroll, and reports.",
    color: "#059669",
    bg: "#D1FAE5",
  },
  {
    icon: <Truck size={20} />,
    name: "Supplier Manager",
    description: "Manages suppliers, purchase orders, and delivery schedules.",
    color: "#0891B2",
    bg: "#CFFAFE",
  },
  {
    icon: <Package size={20} />,
    name: "Product Manager",
    description: "Manages product listings, categories, and pricing.",
    color: "#7C3AED",
    bg: "#EDE9FE",
  },
  {
    icon: <BarChart2 size={20} />,
    name: "Marketing Manager",
    description: "Manages campaigns, promotions, and analytics.",
    color: "#E11D48",
    bg: "#FFE4E6",
  },
  {
    icon: <Tag size={20} />,
    name: "Customer",
    description:
      "Can browse products, place orders, and manage their own account.",
    color: "#0369A1",
    bg: "#E0F2FE",
  },
];

const AdminSettings = () => {
  // State Variables
  const params = new URLSearchParams(window.location.search);
  const initialTab = params.get("tab") || "overview";
  const [activeTab, setActiveTab] = useState(initialTab); // overview, locations, security
  const [locations, setLocations] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [securityLogs, setSecurityLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Modals state
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    variant: "primary",
  });

  const [locationForm, setLocationForm] = useState({
    name: "",
    address: "",
    contactNumber: "",
    isMainWarehouse: false,
  });

  // [E1.5] Branch location management — locations are fetched only when the Locations tab is active
  const fetchLocations = async () => {
    try {
      setLoadingLocations(true);
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/locations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLocations(res.data.locations || []);
    } catch (error) {
      console.error("Error fetching locations:", error);
      toast.error("Failed to load locations");
    } finally {
      setLoadingLocations(false);
    }
  };

  // Side Effects
  useEffect(() => {
    // Update URL without full reload
    const newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?tab=' + activeTab;
    window.history.pushState({path:newurl},'',newurl);

    if (activeTab === "locations") {
      fetchLocations();
    } else if (activeTab === "security") {
      fetchSecurityLogs();
    }
  }, [activeTab]);

  // [E1.11] Security logs: tracks login events and admin actions for auditing suspicious activity
  const fetchSecurityLogs = async () => {
    try {
      setLoadingLogs(true);
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/auth/logs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const processedLogs = (res.data.logs || []).map((log) => ({
        ...log,
        userName: log.user?.name || "Unknown",
      }));
      setSecurityLogs(processedLogs);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
      toast.error("Failed to load security logs");
    } finally {
      setLoadingLogs(false);
    }
  };

  // Admin can forcefully terminate a specific user session (instant remote logout)
  const handleRevokeSession = (session) => {
    setConfirmModal({
      isOpen: true,
      title: "Revoke Security Session",
      message: `Are you sure you want to revoke the session for ${session.user?.name}? The user will be immediately logged out from this device.`,
      variant: "danger",
      onConfirm: async () => {
        try {
          const token = localStorage.getItem("token");
          await axios.post(
            `/api/auth/sessions/${session._id}/revoke`,
            {},
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          toast.success("Session revoked successfully");
          fetchSecurityLogs();
          setConfirmModal({ ...confirmModal, isOpen: false });
        } catch (error) {
          toast.error(
            error.response?.data?.message || "Failed to revoke session",
          );
          setConfirmModal({ ...confirmModal, isOpen: false });
        }
      },
    });
  };

  // Handles both create and update — uses editingLocation state to determine which operation to run
  const handleLocationSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      if (editingLocation) {
        await axios.put(`/api/locations/${editingLocation._id}`, locationForm, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Location updated successfully");
      } else {
        await axios.post("/api/locations", locationForm, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Location created successfully");
      }
      setShowLocationModal(false);
      fetchLocations();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save location");
    }
  };

  const handleDeleteLocation = (id) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Location",
      message:
        "Are you sure you want to delete this location? This action cannot be undone.",
      variant: "danger",
      onConfirm: async () => {
        try {
          const token = localStorage.getItem("token");
          await axios.delete(`/api/locations/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          toast.success("Location deleted successfully");
          fetchLocations();
          setConfirmModal({ ...confirmModal, isOpen: false });
        } catch (error) {
          toast.error(
            error.response?.data?.message || "Failed to delete location",
          );
          setConfirmModal({ ...confirmModal, isOpen: false });
        }
      },
    });
  };

  const locationColumns = [
    {
      header: "Location Name",
      accessor: "name",
      render: (loc) => (
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <strong>{loc.name}</strong>
          {loc.isMainWarehouse && (
            <span
              className="status-badge active"
              style={{ fontSize: "0.7rem", padding: "2px 6px" }}
            >
              Main Warehouse
            </span>
          )}
        </div>
      ),
    },
    { header: "Address", accessor: "address" },
    { header: "Contact", accessor: "contactNumber" },
    {
      header: "Created",
      accessor: "createdAt",
      render: (loc) => new Date(loc.createdAt).toLocaleDateString(),
    },
    {
      header: "Actions",
      accessor: "actions",
      render: (loc) => (
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => {
              setEditingLocation(loc);
              setLocationForm({
                name: loc.name,
                address: loc.address || "",
                contactNumber: loc.contactNumber || "",
                isMainWarehouse: loc.isMainWarehouse || false,
              });
              setShowLocationModal(true);
            }}
          >
            Edit
          </button>
          {!loc.isMainWarehouse && (
            <button
              className="btn btn-danger btn-sm"
              onClick={() => handleDeleteLocation(loc._id)}
            >
              Delete
            </button>
          )}
        </div>
      ),
    },
  ];

  // Render
  return (
    <div className="dashboard-container">
      <DashboardHeader
        title="System Settings"
        subtitle="Manage roles, locations, and system configuration"
      />

      <div className="dashboard-tabs" style={{ marginBottom: "2rem" }}>
        <button
          className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          Roles & System Info
        </button>
        <button
          className={`tab-btn ${activeTab === "locations" ? "active" : ""}`}
          onClick={() => setActiveTab("locations")}
        >
          Location Management
        </button>
        <button
          className={`tab-btn ${activeTab === "security" ? "active" : ""}`}
          onClick={() => setActiveTab("security")}
        >
          Security Logs
        </button>
      </div>

      {activeTab === "overview" && (
        <>
          <DashboardSection title="Role Permissions Overview">
            <div className="settings-roles-grid">
              {roles.map((role, idx) => (
                <div key={idx} className="settings-role-card">
                  <div
                    className="settings-role-icon"
                    style={{ background: role.bg, color: role.color }}
                  >
                    {role.icon}
                  </div>
                  <div className="settings-role-info">
                    <h4 className="settings-role-name">{role.name}</h4>
                    <p className="settings-role-desc">{role.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </DashboardSection>

          <DashboardSection title="System Information">
            <div className="settings-info-grid">
              <div className="settings-info-item">
                <span className="settings-info-label">Application</span>
                <span className="settings-info-value">
                  Methsara Publications Webstore
                </span>
              </div>
              <div className="settings-info-item">
                <span className="settings-info-label">Version</span>
                <span className="settings-info-value">1.0.0</span>
              </div>
              <div className="settings-info-item">
                <span className="settings-info-label">Environment</span>
                <span className="settings-info-value">Production</span>
              </div>
              <div className="settings-info-item">
                <span className="settings-info-label">Database</span>
                <span className="settings-info-value">MongoDB Atlas</span>
              </div>
            </div>
          </DashboardSection>
        </>
      )}

      {activeTab === "locations" && (
        <DashboardSection
          title="Manage Branches & Warehouses"
          action={
            <Button
              variant="primary"
              size="sm"
              icon={Package}
              onClick={() => {
                setEditingLocation(null);
                setLocationForm({
                  name: "",
                  address: "",
                  contactNumber: "",
                  isMainWarehouse: false,
                });
                setShowLocationModal(true);
              }}
            >
              Add New Location
            </Button>
          }
        >
          {loadingLocations ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
            </div>
          ) : (
            <DashboardTable
              columns={locationColumns}
              data={locations}
              searchable={true}
              searchKeys={["name", "address"]}
              rowsPerPage={10}
              emptyMessage="No locations found. Add one to get started."
            />
          )}
        </DashboardSection>
      )}

      {/* Location Modal */}
      <Modal
        isOpen={showLocationModal}
        title={editingLocation ? "Edit Location" : "Add New Location"}
        onClose={() => setShowLocationModal(false)}
        size="md"
      >
        <form
          onSubmit={handleLocationSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          <div>
            <Input
              label="Location Name"
              type="text"
              name="name"
              value={locationForm.name}
              onChange={(e) =>
                setLocationForm({ ...locationForm, name: e.target.value })
              }
              placeholder="e.g. Balangoda Branch"
              required
            />
          </div>
          <div>
            <TextArea
              label="Address"
              name="address"
              value={locationForm.address}
              onChange={(e) =>
                setLocationForm({ ...locationForm, address: e.target.value })
              }
              placeholder="Full street address"
              rows={2}
              required={true}
            />
          </div>
          <div>
            <Input
              label="Contact Number"
              type="text"
              name="contactNumber"
              value={locationForm.contactNumber}
              onChange={(e) =>
                setLocationForm({
                  ...locationForm,
                  contactNumber: e.target.value,
                })
              }
              placeholder="e.g. 045-1234567"
            />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginTop: "0.5rem",
            }}
          >
            <input
              type="checkbox"
              id="isMainWarehouse"
              checked={locationForm.isMainWarehouse}
              onChange={(e) =>
                setLocationForm({
                  ...locationForm,
                  isMainWarehouse: e.target.checked,
                })
              }
              style={{ width: "16px", height: "16px", cursor: "pointer" }}
            />
            <label
              htmlFor="isMainWarehouse"
              style={{ cursor: "pointer", fontWeight: "500" }}
            >
              Set as Main Warehouse
            </label>
            {locationForm.isMainWarehouse && (
              <span
                style={{
                  fontSize: "0.8rem",
                  color: "#666",
                  marginLeft: "auto",
                }}
              >
                (This will unset the previous main warehouse)
              </span>
            )}
          </div>
          <div className="dash-modal-actions" style={{ marginTop: "1rem" }}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowLocationModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingLocation ? "Update Location" : "Save Location"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />

      {activeTab === "security" && (
        <DashboardSection
          title={
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Activity size={22} className="text-primary-color" />
              Global Security Logs
            </div>
          }
          action={
            <Button
              variant="secondary"
              icon={RefreshCcw}
              onClick={fetchSecurityLogs}
              isLoading={loadingLogs}
              className="refresh-btn-Styled"
            >
              Refresh Logs
            </Button>
          }
        >
          {loadingLogs ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
            </div>
          ) : (
            <DashboardTable
              data={securityLogs}
              columns={[
                {
                  header: "User Information",
                  accessor: "userName",
                  render: (log) => (
                    <div className="user-info-cell">
                      <div className="user-avatar-sm">
                        {log.user?.name?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <div>
                        <strong>{log.user?.name || "Unknown"}</strong>
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          {log.user?.email}
                        </div>
                      </div>
                    </div>
                  ),
                },
                {
                  header: "Role",
                  accessor: "role",
                  render: (log) => (
                    <span
                      className={`status-badge ${
                        log.user?.role === "admin"
                          ? "danger"
                          : log.user?.role?.includes("manager")
                            ? "active"
                            : "inactive"
                      }`}
                    >
                      {log.user?.role?.replace("_", " ")}
                    </span>
                  ),
                },
                {
                  header: "IP & Location",
                  accessor: "ipAddress",
                  render: (log) => (
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <Globe size={14} className="text-primary-light" />
                        {log.ipAddress}
                      </span>
                      <span
                        style={{
                          fontSize: "0.7rem",
                          color: "#888",
                          marginLeft: "20px",
                        }}
                      >
                        Colombo, LK (Detected)
                      </span>
                    </div>
                  ),
                },
                {
                  header: "Device / Browser",
                  accessor: "device",
                  render: (log) => (
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      {log.device?.toLowerCase().includes("mobile") ? (
                        <Smartphone size={16} className="text-warning-light" />
                      ) : (
                        <Monitor size={16} className="text-info-light" />
                      )}
                      <span style={{ fontSize: "0.85rem" }}>
                        {log.device || "Unknown Device"}
                      </span>
                    </span>
                  ),
                },
                {
                  header: "Last Sync",
                  accessor: "loginTime",
                  render: (log) => (
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <strong>
                        {new Date(log.loginTime).toLocaleDateString()}
                      </strong>
                      <span style={{ fontSize: "0.75rem", color: "#666" }}>
                        {new Date(log.loginTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  ),
                },
                {
                  header: "Status",
                  accessor: "status",
                  render: (log) => {
                    let statusClass = "active";
                    let label = "Active";

                    if (log.status === "revoked") {
                      statusClass = "danger";
                      label = "Revoked";
                    } else if (log.status === "logged_out") {
                      statusClass = "inactive";
                      label = "Logged Out";
                    }

                    return (
                      <span className={`status-badge ${statusClass}`}>
                        {label}
                      </span>
                    );
                  },
                },
              ]}
              actions={(log) => (
                <button
                  className="btn btn-outline btn-sm text-error"
                  disabled={log.status !== "active"}
                  onClick={() => handleRevokeSession(log)}
                  title="Revoke Session"
                >
                  <Shield size={14} style={{ marginRight: "4px" }} /> Revoke
                </button>
              )}
              rowsPerPage={10}
              searchable={true}
              searchKeys={["userName", "ipAddress", "device"]}
            />
          )}
        </DashboardSection>
      )}
    </div>
  );
};

export default AdminSettings;

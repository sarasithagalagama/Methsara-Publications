// ============================================
// Low Stock Alerts Page
// Epic: E5 - Inventory Management
// Owner: IT24100264 (Bandara N W C D)
// Purpose: Flag low-stock books for reorder (E5.2)
// ============================================

import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  CheckCircle,
  AlertTriangle,
  Package,
  MapPin,
  Printer,
} from "lucide-react";
import { useAuth } from "../../E1_UserAndRoleManagement/context/AuthContext";
import DashboardHeader from "../../../components/dashboard/DashboardHeader";
import "../../../components/dashboard/dashboard.css";
import "./LowStockAlerts.css";

const LowStockAlerts = () => {
  const { user } = useAuth();
  // State Variables
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState("");
  const [availableLocations, setAvailableLocations] = useState([]);

  // [E1.6] RBAC: only master or location inventory managers can act on alerts (e.g. create POs)
  const canEdit =
    user?.role === "master_inventory_manager" ||
    user?.role === "location_inventory_manager";

  // We load all available locations (Warehouses, Physical Shops)
  // so the manager can filter alerts by a specific site.
  // Side Effects
  useEffect(() => {
    fetchLocations();
  }, []);

  // Event Handlers
  const fetchLocations = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/locations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAvailableLocations(res.data.locations || []);
    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  };

  // Every time the selected location changes, we re-run our
  // stock check to show the most relevant warnings.
  useEffect(() => {
    fetchAlerts();
  }, [location]);

  // [Epic E5.9] - Automated Stock Monitoring
  // Our backend compares 'Current Quantity' against the 'Reorder Level'
  // for every product at every location.
  const fetchAlerts = async () => {
    try {
      const token = localStorage.getItem("token");
      const url = location
        ? `/api/inventory/alerts?location=${encodeURIComponent(location)}`
        : "/api/inventory/alerts";
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAlerts(res.data.alerts || []);
    } catch (error) {
      console.error("Error fetching alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  // [E5.9] Alert severity classification: critical = 0 stock or ≤25% of reorder level; warning = 26-50%; low = 51-100%
  const getAlertLevel = (currentStock, reorderLevel) => {
    if (currentStock === 0) return "critical";
    const safeReorder = Math.max(reorderLevel, 1);
    const percentage = (currentStock / safeReorder) * 100;
    if (percentage <= 25) return "critical";
    if (percentage <= 50) return "warning";
    return "low";
  };

  // Render
  return (
    <div className="dashboard-container">
      <DashboardHeader
        title="Low Stock Alerts"
        subtitle={
          location
            ? `Products below reorder level at ${location}: ${alerts.length}`
            : `Products below reorder level: ${alerts.length} across all locations`
        }
        actions={[
          {
            label: "Refresh",
            icon: <AlertTriangle size={18} />,
            onClick: fetchAlerts,
            variant: "outline",
          },
        ]}
      />

      {/* Filtering Toolbar */}
      <div
        className="dashboard-card"
        style={{ marginBottom: "1.5rem", padding: "1rem" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <MapPin size={20} className="text-muted" />
            <select
              className="form-control"
              style={{ minWidth: "200px" }}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            >
              <option value="">All Locations (Global)</option>
              {availableLocations.map((loc) => (
                <option key={loc._id} value={loc.name}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>
          <div className="text-muted" style={{ fontSize: "0.9rem" }}>
            Found {alerts.length} shortage alerts
          </div>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="dashboard-card no-alerts-card">
          <div
            className="table-empty-state text-center"
            style={{ padding: "4rem 2rem" }}
          >
            <CheckCircle
              size={48}
              className="text-success"
              style={{ marginBottom: "1rem" }}
            />
            <h3 className="card-title">Inventory Health Good</h3>
            <p className="text-muted" style={{ fontSize: "1.1rem" }}>
              All products are adequately stocked.
            </p>
          </div>
        </div>
      ) : (
        <div className="dashboard-grid dashboard-grid-3 no-print">
          {alerts.map((alert) => (
            <div
              key={alert._id}
              className={`dashboard-card inventory-alert-card border-none ${getAlertLevel(alert.currentStock, alert.reorderLevel)}`}
            >
              <div
                className="card-header"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <h3 className="card-title">{alert.product?.title}</h3>
                  <span
                    className={`badge alert-badge-${getAlertLevel(alert.currentStock, alert.reorderLevel)}`}
                  >
                    {getAlertLevel(
                      alert.currentStock,
                      alert.reorderLevel,
                    ).toUpperCase()}
                  </span>
                </div>
                {canEdit && (
                  <button
                    className="btn btn-primary btn-sm"
                    title="Manage Stock"
                    onClick={() =>
                      (window.location.href = `/inventory-manager/dashboard?location=${encodeURIComponent(alert.location)}&search=${encodeURIComponent(alert.product?.isbn || "")}`)
                    }
                    style={{ padding: "0.4rem 0.8rem", fontSize: "0.75rem" }}
                  >
                    Manage
                  </button>
                )}
              </div>

              <div className="card-body">
                <div
                  className="info-row"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0.75rem",
                  }}
                >
                  <span
                    className="text-muted"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <Package size={14} /> ISBN
                  </span>
                  <strong>{alert.product?.isbn}</strong>
                </div>
                <div
                  className="info-row"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0.75rem",
                  }}
                >
                  <span
                    className="text-muted"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <MapPin size={14} /> Location
                  </span>
                  <strong>{alert.location}</strong>
                </div>

                <div
                  className="alert-meter-container"
                  style={{ margin: "1.5rem 0" }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "0.5rem",
                      fontSize: "0.85rem",
                    }}
                  >
                    <span className="text-muted">Available Stock</span>
                    <strong>
                      {alert.currentStock} / {alert.reorderLevel}
                    </strong>
                  </div>
                  <div
                    className="progress-bar-container"
                    style={{
                      height: "8px",
                      background: "#f1f5f9",
                      borderRadius: "4px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      className={`alert-progress-bar ${getAlertLevel(alert.currentStock, alert.reorderLevel)}`}
                      style={{
                        height: "100%",
                        width: `${Math.min((alert.currentStock / alert.reorderLevel) * 100, 100)}%`,
                        transition: "width 0.5s ease",
                      }}
                    ></div>
                  </div>
                </div>

                <div
                  className="alert-urgency"
                  style={{
                    padding: "1rem",
                    background: "rgba(241, 245, 249, 0.5)",
                    borderRadius: "var(--radius-md)",
                    textAlign: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Shortage:
                  </span>
                  <strong
                    style={{
                      fontSize: "1.1rem",
                      marginLeft: "0.5rem",
                      color:
                        alert.currentStock === 0
                          ? "#ef4444"
                          : "var(--primary-color)",
                    }}
                  >
                    {alert.reorderLevel - alert.currentStock} Units
                  </strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LowStockAlerts;

// ============================================
// DeliverySchedule
// Epic: E4 - Supplier Management
// Owner: IT24100799 (Gawrawa G H Y)
// Purpose: DeliverySchedule page component
// ============================================
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Calendar, Truck, CheckCircle } from "lucide-react";
import DashboardHeader from "../../../../components/dashboard/DashboardHeader";
import "../../../../components/dashboard/dashboard.css";

const DeliverySchedule = () => {
  const navigate = useNavigate();
  // State Variables
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  // Side Effects
  useEffect(() => {
    fetchSchedule();
  }, []);

  // Event Handlers
  // [E4.3] Delivery Schedule: filters POs where status is NOT 'Received' or 'Cancelled'
  // Sorted by expectedDeliveryDate ascending to show the most urgent first
  const fetchSchedule = async () => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get("/api/purchase-orders", config);
      const pos = res.data.purchaseOrders || [];

      // Filter for pending/upcoming deliveries
      const pendingDeliveries = pos
        .filter((po) => po.status !== "Received" && po.status !== "Cancelled")
        .sort(
          (a, b) =>
            new Date(a.expectedDeliveryDate) - new Date(b.expectedDeliveryDate),
        );

      setSchedule(pendingDeliveries);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching schedule:", error);
      setLoading(false);
    }
  };

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
        title="Delivery Schedule"
        subtitle="Manage upcoming partner deliveries"
      />

      <div className="dashboard-card">
        <div className="agenda-view">
          {schedule.length === 0 ? (
            <div
              className="table-empty-state text-center"
              style={{ padding: "4rem 2rem" }}
            >
              <Calendar
                size={48}
                className="text-muted"
                style={{ marginBottom: "1rem" }}
              />
              <h3 className="text-muted">No Upcoming Deliveries</h3>
              <p className="text-muted">
                All purchase orders have been received or cancelled.
              </p>
            </div>
          ) : (
            schedule.map((po) => (
              <div key={po._id} className="agenda-item">
                <div className="agenda-date">
                  <span className="day">
                    {new Date(po.expectedDeliveryDate).getDate()}
                  </span>
                  <span className="month">
                    {new Date(po.expectedDeliveryDate).toLocaleString(
                      "default",
                      { month: "short" },
                    )}
                  </span>
                </div>
                <div className="agenda-details">
                  <h4>{po.supplier?.name}</h4>
                  <p>PO #{po.poNumber || po._id.slice(-6).toUpperCase()}</p>
                  <div className="agenda-meta">
                    <span className="item-count">
                      <Truck size={14} /> {po.items?.length || 0} Items
                    </span>
                    <span className={`status-badge ${po.status.toLowerCase()}`}>
                      {po.status}
                    </span>
                  </div>
                </div>
                <div className="agenda-action">
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() =>
                      navigate("/supplier-manager/purchase-orders")
                    }
                  >
                    View PO
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DeliverySchedule;

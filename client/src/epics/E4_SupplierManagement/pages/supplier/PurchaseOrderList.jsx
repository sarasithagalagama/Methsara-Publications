// ============================================
// Purchase Order List Page
// Epic: E4 - Supplier Management
// Owner: IT24100799 (Gawrawa G H Y)
// Purpose: View and manage purchase orders (E4.2)
// ============================================

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Plus, Eye, CheckCircle, XCircle } from "lucide-react";
import DashboardHeader from "../../../../components/dashboard/DashboardHeader";
import ConfirmModal from "../../../../components/common/ConfirmModal";
import StatusModal from "../../../../components/common/StatusModal";
import "../../../../components/dashboard/dashboard.css";

const PurchaseOrderList = () => {
  const navigate = useNavigate();
  // State Variables
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    poId: null,
    status: null,
  });
  const [selectedPO, setSelectedPO] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });

  // On mount, we load all purchase orders.
  // This gives the Supplier Manager a bird's-eye view of all procurement.
  // Side Effects
  useEffect(() => {
    fetchPOs();
  }, []);

  // [Epic E4.1] - Secure Procurement Data
  // We fetch the PO list from our protected API, ensuring
  // only authorized managers can see our supplier costs.
  // Event Handlers
  const fetchPOs = async () => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get("/api/purchase-orders", config);
      setPurchaseOrders(res.data.purchaseOrders || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching POs:", error);
      setLoading(false);
    }
  };

  // [Epic E4.3] - Managing Order Lifecycle
  // This handles the status transitions. A PO can go from
  // 'Pending' to 'Approved' or 'Received' as we process the shipment.
  const handleStatusUpdate = (id, status) => {
    setConfirmModal({ isOpen: true, poId: id, status });
  };

  const confirmStatusUpdate = async () => {
    const { poId: id, status } = confirmModal;
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `/api/purchase-orders/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      fetchPOs();
    } catch (error) {
      console.error("Error updating status:", error);
      setStatusModal({
        isOpen: true,
        type: "error",
        title: "Update Failed",
        message: "Failed to update purchase order status. Please try again.",
      });
    }
  };

  // Detailed drill-down into a specific order's items and costs.
  const handleViewPO = (po) => {
    setSelectedPO(po);
    setShowViewModal(true);
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
        title="Purchase Orders"
        subtitle="Manage procurement and supplier orders"
        actions={[
          {
            label: "Create New PO",
            icon: <Plus size={18} />,
            onClick: () => navigate("/supplier-manager/purchase-orders/create"),
            variant: "primary",
          },
        ]}
      />

      <div className="dashboard-card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Supplier</th>
                <th>Date</th>
                <th>Expected Delivery</th>
                <th>Total Cost</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {purchaseOrders.length === 0 ? (
                <tr>
                  <td
                    colspan="7"
                    className="table-empty-state text-center"
                    style={{ padding: "4rem 2rem" }}
                  >
                    No Purchase Orders found.
                  </td>
                </tr>
              ) : (
                purchaseOrders.map((po) => (
                  <tr key={po._id}>
                    <td>
                      <strong>
                        #{po.poNumber || po._id.slice(-6).toUpperCase()}
                      </strong>
                    </td>
                    <td>{po.supplier?.name || "N/A"}</td>
                    <td>{new Date(po.createdAt).toLocaleDateString()}</td>
                    <td>
                      {po.expectedDeliveryDate
                        ? new Date(po.expectedDeliveryDate).toLocaleDateString()
                        : "TBD"}
                    </td>
                    <td>Rs. {po.totalAmount?.toLocaleString()}</td>
                    <td>
                      <span
                        className={`status-badge ${
                          po.status === "Received"
                            ? "success"
                            : po.status === "Cancelled"
                              ? "error"
                              : "warning"
                        }`}
                      >
                        {po.status}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        {(po.status === "Pending" || po.status === "Draft") && (
                          <>
                            <button
                              className="btn-icon success"
                              title="Approve Order"
                              onClick={() =>
                                handleStatusUpdate(po._id, "Approved")
                              }
                            >
                              <CheckCircle size={16} />
                            </button>
                            <button
                              className="btn-icon error"
                              title="Cancel PO"
                              onClick={() =>
                                handleStatusUpdate(po._id, "Cancelled")
                              }
                            >
                              <XCircle size={16} />
                            </button>
                          </>
                        )}
                        {po.status === "Received" && !po.paymentRequested && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={async () => {
                              try {
                                const token = localStorage.getItem("token");
                                await axios.put(
                                  `/api/purchase-orders/${po._id}/request-payment`,
                                  {},
                                  {
                                    headers: {
                                      Authorization: `Bearer ${token}`,
                                    },
                                  },
                                );
                                setStatusModal({
                                  isOpen: true,
                                  type: "success",
                                  title: "Payment Requested",
                                  message:
                                    "Payment request has been sent successfully.",
                                });
                                fetchPOs();
                              } catch (err) {
                                setStatusModal({
                                  isOpen: true,
                                  type: "error",
                                  title: "Request Failed",
                                  message:
                                    "Failed to send payment request. Please try again.",
                                });
                              }
                            }}
                          >
                            Request Payment
                          </button>
                        )}
                        {po.paymentRequested && po.paymentStatus !== "Paid" && (
                          <span className="status-badge warning">
                            Payment Pending
                          </span>
                        )}
                        {po.paymentStatus === "Paid" && (
                          <span className="status-badge success">Paid</span>
                        )}
                        <button
                          className="btn-icon"
                          title="View PO Details"
                          onClick={() => handleViewPO(po)}
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

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() =>
          setConfirmModal({ isOpen: false, poId: null, status: null })
        }
        onConfirm={confirmStatusUpdate}
        title="Confirm Status Update"
        message={`Are you sure you want to mark this PO as ${confirmModal.status}?`}
        confirmText="Yes, Update"
        cancelText="Cancel"
      />

      {/* View Purchase Order Modal */}
      {showViewModal && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            className="modal-container"
            style={{
              background: "white",
              padding: "2rem",
              borderRadius: "12px",
              maxWidth: "800px",
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
              <h3>Purchase Order Details — #{selectedPO?.poNumber}</h3>
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
                gap: "2rem",
                marginBottom: "2rem",
              }}
            >
              <div>
                <label className="text-muted text-xs uppercase font-bold">
                  Supplier
                </label>
                <p className="font-bold">{selectedPO.supplier?.name}</p>
                <p className="text-sm">{selectedPO.supplier?.email}</p>
              </div>
              <div>
                <label className="text-muted text-xs uppercase font-bold">
                  Metadata
                </label>
                <p className="text-sm">
                  <strong>Status:</strong> {selectedPO.status}
                </p>
                <p className="text-sm">
                  <strong>Expected:</strong>{" "}
                  {selectedPO.expectedDeliveryDate
                    ? new Date(
                        selectedPO.expectedDeliveryDate,
                      ).toLocaleDateString()
                    : "TBD"}
                </p>
              </div>
            </div>

            <table className="data-table" style={{ marginBottom: "1.5rem" }}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>UnitPrice</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedPO.items?.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.product?.title || "Product"}</td>
                    <td>{item.quantity}</td>
                    <td>Rs. {item.unitPrice?.toLocaleString()}</td>
                    <td>Rs. {item.totalPrice?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
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

export default PurchaseOrderList;

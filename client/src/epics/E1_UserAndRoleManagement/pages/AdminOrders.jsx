// ============================================
// AdminOrders
// Epic: E1 - User & Role Management
// Owner: IT24100548 (Galagama S.T)
// Purpose: AdminOrders page component
// ============================================
// Purpose: Full Admin Order Management Page

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Eye } from "lucide-react";
import Modal from "../../../components/common/Modal";
import StatusModal from "../../../components/common/StatusModal";
import DashboardHeader from "../../../components/dashboard/DashboardHeader";
import DashboardSection from "../../../components/dashboard/DashboardSection";
import DashboardTable from "../../../components/dashboard/DashboardTable";
import "../../../components/dashboard/dashboard.css";
import "./AdminDashboard.css";

const AdminOrders = () => {
  // State Variables
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewingOrder, setViewingOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });

  // Side Effects
  useEffect(() => {
    fetchOrders();
  }, []);

  // Event Handlers
  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(res.data.orders || []);
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `/api/orders/${orderId}/status`,
        { orderStatus: newStatus },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setStatusModal({
        isOpen: true,
        type: "success",
        title: "Status Updated",
        message: `Order #${orderId.slice(-6).toUpperCase()} status has been successfully updated to ${newStatus}.`,
      });
      fetchOrders();
    } catch (error) {
      console.error("Error updating order status:", error);
      setStatusModal({
        isOpen: true,
        type: "error",
        title: "Update Failed",
        message: "Failed to update order status. Please try again.",
      });
    }
  };

  const orderColumns = [
    {
      header: "Order ID",
      accessor: "_id",
      render: (order) => <strong>#{order._id.slice(-6).toUpperCase()}</strong>,
    },
    {
      header: "Customer",
      accessor: "customer",
      render: (order) => order.customer?.name || order.guestName || "Guest",
    },
    {
      header: "Date",
      accessor: "createdAt",
      render: (order) =>
        order.createdAt
          ? new Date(order.createdAt).toLocaleDateString()
          : "N/A",
    },
    {
      header: "Total",
      accessor: "total",
      render: (order) => `Rs. ${order.total.toLocaleString()}`,
    },
    {
      header: "Status",
      accessor: "orderStatus",
      render: (order) => (
        <span className={`status-badge ${order.orderStatus.toLowerCase()}`}>
          {order.orderStatus}
        </span>
      ),
    },
    {
      header: "Payment",
      accessor: "paymentStatus",
      render: (order) => {
        const isPaid =
          order.paymentStatus === "Paid" || order.paymentStatus === "Completed";
        return (
          <span className={`status-badge ${isPaid ? "active" : "inactive"}`}>
            {order.paymentStatus || "Unpaid"}
          </span>
        );
      },
    },
  ];

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
        title="Order Management"
        subtitle="View and manage all customer orders"
      />

      <DashboardSection title="All Orders">
        <DashboardTable
          columns={orderColumns}
          data={orders}
          searchable={true}
          searchKeys={["_id", "guestName", "orderStatus"]}
          filterable={true}
          filterKey="orderStatus"
          currentFilter={statusFilter}
          onFilterChange={setStatusFilter}
          filterOptions={[
            { value: "all", label: "All Statuses" },
            { value: "Pending", label: "Pending" },
            { value: "Processing", label: "Processing" },
            { value: "Shipped", label: "Shipped" },
            { value: "Delivered", label: "Delivered" },
            { value: "Cancelled", label: "Cancelled" },
          ]}
          rowsPerPage={15}
          actions={(order) => (
            <div className="table-actions">
              <button
                className="btn-icon"
                title="View Details"
                onClick={() => {
                  setViewingOrder(order);
                  setShowOrderModal(true);
                }}
              >
                <Eye size={16} />
              </button>
            </div>
          )}
        />
      </DashboardSection>

      {/* Order Detail Modal */}
      {showOrderModal && viewingOrder && (
        <Modal
          isOpen={showOrderModal && !!viewingOrder}
          onClose={() => setShowOrderModal(false)}
          title="Order Details"
          size="lg"
        >
          <div className="view-details-grid">
            <div className="view-section">
              <h3 className="section-title">Order Information</h3>
              <div className="detail-item">
                <label>Order ID</label>
                <span>#{viewingOrder?._id?.toUpperCase()}</span>
              </div>
              <div className="detail-item">
                <label>Date</label>
                <span>
                  {viewingOrder?.createdAt
                    ? new Date(viewingOrder.createdAt).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
              <div className="detail-item">
                <label>Total Amount</label>
                <span>Rs. {viewingOrder?.total?.toLocaleString()}</span>
              </div>
              <div className="detail-item">
                <label>Status</label>
                <span
                  className={`status-badge ${viewingOrder?.orderStatus?.toLowerCase()}`}
                >
                  {viewingOrder?.orderStatus}
                </span>
              </div>
            </div>
            <div className="view-section">
              <h3 className="section-title">Customer & Shipping</h3>
              <div className="detail-item">
                <label>Customer Name</label>
                <span>
                  {viewingOrder?.user?.name ||
                    viewingOrder?.guestName ||
                    "Guest"}
                </span>
              </div>
              <div className="detail-item">
                <label>Email</label>
                <span>
                  {viewingOrder?.user?.email || viewingOrder?.email || "N/A"}
                </span>
              </div>
              <div className="detail-item">
                <label>Contact Number</label>
                <span>{viewingOrder?.deliveryAddress?.phone || "N/A"}</span>
              </div>
              <div className="detail-item">
                <label>Address</label>
                <span>
                  {viewingOrder?.deliveryAddress?.street},{" "}
                  {viewingOrder?.deliveryAddress?.city}
                </span>
              </div>
            </div>
            <div className="view-section full-width">
              <h3 className="section-title">Ordered Items</h3>
              <table className="data-table" style={{ marginTop: "10px" }}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {viewingOrder?.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        {item.product?.title ||
                          item.productName ||
                          "Unknown Product"}
                      </td>
                      <td>{item.quantity}</td>
                      <td>Rs. {item.price}</td>
                      <td>Rs. {item.price * item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="dash-modal-actions">
            <button
              className="btn btn-primary"
              onClick={() => setShowOrderModal(false)}
            >
              Close
            </button>
          </div>
        </Modal>
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

export default AdminOrders;

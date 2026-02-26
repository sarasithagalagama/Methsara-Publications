// ============================================
// InventoryManagerDashboard
// Epic: E5 - Inventory Management
// Owner: IT24100264 (Bandara N W C D)
// Purpose: InventoryManagerDashboard page component
// ============================================
// Purpose: Stock tracking and management

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../epics/E1_UserAndRoleManagement/context/AuthContext";
import {
  Package,
  AlertTriangle,
  MapPin,
  RefreshCw,
  Edit,
  FileText,
  Download,
  History,
  ArrowRight,
  Check,
  X,
  Plus,
  XCircle,
  Clock,
  Search,
} from "lucide-react";
import toast from "react-hot-toast";
import StatCard from "../../../components/dashboard/StatCard";
import Modal from "../../../components/common/Modal";
import StatusModal from "../../../components/common/StatusModal";
import ConfirmModal from "../../../components/common/ConfirmModal";
import {
  Input,
  Select,
  Button,
  TextArea,
} from "../../../components/common/Forms";
import DashboardHeader from "../../../components/dashboard/DashboardHeader";
import StockChart from "../../../components/dashboard/charts/StockChart";
import StockAdjustmentModal from "../../../epics/E5_InventoryManagement/components/Inventory/StockAdjustmentModal";
import "../../../components/dashboard/dashboard.css";
import "./InventoryManagerDashboard.css";

const InventoryManagerDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  // ─────────────────────────────────
  // State Variables
  // ─────────────────────────────────
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStock: 0,
    outOfStock: 0,
    locations: 0,
    adjustments: 0,
  });
  const [inventory, setInventory] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [activeTab, setActiveTab] = useState("inventory");
  const [notDispatchedCount, setNotDispatchedCount] = useState(0);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedItemForAdj, setSelectedItemForAdj] = useState(null);
  const [selectedItemForHistory, setSelectedItemForHistory] = useState(null);
  const [transferForm, setTransferForm] = useState({
    product: "",
    fromLocation: "",
    toLocation: "",
    quantity: 1,
    reason: "",
  });

  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [sourceInventory, setSourceInventory] = useState([]);
  const [sourceLoading, setSourceLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [movements, setMovements] = useState([]);
  const [distribution, setDistribution] = useState([]);
  const [orders, setOrders] = useState([]);
  const [approvalRequests, setApprovalRequests] = useState([]);

  // Search state for inventory table
  const [inventorySearch, setInventorySearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Stock movements state for filtering and pagination
  const [movementSearch, setMovementSearch] = useState("");
  const [movementTypeFilter, setMovementTypeFilter] = useState("All");
  const [movementPage, setMovementPage] = useState(1);
  const movementsPerPage = 10;

  const [availableLocations, setAvailableLocations] = useState([]);
  const [allLocations, setAllLocations] = useState([]);
  const [mainWarehouseName, setMainWarehouseName] = useState("Main");
  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    confirmText: "Confirm",
    variant: "primary",
  });

  const closeConfirm = () =>
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));

  // Determine available locations based on role
  const isMasterOrAdmin =
    user?.role === "admin" ||
    user?.role === "master_inventory_manager" ||
    user?.assignedLocation === "All" ||
    !user?.assignedLocation;

  const canEdit =
    user?.role === "admin" || user?.role === "master_inventory_manager";

  const [selectedLocation, setSelectedLocation] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize data on mount
  // ─────────────────────────────────
  // Side Effects
  // ─────────────────────────────────
  useEffect(() => {
    const init = async () => {
      await fetchLocations();
      setIsInitialized(true);
    };
    init();
    fetchTransfers();
    fetchOrders();
  }, []);

  // ─────────────────────────────────
  // Event Handlers
  // ─────────────────────────────────
  const fetchLocations = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/locations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const locations = res.data.locations || [];
      const locNames = locations.map((loc) => loc.name);
      const finalLocs = locNames.length > 0 ? locNames : ["Main"];
      setAllLocations(finalLocs);

      // Identify main warehouse
      const mainLoc = locations.find((l) => l.isMainWarehouse);
      const mainName = mainLoc ? mainLoc.name : finalLocs[0];
      setMainWarehouseName(mainName);

      if (isMasterOrAdmin) {
        setAvailableLocations(finalLocs);
      } else {
        setAvailableLocations([user?.assignedLocation].filter(Boolean));
      }

      // Handle initial location selection
      const params = new URLSearchParams(window.location.search);
      const locParam = params.get("location");
      const searchParam = params.get("search");

      const tabParam = params.get("tab");
      if (tabParam) {
        setActiveTab(tabParam);
      }

      if (locParam && finalLocs.includes(locParam)) {
        setSelectedLocation(locParam);
      } else if (!isMasterOrAdmin && user?.assignedLocation) {
        setSelectedLocation(user.assignedLocation);
      } else {
        setSelectedLocation(mainName);
      }

      if (searchParam) {
        setInventorySearch(searchParam);
        setDebouncedSearch(searchParam);
      }
    } catch (error) {
      console.error("Error fetching locations:", error);
      const fallbackLocs = ["Main"];
      setAllLocations(fallbackLocs);
      setSelectedLocation("Main");
      if (isMasterOrAdmin) setAvailableLocations(fallbackLocs);
    }
  };

  const LOCATIONS = availableLocations;

  // Initialize transfer form defaults
  useEffect(() => {
    if (showTransferModal) {
      const otherLocation =
        allLocations.find((l) => l !== selectedLocation) ||
        (selectedLocation === mainWarehouseName ? "Other" : mainWarehouseName);
      setTransferForm((prev) => ({
        ...prev,
        toLocation: selectedLocation,
        fromLocation: otherLocation,
      }));
    }
  }, [showTransferModal, selectedLocation, allLocations, mainWarehouseName]);

  // Fetch inventory for source location in transfer
  useEffect(() => {
    if (showTransferModal && transferForm.fromLocation) {
      fetchSourceInventory(transferForm.fromLocation);
    }
  }, [showTransferModal, transferForm.fromLocation]);

  const fetchSourceInventory = async (locationName) => {
    try {
      setSourceLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(`/api/inventory/location/${locationName}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSourceInventory(res.data.inventory || []);
      setSourceLoading(false);
    } catch (error) {
      console.error("Error fetching source inventory:", error);
      setSourceLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get("tab");
    const locParam = params.get("location");
    const searchParam = params.get("search");

    if (tabParam) {
      setActiveTab(tabParam);
    } else if (location.pathname === "/inventory-manager/dashboard") {
      setActiveTab("inventory");
    }
    if (locParam && allLocations.includes(locParam)) {
      setSelectedLocation(locParam);
    }
    if (searchParam) {
      setInventorySearch(searchParam);
      setDebouncedSearch(searchParam);
    }
  }, [location.search, allLocations]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(inventorySearch);
    }, 500);
    return () => clearTimeout(timer);
  }, [inventorySearch]);

  useEffect(() => {
    if (isInitialized && selectedLocation) {
      if (user?.role === "master_inventory_manager") {
        fetchOrders();
      }

      if (activeTab === "inventory") {
        fetchInventoryData(debouncedSearch);
        fetchDashboardStats();
      } else if (activeTab === "transfers") {
        fetchTransfers();
      } else if (activeTab === "receive") {
        fetchPurchaseOrders();
      } else if (activeTab === "movements") {
        fetchMovements();
      } else if (activeTab === "dispatch") {
        fetchOrders();
      }
    }
  }, [isInitialized, selectedLocation, activeTab, debouncedSearch]);

  // Combined fetch removed from here, integrated into mount init above

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(res.data.orders || []);
      setLoading(false);

      // Calculate non-dispatched orders for the selected location
      const count = (res.data.orders || []).filter(
        (o) =>
          (o.orderStatus === "Pending" || o.orderStatus === "Processing") &&
          o.fulfillmentLocation === selectedLocation &&
          o.orderStatus !== "Cancelled",
      ).length;
      setNotDispatchedCount(count);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    setConfirmModal({
      isOpen: true,
      title: "Update Order Status",
      message: `Are you sure you want to mark this order as ${status}?`,
      confirmText: `Update to ${status}`,
      variant: status === "Delivered" ? "success" : "primary",
      onConfirm: async () => {
        try {
          const token = localStorage.getItem("token");
          await axios.put(
            `/api/orders/${orderId}/status`,
            { orderStatus: status },
            { headers: { Authorization: `Bearer ${token}` } },
          );
          toast.success(`Order marked as ${status}`);
          fetchOrders();
          closeConfirm();
        } catch (error) {
          toast.error("Failed to update order status");
        }
      },
    });
  };

  const handleBulkUpdateStatus = async (fromStatus, toStatus) => {
    const ordersToUpdate = orders.filter(
      (o) =>
        o.orderStatus === fromStatus &&
        o.fulfillmentLocation === selectedLocation &&
        o.orderStatus !== "Cancelled",
    );

    if (ordersToUpdate.length === 0) {
      toast.error(`No ${fromStatus} orders found for ${selectedLocation}`);
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: `Bulk Update: ${toStatus}`,
      message: `Are you sure you want to mark all ${ordersToUpdate.length} "${fromStatus}" orders at ${selectedLocation} as ${toStatus}?`,
      confirmText: `Update ${ordersToUpdate.length} Orders`,
      variant: toStatus === "Shipped" ? "success" : "primary",
      onConfirm: async () => {
        try {
          const token = localStorage.getItem("token");
          const updatePromises = ordersToUpdate.map((order) =>
            axios.put(
              `/api/orders/${order._id}/status`,
              { orderStatus: toStatus },
              { headers: { Authorization: `Bearer ${token}` } },
            ),
          );

          await Promise.all(updatePromises);
          toast.success(
            `Successfully updated ${ordersToUpdate.length} orders to ${toStatus}`,
          );
          fetchOrders();
          closeConfirm();
        } catch (error) {
          console.error("Bulk update error:", error);
          toast.error("Failed to update some orders. Please try again.");
          fetchOrders();
        }
      },
    });
  };

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const statsRes = await axios.get(
        `/api/inventory/stats?location=${encodeURIComponent(selectedLocation)}`,
        config,
      );
      setStats(statsRes.data.stats);
      setDistribution(statsRes.data.distribution);

      const alertsRes = await axios.get(
        `/api/inventory/alerts?location=${encodeURIComponent(selectedLocation)}`,
        config,
      );
      setLowStockAlerts(alertsRes.data.alerts || []);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    }
  };

  const fetchInventoryData = async (search = "") => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const inventoryRes = await axios.get(
        `/api/inventory/location/${selectedLocation}?search=${search}`,
        config,
      );
      const inventoryData = inventoryRes.data.inventory || [];

      setInventory(inventoryData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching inventory data:", error);
      setLoading(false);
    }
  };

  const fetchPurchaseOrders = async () => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(
        "/api/purchase-orders?status=Approved",
        config,
      );
      setPurchaseOrders(res.data.purchaseOrders || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching purchase orders:", error);
      setLoading(false);
    }
  };

  const handleReceivePO = (poId, status = "Received") => {
    setConfirmModal({
      isOpen: true,
      title: "Confirm Status Update",
      message: `Mark this PO as ${status}? This will update inventory stock levels.`,
      confirmText: "Yes, Update",
      variant: "primary",
      onConfirm: async () => {
        closeConfirm();
        try {
          const token = localStorage.getItem("token");
          await axios.put(
            `/api/purchase-orders/${poId}/status`,
            { status, receivedAt: selectedLocation },
            { headers: { Authorization: `Bearer ${token}` } },
          );
          toast.success(
            `Order marked as ${status} successfully! Inventory updated.`,
          );
          fetchPurchaseOrders();
          fetchInventoryData();
          fetchDashboardStats();
        } catch (error) {
          console.error("Error receiving/dispatching PO:", error);
          toast.error(error.response?.data?.message || "Failed to update PO");
        }
      },
    });
  };

  const fetchMovements = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `/api/inventory/movements?location=${selectedLocation}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setMovements(res.data.movements || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching movements:", error);
      setLoading(false);
    }
  };

  const fetchTransfers = async () => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(
        `/api/stock-transfers?location=${selectedLocation}`,
        config,
      );
      setTransfers(res.data.transfers || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching transfers:", error);
      setLoading(false);
    }
  };

  const handleAdjustStock = async (
    inventoryId,
    adjustment,
    reason,
    reorderPoint,
  ) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "/api/inventory/adjust",
        { inventoryId, adjustment, reason, reorderPoint },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      fetchInventoryData();
      fetchDashboardStats();
      if (res.data.pendingApproval) {
        toast.success("Adjustment request submitted for Admin approval.", {
          duration: 4000,
        });
      } else {
        toast.success("Stock adjusted successfully");
      }
    } catch (error) {
      console.error("Error adjusting stock:", error);
      toast.error("Failed to adjust stock");
    }
  };

  const handleRequestTransfer = (e) => {
    e.preventDefault();
    if (transferForm.quantity <= 0) {
      toast.error("Transfer quantity must be greater than 0.");
      return;
    }

    if (!transferForm.reason || transferForm.reason.trim() === "") {
      toast.error("A proper reason for the transfer is required.");
      return;
    }

    if (transferForm.fromLocation === transferForm.toLocation) {
      toast.error("Source and destination locations must be different.");
      return;
    }

    // Find the item in the selected source inventory
    const sourceItem = sourceInventory.find(
      (item) => item.product && item.product._id === transferForm.product,
    );

    if (!sourceItem) {
      toast.error("Selected product not found in source location inventory.");
      return;
    }

    if (transferForm.quantity > sourceItem.quantity) {
      toast.error(
        `Insufficient stock at source. Only ${sourceItem.quantity} units available.`,
      );
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: "Confirm Stock Transfer Request",
      message: `Are you sure you want to request transfer of ${transferForm.quantity} unit(s) of "${sourceItem.product.title}" from ${transferForm.fromLocation} to ${transferForm.toLocation}?`,
      onConfirm: executeTransferRequest,
    });
  };

  const executeTransferRequest = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post("/api/stock-transfers/request", transferForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConfirmModal({ ...confirmModal, isOpen: false });
      setShowTransferModal(false);
      toast.success("Transfer request submitted successfully");
      fetchTransfers();
      fetchDashboardStats(); // Refresh stats
      setTransferForm({
        product: "",
        fromLocation: mainWarehouseName,
        toLocation: selectedLocation,
        quantity: 1,
        reason: "",
      });
    } catch (error) {
      console.error("Error requesting transfer:", error);
      setConfirmModal({ ...confirmModal, isOpen: false });
      toast.error(
        error.response?.data?.message || "Failed to request transfer.",
      );
    }
  };

  const fetchApprovals = async () => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get("/api/approvals", config);
      // Filter for Product module requests for this dashboard
      const productRequests = (res.data.requests || []).filter(
        (r) => r.module === "Product" || r.module === "Inventory",
      );
      setApprovalRequests(productRequests);
    } catch (error) {
      console.error("Error fetching approvals:", error);
    }
  };

  const handleReviewApproval = (id, module, action, status) => {
    setConfirmModal({
      isOpen: true,
      title: `${status === "Approved" ? "Approve" : "Reject"} ${module} ${action}?`,
      message: `Are you sure you want to ${status.toLowerCase()} this ${module.toLowerCase()} ${action.toLowerCase()} request?`,
      confirmText: `Yes, ${status}`,
      variant: status === "Rejected" ? "danger" : "primary",
      onConfirm: async () => {
        closeConfirm();
        try {
          const token = localStorage.getItem("token");
          await axios.put(
            `/api/approvals/${id}`,
            { status },
            { headers: { Authorization: `Bearer ${token}` } },
          );
          fetchApprovals();
          fetchInventoryData();
          fetchDashboardStats();
          toast.success(`Request ${status.toLowerCase()} successfully`);
        } catch (error) {
          console.error(`Error ${status.toLowerCase()}ing request:`, error);
          toast.error(`Failed to ${status.toLowerCase()} request`);
        }
      },
    });
  };

  const handleApproveTransfer = (id, action) => {
    setConfirmModal({
      isOpen: true,
      title: "Confirm Transfer",
      message: `Are you sure you want to ${action} this transfer?`,
      confirmText: `Yes, ${action}`,
      variant: action === "reject" ? "danger" : "primary",
      onConfirm: async () => {
        closeConfirm();
        try {
          const token = localStorage.getItem("token");
          await axios.put(
            `/api/stock-transfers/${id}/approve`,
            { action },
            { headers: { Authorization: `Bearer ${token}` } },
          );
          fetchTransfers();
          fetchInventoryData();
          fetchDashboardStats();
          toast.success(`Transfer ${action}d successfully`);
        } catch (error) {
          console.error(`Error ${action}ing transfer:`, error);
          toast.error(`Failed to ${action} transfer`);
        }
      },
    });
  };

  // Filtered inventory for search (now handled server-side, but keeping this for local consistency if needed)
  const filteredInventory = inventory;

  // --- Filtering & Pagination for Movements ---
  const filteredMovements = movements.filter((move) => {
    // 1. Text Search
    const searchMatch =
      !movementSearch ||
      (move.product?.title || "")
        .toLowerCase()
        .includes(movementSearch.toLowerCase()) ||
      (move.product?.isbn || "")
        .toLowerCase()
        .includes(movementSearch.toLowerCase());

    // 2. Type Filter
    const typeMatch =
      movementTypeFilter === "All" || move.type === movementTypeFilter;

    return searchMatch && typeMatch;
  });

  const totalMovementPages = Math.ceil(
    filteredMovements.length / movementsPerPage,
  );
  const currentMovements = filteredMovements.slice(
    (movementPage - 1) * movementsPerPage,
    movementPage * movementsPerPage,
  );

  // Reset to first page if search/filter changes
  useEffect(() => {
    setMovementPage(1);
  }, [movementSearch, movementTypeFilter]);
  // ---------------------------------------------

  if (loading) {
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
        title="Inventory Manager Dashboard"
        subtitle="Track and manage stock across locations"
        actions={[
          {
            label: "Adjust Stock",
            icon: <Edit size={18} />,
            onClick: () => {
              setActiveTab("inventory");
              setSelectedItemForAdj(null);
              setShowAdjustmentModal(true);
            },
            variant: "primary",
          },
          {
            label: "Request Transfer",
            icon: <Plus size={18} />,
            onClick: () => setShowTransferModal(true),
            variant: "outline",
          },
        ]}
      />

      {/* Stats Grid — E5.1/E5.2/E5.9 */}
      <div
        className={`dashboard-grid ${availableLocations.length > 1 ? "dashboard-grid-main-side" : ""}`}
      >
        <div>
          <div
            className={`dashboard-grid ${availableLocations.length > 1 ? "dashboard-grid-4" : "dashboard-grid-3"}`}
          >
            <StatCard
              icon={<Package size={24} />}
              label="Total Items"
              value={stats.totalItems}
              variant="primary"
            />
            <StatCard
              icon={<AlertTriangle size={24} />}
              label="Low Stock"
              value={stats.lowStock}
              variant="warning"
            />
            <StatCard
              icon={<XCircle size={24} />}
              label="Out of Stock"
              value={stats.outOfStock}
              variant="danger"
            />
            {availableLocations.length > 1 && (
              <StatCard
                icon={<MapPin size={24} />}
                label="Locations"
                value={stats.locations}
                variant="primary"
              />
            )}
            {user?.role === "master_inventory_manager" && (
              <StatCard
                icon={<Clock size={24} />}
                label="Not Dispatched"
                value={notDispatchedCount}
                variant="warning"
                onClick={() => setActiveTab("dispatch")}
              />
            )}
          </div>
        </div>

        {/* Chart Column — Only show if multiple locations exist for comparison */}
        {availableLocations.length > 1 && (
          <div className="dashboard-card">
            <StockChart data={distribution} />
          </div>
        )}
      </div>

      {/* Location Tabs + View Toggle */}
      <div className="dashboard-controls">
        {LOCATIONS.length > 1 && (
          <div className="dashboard-tabs">
            {LOCATIONS.map((location) => (
              <button
                key={location}
                className={`tab-btn ${selectedLocation === location ? "active" : ""}`}
                onClick={() => setSelectedLocation(location)}
              >
                {location}
              </button>
            ))}
          </div>
        )}
        <div className="view-toggle">
          <button
            className={`toggle-btn ${activeTab === "inventory" ? "active" : ""}`}
            onClick={() => setActiveTab("inventory")}
          >
            Inventory
          </button>
          <button
            className={`toggle-btn ${activeTab === "transfers" ? "active" : ""}`}
            onClick={() => setActiveTab("transfers")}
          >
            Transfers
          </button>
          <button
            className={`toggle-btn ${activeTab === "receive" ? "active" : ""}`}
            onClick={() => setActiveTab("receive")}
          >
            Receive from PO
          </button>
          {user?.role === "master_inventory_manager" && (
            <button
              className={`toggle-btn ${activeTab === "dispatch" ? "active" : ""}`}
              onClick={() => setActiveTab("dispatch")}
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              Orders
              {notDispatchedCount > 0 && (
                <span
                  className="count-badge"
                  style={{
                    backgroundColor: "var(--warning-color)",
                    color: "white",
                    borderRadius: "10px",
                    padding: "0 6px",
                    fontSize: "0.7rem",
                    fontWeight: "bold",
                  }}
                >
                  {notDispatchedCount}
                </span>
              )}
            </button>
          )}
          {user?.role === "master_inventory_manager" && (
            <button
              className={`toggle-btn ${activeTab === "approvals" ? "active" : ""}`}
              onClick={() => setActiveTab("approvals")}
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              Approvals
              {approvalRequests.length > 0 && (
                <span
                  className="count-badge"
                  style={{
                    backgroundColor: "var(--accent-color)",
                    color: "white",
                    borderRadius: "10px",
                    padding: "0 6px",
                    fontSize: "0.7rem",
                    fontWeight: "bold",
                  }}
                >
                  {approvalRequests.length}
                </span>
              )}
            </button>
          )}
          <button
            className={`toggle-btn ${activeTab === "movements" ? "active" : ""}`}
            onClick={() => setActiveTab("movements")}
          >
            Movements
          </button>
        </div>
      </div>

      {/* ── INVENTORY TAB ── */}
      {activeTab === "inventory" && (
        <div className="dashboard-card" id="inventory-section">
          <div className="dashboard-card-header">
            <h2 className="card-title">Stock at {selectedLocation}</h2>
            <div className="card-header-actions">
              <div className="search-bar" style={{ maxWidth: "240px" }}>
                <Search size={16} className="detail-label-icon" />
                <input
                  type="text"
                  placeholder="Search product or ISBN…"
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>ISBN</th>
                  <th>Available Stock</th>
                  <th>Reorder Level</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="table-empty-state">
                      {inventorySearch
                        ? "No items match your search."
                        : "No inventory data for this location."}
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map((item) => (
                    <tr key={item._id}>
                      <td>
                        <strong>{item.product?.title || "N/A"}</strong>
                      </td>
                      <td>{item.product?.isbn || "N/A"}</td>
                      <td>
                        <span
                          className={`quantity-badge ${
                            (item.availableQuantity ?? item.quantity) === 0
                              ? "out"
                              : (item.availableQuantity ?? item.quantity) <
                                  (item.reorderPoint || item.lowStockThreshold)
                                ? "low"
                                : "normal"
                          }`}
                        >
                          {item.availableQuantity ?? item.quantity}
                        </span>
                      </td>
                      <td>
                        {item.reorderPoint || item.lowStockThreshold || 0}
                      </td>
                      <td>
                        {(item.availableQuantity ?? item.quantity) === 0 ? (
                          <span className="status-badge inactive">
                            Out of Stock
                          </span>
                        ) : (item.availableQuantity ?? item.quantity) <
                          (item.reorderPoint || item.lowStockThreshold) ? (
                          <span className="status-badge pending">
                            Low Stock
                          </span>
                        ) : (
                          <span className="status-badge active">In Stock</span>
                        )}
                      </td>
                      <td>
                        <div className="table-actions">
                          {canEdit && (
                            <button
                              className="btn-icon"
                              title="Adjust Stock"
                              onClick={() => {
                                setSelectedItemForAdj(item);
                                setShowAdjustmentModal(true);
                              }}
                            >
                              <Edit size={16} />
                            </button>
                          )}
                          <button
                            className="btn-icon"
                            title="View History"
                            onClick={() => {
                              setSelectedItemForHistory(item);
                              setShowHistoryModal(true);
                            }}
                          >
                            <History size={16} />
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
      )}

      {/* ── PRODUCT APPROVALS TAB ── */}
      {activeTab === "approvals" && (
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h2 className="card-title">
              Pending Product & Inventory Approvals
            </h2>
            <span className="card-subtitle">
              Critical requests awaiting your review
            </span>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Requested By</th>
                  <th>Module</th>
                  <th>Action</th>
                  <th>Target Details</th>
                  <th>Requested Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {approvalRequests.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="table-empty-state">
                      No pending approval requests found.
                    </td>
                  </tr>
                ) : (
                  approvalRequests.map((req) => (
                    <tr key={req._id}>
                      <td>
                        <div
                          style={{ display: "flex", flexDirection: "column" }}
                        >
                          <span style={{ fontWeight: "600" }}>
                            {req.requestedBy?.name || "Unknown"}
                          </span>
                          <span
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--text-light)",
                            }}
                          >
                            {req.requestedBy?.role}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`status-badge ${req.module === "Product" ? "active" : "pending"}`}
                        >
                          {req.module}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: "500" }}>{req.action}</span>
                      </td>
                      <td>
                        <div style={{ fontSize: "0.85rem", maxWidth: "250px" }}>
                          {req.action === "Delete" ? (
                            <span>
                              Delete Product:{" "}
                              <strong>{req.targetData?.title}</strong>
                            </span>
                          ) : req.action === "Adjust Stock" ? (
                            <span>
                              Adjust Stock:{" "}
                              <strong>
                                {req.targetData?.quantityChange > 0 ? "+" : ""}
                                {req.targetData?.quantityChange}
                              </strong>
                            </span>
                          ) : (
                            <span>{JSON.stringify(req.targetData)}</span>
                          )}
                        </div>
                      </td>
                      <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="btn-icon"
                            style={{ color: "var(--success-color)" }}
                            title="Approve"
                            onClick={() =>
                              handleReviewApproval(
                                req._id,
                                req.module,
                                req.action,
                                "Approved",
                              )
                            }
                          >
                            <Check size={18} />
                          </button>
                          <button
                            className="btn-icon"
                            style={{ color: "var(--danger-color)" }}
                            title="Reject"
                            onClick={() =>
                              handleReviewApproval(
                                req._id,
                                req.module,
                                req.action,
                                "Rejected",
                              )
                            }
                          >
                            <XCircle size={18} />
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
      )}

      {/* ── RECEIVE FROM PO TAB — E5.6 ── */}
      {activeTab === "receive" && (
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h2 className="card-title">Receive Stock from Purchase Orders</h2>
            <span className="card-subtitle">
              Approved POs awaiting receipt at {selectedLocation}
            </span>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Supplier</th>
                  <th>Items</th>
                  <th>Total Value</th>
                  <th>Order Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {purchaseOrders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="table-empty-state">
                      No approved POs awaiting processing.
                    </td>
                  </tr>
                ) : (
                  purchaseOrders.map((po) => {
                    const isOutward =
                      po.supplier?.category === "Distributor" ||
                      po.supplier?.category === "Bookshop";
                    return (
                      <tr key={po._id}>
                        <td>
                          <strong>#{po.poNumber}</strong>
                        </td>
                        <td>{po.supplier?.name || "N/A"}</td>
                        <td>
                          {po.items?.length || 0} item(s)
                          <div className="text-muted text-xs">
                            {po.items
                              ?.slice(0, 2)
                              .map((i) => i.product?.title || "Unknown")
                              .join(", ")}
                            {po.items?.length > 2
                              ? ` +${po.items.length - 2} more`
                              : ""}
                          </div>
                        </td>
                        <td>Rs. {(po.totalAmount || 0).toLocaleString()}</td>
                        <td>{new Date(po.createdAt).toLocaleDateString()}</td>
                        <td>
                          {canEdit && (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() =>
                                handleReceivePO(
                                  po._id,
                                  isOutward ? "Dispatched" : "Received",
                                )
                              }
                            >
                              <Check size={14} />{" "}
                              {isOutward ? "Dispatch Stock" : "Receive Stock"}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TRANSFERS TAB ── */}
      {activeTab === "transfers" && (
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h2 className="card-title">Stock Transfers ({selectedLocation})</h2>
            {canEdit && (
              <button
                className="btn btn-primary"
                onClick={() => setShowTransferModal(true)}
              >
                <Plus size={16} /> Request Transfer
              </button>
            )}
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Product</th>
                  <th>Route</th>
                  <th>Quantity</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transfers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="table-empty-state">
                      No transfers found
                    </td>
                  </tr>
                ) : (
                  transfers.map((transfer) => (
                    <tr key={transfer._id}>
                      <td>
                        {new Date(transfer.createdAt).toLocaleDateString()}
                      </td>
                      <td>{transfer.product?.title || "Unknown Product"}</td>
                      <td>
                        {transfer.fromLocation} <ArrowRight size={14} />{" "}
                        {transfer.toLocation}
                      </td>
                      <td>{transfer.quantity}</td>
                      <td>
                        <span
                          className={`status-badge ${
                            transfer.status === "Completed"
                              ? "active"
                              : transfer.status === "Rejected"
                                ? "inactive"
                                : "pending"
                          }`}
                        >
                          {transfer.status}
                        </span>
                      </td>
                      <td>
                        {transfer.status === "Requested" &&
                          canEdit &&
                          (isMasterOrAdmin ||
                            transfer.fromLocation === selectedLocation) && (
                            <div className="table-actions">
                              <button
                                className="btn-icon success"
                                title="Approve"
                                onClick={() =>
                                  handleApproveTransfer(transfer._id, "approve")
                                }
                              >
                                <Check size={16} />
                              </button>
                              <button
                                className="btn-icon error"
                                title="Reject"
                                onClick={() =>
                                  handleApproveTransfer(transfer._id, "reject")
                                }
                              >
                                <X size={16} />
                              </button>
                            </div>
                          )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── LOW STOCK ALERTS — E5.9 (lists actual items) ── */}
      {stats.lowStock > 0 && (
        <div className="dashboard-card alert-card low-stock-alert">
          <div className="alert-header">
            <h3>
              <AlertTriangle size={20} /> Low Stock Alerts (Global)
            </h3>
            <span className="alert-count">{lowStockAlerts.length} items</span>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Location</th>
                  <th>Available Qty</th>
                  <th>Reorder Level</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {lowStockAlerts.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <strong>{item.product?.title || "N/A"}</strong>
                      <div
                        className="text-secondary"
                        style={{ fontSize: "0.75rem" }}
                      >
                        ISBN: {item.product?.isbn || "N/A"}
                      </div>
                    </td>
                    <td>
                      <span className="role-badge">{item.location}</span>
                    </td>
                    <td>
                      <span
                        className={`quantity-badge ${item.currentStock === 0 ? "out" : "low"}`}
                      >
                        {item.currentStock}
                      </span>
                    </td>
                    <td>{item.reorderLevel}</td>
                    <td>
                      {canEdit && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => {
                            setSelectedItemForAdj(item);
                            setShowAdjustmentModal(true);
                          }}
                        >
                          Adjust Stock
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {activeTab === "movements" && (
        <div className="dashboard-card glass-card">
          <div
            className="card-header"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem",
            }}
          >
            <h3 className="card-title">Stock Movements History</h3>

            {/* Functional Toolbar */}
            <div
              className="card-header-actions"
              style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}
            >
              <div className="search-bar" style={{ minWidth: "240px" }}>
                <Search size={16} className="detail-label-icon" />
                <input
                  type="text"
                  placeholder="Search Product or ISBN..."
                  value={movementSearch}
                  onChange={(e) => setMovementSearch(e.target.value)}
                />
              </div>

              <div style={{ minWidth: "150px" }}>
                <Select
                  value={movementTypeFilter}
                  onChange={(e) => setMovementTypeFilter(e.target.value)}
                  options={[
                    { value: "All", label: "All Types" },
                    { value: "Add", label: "Add" },
                    { value: "Remove", label: "Remove" },
                    { value: "Sale", label: "Sale" },
                    { value: "Transfer In", label: "Transfer In" },
                    { value: "Transfer Out", label: "Transfer Out" },
                    { value: "Damage", label: "Damage" },
                    { value: "Loss", label: "Loss" },
                    { value: "Found", label: "Found" },
                  ]}
                />
              </div>
            </div>
          </div>

          <div className="dashboard-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Product</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>Location</th>
                  <th>Reason</th>
                  <th>User</th>
                </tr>
              </thead>
              <tbody>
                {currentMovements.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="text-center py-8 text-secondary"
                      style={{ textAlign: "center", padding: "3rem" }}
                    >
                      No stock movements found for the selected criteria.
                    </td>
                  </tr>
                ) : (
                  currentMovements.map((move) => (
                    <tr key={move._id}>
                      <td>
                        <div
                          style={{ display: "flex", flexDirection: "column" }}
                        >
                          <span style={{ fontWeight: 600 }}>
                            {new Date(move.timestamp).toLocaleDateString()}
                          </span>
                          <span
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--text-secondary)",
                            }}
                          >
                            {new Date(move.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div
                          style={{ display: "flex", flexDirection: "column" }}
                        >
                          <span style={{ fontWeight: 600 }}>
                            {move.product?.title || "Unknown Product"}
                          </span>
                          <span
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--text-secondary)",
                            }}
                          >
                            ISBN: {move.product?.isbn || "N/A"}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`status-badge ${
                            move.quantity > 0 ? "completed" : "cancelled"
                          }`}
                        >
                          {move.type}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            fontWeight: 700,
                            color: move.quantity > 0 ? "#10b981" : "#ef4444",
                          }}
                        >
                          {move.quantity > 0
                            ? `+${move.quantity}`
                            : move.quantity}
                        </span>
                      </td>
                      <td>
                        <span className="role-badge">{move.location}</span>
                      </td>
                      <td>{move.reason}</td>
                      <td>{move.adjustedBy?.name || "System"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalMovementPages > 1 && (
            <div
              className="pagination-controls"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "1.5rem",
                borderTop: "1px solid var(--border-color)",
              }}
            >
              <div
                style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}
              >
                Showing {(movementPage - 1) * movementsPerPage + 1} to{" "}
                {Math.min(
                  movementPage * movementsPerPage,
                  filteredMovements.length,
                )}{" "}
                of {filteredMovements.length} movements
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMovementPage((p) => Math.max(1, p - 1))}
                  disabled={movementPage === 1}
                >
                  Previous
                </Button>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "0 0.5rem",
                    fontWeight: "600",
                  }}
                >
                  {movementPage} / {totalMovementPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setMovementPage((p) => Math.min(totalMovementPages, p + 1))
                  }
                  disabled={movementPage === totalMovementPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MODALS ── */}

      <StatusModal
        isOpen={statusModal.isOpen}
        onClose={() => setStatusModal({ ...statusModal, isOpen: false })}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        confirmText="Confirm Transfer"
      />

      {/* Request Transfer Modal */}
      <Modal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        title="Request Stock Transfer"
        size="md"
      >
        <form onSubmit={handleRequestTransfer}>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <div
              className="form-row"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
              }}
            >
              <Select
                label="Source (Request From)"
                required
                value={transferForm.fromLocation}
                onChange={(e) =>
                  setTransferForm({
                    ...transferForm,
                    fromLocation: e.target.value,
                    product: "", // Reset product when location changes
                  })
                }
                options={allLocations
                  .filter((loc) => loc !== transferForm.toLocation)
                  .map((loc) => ({ value: loc, label: loc }))}
              />
              <Select
                label="Destination (Receiving At)"
                required
                value={transferForm.toLocation}
                disabled={!isMasterOrAdmin} // Restrict if not master/admin
                onChange={(e) =>
                  setTransferForm({
                    ...transferForm,
                    toLocation: e.target.value,
                  })
                }
                options={allLocations
                  .filter((loc) => loc !== transferForm.fromLocation)
                  .map((loc) => ({ value: loc, label: loc }))}
              />
            </div>

            <Select
              label="Product to Transfer"
              required
              value={transferForm.product}
              disabled={sourceLoading || sourceInventory.length === 0}
              onChange={(e) =>
                setTransferForm({ ...transferForm, product: e.target.value })
              }
              options={sourceInventory
                .filter((item) => item.product?._id)
                .map((item) => ({
                  value: item.product._id,
                  label: `${item.product.title} (Available: ${item.availableQuantity})`,
                }))}
              helperText={
                sourceLoading
                  ? "Loading products..."
                  : sourceInventory.length === 0
                    ? `No products found at ${transferForm.fromLocation}`
                    : `Showing products available at ${transferForm.fromLocation}`
              }
            />

            <div
              className="form-row"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
              }}
            >
              <Input
                label="Transfer Quantity"
                type="number"
                min="1"
                required
                value={transferForm.quantity}
                onChange={(e) =>
                  setTransferForm({
                    ...transferForm,
                    quantity: parseInt(e.target.value),
                  })
                }
              />
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  paddingBottom: "0.5rem",
                }}
              >
                {transferForm.product && (
                  <span
                    className="text-secondary"
                    style={{ fontSize: "0.8rem" }}
                  >
                    Max available:{" "}
                    {sourceInventory.find(
                      (i) => i.product?._id === transferForm.product,
                    )?.availableQuantity || 0}
                  </span>
                )}
              </div>
            </div>

            <TextArea
              label="Reason for Transfer"
              required
              value={transferForm.reason}
              onChange={(e) =>
                setTransferForm({ ...transferForm, reason: e.target.value })
              }
              placeholder={`e.g. Stock replenishment for ${transferForm.toLocation || "branch"}`}
            />
          </div>

          <div className="dash-modal-actions" style={{ marginTop: "2rem" }}>
            <Button
              type="button"
              onClick={() => setShowTransferModal(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={
                !transferForm.product ||
                transferForm.quantity <= 0 ||
                transferForm.fromLocation === transferForm.toLocation
              }
            >
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={showAdjustmentModal}
        onClose={() => {
          setShowAdjustmentModal(false);
          setSelectedItemForAdj(null);
        }}
        onConfirm={handleAdjustStock}
        item={selectedItemForAdj}
        location={selectedLocation}
      />

      {/* Stock History Modal — E5.3 */}
      <Modal
        isOpen={showHistoryModal}
        onClose={() => {
          setShowHistoryModal(false);
          setSelectedItemForHistory(null);
        }}
        title={`Stock History — ${selectedItemForHistory?.product?.title || "Item"}`}
        size="lg"
      >
        {selectedItemForHistory && (
          <>
            <div
              className="view-details-grid"
              style={{
                gridTemplateColumns: "repeat(3, 1fr)",
                marginBottom: "1rem",
              }}
            >
              <div className="detail-item">
                <label>Available Stock</label>
                <span>
                  <strong>
                    {selectedItemForHistory.availableQuantity ??
                      selectedItemForHistory.quantity}
                  </strong>
                </span>
              </div>
              <div className="detail-item">
                <label>Reorder Level</label>
                <span>
                  {selectedItemForHistory.reorderPoint ||
                    selectedItemForHistory.lowStockThreshold ||
                    0}
                </span>
              </div>
              <div className="detail-item">
                <label>Location</label>
                <span>{selectedLocation}</span>
              </div>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Adjustment</th>
                    <th>Reason</th>
                    <th>By</th>
                  </tr>
                </thead>
                <tbody>
                  {!selectedItemForHistory.adjustments ||
                  selectedItemForHistory.adjustments.length === 0 ? (
                    <tr>
                      <td
                        colSpan="4"
                        style={{ textAlign: "center", padding: "1.5rem" }}
                        className="text-muted"
                      >
                        <Clock
                          size={20}
                          style={{ display: "block", margin: "0 auto 0.5rem" }}
                        />
                        No adjustment history recorded yet.
                      </td>
                    </tr>
                  ) : (
                    [...selectedItemForHistory.adjustments]
                      .reverse()
                      .map((entry, idx) => (
                        <tr key={idx}>
                          <td>
                            {entry.timestamp
                              ? new Date(entry.timestamp).toLocaleString()
                              : "—"}
                          </td>
                          <td>
                            <span
                              className={
                                entry.quantity > 0
                                  ? "status-badge success"
                                  : "status-badge error"
                              }
                            >
                              {entry.quantity > 0 ? "+" : ""}
                              {entry.quantity}
                            </span>
                          </td>
                          <td>{entry.reason || "—"}</td>
                          <td>{entry.adjustedBy?.name || "System"}</td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Modal>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirm}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText || "Confirm"}
        variant={confirmModal.variant || "primary"}
      />

      {/* ── DISPATCH TAB (ORDERS) ── */}
      {activeTab === "dispatch" &&
        user?.role === "master_inventory_manager" && (
          <div className="dashboard-card" style={{ marginTop: "20px" }}>
            <div className="dashboard-card-header">
              <div>
                <h2 className="card-title">Pending & Processing Orders</h2>
                <p className="text-secondary text-sm">
                  Manage order fulfillment and tracking for {selectedLocation}.
                </p>
              </div>
              <div
                className="bulk-actions"
                style={{ display: "flex", gap: "10px" }}
              >
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() =>
                    handleBulkUpdateStatus("Pending", "Processing")
                  }
                  title="Move all Pending orders to Processing"
                >
                  <RefreshCw size={14} /> Process All Pending
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() =>
                    handleBulkUpdateStatus("Processing", "Shipped")
                  }
                  title="Dispatch all Processing orders"
                >
                  <Package size={14} /> Dispatch All Processing
                </button>
              </div>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Location</th>
                    <th>Items</th>
                    <th>Order Status</th>
                    <th>Payment</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders
                    .filter(
                      (o) =>
                        o.orderStatus !== "Cancelled" &&
                        o.fulfillmentLocation === selectedLocation,
                    )
                    .map((order) => (
                      <tr
                        key={order._id}
                        style={{
                          backgroundColor:
                            order.orderStatus === "Pending" ||
                            order.orderStatus === "Processing"
                              ? "var(--bg-color-hover)"
                              : "transparent",
                          borderLeft:
                            order.orderStatus === "Pending" ||
                            order.orderStatus === "Processing"
                              ? "4px solid var(--primary-color)"
                              : "none",
                        }}
                      >
                        <td>
                          <strong>#{order._id.slice(-6).toUpperCase()}</strong>
                          <div style={{ fontSize: "0.75rem", color: "#888" }}>
                            {new Date(order.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td>
                          <div>{order.customer?.name || order.guestName}</div>
                          <div style={{ fontSize: "0.75rem", color: "#888" }}>
                            {order.deliveryAddress?.city}
                          </div>
                        </td>
                        <td>
                          <span className="role-badge">
                            {order.fulfillmentLocation}
                          </span>
                        </td>
                        <td>
                          {order.items.length}{" "}
                          {order.items.length === 1 ? "Book" : "Books"}
                        </td>
                        <td>
                          <span
                            className={`status-badge ${order.orderStatus.toLowerCase()}`}
                          >
                            {order.orderStatus}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`status-badge ${order.paymentStatus === "Paid" ? "success" : "warning"}`}
                          >
                            {order.paymentStatus}
                          </span>
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "#888",
                              marginTop: "2px",
                            }}
                          >
                            {order.paymentMethod}
                          </div>
                        </td>
                        <td>
                          <div className="table-actions">
                            {order.orderStatus === "Pending" && (
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() =>
                                  handleUpdateOrderStatus(
                                    order._id,
                                    "Processing",
                                  )
                                }
                              >
                                Process
                              </button>
                            )}
                            {order.orderStatus === "Processing" && (
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() =>
                                  handleUpdateOrderStatus(order._id, "Shipped")
                                }
                              >
                                Dispatch
                              </button>
                            )}
                            {order.orderStatus === "Shipped" && (
                              <button
                                className="btn btn-gold btn-sm"
                                onClick={() =>
                                  handleUpdateOrderStatus(
                                    order._id,
                                    "Delivered",
                                  )
                                }
                              >
                                Deliver
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan="7" className="text-center py-4">
                        No orders found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
    </div>
  );
};

export default InventoryManagerDashboard;

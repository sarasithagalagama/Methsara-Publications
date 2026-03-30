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
  Truck,
  ShieldCheck,
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
  // State Variables
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
  // [E5.4] Transfer requests between locations — requires fromLocation, toLocation, product, quantity, reason
  const [showTransferModal, setShowTransferModal] = useState(false);
  // [E5.3] Adjustment modal pre-selects the clicked inventory item for quick ± quantity changes
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

  // [E5.9] Low stock alert count surfaces as a stat card — also drives the badge on the sidebar nav
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [sourceInventory, setSourceInventory] = useState([]);
  const [sourceLoading, setSourceLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [movements, setMovements] = useState([]);
  const [distribution, setDistribution] = useState([]);
  const [orders, setOrders] = useState([]);
  // [E5.8] approvalRequests shows stock deduction approvals needed before dispatching orders
  const [approvalRequests, setApprovalRequests] = useState([]);
  // [E4⇔E5] soDispatchRequests: SO dispatch requests from the supplier manager awaiting IM approval
  const [soDispatchRequests, setSODispatchRequests] = useState([]);

  // Approval detail diff modal
  const [showApprovalDetailModal, setShowApprovalDetailModal] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [currentApprovalDoc, setCurrentApprovalDoc] = useState(null);
  const [loadingCurrentApprovalDoc, setLoadingCurrentApprovalDoc] =
    useState(false);
  const [approvalRemarks, setApprovalRemarks] = useState("");

  // [E5.7] Debounce applied to inventory search to avoid filtering on every keystroke
  // Search state for inventory table
  const [inventorySearch, setInventorySearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  // [E5.7] Client-side status filter, sort and pagination for inventory table
  const [inventoryStatusFilter, setInventoryStatusFilter] = useState("All");
  const [inventorySort, setInventorySort] = useState("none");
  const [inventoryPage, setInventoryPage] = useState(1);
  const inventoryPerPage = 10;

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

  // [E5.1] [E5.2] Role determines location scope: master/admin see all, location_manager sees only their site
  const isMasterOrAdmin =
    user?.role === "admin" ||
    user?.role === "master_inventory_manager" ||
    user?.assignedLocation === "All" ||
    !user?.assignedLocation;

  // [E5.3] Determine if user can edit: admin can edit all;
  // master IM defaults to main warehouse; others restricted to assigned location
  const canEditItem = (item) => {
    if (user?.role === "admin") return true;

    if (user?.role === "master_inventory_manager") {
      // Effective editable location: specific assignedLocation, or fall back to main warehouse
      const editableLocation =
        user?.assignedLocation && user?.assignedLocation !== "All"
          ? user.assignedLocation
          : mainWarehouseName;
      return item?.location === editableLocation;
    }

    if (user?.role === "location_inventory_manager") {
      return item?.location === user?.assignedLocation;
    }

    return false;
  };

  // [E5.3] Check if user can edit at the currently selected location
  const canEditCurrentLocation = () => {
    if (user?.role === "admin") return true;

    if (user?.role === "master_inventory_manager") {
      const editableLocation =
        user?.assignedLocation && user?.assignedLocation !== "All"
          ? user.assignedLocation
          : mainWarehouseName;
      return selectedLocation === editableLocation;
    }

    if (user?.role === "location_inventory_manager") {
      return selectedLocation === user?.assignedLocation;
    }

    return false;
  };

  const [selectedLocation, setSelectedLocation] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize data on mount
  // Side Effects
  useEffect(() => {
    const init = async () => {
      await fetchLocations();
      setIsInitialized(true);
    };
    init();
    fetchTransfers();
    fetchOrders();
    fetchSODispatchRequests();
  }, []);

  // Event Handlers
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
        fetchSODispatchRequests();
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

  // [E4⇔E5] Fetch pending SO dispatch requests (DispatchRequested status)
  const fetchSODispatchRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/sales-orders/pending-dispatch", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSODispatchRequests(res.data.salesOrders || []);
    } catch (error) {
      console.error("Error fetching SO dispatch requests:", error);
    }
  };

  // [E4⇔E5] Approve SO dispatch request — deducts inventory and marks SO as Dispatched
  const handleApproveSODispatch = (so) => {
    setConfirmModal({
      isOpen: true,
      title: "Approve Dispatch",
      message: `Approve dispatch for SO #${so.soNumber}?\n\nThis will deduct stock for all items from the main warehouse. This action cannot be undone.`,
      confirmText: "Approve & Dispatch",
      variant: "primary",
      onConfirm: async () => {
        closeConfirm();
        try {
          const token = localStorage.getItem("token");
          await axios.post(
            `/api/sales-orders/${so._id}/approve-dispatch`,
            { notes: "Approved by inventory manager" },
            { headers: { Authorization: `Bearer ${token}` } },
          );
          toast.success(`SO #${so.soNumber} dispatched. Inventory updated.`);
          fetchSODispatchRequests();
          fetchInventoryData();
          fetchDashboardStats();
        } catch (error) {
          console.error("Error approving SO dispatch:", error);
          toast.error(
            error.response?.data?.message || "Failed to approve dispatch",
          );
        }
      },
    });
  };

  // [E4⇔E5] Reject SO dispatch request — returns SO to Processing
  const handleRejectSODispatch = (so) => {
    setConfirmModal({
      isOpen: true,
      title: "Reject Dispatch Request",
      message: `Reject the dispatch request for SO #${so.soNumber}?\n\nThe order will be returned to Processing status. The supplier manager can re-submit after making corrections.`,
      confirmText: "Yes, Reject",
      variant: "danger",
      onConfirm: async () => {
        closeConfirm();
        try {
          const token = localStorage.getItem("token");
          await axios.post(
            `/api/sales-orders/${so._id}/reject-dispatch`,
            { notes: "Rejected by inventory manager" },
            { headers: { Authorization: `Bearer ${token}` } },
          );
          toast.success(`Dispatch request for SO #${so.soNumber} rejected.`);
          fetchSODispatchRequests();
        } catch (error) {
          console.error("Error rejecting SO dispatch:", error);
          toast.error(
            error.response?.data?.message || "Failed to reject dispatch",
          );
        }
      },
    });
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
    // Use .toString() to compare Mongoose ObjectId (object) with string from select value
    const sourceItem = sourceInventory.find(
      (item) =>
        item.product && item.product._id.toString() === transferForm.product,
    );

    if (!sourceItem) {
      toast.error("Selected product not found in source location inventory.");
      return;
    }

    // Check against availableQuantity (quantity minus reserved stock)
    const availableQty = sourceItem.availableQuantity ?? sourceItem.quantity;
    if (transferForm.quantity > availableQty) {
      toast.error(
        `Insufficient available stock at source. Only ${availableQty} units available.`,
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
      setConfirmModal((prev) => ({ ...prev, isOpen: false }));
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
      setConfirmModal((prev) => ({ ...prev, isOpen: false }));
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

  // Open diff detail modal and fetch current document for comparison
  const openApprovalDetailModal = async (req) => {
    setSelectedApproval(req);
    setApprovalRemarks("");
    setCurrentApprovalDoc(null);
    setShowApprovalDetailModal(true);

    const moduleEndpoints = {
      Product: `/api/products/${req.documentId}`,
      Supplier: `/api/suppliers/${req.documentId}`,
    };
    const endpoint = moduleEndpoints[req.module];
    if (endpoint) {
      setLoadingCurrentApprovalDoc(true);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const doc =
          res.data.product || res.data.supplier || res.data.data || res.data;
        setCurrentApprovalDoc(doc);
      } catch (e) {
        console.warn("Could not fetch current document for diff", e);
      } finally {
        setLoadingCurrentApprovalDoc(false);
      }
    }
  };

  const handleApprovalDecision = async (status) => {
    if (!selectedApproval) return;
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `/api/approvals/${selectedApproval._id}`,
        { status, remarks: approvalRemarks },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success(`Request ${status.toLowerCase()} successfully`);
      setShowApprovalDetailModal(false);
      setSelectedApproval(null);
      fetchApprovals();
      fetchInventoryData();
      fetchDashboardStats();
    } catch (error) {
      toast.error(`Failed to ${status.toLowerCase()} request`);
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

  // [E5.7] Client-side status filter + sort applied on top of server-side search results
  const filteredInventory = inventory
    .filter((item) => {
      const qty = item.availableQuantity ?? item.quantity;
      const threshold = item.reorderPoint || item.lowStockThreshold || 0;
      if (inventoryStatusFilter === "In Stock") return qty > threshold;
      if (inventoryStatusFilter === "Low Stock") return qty > 0 && qty <= threshold;
      if (inventoryStatusFilter === "Out of Stock") return qty === 0;
      return true;
    })
    .sort((a, b) => {
      const qtyA = a.availableQuantity ?? a.quantity;
      const qtyB = b.availableQuantity ?? b.quantity;
      if (inventorySort === "high-to-low") return qtyB - qtyA;
      if (inventorySort === "low-to-high") return qtyA - qtyB;
      return 0;
    });
  const totalInventoryPages = Math.ceil(filteredInventory.length / inventoryPerPage);
  const paginatedInventory = filteredInventory.slice(
    (inventoryPage - 1) * inventoryPerPage,
    inventoryPage * inventoryPerPage,
  );

  // Filtering & Pagination For Movements
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

  // Reset movement page on filter/search change
  useEffect(() => {
    setMovementPage(1);
  }, [movementSearch, movementTypeFilter]);

  // Reset inventory page on status filter, sort or search change
  useEffect(() => {
    setInventoryPage(1);
  }, [inventoryStatusFilter, inventorySort, debouncedSearch]);
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
              {notDispatchedCount + soDispatchRequests.length > 0 && (
                <span
                  className="count-badge"
                  style={{
                    backgroundColor:
                      soDispatchRequests.length > 0
                        ? "#ef4444"
                        : "var(--warning-color)",
                    color: "white",
                    borderRadius: "10px",
                    padding: "0 6px",
                    fontSize: "0.7rem",
                    fontWeight: "bold",
                  }}
                >
                  {notDispatchedCount + soDispatchRequests.length}
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
          <div className="dashboard-card-header" style={{ flexWrap: "wrap", gap: "1rem" }}>
            <h2 className="card-title">Stock at {selectedLocation}</h2>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
              {/* Search */}
              <div className="search-bar" style={{ maxWidth: "210px", minWidth: "140px", flex: "0 1 210px" }}>
                <Search size={15} className="detail-label-icon" />
                <input
                  type="text"
                  placeholder="Search product or ISBN…"
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                />
              </div>
              {/* Status filter */}
              <select
                value={inventoryStatusFilter}
                onChange={(e) => setInventoryStatusFilter(e.target.value)}
                className="form-select"
                style={{ width: "130px", flex: "0 0 130px" }}
                aria-label="Filter by stock status"
              >
                <option value="All">All Statuses</option>
                <option value="In Stock">In Stock</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>
              {/* Sort */}
              <select
                value={inventorySort}
                onChange={(e) => setInventorySort(e.target.value)}
                className="form-select"
                style={{ width: "148px", flex: "0 0 148px" }}
                aria-label="Sort by stock level"
              >
                <option value="none">Sort: Default</option>
                <option value="high-to-low">Stock: High → Low</option>
                <option value="low-to-high">Stock: Low → High</option>
              </select>
              {/* Clear */}
              {(inventoryStatusFilter !== "All" || inventorySort !== "none" || inventorySearch) && (
                <button
                  className="btn-icon"
                  title="Clear all filters"
                  onClick={() => { setInventoryStatusFilter("All"); setInventorySort("none"); setInventorySearch(""); }}
                  style={{ width: "auto", padding: "0 10px", height: "34px", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.8rem", border: "1px solid var(--border-color)", borderRadius: "6px" }}
                >
                  <X size={13} /> Clear
                </button>
              )}
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
                      {inventorySearch || inventoryStatusFilter !== "All"
                        ? "No items match your search or filter."
                        : "No inventory data for this location."}
                    </td>
                  </tr>
                ) : (
                  paginatedInventory.map((item) => (
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
                          {canEditItem(item) && (
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

          {/* Pagination controls */}
          {totalInventoryPages > 1 && (
            <div className="pagination-controls" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 0 0" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-light)" }}>
                Showing {Math.min((inventoryPage - 1) * inventoryPerPage + 1, filteredInventory.length)}–{Math.min(inventoryPage * inventoryPerPage, filteredInventory.length)} of {filteredInventory.length} items
              </span>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  className="btn btn-outline"
                  disabled={inventoryPage === 1}
                  onClick={() => setInventoryPage((p) => p - 1)}
                  style={{ padding: "6px 14px", fontSize: "0.85rem" }}
                >
                  Previous
                </button>
                {Array.from({ length: totalInventoryPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalInventoryPages || Math.abs(p - inventoryPage) <= 1)
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, idx) =>
                    p === "..." ? (
                      <span key={`ellipsis-${idx}`} style={{ padding: "6px 4px", fontSize: "0.85rem", color: "var(--text-light)" }}>…</span>
                    ) : (
                      <button
                        key={p}
                        className={`btn ${inventoryPage === p ? "btn-primary" : "btn-outline"}`}
                        onClick={() => setInventoryPage(p)}
                        style={{ padding: "6px 12px", fontSize: "0.85rem", minWidth: "36px" }}
                      >
                        {p}
                      </button>
                    )
                  )}
                <button
                  className="btn btn-outline"
                  disabled={inventoryPage === totalInventoryPages}
                  onClick={() => setInventoryPage((p) => p + 1)}
                  style={{ padding: "6px 14px", fontSize: "0.85rem" }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
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
                            className="btn btn-primary btn-sm"
                            onClick={() => openApprovalDetailModal(req)}
                          >
                            Review
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
                          {canEditCurrentLocation() && (
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
            {canEditCurrentLocation() && (
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
                          canEditCurrentLocation() &&
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
                      {canEditItem(item) && (
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

      {/* Approval Detail Diff Modal */}
      {selectedApproval &&
        (() => {
          const SKIP_FIELDS = new Set([
            "_id",
            "__v",
            "createdAt",
            "updatedAt",
            "isActive",
            "isVerified",
            "totalOrders",
            "totalValue",
            "totalPaid",
            "outstandingBalance",
            "rating",
            "hasDebt",
            "paymentHistory",
            "totalPaidToUs",
            "totalPaymentsReceived",
            "images",
            "reviews",
          ]);

          const labelOf = (key) =>
            key
              .replace(/([A-Z])/g, " $1")
              .trim()
              .replace(/^./, (s) => s.toUpperCase());

          const renderVal = (val) => {
            if (val === null || val === undefined || val === "")
              return <em style={{ color: "#9ca3af" }}>—</em>;
            if (typeof val === "boolean") return val ? "Yes" : "No";
            if (Array.isArray(val))
              return val.length === 0 ? (
                <em style={{ color: "#9ca3af" }}>—</em>
              ) : (
                `[${val.length} items]`
              );
            if (typeof val === "object") {
              const entries = Object.entries(val).filter(
                ([, v]) => v !== "" && v !== null && v !== undefined,
              );
              if (entries.length === 0)
                return <em style={{ color: "#9ca3af" }}>—</em>;
              return (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                  }}
                >
                  {entries.map(([k, v]) => (
                    <span key={k}>
                      <span style={{ color: "#6b7280", fontSize: "0.8rem" }}>
                        {labelOf(k)}:{" "}
                      </span>
                      {String(v)}
                    </span>
                  ))}
                </div>
              );
            }
            return String(val);
          };

          const proposed = selectedApproval.targetData || {};
          const current = currentApprovalDoc || {};
          const isAdjust =
            selectedApproval.action === "Adjust Stock" ||
            selectedApproval.action === "Delete";

          // For Update/non-adjust: show only changed fields
          const changedFields = isAdjust
            ? Object.entries(proposed).filter(([k]) => !SKIP_FIELDS.has(k))
            : Object.entries(proposed).filter(([key, newVal]) => {
                if (SKIP_FIELDS.has(key)) return false;
                return JSON.stringify(newVal) !== JSON.stringify(current[key]);
              });

          return (
            <Modal
              isOpen={showApprovalDetailModal}
              onClose={() => setShowApprovalDetailModal(false)}
              title="Review Approval Request"
              size="lg"
            >
              <div>
                {/* Metadata */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "0.5rem 2rem",
                    background: "#f9fafb",
                    border: "1px solid var(--border-color)",
                    borderRadius: "8px",
                    padding: "1rem 1.25rem",
                    marginBottom: "1.5rem",
                    fontSize: "0.9rem",
                  }}
                >
                  <div>
                    <span style={{ color: "#6b7280" }}>Module:</span>{" "}
                    <strong>{selectedApproval.module}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#6b7280" }}>Action:</span>{" "}
                    <strong>{selectedApproval.action}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#6b7280" }}>Requested By:</span>{" "}
                    <strong>{selectedApproval.requestedBy?.name}</strong>{" "}
                    <span style={{ color: "#6b7280" }}>
                      ({selectedApproval.requestedBy?.role?.replace(/_/g, " ")})
                    </span>
                  </div>
                  <div>
                    <span style={{ color: "#6b7280" }}>Date:</span>{" "}
                    <strong>
                      {new Date(selectedApproval.createdAt).toLocaleString()}
                    </strong>
                  </div>
                </div>

                {/* Diff table */}
                <h4
                  style={{
                    marginBottom: "0.75rem",
                    fontWeight: "600",
                    color: "var(--text-color)",
                  }}
                >
                  {loadingCurrentApprovalDoc
                    ? "Loading comparison..."
                    : changedFields.length === 0
                      ? currentApprovalDoc
                        ? "No fields were changed."
                        : "Requested Changes:"
                      : `${changedFields.length} field${changedFields.length > 1 ? "s" : ""} changed:`}
                </h4>
                <div
                  style={{
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    overflow: "hidden",
                    marginBottom: "1.5rem",
                  }}
                >
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      textAlign: "left",
                    }}
                  >
                    <thead>
                      <tr style={{ background: "#f3f4f6" }}>
                        <th
                          style={{
                            padding: "0.65rem 1rem",
                            fontWeight: "600",
                            fontSize: "0.82rem",
                            color: "#374151",
                            width: "25%",
                            borderBottom: "1px solid var(--border-color)",
                          }}
                        >
                          FIELD
                        </th>
                        {currentApprovalDoc && !isAdjust && (
                          <th
                            style={{
                              padding: "0.65rem 1rem",
                              fontWeight: "600",
                              fontSize: "0.82rem",
                              color: "#374151",
                              width: "37.5%",
                              borderBottom: "1px solid var(--border-color)",
                              borderLeft: "1px solid var(--border-color)",
                            }}
                          >
                            CURRENT VALUE
                          </th>
                        )}
                        <th
                          style={{
                            padding: "0.65rem 1rem",
                            fontWeight: "600",
                            fontSize: "0.82rem",
                            color: "#374151",
                            borderBottom: "1px solid var(--border-color)",
                            borderLeft: "1px solid var(--border-color)",
                          }}
                        >
                          NEW VALUE
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {changedFields.map(([key, newVal]) => {
                        const oldVal = current[key];
                        const isChanged =
                          !isAdjust &&
                          currentApprovalDoc &&
                          JSON.stringify(newVal) !== JSON.stringify(oldVal);
                        return (
                          <tr
                            key={key}
                            style={{
                              borderBottom: "1px solid var(--border-color)",
                              background: isChanged ? "#fffbeb" : "white",
                            }}
                          >
                            <td
                              style={{
                                padding: "0.85rem 1rem",
                                fontWeight: "600",
                                color: "#374151",
                                fontSize: "0.88rem",
                                verticalAlign: "top",
                              }}
                            >
                              {labelOf(key)}
                              {isChanged && (
                                <span
                                  style={{
                                    display: "block",
                                    fontSize: "0.7rem",
                                    color: "#d97706",
                                    fontWeight: "500",
                                    marginTop: "2px",
                                  }}
                                >
                                  CHANGED
                                </span>
                              )}
                            </td>
                            {currentApprovalDoc && !isAdjust && (
                              <td
                                style={{
                                  padding: "0.85rem 1rem",
                                  color: "#6b7280",
                                  fontSize: "0.88rem",
                                  borderLeft: "1px solid var(--border-color)",
                                  verticalAlign: "top",
                                  textDecoration: isChanged
                                    ? "line-through"
                                    : "none",
                                }}
                              >
                                {renderVal(oldVal)}
                              </td>
                            )}
                            <td
                              style={{
                                padding: "0.85rem 1rem",
                                fontWeight: "500",
                                color: isChanged ? "#065f46" : "#111827",
                                fontSize: "0.88rem",
                                borderLeft: "1px solid var(--border-color)",
                                background: isChanged
                                  ? "#ecfdf5"
                                  : "transparent",
                                verticalAlign: "top",
                              }}
                            >
                              {renderVal(newVal)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div style={{ marginBottom: "1.25rem" }}>
                  <label
                    style={{
                      display: "block",
                      fontWeight: "600",
                      marginBottom: "0.4rem",
                      fontSize: "0.9rem",
                    }}
                  >
                    Remarks (Optional)
                  </label>
                  <textarea
                    className="form-control"
                    value={approvalRemarks}
                    onChange={(e) => setApprovalRemarks(e.target.value)}
                    placeholder="Enter any notes about this decision..."
                    rows="3"
                    style={{
                      width: "100%",
                      padding: "0.6rem",
                      borderRadius: "6px",
                      border: "1px solid var(--border-color)",
                      fontSize: "0.9rem",
                    }}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    justifyContent: "flex-end",
                  }}
                >
                  <button
                    className="btn btn-outline"
                    onClick={() => setShowApprovalDetailModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-danger"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                    onClick={() => handleApprovalDecision("Rejected")}
                  >
                    <XCircle size={16} /> Reject
                  </button>
                  <button
                    className="btn btn-primary"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                    onClick={() => handleApprovalDecision("Approved")}
                  >
                    <Check size={16} /> Approve
                  </button>
                </div>
              </div>
            </Modal>
          );
        })()}

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
          <>
            {/* ─── SO Dispatch Requests (E4 → E5 Approval) ─── */}
            <div
              className="dashboard-card"
              style={{
                marginTop: "20px",
                borderLeft: "4px solid #ef4444",
              }}
            >
              <div className="dashboard-card-header">
                <div>
                  <h2
                    className="card-title"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <Truck size={20} style={{ color: "#ef4444" }} />
                    Bulk SO Dispatch Requests
                    {soDispatchRequests.length > 0 && (
                      <span
                        style={{
                          background: "#ef4444",
                          color: "#fff",
                          borderRadius: "999px",
                          padding: "0.1rem 0.55rem",
                          fontSize: "0.78rem",
                          fontWeight: 700,
                        }}
                      >
                        {soDispatchRequests.length} pending
                      </span>
                    )}
                  </h2>
                  <p className="text-secondary text-sm">
                    Sales Orders from the Supplier Manager awaiting stock
                    deduction approval.
                  </p>
                </div>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={fetchSODispatchRequests}
                >
                  <RefreshCw size={14} /> Refresh
                </button>
              </div>

              {soDispatchRequests.length === 0 ? (
                <div
                  style={{
                    padding: "2.5rem",
                    textAlign: "center",
                    color: "var(--text-muted)",
                  }}
                >
                  <ShieldCheck
                    size={40}
                    style={{ opacity: 0.3, marginBottom: "0.75rem" }}
                  />
                  <p>No pending dispatch requests.</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>SO #</th>
                        <th>Customer</th>
                        <th>Date</th>
                        <th>Items</th>
                        <th>Total (Rs.)</th>
                        <th>Location</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {soDispatchRequests.map((so) => (
                        <tr
                          key={so._id}
                          style={{
                            borderLeft: "3px solid #f59e0b",
                            backgroundColor: "rgba(245,158,11,0.04)",
                          }}
                        >
                          <td>
                            <strong>#{so.soNumber}</strong>
                            <div style={{ fontSize: "0.75rem", color: "#888" }}>
                              {new Date(so.createdAt).toLocaleDateString()}
                            </div>
                          </td>
                          <td>
                            <div>{so.customer?.name || "N/A"}</div>
                            <div style={{ fontSize: "0.75rem", color: "#888" }}>
                              {so.customer?.category}
                            </div>
                          </td>
                          <td>
                            {so.statusHistory
                              ?.slice()
                              .reverse()
                              .find((h) => h.status === "DispatchRequested")
                              ?.changedAt
                              ? new Date(
                                  so.statusHistory
                                    .slice()
                                    .reverse()
                                    .find(
                                      (h) => h.status === "DispatchRequested",
                                    ).changedAt,
                                ).toLocaleDateString()
                              : "—"}
                          </td>
                          <td>
                            {so.items?.length ?? 0}{" "}
                            {so.items?.length === 1 ? "item" : "items"}
                            <div style={{ fontSize: "0.75rem", color: "#888" }}>
                              {so.items
                                ?.map(
                                  (i) =>
                                    `${i.product?.title || "—"} ×${i.quantity}`,
                                )
                                .join(", ")}
                            </div>
                          </td>
                          <td>
                            <strong>
                              Rs. {(so.totalAmount || 0).toLocaleString()}
                            </strong>
                          </td>
                          <td>
                            <span className="role-badge">
                              {so.location || "Main Warehouse"}
                            </span>
                          </td>
                          <td>
                            <div className="table-actions">
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => handleApproveSODispatch(so)}
                                title="Approve dispatch — deducts inventory"
                              >
                                <ShieldCheck size={14} /> Approve
                              </button>
                              <button
                                className="btn btn-outline btn-sm"
                                style={{
                                  color: "#ef4444",
                                  borderColor: "#ef4444",
                                }}
                                onClick={() => handleRejectSODispatch(so)}
                                title="Reject — returns SO to Processing"
                              >
                                <X size={14} /> Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ─── Online Order Dispatch (existing) ─── */}
            <div className="dashboard-card" style={{ marginTop: "20px" }}>
              <div className="dashboard-card-header">
                <div>
                  <h2 className="card-title">Pending & Processing Orders</h2>
                  <p className="text-secondary text-sm">
                    Manage order fulfillment and tracking for {selectedLocation}
                    .
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
                            <strong>
                              #{order._id.slice(-6).toUpperCase()}
                            </strong>
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
                                    handleUpdateOrderStatus(
                                      order._id,
                                      "Shipped",
                                    )
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
          </>
        )}
    </div>
  );
};

export default InventoryManagerDashboard;

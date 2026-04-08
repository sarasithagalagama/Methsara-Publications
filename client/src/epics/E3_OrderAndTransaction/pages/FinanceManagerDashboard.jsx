// ============================================
// Finance Manager Dashboard
// Epic: E3 - Orders & Transactions
// Owner: IT24100191 (Jayasinghe D.B.P)
// Purpose: Financial overview and management
// ============================================

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../epics/E1_UserAndRoleManagement/context/AuthContext";
import {
  DollarSign,
  ShoppingCart,
  CreditCard,
  TrendingUp,
  PieChart,
  Eye,
  FileText,
  Settings,
  Activity,
  LogOut,
  RotateCcw,
  Users,
  Truck as TruckIcon,
  ShieldCheck,
  AlertCircle,
  XCircle,
  ClipboardList,
  ChevronRight,
  CheckCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import StatCard from "../../../components/dashboard/StatCard";
import DashboardHeader from "../../../components/dashboard/DashboardHeader";
import DashboardSection from "../../../components/dashboard/DashboardSection";
import RevenueChart from "../../../components/dashboard/charts/RevenueChart";
import SalesChart from "../../../components/dashboard/charts/SalesChart";
import "../../../components/dashboard/dashboard.css";
import "./FinanceManagerDashboard.css";
import Invoice from "../../../epics/E3_OrderAndTransaction/components/Order/Invoice";
import Modal from "../../../components/common/Modal";
import ConfirmModal from "../../../components/common/ConfirmModal";
import {
  Input,
  Select,
  TextArea,
  Button,
} from "../../../components/common/Forms";

const FinanceManagerDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  // [E3.9] Financial KPIs: totalRevenue, totalExpenses, netIncome, pendingOrders aggregated server-side
  // State Variables
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netIncome: 0,
    transactions: 0,
    pendingOrders: 0,
    pendingBankTransfers: 0,
    growth: 0,
  });

  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [staff, setStaff] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  // New Features State
  const [showTaxModal, setShowTaxModal] = useState(false);
  // [E3.9] taxConfig persisted in localStorage — covers VAT rate, apply-to-invoices toggle, and exempt types
  const [taxConfig, setTaxConfig] = useState(() => {
    try {
      const stored = localStorage.getItem("taxConfig");
      return stored
        ? JSON.parse(stored)
        : {
            vatRate: "18",
            applyToInvoices: true,
            applyToSalaries: false,
            applyToSupplierPayments: false,
            taxName: "VAT",
            taxNumber: "",
          };
    } catch {
      return {
        vatRate: "18",
        applyToInvoices: true,
        applyToSalaries: false,
        applyToSupplierPayments: false,
        taxName: "VAT",
        taxNumber: "",
      };
    }
  });
  const [tempTaxConfig, setTempTaxConfig] = useState(taxConfig);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [allFinancialTransactions, setAllFinancialTransactions] = useState([]);
  const [editingFinItem, setEditingFinItem] = useState(null);
  const [activeTab, setActiveTab] = useState("payments"); // [E3.9] Tabs: payments (default), overview (revenue), salaries (E3.11), suppliers (E4 integration)
  const [showPOModal, setShowPOModal] = useState(false);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [slipViewerUrl, setSlipViewerUrl] = useState(null); // [E3.4] Bank slip popup: finance manager reviews upload before approving order

  // Form States for Modals
  const [salaryInputs, setSalaryInputs] = useState({}); // { memberId: amount }
  const [bonusInputs, setBonusInputs] = useState({}); // { memberId: amount }
  const [settleInputs, setSettleInputs] = useState({}); // { supplierId: amount }
  const [manualEntry, setManualEntry] = useState({
    type: "Other",
    amount: "",
    description: "",
    direction: "Expense",
  });

  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    variant: "primary",
    confirmText: "Confirm",
  });

  const [analyticsData, setAnalyticsData] = useState({
    revenue: [],
    sales: [],
    labels: [],
  });

  const closeConfirm = () =>
    setConfirmState((prev) => ({ ...prev, isOpen: false }));

  // Event Handlers
  const handleSaveTax = () => {
    const rate = parseFloat(tempTaxConfig.vatRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast.error("VAT rate must be between 0 and 100.");
      return;
    }
    const updated = { ...tempTaxConfig, vatRate: String(rate) };
    localStorage.setItem("taxConfig", JSON.stringify(updated));
    setTaxConfig(updated);
    setShowTaxModal(false);
    toast.success("Tax configuration saved successfully!");
  };

  const scrollToTransactions = () => {
    const element = document.getElementById("transactions-section");
    if (element) element.scrollIntoView({ behavior: "smooth" });
  };

  // Side Effects
  useEffect(() => {
    fetchDashboardData();

    // Check URL query or path to open specific sections
    if (location.pathname.includes("/finance-manager/transactions")) {
      setTimeout(() => scrollToTransactions(), 500);
    } else if (location.pathname.includes("/finance-manager/payroll")) {
      setShowSalaryModal(true);
    }
  }, [location.pathname]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [dashRes, ordersRes, usersRes, suppliersRes, transRes, posRes] =
        await Promise.allSettled([
          axios.get("/api/financial/dashboard", config),
          axios.get("/api/orders", config),
          axios.get("/api/auth/users", config),
          axios.get("/api/suppliers", config),
          axios.get("/api/financial/transactions", config),
          axios.get("/api/purchase-orders", config),
        ]);

      if (dashRes.status === "fulfilled" && dashRes.value.data.success) {
        const { summary, dailyTrend } = dashRes.value.data.dashboard;
        setStats({
          totalRevenue: summary.totalRevenue,
          totalExpenses: summary.totalExpenses,
          netIncome: summary.netIncome,
          transactions: summary.totalOrders,
          pendingOrders: summary.pendingOrders || 0, // Fallback if not in summary
          growth: summary.growth,
        });

        // Format daily trend for charts (last 7 days for current weekly view)
        const last7Days = dailyTrend.slice(-7);
        const labels = last7Days.map((d) => {
          const date = new Date(d._id);
          return date.toLocaleDateString("en-US", { weekday: "short" });
        });
        const revenue = last7Days.map((d) => d.revenue);
        const sales = last7Days.map((d) => d.orders);

        setAnalyticsData({ labels, revenue, sales });
      }

      let allOrders = [];
      if (ordersRes.status === "fulfilled") {
        allOrders = ordersRes.value.data.orders || [];
      }

      if (usersRes.status === "fulfilled") {
        const staffList = (usersRes.value.data.users || []).filter(
          (u) => u.userType === "staff",
        );
        setStaff(staffList);
        const initialSalaries = {};
        const initialBonuses = {};
        staffList.forEach((s) => {
          initialSalaries[s._id] = s.salary != null ? s.salary : 0;
          initialBonuses[s._id] = "";
        });
        setSalaryInputs(initialSalaries);
        setBonusInputs(initialBonuses);
      }

      if (suppliersRes.status === "fulfilled") {
        const supplierList = suppliersRes.value.data.suppliers || [];
        setSuppliers(supplierList);
        const initialSettle = {};
        supplierList.forEach((s) => (initialSettle[s._id] = ""));
        setSettleInputs(initialSettle);
      }

      let allFinancialTransactionsData = [];
      if (transRes.status === "fulfilled" && transRes.value.data.success) {
        allFinancialTransactionsData = transRes.value.data.transactions || [];
        setAllFinancialTransactions(allFinancialTransactionsData);
      }

      if (posRes?.status === "fulfilled") {
        setPurchaseOrders(posRes.value.data.purchaseOrders || []);
      }

      // Normalized view for the recent transactions table
      const normalizedOrders = allOrders.map((order) => ({
        _id: order._id,
        type: "Order",
        description: `Order #${order._id.slice(-6).toUpperCase()} - ${order.user?.name || order.guestName || "Guest"}`,
        amount: order.total,
        date: order.createdAt,
        status: order.paymentStatus === "Paid" ? "Completed" : "Pending",
        isIncome: true,
        originalData: order,
      }));

      const normalizedFinancials = allFinancialTransactionsData.map((tx) => ({
        _id: tx._id,
        type: tx.type,
        description: tx.description || `${tx.type} Transaction`,
        amount: tx.amount,
        date: tx.date || tx.createdAt,
        status: tx.status || "Completed",
        isIncome: tx.isIncome,
        originalData: tx,
      }));

      const combinedTransactions = [
        ...normalizedOrders,
        ...normalizedFinancials,
      ]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10);

      setRecentTransactions(combinedTransactions);

      // We still need to calculate pendingOrders if backend didn't provide it
      if (dashRes.status === "fulfilled") {
        const pendingBankTransfers = allOrders.filter(
          (o) =>
            o.paymentMethod === "Bank Transfer" && o.paymentStatus === "Pending",
        ).length;
        setStats((prev) => ({
          ...prev,
          pendingOrders: allOrders.filter((o) => o.orderStatus === "Pending")
            .length,
          pendingBankTransfers,
        }));
      }

      setLoading(false);
      fetchOrders(); // Initial fetch for orders
    } catch (error) {
      console.error("Dashboard error:", error);
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(res.data.orders || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleConfirmPayment = async (orderId) => {
    setConfirmState({
      isOpen: true,
      title: "Confirm Payment",
      message: "Are you sure you want to mark this bank transfer as confirmed?",
      confirmText: "Confirm Payment",
      variant: "success",
      onConfirm: async () => {
        try {
          const token = localStorage.getItem("token");
          await axios.put(
            `/api/orders/${orderId}/payment`,
            { paymentStatus: "Paid", note: "Verified by Finance" },
            { headers: { Authorization: `Bearer ${token}` } },
          );
          toast.success("Payment confirmed successfully");
          fetchOrders();
          fetchDashboardData();
          closeConfirm();
        } catch (error) {
          toast.error("Failed to confirm payment");
        }
      },
    });
  };

  const handleDeclinePayment = (orderId) => {
    setConfirmState({
      isOpen: true,
      title: "Decline Payment",
      message:
        "Are you sure you want to decline this bank transfer payment proof?",
      confirmText: "Decline Payment",
      variant: "danger",
      onConfirm: async () => {
        try {
          const token = localStorage.getItem("token");
          await axios.put(
            `/api/orders/${orderId}/payment`,
            {
              paymentStatus: "Failed",
              note: "Rejected by Finance - Invalid proof",
            },
            { headers: { Authorization: `Bearer ${token}` } },
          );
          toast.success("Payment declined");
          fetchOrders();
          fetchDashboardData();
          closeConfirm();
        } catch (error) {
          toast.error("Failed to decline payment");
        }
      },
    });
  };

  const handleProcessRefund = (orderId) => {
    setConfirmState({
      isOpen: true,
      title: "Confirm Refund",
      message:
        "Are you sure you want to process a refund for this order? This will mark the order as Refunded and create a transaction record.",
      confirmText: "Process Refund",
      variant: "warning",
      onConfirm: async () => {
        closeConfirm();
        try {
          const token = localStorage.getItem("token");
          await axios.post(
            `/api/financial/refunds/${orderId}`,
            {
              refundAmount:
                recentTransactions.find((t) => t._id === orderId)?.amount || 0,
              reason: "Customer Request",
            },
            { headers: { Authorization: `Bearer ${token}` } },
          );
          toast.success("Refund processed successfully");
          fetchDashboardData();
        } catch (error) {
          console.error("Error processing refund:", error);
          toast.error("Failed to process refund");
        }
      },
    });
  };

  const handlePaySalary = async (memberId) => {
    const amount = salaryInputs[memberId];
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid positive salary amount");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "/api/financial/transactions",
        {
          type: "Salary",
          amount: parseFloat(amount),
          relatedId: memberId,
          description: `Salary payment for ${staff.find((s) => s._id === memberId).name}`,
          isIncome: false,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success("Salary payment recorded successfully");
      fetchDashboardData();
    } catch (error) {
      toast.error("Failed to record salary payment");
    }
  };

  const handlePayBonus = async (memberId) => {
    const amount = bonusInputs[memberId];
    if (!amount || parseFloat(amount) <= 0)
      return toast.error("Please enter a valid bonus amount");

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "/api/financial/transactions",
        {
          type: "Bonus",
          amount: parseFloat(amount),
          relatedId: memberId,
          description: `Performance bonus for ${staff.find((s) => s._id === memberId).name}`,
          isIncome: false,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success("Bonus payment recorded successfully");
      setBonusInputs((prev) => ({ ...prev, [memberId]: "" }));
      fetchDashboardData();
    } catch (error) {
      toast.error("Failed to record bonus payment");
    }
  };

  const handleSettleSupplier = async (supplierId) => {
    const amount = settleInputs[supplierId];
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid positive settlement amount");
      return;
    }

    try {
      const supplier = suppliers.find((s) => s._id === supplierId);
      // Vendors: we PAY them → expense (isIncome=false)
      // Customers: they PAY us → income (isIncome=true)
      const isCustomer = supplier?.supplierType === "Customer";
      const isIncome = isCustomer;
      const txType = isCustomer ? "Customer Collection" : "Vendor Payment";
      const description = isCustomer
        ? `Payment received from ${supplier.name}`
        : `Payment made to vendor ${supplier.name}`;

      const token = localStorage.getItem("token");
      await axios.post(
        "/api/financial/transactions",
        {
          type: txType,
          amount: parseFloat(amount),
          relatedId: supplierId,
          description,
          isIncome,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success(
        isCustomer
          ? "Payment collection recorded successfully"
          : "Vendor payment recorded successfully",
      );
      setSettleInputs((prev) => ({ ...prev, [supplierId]: "" }));
      fetchDashboardData();
    } catch (error) {
      toast.error("Failed to record settlement");
    }
  };

  const handleUpdateStaffSalary = (id) => {
    const salary = salaryInputs[id];
    const staffMember = staff.find((s) => s._id === id);
    if (!staffMember) return toast.error("Staff member not found");

    const parsedSalary = parseFloat(salary);
    if (!salary && salary !== 0)
      return toast.error("Please enter a salary amount");
    if (isNaN(parsedSalary))
      return toast.error("Salary must be a valid number");
    if (parsedSalary < 0) return toast.error("Salary cannot be negative");

    setConfirmState({
      isOpen: true,
      title: "Update Salary",
      message: `Are you sure you want to update the base salary for ${staffMember.name} to Rs. ${parsedSalary.toLocaleString()}?`,
      confirmText: "Update Salary",
      variant: "primary",
      onConfirm: async () => {
        closeConfirm();
        try {
          const token = localStorage.getItem("token");
          await axios.put(
            `/api/auth/users/${id}`,
            {
              name: staffMember.name,
              email: staffMember.email,
              salary: parseFloat(salary),
            },
            { headers: { Authorization: `Bearer ${token}` } },
          );
          toast.success("Staff salary updated");
          fetchDashboardData();
        } catch (error) {
          const message =
            error.response?.data?.message || "Failed to update staff salary";
          toast.error(message);
        }
      },
    });
  };

  const handleUpdateTransaction = async (id, amount, description, isIncome) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `/api/financial/transactions/${id}`,
        { amount, description, isIncome },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (res.data.pendingApproval) {
        toast.success(
          "Edit request submitted for Admin approval. It will take effect once approved.",
          { duration: 4000 },
        );
      } else {
        toast.success("Transaction updated");
      }

      setEditingFinItem(null);
      setShowTransactionModal(false);
      fetchDashboardData();
    } catch (error) {
      toast.error("Failed to update transaction");
    }
  };

  const handleManualCreateTransaction = async () => {
    try {
      const { type, amount, description, direction } = manualEntry;
      if (!amount || !description) return toast.error("Please fill all fields");
      if (parseFloat(amount) <= 0) {
        toast.error("Amount must be a positive number");
        return;
      }

      const token = localStorage.getItem("token");
      await axios.post(
        "/api/financial/transactions",
        {
          type,
          amount: parseFloat(amount),
          description,
          date: new Date(),
          isIncome: direction === "Income",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      toast.success("Transaction recorded");
      setManualEntry({
        type: "Other",
        amount: "",
        description: "",
        direction: "Expense",
      });
      setShowTransactionModal(false);
      fetchDashboardData();
    } catch (error) {
      toast.error("Failed to record transaction");
    }
  };

  const handlePayPO = async (poId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `/api/financial/purchase-orders/${poId}/pay`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success("Purchase order paid successfully");
      fetchDashboardData();
    } catch (error) {
      toast.error("Failed to pay purchase order");
    }
  };

  // Opens the bank slip in an in-page popup modal.
  const handleViewSlip = (dataUrl) => setSlipViewerUrl(dataUrl);

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
        title="Finance Manager Dashboard"
        subtitle="Overview of financial performance"
        actions={[
          {
            label: "Analytics",
            icon: <PieChart size={18} />,
            onClick: () =>
              document
                .querySelector(".dashboard-grid")
                ?.scrollIntoView({ behavior: "smooth" }),
            variant: "outline",
          },
        ]}
      />

      {/* ── Operations section moved below stats if needed, or keeping it as navigation ── */}
      <DashboardSection title="Finance Operations">
        <div className="dashboard-grid dashboard-grid-4">
          <div
            className="dashboard-card action-card"
            onClick={() => setShowTransactionModal(true)}
            style={{ cursor: "pointer" }}
          >
            <div
              className="action-icon"
              style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}
            >
              <DollarSign size={24} />
            </div>
            <h3 style={{ fontSize: "1.05rem", marginBottom: "6px" }}>
              Record Entry
            </h3>
            <p style={{ fontSize: "0.85rem" }}>
              Log a new financial transaction
            </p>
            <div className="action-link" style={{ marginTop: "auto" }}>
              Add Record <ChevronRight size={16} />
            </div>
          </div>
          <div
            className="dashboard-card action-card"
            onClick={() => setShowSalaryModal(true)}
            style={{ cursor: "pointer" }}
          >
            <div
              className="action-icon"
              style={{ background: "rgba(37,99,235,0.1)", color: "#2563EB" }}
            >
              <Users size={24} />
            </div>
            <h3 style={{ fontSize: "1.05rem", marginBottom: "6px" }}>
              Payroll Mgmt
            </h3>
            <p style={{ fontSize: "0.85rem" }}>
              Manage staff salaries & bonuses
            </p>
            <div className="action-link" style={{ marginTop: "auto" }}>
              Open Payroll <ChevronRight size={16} />
            </div>
          </div>
          <div
            className="dashboard-card action-card"
            onClick={() => navigate("/finance-manager/transactions")}
            style={{ cursor: "pointer" }}
          >
            <div
              className="action-icon"
              style={{ background: "rgba(245,158,11,0.1)", color: "#F59E0B" }}
            >
              <FileText size={24} />
            </div>
            <h3 style={{ fontSize: "1.05rem", marginBottom: "6px" }}>
              Transactions
            </h3>
            <p style={{ fontSize: "0.85rem" }}>View full history & receipts</p>
            <div className="action-link" style={{ marginTop: "auto" }}>
              View All <ChevronRight size={16} />
            </div>
          </div>
          <div
            className="dashboard-card action-card"
            onClick={() => {
              setTempTaxConfig(taxConfig);
              setShowTaxModal(true);
            }}
            style={{ cursor: "pointer" }}
          >
            <div
              className="action-icon"
              style={{ background: "rgba(139,92,246,0.1)", color: "#8B5CF6" }}
            >
              <Settings size={24} />
            </div>
            <h3 style={{ fontSize: "1.05rem", marginBottom: "6px" }}>
              Tax Config
            </h3>
            <p style={{ fontSize: "0.85rem" }}>Update VAT & tax settings</p>
            <div className="action-link" style={{ marginTop: "auto" }}>
              Configure <ChevronRight size={16} />
            </div>
          </div>
        </div>
      </DashboardSection>

      {/* Urgent Alerts Strip */}
      {stats.pendingBankTransfers > 0 && (
        <div
          className="finance-alert-strip"
          style={{
            display: "flex",
            gap: "1rem",
            padding: "0.75rem 1rem",
            background: "rgba(37, 99, 235, 0.05)",
            border: "1px solid rgba(37, 99, 235, 0.1)",
            borderRadius: "var(--radius-md)",
            marginBottom: "1.5rem",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "var(--text-secondary)",
            }}
          >
            Action Required:
          </span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.25rem 0.75rem",
              background: "#eff6ff",
              color: "#1d4ed8",
              borderRadius: "20px",
              fontSize: "0.8rem",
              fontWeight: 500,
              border: "1px solid #dbeafe",
              cursor: "pointer",
            }}
            onClick={() => setActiveTab("payments")}
          >
            <CreditCard size={14} />
            {stats.pendingBankTransfers} bank transfers awaiting confirmation
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div
        className="dashboard-grid dashboard-grid-4"
        style={{ marginBottom: "2rem" }}
      >
        <StatCard
          icon={<DollarSign size={24} />}
          label="Total Revenue"
          value={`Rs. ${(stats.totalRevenue || 0).toLocaleString()}`}
          variant="primary"
        />
        <StatCard
          icon={<ShoppingCart size={24} />}
          label="Total Expenses"
          value={`Rs. ${(stats.totalExpenses || 0).toLocaleString()}`}
          variant="error"
        />
        <StatCard
          icon={<Activity size={24} />}
          label="Net Income"
          value={`Rs. ${(stats.netIncome || 0).toLocaleString()}`}
          variant="success"
        />
        <StatCard
          icon={<TrendingUp size={24} />}
          label="Growth"
          value={`+${stats.growth}%`}
          variant="warning"
        />
      </div>

      {/* ── TAB NAVIGATION BAR ── */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "20px",
          borderBottom: "2px solid #e5e7eb",
          paddingBottom: "0",
        }}
      >
        {[
          {
            key: "payments",
            label: "Payment Confirmation",
            icon: <CreditCard size={15} />,
            count: stats.pendingBankTransfers,
          },
          { key: "overview", label: "Overview", icon: <Activity size={15} /> },
        ].map(({ key, label, icon, count }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 18px",
              border: "none",
              borderBottom:
                activeTab === key
                  ? "2px solid #3b82f6"
                  : "2px solid transparent",
              background: "none",
              color: activeTab === key ? "#3b82f6" : "#6b7280",
              fontWeight: activeTab === key ? 600 : 400,
              fontSize: "0.9rem",
              cursor: "pointer",
              marginBottom: "-2px",
              transition: "color 0.15s, border-color 0.15s",
            }}
          >
            {icon}
            {label}
            {count > 0 && (
              <span
                style={{
                  background: key === "payments" ? "#3b82f6" : "#ef4444",
                  color: "#fff",
                  fontSize: "0.7rem",
                  padding: "0.1rem 0.4rem",
                  borderRadius: "10px",
                  marginLeft: "4px",
                }}
              >
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── PAYMENTS CONFIRMATION TAB ── */}
      {activeTab === "payments" && (
        <div
          className="dashboard-card"
          id="payments-section"
          style={{ marginTop: "20px" }}
        >
          <div className="dashboard-card-header">
            <h2 className="card-title">Pending Bank Transfer Confirmations</h2>
            <div className="card-header-actions">
              <Button
                size="sm"
                variant="outline"
                icon={RotateCcw}
                onClick={fetchOrders}
                loading={loadingOrders}
              >
                Refresh
              </Button>
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Payment Type</th>
                  <th>Bank Slip</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders
                  .filter(
                    (o) =>
                      o.paymentMethod === "Bank Transfer" &&
                      o.paymentStatus === "Pending",
                  )
                  .map((order) => (
                    <tr key={order._id}>
                      <td>
                        <strong>#{order._id.slice(-6).toUpperCase()}</strong>
                        <div style={{ fontSize: "0.75rem", color: "#888" }}>
                          {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td>{order.customer?.name || order.guestName}</td>
                      <td>
                        <strong>Rs. {order.total.toLocaleString()}</strong>
                      </td>
                      <td>
                        <span className="role-badge">
                          {order.paymentMethod}
                        </span>
                      </td>
                      <td>
                        {order.bankSlipUrl ? (
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => handleViewSlip(order.bankSlipUrl)}
                          >
                            <Eye size={14} /> View Slip
                          </button>
                        ) : (
                          <span className="text-secondary text-sm">
                            Not uploaded
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="status-badge warning">
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleConfirmPayment(order._id)}
                          >
                            <ShieldCheck size={14} /> Confirm
                          </button>
                          <button
                            className="btn btn-outline btn-sm text-danger"
                            style={{ borderColor: "#ef4444" }}
                            onClick={() => handleDeclinePayment(order._id)}
                          >
                            <XCircle size={14} /> Decline
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                {orders.filter(
                  (o) =>
                    o.paymentMethod === "Bank Transfer" &&
                    o.paymentStatus === "Pending",
                ).length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center py-5">
                      <div className="empty-state">
                        <ShieldCheck
                          size={48}
                          style={{ opacity: 0.2, marginBottom: "10px" }}
                        />
                        <p>No pending bank transfers to confirm.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Analytics Charts */}
      <div className="dashboard-grid dashboard-grid-2">
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h2 className="card-title">Weekly Revenue (Rs)</h2>
          </div>
          <RevenueChart
            data={analyticsData.revenue}
            labels={analyticsData.labels}
          />
        </div>
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h2 className="card-title">Weekly Sales Volume</h2>
          </div>
          <SalesChart
            data={analyticsData.sales}
            labels={analyticsData.labels}
          />
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="dashboard-card" id="transactions-section">
        <div className="dashboard-card-header">
          <h2 className="card-title">Recent Transactions</h2>
          <button
            className="card-action"
            onClick={() => navigate("/finance-manager/transactions")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--primary-color)",
              fontWeight: 500,
            }}
          >
            View All →
          </button>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    No recent transactions found.
                  </td>
                </tr>
              ) : (
                recentTransactions.map((tx) => (
                  <tr key={tx._id}>
                    <td>{new Date(tx.date).toLocaleDateString()}</td>
                    <td>
                      <span className="role-badge">{tx.type}</span>
                    </td>
                    <td>
                      <span
                        className="text-secondary"
                        style={{ fontSize: "0.9em" }}
                      >
                        {tx.description}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontWeight: 600,
                          color: tx.isIncome ? "#10b981" : "#ef4444",
                        }}
                      >
                        {tx.isIncome ? "+" : "-"} Rs.{" "}
                        {(tx.amount || 0).toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`status-badge ${
                          tx.status === "Completed" || tx.status === "Paid"
                            ? "success"
                            : tx.status === "Pending"
                              ? "warning"
                              : "error"
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        {tx.type === "Order" ? (
                          <button
                            className="btn-icon"
                            title="View Invoice"
                            onClick={() => setSelectedOrder(tx.originalData)}
                          >
                            <FileText size={16} />
                          </button>
                        ) : (
                          <>
                            <button
                              className="btn-icon"
                              title="Edit Transaction"
                              onClick={() => {
                                setEditingFinItem(tx.originalData);
                                setShowTransactionModal(true);
                              }}
                            >
                              <Settings size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="dashboard-grid dashboard-grid-3">
        <div
          className="dashboard-card action-card"
          onClick={() => setShowSalaryModal(true)}
        >
          <div className="action-icon">
            <Users size={24} />
          </div>
          <h3>Staff Salaries</h3>
          <p>Manage and process monthly staff payments</p>
          <span className="action-link">Manage Salaries →</span>
        </div>
        <div
          className="dashboard-card action-card"
          onClick={() => setShowSupplierModal(true)}
        >
          <div className="action-icon">
            <TruckIcon size={24} />
          </div>
          <h3>Supplier Payments</h3>
          <p>Track and settle vendor accounts</p>
          <span className="action-link">Settle Payments →</span>
        </div>

        <div
          className="dashboard-card action-card"
          onClick={() => {
            setActiveTab("payments");
            const element = document.getElementById("payments-section");
            if (element) element.scrollIntoView({ behavior: "smooth" });
          }}
        >
          <div className="action-icon">
            <CreditCard size={24} />
          </div>
          <h3>Payment Confirmation</h3>
          <p>Verify bank transfers and update payment status</p>
          <span className="action-link">Verify Payments →</span>
        </div>
        <div
          className="dashboard-card action-card"
          onClick={scrollToTransactions}
        >
          <div className="action-icon">
            <Activity size={24} />
          </div>
          <h3>Transaction Logs</h3>
          <p>View all system transaction history</p>
          <span className="action-link">View Logs →</span>
        </div>
        <div
          className="dashboard-card action-card"
          onClick={() => setShowPOModal(true)}
        >
          <div className="action-icon">
            <CreditCard size={24} />
          </div>
          <h3>PO Payment Requests</h3>
          <p>Process pending supplier payment requests</p>
          <span className="action-link">
            View Requests (
            {
              purchaseOrders.filter(
                (po) => po.paymentRequested && po.paymentStatus !== "Paid",
              ).length
            }
            ) →
          </span>
        </div>
        <div
          className="dashboard-card action-card"
          onClick={() => {
            setTempTaxConfig(taxConfig);
            setShowTaxModal(true);
          }}
        >
          <div className="action-icon">
            <Settings size={24} />
          </div>
          <h3>Tax Settings</h3>
          <p>Configure tax rates and rules</p>
          <span className="action-link">Configure →</span>
        </div>
      </div>

      {selectedOrder && (
        <Invoice order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}

      {/* Tax Configuration Modal */}
      <Modal
        isOpen={showTaxModal}
        onClose={() => setShowTaxModal(false)}
        title="Tax Configuration"
        size="md"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Header info */}
          <div style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: "12px", padding: "1rem", fontSize: "0.85rem", color: "var(--primary-color)", display: "flex", alignItems: "flex-start", gap: "10px" }}>
            <Settings size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
            <div>
              <strong style={{ display: "block", marginBottom: "4px" }}>Local Tax Settings</strong>
              Tax settings are stored locally and instantly applied to all future manual invoice calculations.
            </div>
          </div>

          <div style={{ padding: "0 4px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.5rem" }}>
              <Input
                label="Tax Name"
                type="text"
                placeholder="e.g. VAT, GST"
                value={tempTaxConfig.taxName}
                onChange={(e) => setTempTaxConfig((p) => ({ ...p, taxName: e.target.value })) }
              />
              <Input
                label="Reg. Number (Optional)"
                type="text"
                placeholder="e.g. VAT-123456"
                value={tempTaxConfig.taxNumber}
                onChange={(e) => setTempTaxConfig((p) => ({ ...p, taxNumber: e.target.value })) }
              />
            </div>

            {/* Rate */}
            <div style={{ marginBottom: "1.5rem" }}>
              <Input
                label="Default Tax Rate (%)"
                type="number"
                min="0" max="100" step="0.1"
                value={tempTaxConfig.vatRate}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v !== "" && (parseFloat(v) < 0 || parseFloat(v) > 100)) return;
                  setTempTaxConfig((p) => ({ ...p, vatRate: v }));
                }}
                helperText={`Example: Tax on Rs. 10,000 → Rs. ${((10000 * (parseFloat(tempTaxConfig.vatRate) || 0)) / 100).toLocaleString()}`}
              />
            </div>

            {/* Apply-to toggles */}
            <div style={{ background: "var(--bg-color)", borderRadius: "12px", border: "1px solid var(--border-color)", padding: "1.25rem" }}>
              <p style={{ fontWeight: "600", fontSize: "0.9rem", marginBottom: "1rem", color: "var(--text-color)" }}>
                Apply Tax To:
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {[
                  { key: "applyToInvoices", label: "Customer Invoices" },
                  { key: "applyToSalaries", label: "Salary Transactions" },
                  { key: "applyToSupplierPayments", label: "Supplier Payments" },
                ].map(({ key, label }) => (
                  <label key={key} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                    <input
                      type="checkbox"
                      checked={tempTaxConfig[key]}
                      onChange={(e) => setTempTaxConfig((p) => ({ ...p, [key]: e.target.checked }))}
                      style={{ width: "18px", height: "18px", accentColor: "var(--primary-color)", borderRadius: "4px" }}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
            <Button variant="outline" onClick={() => setShowTaxModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveTax}>
              Save Configuration
            </Button>
          </div>
        </div>
      </Modal>

      {/* Staff Salary & Bonus Management Modal */}
      <Modal
        isOpen={showSalaryModal}
        onClose={() => setShowSalaryModal(false)}
        title="Staff Salary & Bonus Management"
        className="modal-xl"
      >
        <div style={{ padding: "8px 4px", maxHeight: "65vh", overflowY: "auto" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {staff.filter((m) => m.role?.toLowerCase() !== "admin" && m.name !== "Admin User").length === 0 && (
              <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>
                No staff members found.
              </div>
            )}
            {staff.filter((m) => m.role?.toLowerCase() !== "admin" && m.name !== "Admin User").map((member) => {
              const isPaidThisMonth = allFinancialTransactions.some((t) => {
                if (t.type !== "Salary") return false;
                const tid = t.relatedId?._id || t.relatedId;
                if (tid !== member._id) return false;
                const transDate = new Date(t.date || t.createdAt);
                const now = new Date();
                return (
                  transDate.getMonth() === now.getMonth() &&
                  transDate.getFullYear() === now.getFullYear()
                );
              });

              return (
                <div key={member._id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", background: "var(--card-bg)", borderRadius: "12px", border: "1px solid var(--border-color)", gap: "1.5rem", transition: "border-color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--primary-color)"} onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border-color)"}>
                  
                  {/* Info */}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: "1.5", minWidth: "180px" }}>
                    <div style={{ width: "42px", height: "42px", borderRadius: "12px", backgroundColor: "rgba(59,130,246,0.15)", color: "#3B82F6", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "600", fontSize: "1.2rem" }}>
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: "600", color: "var(--text-color)", fontSize: "0.95rem", marginBottom: "2px" }}>{member.name}</div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{member.email}</div>
                    </div>
                  </div>

                  {/* Role */}
                  <div style={{ flex: "1", minWidth: "120px" }}>
                    <span style={{ display: "inline-block", padding: "4px 10px", borderRadius: "6px", background: "var(--bg-color)", border: "1px solid var(--border-color)", color: "var(--text-secondary)", fontSize: "0.8rem", fontWeight: "500", letterSpacing: "0.3px" }}>
                      {member.role.replace(/_/g, " ")}
                    </span>
                  </div>

                  {/* Salary section */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: "1.2", minWidth: "150px" }}>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)", fontSize: "0.85rem", pointerEvents: "none", fontWeight: "500" }}>Rs.</span>
                      <input
                        type="number"
                        style={{ width: "115px", paddingLeft: "32px", paddingRight: "8px", height: "36px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-color)", color: "var(--text-color)", outline: "none", fontSize: "0.9rem", transition: "all 0.2s", fontWeight: "500" }}
                        placeholder="0"
                        min="0" step="1"
                        value={salaryInputs[member._id] || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val !== "" && parseFloat(val) < 0) return;
                          setSalaryInputs({ ...salaryInputs, [member._id]: val });
                        }}
                        onFocus={(e) => e.target.style.borderColor = "var(--primary-color)"}
                        onBlur={(e) => e.target.style.borderColor = "var(--border-color)"}
                      />
                    </div>
                    <button title="Update Base Salary" className="btn-icon" onClick={() => handleUpdateStaffSalary(member._id)} style={{ width: "36px", height: "36px", border: "1px solid var(--border-color)", borderRadius: "8px", background: "var(--bg-color)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-secondary)", transition: "all 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.color = "var(--primary-color)"; e.currentTarget.style.borderColor = "var(--primary-color)"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.borderColor = "var(--border-color)"; }}>
                      <Settings size={16} />
                    </button>
                  </div>

                  {/* Salary Action section */}
                  <div style={{ flex: "1", minWidth: "130px" }}>
                    {isPaidThisMonth ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--success-color)", fontSize: "0.85rem", fontWeight: "600", padding: "6px 0" }}>
                        <CheckCircle size={16} /> Paid This Month
                      </span>
                    ) : (
                      <button style={{ height: "36px", padding: "0 16px", borderRadius: "8px", fontSize: "0.85rem", fontWeight: "600", border: "1px solid var(--primary-color)", color: "var(--primary-color)", background: "transparent", cursor: "pointer", transition: "all 0.2s" }} onClick={() => handlePaySalary(member._id)} onMouseOver={(e) => { e.currentTarget.style.background = "var(--primary-color)"; e.currentTarget.style.color = "white"; }} onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--primary-color)"; }}>
                        Pay Salary
                      </button>
                    )}
                  </div>

                  {/* Bonus Action section */}
                  <div style={{ flex: "1.5", display: "flex", alignItems: "center", gap: "8px", justifyContent: "flex-end", minWidth: "180px" }}>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)", fontSize: "0.85rem", pointerEvents: "none", fontWeight: "500" }}>Rs.</span>
                      <input
                        type="number"
                        style={{ width: "105px", paddingLeft: "32px", paddingRight: "8px", height: "36px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-color)", color: "var(--text-color)", outline: "none", fontSize: "0.9rem", transition: "all 0.2s", fontWeight: "500" }}
                        placeholder="Bonus"
                        value={bonusInputs[member._id] || ""}
                        onChange={(e) => setBonusInputs({ ...bonusInputs, [member._id]: e.target.value })}
                        onFocus={(e) => e.target.style.borderColor = "var(--primary-color)"}
                        onBlur={(e) => e.target.style.borderColor = "var(--border-color)"}
                      />
                    </div>
                    <button style={{ height: "36px", padding: "0 16px", borderRadius: "8px", fontSize: "0.85rem", fontWeight: "600", border: "none", background: "var(--primary-color)", color: "white", cursor: "pointer", transition: "opacity 0.2s" }} onMouseOver={(e) => e.currentTarget.style.opacity = "0.9"} onMouseOut={(e) => e.currentTarget.style.opacity = "1"} onClick={() => handlePayBonus(member._id)}>
                      Send
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Modal>

      {/* Supplier Payment Modal */}
      <Modal
        isOpen={showSupplierModal}
        onClose={() => setShowSupplierModal(false)}
        title="Account Settlement"
        size="lg"
      >
        <div className="supplier-management">
          {/* ── Section 1: Vendor Payables (WE pay them) ── */}
          {(() => {
            const vendors = suppliers.filter(
              (s) => s.supplierType === "Vendor",
            );
            return (
              <div style={{ marginBottom: "2rem" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginBottom: "0.75rem",
                    padding: "0.5rem 0.75rem",
                    background: "rgba(239,68,68,0.07)",
                    borderRadius: "8px",
                    borderLeft: "4px solid #ef4444",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      color: "#ef4444",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    Vendor Payables — We Owe Them
                  </span>
                </div>
                {vendors.length === 0 ? (
                  <p
                    style={{
                      color: "var(--text-muted)",
                      fontSize: "0.9rem",
                      padding: "0.5rem 0",
                    }}
                  >
                    No vendor payable records.
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "1rem", maxHeight: "60vh", overflowY: "auto", paddingRight: "4px" }}>
                    {vendors.map((supplier) => (
                      <div key={supplier._id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", background: "var(--card-bg)", borderRadius: "12px", border: "1px solid var(--border-color)", gap: "1.5rem", transition: "border-color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--primary-color)"} onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border-color)"}>
                        
                        {/* Info */}
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: "1.5", minWidth: "200px" }}>
                          <div style={{ width: "42px", height: "42px", borderRadius: "12px", backgroundColor: "rgba(239, 68, 68, 0.1)", color: "var(--danger-color)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "600", fontSize: "1.2rem" }}>
                            {supplier.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: "600", color: "var(--text-color)", fontSize: "0.95rem", marginBottom: "2px", display: "flex", alignItems: "center", gap: "8px" }}>
                              {supplier.name}
                              <span style={{ fontSize: "0.7rem", padding: "2px 6px", borderRadius: "4px", background: "rgba(239,68,68,0.1)", color: "var(--danger-color)", letterSpacing: "0.3px", fontWeight: "600" }}>
                                {supplier.category}
                              </span>
                            </div>
                            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{supplier.contactPerson} • {supplier.paymentTerms} terms</div>
                          </div>
                        </div>

                        {/* Outstanding */}
                        <div style={{ flex: "1", minWidth: "140px" }}>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "4px", fontWeight: "500", textTransform: "uppercase", letterSpacing: "0.5px" }}>Outstanding</div>
                          <div style={{ color: "var(--danger-color)", fontWeight: "700", fontSize: "1.05rem" }}>
                            Rs. {(supplier.outstandingBalance || 0).toLocaleString()}
                          </div>
                        </div>

                        {/* Settle Action */}
                        <div style={{ flex: "1.2", display: "flex", alignItems: "center", gap: "8px", justifyContent: "flex-end", minWidth: "200px" }}>
                          <div style={{ position: "relative" }}>
                            <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)", fontSize: "0.85rem", pointerEvents: "none", fontWeight: "500" }}>Rs.</span>
                            <input
                              type="number"
                              style={{ width: "115px", paddingLeft: "32px", paddingRight: "8px", height: "36px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-color)", color: "var(--text-color)", outline: "none", fontSize: "0.9rem", transition: "all 0.2s", fontWeight: "500" }}
                              placeholder="Amount"
                              min="0" step="1"
                              value={settleInputs[supplier._id] || ""}
                              onChange={(e) => setSettleInputs({ ...settleInputs, [supplier._id]: e.target.value })}
                              onFocus={(e) => e.target.style.borderColor = "var(--primary-color)"}
                              onBlur={(e) => e.target.style.borderColor = "var(--border-color)"}
                            />
                          </div>
                          <button style={{ height: "36px", padding: "0 16px", borderRadius: "8px", fontSize: "0.85rem", fontWeight: "600", border: "none", background: "var(--danger-color)", color: "white", cursor: "pointer", transition: "opacity 0.2s" }} onMouseOver={(e) => e.currentTarget.style.opacity = "0.9"} onMouseOut={(e) => e.currentTarget.style.opacity = "1"} onClick={() => handleSettleSupplier(supplier._id)}>
                            Pay Vendor
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </Modal>

      {/* PO Payment Requests Modal */}
      <Modal
        isOpen={showPOModal}
        onClose={() => setShowPOModal(false)}
        title="Supplier Payment Requests"
      >
        <div className="po-requests">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Supplier</th>
                  <th>Amount</th>
                  <th>Requested</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {purchaseOrders
                  .filter(
                    (po) => po.paymentRequested && po.paymentStatus !== "Paid",
                  )
                  .map((po) => (
                    <tr key={po._id}>
                      <td>
                        <strong>#{po.poNumber}</strong>
                      </td>
                      <td>{po.supplier?.name}</td>
                      <td>Rs. {po.totalAmount.toLocaleString()}</td>
                      <td>{new Date(po.updatedAt).toLocaleDateString()}</td>
                      <td>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handlePayPO(po._id)}
                        >
                          {po.supplier?.category === "Distributor" ||
                          po.supplier?.category === "Bookshop"
                            ? "Confirm Collection"
                            : "Accept & Pay"}
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {purchaseOrders.filter(
              (po) => po.paymentRequested && po.paymentStatus !== "Paid",
            ).length === 0 && (
              <p className="text-center p-4">No pending payment requests.</p>
            )}
          </div>
        </div>
      </Modal>

      {/* Transaction History Section */}
      <div className="dashboard-card" style={{ marginTop: "2rem" }}>
        <div className="dashboard-card-header">
          <h2 className="card-title">Financial Transaction Logs</h2>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              setEditingFinItem(null);
              setShowTransactionModal(true);
            }}
          >
            + Add Manual Entry
          </button>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {allFinancialTransactions.map((tx) => (
                <tr key={tx._id}>
                  <td>{new Date(tx.date).toLocaleDateString()}</td>
                  <td>
                    <span
                      className={`status-badge ${tx.type === "Salary" ? "info" : tx.type === "Refund" ? "warning" : tx.type === "Bonus" ? "gold" : tx.type === "Customer Collection" ? "success" : tx.type === "Supplier Payment" ? "error" : "primary"}`}
                    >
                      {tx.type}
                    </span>
                  </td>
                  <td
                    style={{
                      color: tx.isIncome ? "#16a34a" : "#dc2626",
                      fontWeight: "600",
                    }}
                  >
                    {tx.isIncome ? "+" : "-"} Rs. {tx.amount.toLocaleString()}
                  </td>
                  <td>{tx.description}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="btn-icon"
                        title="Edit Transaction"
                        onClick={() => {
                          setEditingFinItem(tx);
                          setShowTransactionModal(true);
                        }}
                      >
                        <Settings size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {allFinancialTransactions.length === 0 && (
            <p className="text-center p-4">No transactions recorded yet.</p>
          )}
        </div>
      </div>

      {/* Transaction Entry/Edit Modal */}
      <Modal
        isOpen={showTransactionModal}
        onClose={() => {
          setShowTransactionModal(false);
          setEditingFinItem(null);
        }}
        title={
          editingFinItem ? "Edit Transaction Entry" : "New Manual Transaction"
        }
      >
        <div className="transaction-form" style={{ padding: "1rem" }}>
          {!editingFinItem && (
            <Select
              label="Transaction Type"
              value={manualEntry.type}
              onChange={(e) =>
                setManualEntry({ ...manualEntry, type: e.target.value })
              }
              options={[
                { value: "Other", label: "Other Expense/Income" },
                { value: "Salary", label: "Salary (Manual Record)" },
                { value: "Bonus", label: "Bonus (Manual Record)" },
                {
                  value: "Supplier Payment",
                  label: "Supplier (Manual Record)",
                },
              ]}
            />
          )}

          <Select
            label="Transaction Category"
            value={
              editingFinItem
                ? editingFinItem.isIncome
                  ? "Income"
                  : "Expense"
                : manualEntry.direction
            }
            onChange={(e) => {
              if (editingFinItem) {
                setEditingFinItem({
                  ...editingFinItem,
                  isIncome: e.target.value === "Income",
                });
              } else {
                setManualEntry({ ...manualEntry, direction: e.target.value });
              }
            }}
            options={[
              { value: "Expense", label: "Expense (-)" },
              { value: "Income", label: "Income (+)" },
            ]}
          />

          <Input
            label="Amount (Rs.)"
            type="number"
            value={editingFinItem ? editingFinItem.amount : manualEntry.amount}
            onChange={(e) => {
              if (editingFinItem) {
                setEditingFinItem({
                  ...editingFinItem,
                  amount: e.target.value,
                });
              } else {
                setManualEntry({ ...manualEntry, amount: e.target.value });
              }
            }}
            placeholder="Enter amount"
          />

          <TextArea
            label="Description"
            value={
              editingFinItem
                ? editingFinItem.description
                : manualEntry.description
            }
            onChange={(e) => {
              if (editingFinItem) {
                setEditingFinItem({
                  ...editingFinItem,
                  description: e.target.value,
                });
              } else {
                setManualEntry({
                  ...manualEntry,
                  description: e.target.value,
                });
              }
            }}
            placeholder="e.g. Electricity Bill, Shop Rent, etc."
            rows={3}
          />

          <Button
            variant="primary"
            className="w-100"
            onClick={async () => {
              if (editingFinItem) {
                await handleUpdateTransaction(
                  editingFinItem._id,
                  parseFloat(editingFinItem.amount),
                  editingFinItem.description,
                  editingFinItem.isIncome,
                );
              } else {
                await handleManualCreateTransaction();
              }
            }}
          >
            {editingFinItem ? "Save Changes" : "Record Transaction"}
          </Button>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={closeConfirm}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        variant={confirmState.variant}
      />

      {/* ── Bank Slip Image Popup ── */}
      {slipViewerUrl && (
        <div
          onClick={() => setSlipViewerUrl(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.82)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#1a1a2e",
              borderRadius: "16px",
              boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
              maxWidth: "90vw",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                borderBottom: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <span
                style={{ color: "#fff", fontWeight: 600, fontSize: "1rem" }}
              >
                Bank Deposit Slip
              </span>
              <div style={{ display: "flex", gap: "10px" }}>
                <a
                  href={slipViewerUrl}
                  download="bank-slip.jpg"
                  style={{
                    background: "rgba(255,255,255,0.12)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "6px 14px",
                    fontSize: "0.8rem",
                    cursor: "pointer",
                    textDecoration: "none",
                  }}
                >
                  ⬇ Download
                </a>
                <button
                  onClick={() => setSlipViewerUrl(null)}
                  style={{
                    background: "rgba(255,255,255,0.12)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "6px 14px",
                    fontSize: "0.8rem",
                    cursor: "pointer",
                  }}
                >
                  ✕ Close
                </button>
              </div>
            </div>
            {/* Image */}
            <div style={{ overflow: "auto", padding: "16px" }}>
              <img
                src={slipViewerUrl}
                alt="Bank Slip"
                style={{
                  maxWidth: "100%",
                  maxHeight: "75vh",
                  objectFit: "contain",
                  borderRadius: "8px",
                  display: "block",
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceManagerDashboard;

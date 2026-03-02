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
} from "lucide-react";
import toast from "react-hot-toast";
import StatCard from "../../../components/dashboard/StatCard";
import DashboardHeader from "../../../components/dashboard/DashboardHeader";
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
        setStats((prev) => ({
          ...prev,
          pendingOrders: allOrders.filter((o) => o.status === "Pending").length,
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
          },
          { key: "overview", label: "Overview", icon: <Activity size={15} /> },
        ].map(({ key, label, icon }) => (
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
          </button>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="dashboard-grid dashboard-grid-4">
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
        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
        >
          {/* Header info */}
          <div
            style={{
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              borderRadius: "8px",
              padding: "0.85rem 1rem",
              fontSize: "0.875rem",
              color: "#1e40af",
            }}
          >
            Tax settings are stored locally and applied to all future manual
            invoice calculations.
          </div>

          {/* Tax identity */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
            }}
          >
            <Input
              label="Tax Name"
              type="text"
              placeholder="e.g. VAT, GST"
              value={tempTaxConfig.taxName}
              onChange={(e) =>
                setTempTaxConfig((p) => ({ ...p, taxName: e.target.value }))
              }
            />
            <Input
              label="Tax Registration Number (optional)"
              type="text"
              placeholder="e.g. VAT-123456"
              value={tempTaxConfig.taxNumber}
              onChange={(e) =>
                setTempTaxConfig((p) => ({ ...p, taxNumber: e.target.value }))
              }
            />
          </div>

          {/* Rate */}
          <Input
            label="Default Tax Rate (%)"
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={tempTaxConfig.vatRate}
            onChange={(e) => {
              const v = e.target.value;
              if (v !== "" && (parseFloat(v) < 0 || parseFloat(v) > 100))
                return;
              setTempTaxConfig((p) => ({ ...p, vatRate: v }));
            }}
            helperText={`Tax amount on Rs. 10,000 → Rs. ${((10000 * (parseFloat(tempTaxConfig.vatRate) || 0)) / 100).toLocaleString()}`}
          />

          {/* Apply-to toggles */}
          <div>
            <p
              style={{
                fontWeight: "600",
                fontSize: "0.875rem",
                marginBottom: "0.6rem",
                color: "#374151",
              }}
            >
              Apply Tax To
            </p>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              {[
                { key: "applyToInvoices", label: "Customer Invoices" },
                { key: "applyToSalaries", label: "Salary Transactions" },
                { key: "applyToSupplierPayments", label: "Supplier Payments" },
              ].map(({ key, label }) => (
                <label
                  key={key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={tempTaxConfig[key]}
                    onChange={(e) =>
                      setTempTaxConfig((p) => ({
                        ...p,
                        [key]: e.target.checked,
                      }))
                    }
                    style={{
                      width: "16px",
                      height: "16px",
                      accentColor: "#3b82f6",
                    }}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div
            style={{
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "0.85rem 1rem",
            }}
          >
            <p
              style={{
                fontWeight: "600",
                fontSize: "0.875rem",
                marginBottom: "0.5rem",
              }}
            >
              Current Configuration Preview
            </p>
            <div
              style={{
                fontSize: "0.85rem",
                color: "#4b5563",
                display: "flex",
                flexDirection: "column",
                gap: "0.25rem",
              }}
            >
              <span>
                <strong>Tax Name:</strong> {tempTaxConfig.taxName || "—"}
              </span>
              <span>
                <strong>Rate:</strong> {tempTaxConfig.vatRate}%
              </span>
              <span>
                <strong>Reg. No.:</strong>{" "}
                {tempTaxConfig.taxNumber || "Not set"}
              </span>
              <span>
                <strong>Applied to:</strong>{" "}
                {[
                  tempTaxConfig.applyToInvoices && "Invoices",
                  tempTaxConfig.applyToSalaries && "Salaries",
                  tempTaxConfig.applyToSupplierPayments && "Supplier Payments",
                ]
                  .filter(Boolean)
                  .join(", ") || "None"}
              </span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              justifyContent: "flex-end",
            }}
          >
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
        <div className="salary-management">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Staff Member</th>
                  <th>Role</th>
                  <th>Base Salary (Rs.)</th>
                  <th>Status</th>
                  <th>Bonus (Rs.)</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((member) => {
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
                    <tr key={member._id}>
                      <td>
                        <div className="user-info">
                          <div
                            className="user-avatar"
                            style={{
                              backgroundColor: "#f3e8ff",
                              color: "#6b21a8",
                            }}
                          >
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="user-name">{member.name}</div>
                            <div className="user-subtitle">{member.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="status-badge info">
                          {member.role.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            gap: "0.5rem",
                            alignItems: "center",
                          }}
                        >
                          <input
                            type="number"
                            className="form-input form-input-sm"
                            style={{ width: "100px" }}
                            min="0"
                            step="1"
                            value={salaryInputs[member._id] || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              // Prevent negative values from being entered
                              if (val !== "" && parseFloat(val) < 0) return;
                              setSalaryInputs({
                                ...salaryInputs,
                                [member._id]: val,
                              });
                            }}
                          />
                          <button
                            className="btn-icon"
                            title="Update Base Salary"
                            onClick={() => handleUpdateStaffSalary(member._id)}
                          >
                            <Settings size={14} />
                          </button>
                        </div>
                      </td>
                      <td>
                        {isPaidThisMonth ? (
                          <span className="status-badge success">
                            Paid (This Month)
                          </span>
                        ) : (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handlePaySalary(member._id)}
                          >
                            Pay Salary
                          </button>
                        )}
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-input form-input-sm"
                          style={{ width: "100px" }}
                          placeholder="Amount..."
                          value={bonusInputs[member._id] || ""}
                          onChange={(e) =>
                            setBonusInputs({
                              ...bonusInputs,
                              [member._id]: e.target.value,
                            })
                          }
                        />
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handlePayBonus(member._id)}
                        >
                          Send Bonus
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Vendor</th>
                          <th>Outstanding (We Owe)</th>
                          <th>Terms</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vendors.map((supplier) => (
                          <tr key={supplier._id}>
                            <td>
                              <strong>{supplier.name}</strong>
                              <div
                                style={{ fontSize: "0.8rem", color: "#666" }}
                              >
                                {supplier.contactPerson}
                              </div>
                              <span
                                style={{
                                  fontSize: "0.75rem",
                                  padding: "1px 6px",
                                  borderRadius: "4px",
                                  background: "rgba(239,68,68,0.1)",
                                  color: "#ef4444",
                                }}
                              >
                                {supplier.category}
                              </span>
                            </td>
                            <td
                              style={{ color: "#ef4444", fontWeight: "bold" }}
                            >
                              Rs.{" "}
                              {(
                                supplier.outstandingBalance || 0
                              ).toLocaleString()}
                            </td>
                            <td>{supplier.paymentTerms}</td>
                            <td>
                              <div style={{ display: "flex", gap: "0.5rem" }}>
                                <input
                                  type="number"
                                  placeholder="Amount"
                                  value={settleInputs[supplier._id] || ""}
                                  onChange={(e) =>
                                    setSettleInputs({
                                      ...settleInputs,
                                      [supplier._id]: e.target.value,
                                    })
                                  }
                                  className="form-input form-input-sm"
                                  style={{ width: "110px" }}
                                />
                                <button
                                  className="btn btn-sm"
                                  style={{
                                    background: "#ef4444",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "6px",
                                    padding: "0.35rem 0.75rem",
                                    cursor: "pointer",
                                    fontWeight: 600,
                                  }}
                                  onClick={() =>
                                    handleSettleSupplier(supplier._id)
                                  }
                                >
                                  Pay Vendor
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

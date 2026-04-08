// ============================================
// MarketingManagerDashboard
// Epic: E6 - Promotion & Loyalty
// Owner: IT24101266 (Perera M.U.E)
// Purpose: MarketingManagerDashboard page component
// ============================================
// Purpose: Coupon, campaign, and promotion management

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../epics/E1_UserAndRoleManagement/context/AuthContext";
import {
  Ticket,
  CheckCircle,
  Gift,
  Megaphone,
  Plus,
  BarChart2,
  LogOut,
  Trash2,
  Calendar,
  AlertCircle,
  Edit,
  Search,
  XCircle,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import StatCard from "../../../components/dashboard/StatCard";
import DashboardHeader from "../../../components/dashboard/DashboardHeader";
import DashboardSection from "../../../components/dashboard/DashboardSection";
import Modal from "../../../components/common/Modal";
import StatusModal from "../../../components/common/StatusModal";
import ConfirmModal from "../../../components/common/ConfirmModal";
import {
  Input,
  Select,
  Button,
  TextArea,
} from "../../../components/common/Forms";
import RevenueChart from "../../../components/dashboard/charts/RevenueChart";
import "../../../components/dashboard/dashboard.css";
import "./MarketingManagerDashboard.css";
import { LogoutModal } from "../../../epics/E1_UserAndRoleManagement/components/Auth/AuthModals";
import GiftVoucherManagement from "../../../epics/E6_PromotionAndLoyalty/pages/marketing/GiftVoucherManagement";
import PriorityAlert from "../../../components/dashboard/PriorityAlert";

const MarketingManagerDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  // [E6.1] Dashboard KPIs: activeCoupons, totalUsed (E6.3 usage tracking), activeVouchers, campaigns, CTR
  // Dashboard State
  const [stats, setStats] = useState({
    activeCoupons: 0,
    totalUsed: 0,
    activeVouchers: 0,
    campaigns: 0,
    totalRevenue: 0,
    conversionRate: 0,
    ctr: 0,
    giftVouchers: 0,
    totalVoucherBalance: 0,
    usedToday: 0,
    endingSoon: 0,
    revenueTrend: [],
  });
  const [coupons, setCoupons] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [activeTab, setActiveTab] = useState("coupons"); // coupons, campaigns, analytics, vouchers
  const [searchTermCoupons, setSearchTermCoupons] = useState("");
  const [searchTermCampaigns, setSearchTermCampaigns] = useState("");
  const [loading, setLoading] = useState(true);

  const location = useLocation();

  // [E6.5] Tab sync with URL path: /campaigns, /analytics, /gift-vouchers map to dashboard sub-tabs
  // Sync tab with route
  // Side Effects
  useEffect(() => {
    const path = location.pathname;
    if (path.includes("/campaigns")) {
      setActiveTab("campaigns");
    } else if (path.includes("/analytics")) {
      setActiveTab("analytics");
    } else if (path.includes("/gift-vouchers")) {
      setActiveTab("vouchers");
    } else {
      setActiveTab("coupons");
    }
  }, [location.pathname]);

  // Modals
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [isEditingCoupon, setIsEditingCoupon] = useState(false);
  const [editingCouponId, setEditingCouponId] = useState(null);
  const [isEditingCampaign, setIsEditingCampaign] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState(null);
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
    variant: "primary",
    confirmText: "Confirm",
  });

  const closeConfirm = () =>
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));

  // Forms
  // [E6.1] [E6.2] couponForm includes all required fields: code, discountType, discountValue, validUntil, maxUsageCount
  const [couponForm, setCouponForm] = useState({
    code: "",
    discountType: "percentage",
    discountValue: "",
    minPurchaseAmount: "",
    validUntil: "",
    maxUsageCount: "",
  });

  const [campaignForm, setCampaignForm] = useState({
    name: "",
    type: "Seasonal",
    startDate: "",
    endDate: "",
    discountType: "Percentage",
    discountValue: "",
    description: "",
  });

  // Validation State
  const [couponErrors, setCouponErrors] = useState({});
  const [campaignErrors, setCampaignErrors] = useState({});

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Event Handlers
  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [couponsRes, campaignsRes, analyticsRes] = await Promise.all([
        axios.get("/api/coupons", config),
        axios.get("/api/coupons/campaigns", config),
        axios.get("/api/coupons/analytics", config),
      ]);

      const allCoupons = couponsRes.data.coupons || [];
      const allCampaigns = campaignsRes.data.campaigns || [];
      const analytics = analyticsRes.data.stats || {};

      setStats({
        activeCoupons: analytics.activeCoupons || allCoupons.length,
        totalUsed: analytics.totalUsed || 0,
        activeVouchers: analytics.giftVouchers || 0,
        campaigns: allCampaigns.length,
        totalRevenue: analytics.totalRevenue || 0,
        conversionRate: analytics.conversionRate || 0,
        ctr: analytics.ctr || 0,
        totalVoucherBalance: analytics.totalVoucherBalance || 0,
        usedToday: analytics.usedToday || 0,
        endingSoon: analytics.endingSoon || 0,
        revenueTrend: analytics.revenueTrend || [],
      });

      setCoupons(allCoupons);
      setCampaigns(allCampaigns);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setLoading(false);
    }
  };

  // Validation Logic
  const validateCoupon = (name, value) => {
    let error = "";
    if (name === "code") {
      if (!value) error = "Coupon code is required";
      else if (value.length < 3) error = "Code must be at least 3 characters";
    } else if (name === "discountValue") {
      if (!value) error = "Discount value is required";
      else if (Number(value) <= 0) error = "Must be greater than 0";
      else if (couponForm.discountType === "percentage" && Number(value) > 100)
        error = "Percentage cannot exceed 100%";
    } else if (name === "validUntil") {
      if (!value) error = "Expiry date is required";
      else if (new Date(value) <= new Date())
        error = "Expiry must be in the future";
    } else if (name === "minPurchaseAmount" && value) {
      if (Number(value) < 0) error = "Cannot be negative";
    } else if (name === "maxUsageCount" && value) {
      if (Number(value) <= 0) error = "Must be at least 1";
    }
    return error;
  };

  const handleCouponInputChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;
    if (name === "code") finalValue = value.toUpperCase();

    setCouponForm((prev) => ({ ...prev, [name]: finalValue }));

    const error = validateCoupon(name, finalValue);
    setCouponErrors((prev) => ({ ...prev, [name]: error }));
  };

  const validateCampaign = (name, value) => {
    let error = "";
    if (name === "name") {
      if (!value) error = "Campaign name is required";
      else if (value.length < 3) error = "Name must be at least 3 characters";
    } else if (name === "discountValue") {
      if (!value) error = "Discount value is required";
      else if (Number(value) <= 0) error = "Must be greater than 0";
    } else if (name === "startDate") {
      if (!value) error = "Start date is required";
    } else if (name === "endDate") {
      if (!value) error = "End date is required";
      else if (
        campaignForm.startDate &&
        new Date(value) <= new Date(campaignForm.startDate)
      ) {
        error = "End date must be after start date";
      }
    }
    return error;
  };

  const handleCampaignInputChange = (e) => {
    const { name, value } = e.target;
    setCampaignForm((prev) => ({ ...prev, [name]: value }));

    const error = validateCampaign(name, value);
    setCampaignErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();

    // Final Validation Check
    const errors = {};
    Object.keys(couponForm).forEach((key) => {
      const err = validateCoupon(key, couponForm[key]);
      if (err) errors[key] = err;
    });

    if (Object.keys(errors).length > 0) {
      setCouponErrors(errors);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (isEditingCoupon && editingCouponId) {
        await axios.put(`/api/coupons/${editingCouponId}`, couponForm, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStatusModal({
          isOpen: true,
          type: "success",
          title: "Coupon Updated",
          message: `Coupon code "${couponForm.code}" has been updated successfully.`,
        });
      } else {
        await axios.post("/api/coupons", couponForm, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStatusModal({
          isOpen: true,
          type: "success",
          title: "Coupon Created",
          message: `New coupon code "${couponForm.code}" has been created and is now active.`,
        });
      }
      setShowCouponModal(false);
      setIsEditingCoupon(false);
      setEditingCouponId(null);
      fetchDashboardData();
      setCouponForm({
        code: "",
        discountType: "percentage",
        discountValue: "",
        minPurchaseAmount: "",
        validUntil: "",
        maxUsageCount: "",
      });
    } catch (error) {
      console.error("Error saving coupon:", error);
      setStatusModal({
        isOpen: true,
        type: "error",
        title: "Operation Failed",
        message:
          error.response?.data?.message ||
          "Failed to save coupon. Please check your data and try again.",
      });
    }
  };

  const handleEditCoupon = (coupon) => {
    setIsEditingCoupon(true);
    setEditingCouponId(coupon._id);
    setCouponForm({
      code: coupon.code || "",
      discountType: coupon.discountType || "percentage",
      discountValue: coupon.discountValue || "",
      minPurchaseAmount: coupon.minPurchaseAmount || "",
      validUntil: coupon.validUntil ? coupon.validUntil.slice(0, 10) : "",
      maxUsageCount: coupon.maxUsageCount || "",
    });
    setShowCouponModal(true);
  };

  const handleDeleteCoupon = (id) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Coupon",
      message:
        "Are you sure you want to delete this coupon? This action cannot be undone.",
      confirmText: "Delete",
      variant: "danger",
      onConfirm: async () => {
        closeConfirm();
        try {
          const token = localStorage.getItem("token");
          await axios.delete(`/api/coupons/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          fetchDashboardData();
        } catch (error) {
          console.error("Error deleting coupon:", error);
          setStatusModal({
            isOpen: true,
            type: "error",
            title: "Delete Failed",
            message: "Failed to delete the coupon. Please try again.",
          });
        }
      },
    });
  };

  const handleCreateCampaign = async (e) => {
    e.preventDefault();

    // Final Validation Check
    const errors = {};
    Object.keys(campaignForm).forEach((key) => {
      const err = validateCampaign(key, campaignForm[key]);
      if (err) errors[key] = err;
    });

    if (Object.keys(errors).length > 0) {
      setCampaignErrors(errors);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (isEditingCampaign && editingCampaignId) {
        await axios.put(
          `/api/coupons/campaigns/${editingCampaignId}`,
          campaignForm,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setStatusModal({
          isOpen: true,
          type: "success",
          title: "Campaign Updated",
          message: `Campaign "${campaignForm.name}" has been updated successfully.`,
        });
      } else {
        await axios.post("/api/coupons/campaigns", campaignForm, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStatusModal({
          isOpen: true,
          type: "success",
          title: "Campaign Launched",
          message: `New campaign "${campaignForm.name}" has been launched successfully.`,
        });
      }
      setShowCampaignModal(false);
      setIsEditingCampaign(false);
      setEditingCampaignId(null);
      fetchDashboardData();
      setCampaignForm({
        name: "",
        type: "Seasonal",
        startDate: "",
        endDate: "",
        discountType: "Percentage",
        discountValue: "",
        description: "",
      });
    } catch (error) {
      console.error("Error saving campaign:", error);
      setStatusModal({
        isOpen: true,
        type: "error",
        title: "Launch Failed",
        message:
          error.response?.data?.message ||
          "Failed to save campaign. Please try again.",
      });
    }
  };

  const handleEditCampaign = (campaign) => {
    setIsEditingCampaign(true);
    setEditingCampaignId(campaign._id);
    setCampaignForm({
      name: campaign.name || "",
      type: campaign.type || "Seasonal",
      startDate: campaign.startDate ? campaign.startDate.slice(0, 10) : "",
      endDate: campaign.endDate ? campaign.endDate.slice(0, 10) : "",
      discountType: campaign.discountType || "Percentage",
      discountValue: campaign.discountValue || "",
      description: campaign.description || "",
    });
    setShowCampaignModal(true);
  };

  const handleDeleteCampaign = (id) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Campaign",
      message:
        "Are you sure you want to delete this campaign? This action cannot be undone.",
      confirmText: "Delete",
      variant: "danger",
      onConfirm: async () => {
        closeConfirm();
        try {
          const token = localStorage.getItem("token");
          await axios.delete(`/api/coupons/campaigns/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          fetchDashboardData();
        } catch (error) {
          console.error("Error deleting campaign:", error);
          setStatusModal({
            isOpen: true,
            type: "error",
            title: "Delete Failed",
            message: "Failed to delete the campaign. Please try again.",
          });
        }
      },
    });
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
    <div className="dashboard-container marketing-dashboard">
      <DashboardHeader
        title="Marketing Manager Dashboard"
        subtitle="Manage promotions and campaigns to drive sales"
        actions={[
          {
            label: "Create Coupon",
            icon: <Plus size={18} />,
            onClick: () => setShowCouponModal(true),
            variant: "primary",
          },
          {
            label: "New Campaign",
            icon: <Megaphone size={18} />,
            onClick: () => setShowCampaignModal(true),
            variant: "outline",
          },
        ]}
      />

      {/* Priority Alerts — E6.1 Expiry Tracking */}
      {stats.endingSoon > 0 && (
        <PriorityAlert
          title="Promotion Expiry Warning"
          description={`${stats.endingSoon} coupon(s) or campaign(s) are ending within the next 3 days.`}
          actionLabel="Review Now"
          onAction={() => {
            setActiveTab("coupons");
            document
              .querySelector(".dashboard-tabs")
              ?.scrollIntoView({ behavior: "smooth" });
          }}
          variant="danger"
        />
      )}

      {/* Stats Grid */}
      <div className="dashboard-grid dashboard-grid-4">
        <StatCard
          icon={<Ticket size={24} />}
          label="Active Coupons"
          value={stats.activeCoupons}
          variant="primary"
          trend={`Active now in store`}
        />
        <StatCard
          icon={<CheckCircle size={24} />}
          label="Total Used"
          value={stats.totalUsed}
          variant="warning"
          trend={`${stats.usedToday} used in last 24h`}
        />
        <StatCard
          icon={<Megaphone size={24} />}
          label="Campaigns"
          value={stats.campaigns}
          variant="primary"
          trend={`${stats.endingSoon} ending soon`}
        />
        <StatCard
          icon={<BarChart2 size={24} />}
          label="Revenue Impact"
          value={`Rs. ${stats.totalRevenue?.toLocaleString()}`}
          variant="success"
          trend={`${stats.conversionRate}% Conversion`}
        />
      </div>

      {/* ── Quick Priority Actions ── */}
      <DashboardSection title="Marketing Shortcuts">
        <div className="dashboard-grid dashboard-grid-4">
          <div
            className="dashboard-card action-card"
            onClick={() => setShowCouponModal(true)}
            style={{ cursor: "pointer" }}
          >
            <div
              className="action-icon"
              style={{ background: "rgba(37,99,235,0.1)", color: "#2563EB" }}
            >
              <Ticket size={24} />
            </div>
            <h3 style={{ fontSize: "1.05rem", marginBottom: "6px" }}>
              Issue Coupon
            </h3>
            <p style={{ fontSize: "0.85rem" }}>Generate discount codes</p>
            <div className="action-link" style={{ marginTop: "auto" }}>
              Create <ChevronRight size={16} />
            </div>
          </div>
          <div
            className="dashboard-card action-card"
            onClick={() => setShowCampaignModal(true)}
            style={{ cursor: "pointer" }}
          >
            <div
              className="action-icon"
              style={{ background: "rgba(245,158,11,0.1)", color: "#F59E0B" }}
            >
              <Megaphone size={24} />
            </div>
            <h3 style={{ fontSize: "1.05rem", marginBottom: "6px" }}>
              New Campaign
            </h3>
            <p style={{ fontSize: "0.85rem" }}>Launch site-wide promotions</p>
            <div className="action-link" style={{ marginTop: "auto" }}>
              Create <ChevronRight size={16} />
            </div>
          </div>
          <div
            className="dashboard-card action-card"
            onClick={() => navigate("/marketing-manager/gift-vouchers")}
            style={{ cursor: "pointer" }}
          >
            <div
              className="action-icon"
              style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}
            >
              <Gift size={24} />
            </div>
            <h3 style={{ fontSize: "1.05rem", marginBottom: "6px" }}>
              Gift Vouchers
            </h3>
            <p style={{ fontSize: "0.85rem" }}>Manage issued gift cards</p>
            <div className="action-link" style={{ marginTop: "auto" }}>
              View Vouchers <ChevronRight size={16} />
            </div>
          </div>
          <div
            className="dashboard-card action-card"
            onClick={() => navigate("/marketing-manager/analytics")}
            style={{ cursor: "pointer" }}
          >
            <div
              className="action-icon"
              style={{ background: "rgba(139,92,246,0.1)", color: "#8B5CF6" }}
            >
              <BarChart2 size={24} />
            </div>
            <h3 style={{ fontSize: "1.05rem", marginBottom: "6px" }}>
              Analytics
            </h3>
            <p style={{ fontSize: "0.85rem" }}>Review performance</p>
            <div className="action-link" style={{ marginTop: "auto" }}>
              View Analytics <ChevronRight size={16} />
            </div>
          </div>
        </div>
      </DashboardSection>

      {/* Tabs */}
      <div className="dashboard-tabs">
        <button
          className={`tab-btn ${activeTab === "coupons" ? "active" : ""}`}
          onClick={() => navigate("/marketing-manager/dashboard")}
        >
          <Ticket size={18} /> Overview
        </button>
        <button
          className={`tab-btn ${activeTab === "campaigns" ? "active" : ""}`}
          onClick={() => navigate("/marketing-manager/campaigns")}
        >
          <Megaphone size={18} /> Campaigns
        </button>
        <button
          className={`tab-btn ${activeTab === "analytics" ? "active" : ""}`}
          onClick={() => navigate("/marketing-manager/analytics")}
        >
          <BarChart2 size={18} /> Analytics
        </button>
        <button
          className={`tab-btn ${activeTab === "vouchers" ? "active" : ""}`}
          onClick={() => navigate("/marketing-manager/gift-vouchers")}
        >
          <Gift size={18} /> Gift Vouchers
        </button>
      </div>

      {/* Content Area */}
      <div className="dashboard-card">
        {activeTab === "coupons" && (
          <>
            <div className="table-controls" style={{ marginBottom: "1.5rem" }}>
              <div className="search-bar">
                <Search size={20} />
                <input
                  type="text"
                  placeholder="Search by code..."
                  value={searchTermCoupons}
                  onChange={(e) => setSearchTermCoupons(e.target.value)}
                />
                {searchTermCoupons && (
                  <XCircle
                    className="search-clear-icon"
                    size={16}
                    onClick={() => setSearchTermCoupons("")}
                  />
                )}
              </div>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Discount</th>
                    <th>Type</th>
                    <th>Used / Max</th>
                    <th>Expires</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.filter((c) =>
                    c.code
                      .toLowerCase()
                      .includes(searchTermCoupons.toLowerCase()),
                  ).length === 0 ? (
                    <tr>
                      <td
                        colSpan="7"
                        style={{ textAlign: "center", padding: "2rem" }}
                        className="text-muted"
                      >
                        {searchTermCoupons
                          ? "No coupons match your search"
                          : "No active coupons"}
                      </td>
                    </tr>
                  ) : (
                    coupons
                      .filter((c) =>
                        c.code
                          .toLowerCase()
                          .includes(searchTermCoupons.toLowerCase()),
                      )
                      .map((coupon) => (
                        <tr key={coupon._id}>
                          <td>
                            <strong className="coupon-code">
                              {coupon.code}
                            </strong>
                          </td>
                          <td>
                            {coupon.discountType === "percentage"
                              ? `${coupon.discountValue}%`
                              : `Rs. ${coupon.discountValue}`}
                          </td>
                          <td>
                            <span className="type-badge">
                              {coupon.discountType}
                            </span>
                          </td>
                          <td>
                            {coupon.currentUsageCount} /{" "}
                            {coupon.maxUsageCount || "∞"}
                          </td>
                          <td>
                            {new Date(coupon.validUntil).toLocaleDateString()}
                          </td>
                          <td>
                            <span
                              className={`status-badge ${coupon.isActive ? "active" : "inactive"}`}
                            >
                              {coupon.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td>
                            <div className="table-actions">
                              <button
                                className="btn-icon"
                                onClick={() => handleEditCoupon(coupon)}
                                title="Edit Coupon"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                className="btn-icon danger"
                                onClick={() => handleDeleteCoupon(coupon._id)}
                                title="Delete Coupon"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === "campaigns" && (
          <>
            <div className="table-controls" style={{ marginBottom: "1.5rem" }}>
              <div className="search-bar">
                <Search size={20} />
                <input
                  type="text"
                  placeholder="Search campaigns..."
                  value={searchTermCampaigns}
                  onChange={(e) => setSearchTermCampaigns(e.target.value)}
                />
                {searchTermCampaigns && (
                  <XCircle
                    className="search-clear-icon"
                    size={16}
                    onClick={() => setSearchTermCampaigns("")}
                  />
                )}
              </div>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Campaign Name</th>
                    <th>Type</th>
                    <th>Duration</th>
                    <th>Discount</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.filter(
                    (c) =>
                      c.name
                        .toLowerCase()
                        .includes(searchTermCampaigns.toLowerCase()) ||
                      c.type
                        .toLowerCase()
                        .includes(searchTermCampaigns.toLowerCase()),
                  ).length === 0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        style={{ textAlign: "center", padding: "2rem" }}
                        className="text-muted"
                      >
                        {searchTermCampaigns
                          ? "No campaigns match your search"
                          : "No campaigns found"}
                      </td>
                    </tr>
                  ) : (
                    campaigns
                      .filter(
                        (c) =>
                          c.name
                            .toLowerCase()
                            .includes(searchTermCampaigns.toLowerCase()) ||
                          c.type
                            .toLowerCase()
                            .includes(searchTermCampaigns.toLowerCase()),
                      )
                      .map((campaign) => (
                        <tr key={campaign._id}>
                          <td>
                            <strong>{campaign.name}</strong>
                          </td>
                          <td>{campaign.type}</td>
                          <td>
                            {new Date(campaign.startDate).toLocaleDateString()}{" "}
                            - {new Date(campaign.endDate).toLocaleDateString()}
                          </td>
                          <td>
                            {campaign.discountValue}
                            {campaign.discountType === "Percentage"
                              ? "%"
                              : " LKR"}
                          </td>
                          <td>
                            <span
                              className={`status-badge ${campaign.isActive ? "active" : "inactive"}`}
                            >
                              {campaign.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td>
                            <div className="table-actions">
                              <button
                                className="btn-icon"
                                onClick={() => handleEditCampaign(campaign)}
                                title="Edit Campaign"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                className="btn-icon danger"
                                onClick={() =>
                                  handleDeleteCampaign(campaign._id)
                                }
                                title="Delete Campaign"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === "analytics" && (
          <div className="card-body">
            <div
              className="dashboard-card-header"
              style={{ border: "none", padding: "0 0 1.5rem 0" }}
            >
              <h2 className="card-title">Marketing Analytics</h2>
              <p className="text-muted">
                Track the effectiveness of your marketing efforts over time
              </p>
            </div>

            <div className="dashboard-grid dashboard-grid-3">
              <div className="metric-card mini">
                <span className="stat-label">Conversion Rate</span>
                <h3 className="stat-value">{stats.conversionRate}%</h3>
              </div>
              <div className="metric-card mini">
                <span className="stat-label">Click Through Rate</span>
                <h3 className="stat-value">{stats.ctr}%</h3>
              </div>
              <div className="metric-card mini">
                <span className="stat-label">Revenue Impact</span>
                <h3 className="stat-value">
                  Rs. {stats.totalRevenue.toLocaleString()}
                </h3>
              </div>
            </div>

            <div className="chart-container" style={{ marginTop: "2rem" }}>
              {stats.revenueTrend && stats.revenueTrend.length > 0 ? (
                <RevenueChart
                  data={stats.revenueTrend.map((t) => t.total)}
                  labels={stats.revenueTrend.map((t) => t._id)}
                />
              ) : (
                <div className="no-data-placeholder">
                  Fetching latest performance data...
                </div>
              )}
            </div>

            <div
              className="info-alert"
              style={{
                marginTop: "2rem",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
              }}
            >
              <AlertCircle size={20} className="text-primary" />
              <p
                className="text-muted"
                style={{ margin: 0, fontSize: "0.9rem" }}
              >
                Daily revenue attribution from active campaigns for the current
                week. Data is updated live.
              </p>
            </div>
          </div>
        )}

        {activeTab === "vouchers" && <GiftVoucherManagement />}
      </div>

      {/* Coupon Modal */}
      <Modal
        isOpen={showCouponModal}
        onClose={() => {
          setShowCouponModal(false);
          setIsEditingCoupon(false);
          setEditingCouponId(null);
        }}
        title={isEditingCoupon ? "Edit Coupon" : "Create New Coupon"}
        size="md"
      >
        <form onSubmit={handleCreateCoupon}>
          <div className="form-grid-2">
            <Input
              label="Coupon Code"
              name="code"
              required
              value={couponForm.code}
              onChange={handleCouponInputChange}
              error={couponErrors.code}
              placeholder="e.g. SUMMER2024"
            />
            <Select
              label="Discount Type"
              name="discountType"
              value={couponForm.discountType}
              onChange={handleCouponInputChange}
              error={couponErrors.discountType}
              options={[
                { value: "percentage", label: "Percentage (%)" },
                { value: "fixed", label: "Fixed Amount (Rs)" },
              ]}
            />
          </div>

          <div className="form-grid-2">
            <Input
              label="Discount Value"
              name="discountValue"
              type="number"
              required
              value={couponForm.discountValue}
              onChange={handleCouponInputChange}
              error={couponErrors.discountValue}
              min="0"
            />
            <Input
              label="Valid Until"
              name="validUntil"
              type="date"
              required
              value={couponForm.validUntil}
              onChange={handleCouponInputChange}
              error={couponErrors.validUntil}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>

          <div className="form-grid-2">
            <Input
              label="Min. Purchase (Rs.)"
              name="minPurchaseAmount"
              type="number"
              value={couponForm.minPurchaseAmount}
              onChange={handleCouponInputChange}
              error={couponErrors.minPurchaseAmount}
              placeholder="0 = no minimum"
              min="0"
            />
            <Input
              label="Max Usage Count"
              name="maxUsageCount"
              type="number"
              value={couponForm.maxUsageCount}
              onChange={handleCouponInputChange}
              error={couponErrors.maxUsageCount}
              placeholder="Unlimited"
              min="1"
            />
          </div>

          <div className="dash-modal-actions" style={{ marginTop: "2rem" }}>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCouponModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {isEditingCoupon ? "Save Changes" : "Create Coupon"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Campaign Modal */}
      <Modal
        isOpen={showCampaignModal}
        onClose={() => {
          setShowCampaignModal(false);
          setIsEditingCampaign(false);
          setEditingCampaignId(null);
        }}
        title={isEditingCampaign ? "Edit Campaign" : "Launch New Campaign"}
        size="md"
      >
        <form onSubmit={handleCreateCampaign}>
          <div className="form-grid-2">
            <Input
              label="Campaign Name"
              name="name"
              required
              value={campaignForm.name}
              onChange={handleCampaignInputChange}
              error={campaignErrors.name}
              placeholder="e.g. Back to School Sale"
            />
            <Select
              label="Campaign Type"
              name="type"
              value={campaignForm.type}
              onChange={handleCampaignInputChange}
              error={campaignErrors.type}
              options={[
                { value: "Seasonal", label: "Seasonal" },
                { value: "Flash Sale", label: "Flash Sale" },
                { value: "Clearance", label: "Clearance" },
                { value: "New Arrival", label: "New Arrival" },
              ]}
            />
          </div>

          <div className="form-grid-2">
            <Input
              label="Start Date"
              name="startDate"
              type="date"
              required
              value={campaignForm.startDate}
              onChange={handleCampaignInputChange}
              error={campaignErrors.startDate}
              min={new Date().toISOString().split("T")[0]}
            />
            <Input
              label="End Date"
              name="endDate"
              type="date"
              required
              value={campaignForm.endDate}
              onChange={handleCampaignInputChange}
              error={campaignErrors.endDate}
              min={
                campaignForm.startDate || new Date().toISOString().split("T")[0]
              }
            />
          </div>

          <div
            className="form-row"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 100px",
              gap: "1rem",
            }}
          >
            <Input
              label="Discount Value"
              name="discountValue"
              type="number"
              required
              placeholder="Value"
              value={campaignForm.discountValue}
              onChange={handleCampaignInputChange}
              error={campaignErrors.discountValue}
            />
            <Select
              label="Type"
              name="discountType"
              value={campaignForm.discountType}
              onChange={handleCampaignInputChange}
              error={campaignErrors.discountType}
              options={[
                { value: "Percentage", label: "%" },
                { value: "Fixed Amount", label: "LKR" },
              ]}
            />
          </div>

          <TextArea
            label="Campaign Description"
            name="description"
            value={campaignForm.description}
            onChange={handleCampaignInputChange}
            error={campaignErrors.description}
            placeholder="Tell us about this promotion..."
            rows={3}
          />

          <div className="dash-modal-actions" style={{ marginTop: "2rem" }}>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCampaignModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {isEditingCampaign ? "Save Changes" : "Launch Campaign"}
            </Button>
          </div>
        </form>
      </Modal>

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={() => {
          logout();
          setShowLogoutModal(false);
          navigate("/");
        }}
      />
      <StatusModal
        isOpen={statusModal.isOpen}
        onClose={() => setStatusModal({ ...statusModal, isOpen: false })}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirm}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        variant={confirmModal.variant}
      />
    </div>
  );
};

export default MarketingManagerDashboard;

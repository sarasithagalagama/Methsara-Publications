import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../epics/E1_UserAndRoleManagement/context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Package,
  Truck,
  BarChart2,
  DollarSign,
  FileText,
  Settings,
  LogOut,
  Bell,
  ClipboardList,
  Tags,
  Megaphone,
  Gift,
  ShoppingBag,
  TrendingDown,
  Sun,
  Moon,
  BookOpen,
} from "lucide-react";
import "./dashboard.css";

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [alertCount, setAlertCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);

  const isActive = (path) => location.pathname.startsWith(path);
  const role = user?.role;

  useEffect(() => {
    if (
      role === "admin" ||
      role === "master_inventory_manager" ||
      role === "location_inventory_manager"
    ) {
      const fetchAlertsCount = async () => {
        try {
          const token = localStorage.getItem("token");
          const res = await axios.get("/api/inventory/alerts", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setAlertCount(res.data.alerts?.length || 0);
        } catch {}
      };

      const fetchOrdersCount = async () => {
        try {
          const token = localStorage.getItem("token");
          const res = await axios.get("/api/orders", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const pending = (res.data.orders || []).filter(
            (o) =>
              (o.orderStatus === "Pending" || o.orderStatus === "Processing") &&
              o.orderStatus !== "Cancelled"
          ).length;
          setOrderCount(pending);
        } catch {}
      };

      fetchAlertsCount();
      fetchOrdersCount();
    }
  }, [role]);

  const getMenuItems = () => {
    switch (role) {
      case "admin":
        return [
          { path: "/admin/dashboard",  icon: <LayoutDashboard size={18} />, label: "Overview" },
          { path: "/admin/users",       icon: <Users size={18} />,           label: "Users" },
          { path: "/admin/products",    icon: <Package size={18} />,         label: "Products" },
          { path: "/admin/orders",      icon: <ShoppingCart size={18} />,    label: "Orders" },
          {
            path: "/inventory-manager/alerts",
            icon: <Bell size={18} />,
            label: "Stock Alerts",
            badge: alertCount > 0 ? alertCount : null,
            badgeVariant: "danger",
          },
          { path: "/admin/settings",    icon: <Settings size={18} />,        label: "Settings" },
        ];
      case "finance_manager":
        return [
          { path: "/finance-manager/dashboard",    icon: <LayoutDashboard size={18} />, label: "Overview" },
          { path: "/finance-manager/transactions", icon: <DollarSign size={18} />,      label: "Transactions" },
          { path: "/finance-manager/payroll",      icon: <Users size={18} />,           label: "Payroll" },
          { path: "/finance-manager/reports",      icon: <FileText size={18} />,        label: "Reports" },
        ];
      case "master_inventory_manager":
      case "location_inventory_manager":
        return [
          { path: "/inventory-manager/dashboard",          icon: <LayoutDashboard size={18} />, label: "Overview" },
          {
            path: "/inventory-manager/dashboard?tab=dispatch",
            icon: <ShoppingCart size={18} />,
            label: "Orders",
            badge: orderCount > 0 ? orderCount : null,
            badgeVariant: "warning",
          },
          {
            path: "/inventory-manager/alerts",
            icon: <Bell size={18} />,
            label: "Alerts",
            badge: alertCount > 0 ? alertCount : null,
            badgeVariant: "danger",
          },
        ];
      case "supplier_manager":
        return [
          { path: "/supplier-manager/dashboard",       icon: <LayoutDashboard size={18} />, label: "Overview" },
          { path: "/supplier-manager/suppliers",        icon: <Truck size={18} />,           label: "Partner Directory" },
          { path: "/supplier-manager/purchase-orders",  icon: <ClipboardList size={18} />,   label: "Purchase Orders" },
          { path: "/supplier-manager/sales-orders",     icon: <ShoppingBag size={18} />,     label: "Sales Orders" },
          { path: "/supplier-manager/debt-tracker",     icon: <TrendingDown size={18} />,    label: "Debt Tracker" },
        ];
      case "product_manager":
        return [
          { path: "/product-manager/dashboard",   icon: <LayoutDashboard size={18} />, label: "Overview" },
          { path: "/product-manager/categories",  icon: <Tags size={18} />,            label: "Classification" },
        ];
      case "marketing_manager":
        return [
          { path: "/marketing-manager/dashboard",    icon: <LayoutDashboard size={18} />, label: "Overview" },
          { path: "/marketing-manager/campaigns",    icon: <Megaphone size={18} />,       label: "Campaigns" },
          { path: "/marketing-manager/analytics",    icon: <BarChart2 size={18} />,       label: "Analytics" },
          { path: "/marketing-manager/gift-vouchers",icon: <Gift size={18} />,            label: "Gift Vouchers" },
        ];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  const getRoleLabel = (r) =>
    r?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "Staff";

  const getInitials = (name) =>
    name
      ?.split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  return (
    <aside className={`dashboard-sidebar sidebar-modern ${isOpen ? "open" : "closed"}`}>

      {/* ── Brand Header ── */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <BookOpen size={20} />
        </div>
        <div className="sidebar-brand-text">
          <span className="sidebar-brand-name">Methsara</span>
          <span className="sidebar-brand-sub">Publications</span>
        </div>
      </div>

      {/* ── User Profile ── */}
      <div className="sidebar-profile">
        <div className="sidebar-avatar">
          {getInitials(user?.name)}
        </div>
        <div className="sidebar-profile-info">
          <p className="sidebar-profile-name">{user?.name || "User"}</p>
          <p className="sidebar-profile-role">{getRoleLabel(role)}</p>
        </div>
      </div>

      {/* ── Navigation ── */}
      <div className="sidebar-scroll-area">
        <nav className="sidebar-nav">
          <span className="nav-section-label">Main Menu</span>
          {menuItems.map((item, index) => (
            <Link
              key={index}
              to={item.path}
              className={`nav-item ${isActive(item.path.split("?")[0]) ? "active" : ""}`}
              onClick={() => window.innerWidth < 1024 && toggleSidebar()}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {item.badge && (
                <span className={`nav-badge nav-badge-${item.badgeVariant}`}>
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>
      </div>

      {/* ── Footer ── */}
      <div className="sidebar-footer">
        <button
          className="sidebar-footer-btn theme-toggle-btn"
          onClick={toggleTheme}
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          <span className="nav-icon">
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </span>
          <span className="nav-label">
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </span>
        </button>

        <button className="sidebar-footer-btn sidebar-logout-btn" onClick={logout}>
          <span className="nav-icon"><LogOut size={18} /></span>
          <span className="nav-label">Logout</span>
        </button>
      </div>

    </aside>
  );
};

export default Sidebar;

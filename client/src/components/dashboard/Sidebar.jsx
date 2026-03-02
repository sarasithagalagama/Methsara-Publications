import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../epics/E1_UserAndRoleManagement/context/AuthContext";
import {
  LayoutDashboard, // Overview
  Users, // Admin/Users
  ShoppingCart, // Orders
  Package, // Products
  Truck, // Suppliers
  BarChart2, // Analytics/Marketing
  DollarSign, // Finance
  FileText, // Reports
  Settings, // Settings
  LogOut,
  Bell,
  Box,
  ClipboardList,
  Tags,
  Megaphone,
  Gift,
  ShoppingBag, // Sales Orders
  TrendingDown, // Debt Tracker
} from "lucide-react";
import logo from "../../assets/logo.png";
import "./dashboard.css";

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [alertCount, setAlertCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);

  const isActive = (path) => location.pathname.startsWith(path);

  const role = user?.role;

  useEffect(() => {
    // Only fetch alerts if the user is admin or an inventory manager
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
        } catch (error) {
          console.error("Error fetching alert count for sidebar:", error);
        }
      };

      fetchAlertsCount();

      // Fetch pending orders count for Inventory Managers
      const fetchOrdersCount = async () => {
        try {
          const token = localStorage.getItem("token");
          const res = await axios.get("/api/orders", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const pending = (res.data.orders || []).filter(
            (o) =>
              (o.orderStatus === "Pending" || o.orderStatus === "Processing") &&
              o.orderStatus !== "Cancelled",
          ).length;
          setOrderCount(pending);
        } catch (error) {
          console.error("Error fetching order count for sidebar:", error);
        }
      };

      fetchOrdersCount();
    }
  }, [role]);

  // Define menu items based on role
  const getMenuItems = () => {
    switch (role) {
      case "admin":
        return [
          {
            path: "/admin/dashboard",
            icon: <LayoutDashboard size={20} />,
            label: "Overview",
          },
          { path: "/admin/users", icon: <Users size={20} />, label: "Users" },
          {
            path: "/admin/products",
            icon: <Package size={20} />,
            label: "Products",
          },
          {
            path: "/admin/orders",
            icon: <ShoppingCart size={20} />,
            label: "Orders",
          },
          {
            path: "/inventory-manager/alerts",
            icon: <Bell size={20} />,
            label: (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <span>Stock Alerts</span>
                {alertCount > 0 && (
                  <span className="sidebar-badge danger">{alertCount}</span>
                )}
              </div>
            ),
          },
          {
            path: "/admin/settings",
            icon: <Settings size={20} />,
            label: "Settings",
          },
        ];
      case "finance_manager":
        return [
          {
            path: "/finance-manager/dashboard",
            icon: <LayoutDashboard size={20} />,
            label: "Overview",
          },
          {
            path: "/finance-manager/transactions",
            icon: <DollarSign size={20} />,
            label: "Transactions",
          },
          {
            path: "/finance-manager/payroll",
            icon: <Users size={20} />,
            label: "Payroll",
          },
          {
            path: "/finance-manager/reports",
            icon: <FileText size={20} />,
            label: "Reports",
          },
        ];
      case "master_inventory_manager":
      case "location_inventory_manager":
        return [
          {
            path: "/inventory-manager/dashboard",
            icon: <LayoutDashboard size={20} />,
            label: "Overview",
          },
          {
            path: "/inventory-manager/dashboard?tab=dispatch",
            icon: <ShoppingCart size={20} />,
            label: (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <span>Orders</span>
                {orderCount > 0 && (
                  <span className="sidebar-badge warning">{orderCount}</span>
                )}
              </div>
            ),
          },
          {
            path: "/inventory-manager/alerts",
            icon: <Bell size={20} />,
            label: (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <span>Alerts</span>
                {alertCount > 0 && (
                  <span className="sidebar-badge danger">{alertCount}</span>
                )}
              </div>
            ),
          },
        ];
      case "supplier_manager":
        return [
          {
            path: "/supplier-manager/dashboard",
            icon: <LayoutDashboard size={20} />,
            label: "Overview",
          },
          {
            path: "/supplier-manager/suppliers",
            icon: <Truck size={20} />,
            label: "Partner Directory",
          },
          {
            path: "/supplier-manager/purchase-orders",
            icon: <ClipboardList size={20} />,
            label: "Purchase Orders",
          },
          {
            path: "/supplier-manager/sales-orders",
            icon: <ShoppingBag size={20} />,
            label: "Sales Orders",
          },
          {
            path: "/supplier-manager/debt-tracker",
            icon: <TrendingDown size={20} />,
            label: "Debt Tracker",
          },
        ];
      case "product_manager":
        return [
          {
            path: "/product-manager/dashboard",
            icon: <LayoutDashboard size={20} />,
            label: "Overview",
          },
          {
            path: "/product-manager/categories",
            icon: <Tags size={20} />,
            label: "Classification Manager",
          },
        ];
      case "marketing_manager":
        return [
          {
            path: "/marketing-manager/dashboard",
            icon: <LayoutDashboard size={20} />,
            label: "Overview",
          },
          {
            path: "/marketing-manager/campaigns",
            icon: <Megaphone size={20} />,
            label: "Campaigns",
          },
          {
            path: "/marketing-manager/analytics",
            icon: <BarChart2 size={20} />,
            label: "Analytics",
          },
          {
            path: "/marketing-manager/gift-vouchers",
            icon: <Gift size={20} />,
            label: "Gift Vouchers",
          },
        ];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  return (
    <aside className={`dashboard-sidebar ${isOpen ? "open" : "closed"}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <img src={logo} alt="Methsara Publications" className="logo-image" />
        </div>
      </div>

      <div className="sidebar-user">
        <div className="user-avatar">{user?.name?.charAt(0) || "U"}</div>
        <div className="user-info">
          <p className="user-name">{user?.name || "User"}</p>
          <p className="user-role">
            {user?.role?.replace(/_/g, " ") || "Staff"}
          </p>
        </div>
      </div>

      <div className="sidebar-scroll-area">
        <nav className="sidebar-nav">
          <div className="nav-group-label">Main Menu</div>
          {menuItems.map((item, index) => (
            <Link
              key={index}
              to={item.path}
              className={`nav-item ${isActive(item.path) ? "active" : ""}`}
              onClick={() => window.innerWidth < 1024 && toggleSidebar()}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-text" style={{ flex: 1 }}>
                {item.label}
              </span>
            </Link>
          ))}
        </nav>
      </div>

      <div className="sidebar-footer">
        <button className="nav-item logout-btn" onClick={logout}>
          <span className="nav-icon">
            <LogOut size={20} />
          </span>
          <span className="nav-text">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../dashboard/Sidebar";
import { useAuth } from "../../epics/E1_UserAndRoleManagement/context/AuthContext";
import "../dashboard/dashboard.css";

const DashboardInner = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { user } = useAuth();

  const getThemeClass = () => {
    switch (user?.role) {
      case "finance_manager":
        return "theme-finance";
      case "master_inventory_manager":
      case "location_inventory_manager":
        return "theme-inventory";
      case "supplier_manager":
        return "theme-supplier";
      case "product_manager":
        return "theme-product";
      case "marketing_manager":
        return "theme-marketing";
      case "admin":
      default:
        return "theme-admin";
    }
  };

  const toggleSidebar = () => setIsSidebarOpen((v) => !v);

  return (
    <div
      className={`dashboard-layout ${getThemeClass()} ${isSidebarOpen ? "sidebar-open" : "sidebar-closed"}`}
      data-theme="light"
    >
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      <div className="main-content">
        <header className="dashboard-top-bar">
          <button className="menu-toggle" onClick={toggleSidebar}>
            ☰
          </button>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const DashboardLayout = () => <DashboardInner />;

export default DashboardLayout;

import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../dashboard/Sidebar";
import DashboardHeader from "../dashboard/DashboardHeader";
import { useAuth } from "../../epics/E1_UserAndRoleManagement/context/AuthContext";
import "../dashboard/dashboard.css";

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { user } = useAuth(); // Get user from auth context

  const getThemeClass = () => {
    switch (user?.role) {
      case "finance_manager":
        return "theme-finance";
      case "inventory_manager":
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

  const themeClass = getThemeClass();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div
      className={`dashboard-layout ${themeClass} ${isSidebarOpen ? "sidebar-open" : "sidebar-closed"}`}
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

export default DashboardLayout;

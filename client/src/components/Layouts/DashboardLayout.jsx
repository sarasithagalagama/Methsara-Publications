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

          {/* We might not need DashboardHeader here if individual pages use it, 
              OR we can move DashboardHeader here for global consistency. 
              Let's keep it flexible for now, maybe just render Outlet. 
              But the plan said "Includes Sidebar and DashboardHeader".
              If we put DashboardHeader here, we need to pass props like title/subtitle which vary by page.
              Better approach: Let pages render their specific header content, 
              OR use a context to set the header. 
              For now, let's keep the layout simple: Sidebar + Main Content Area. 
              The pages can render DashboardHeader inside Outlet.
          */}
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

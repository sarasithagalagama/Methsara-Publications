// Purpose: Consistent header for all dashboards

import React from "react";
import "./DashboardHeader.css";

const DashboardHeader = ({ title, subtitle, actions = [] }) => {
  return (
    <div className="dashboard-header">
      <div className="dashboard-header-content">
        <h1 className="dashboard-title">{title}</h1>
        {subtitle && <p className="dashboard-header-subtitle">{subtitle}</p>}
      </div>
      {actions.length > 0 && (
        <div className="header-actions">
          {actions.map((action, index) => (
            <button
              key={index}
              className={`btn btn-${action.variant || "primary"}`}
              onClick={action.onClick}
            >
              {action.icon && (
                <span className="action-btn-icon">{action.icon}</span>
              )}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardHeader;

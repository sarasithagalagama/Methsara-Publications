import React from "react";
import "./dashboard.css";

const DashboardSection = ({ title, children, action, className = "" }) => {
  return (
    <div className={`dashboard-card ${className}`}>
      {(title || action) && (
        <div className="dashboard-card-header compact-header">
          {title && <h2 className="card-title">{title}</h2>}
          {action && <div className="card-actions">{action}</div>}
        </div>
      )}
      <div className="dashboard-card-content">{children}</div>
    </div>
  );
};

export default DashboardSection;

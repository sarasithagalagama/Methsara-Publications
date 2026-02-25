// Purpose: Reusable stat card for dashboards

import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import "./StatCard.css";

const StatCard = ({
  icon,
  label,
  value,
  change,
  trend,
  subtitle,
  variant = "primary",
  onClick,
}) => {
  return (
    <div
      className={`stat-card variant-${variant} ${onClick ? "clickable" : ""}`}
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <p className="stat-label">{label}</p>
        <h3 className="stat-value">{value ?? 0}</h3>
        {subtitle && <p className="stat-subtitle">{subtitle}</p>}
        {change && (
          <span
            className={`stat-change ${trend === "up" ? "trend-up" : "trend-down"}`}
          >
            {trend === "up" ? (
              <TrendingUp size={14} className="trend-icon" />
            ) : (
              <TrendingDown size={14} className="trend-icon" />
            )}
            {change}
          </span>
        )}
      </div>
    </div>
  );
};

export default StatCard;

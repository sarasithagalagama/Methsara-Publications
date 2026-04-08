import React from "react";
import { AlertCircle, ArrowRight } from "lucide-react";

/**
 * PriorityAlert - A premium, standardized alert component for critical dashboard notifications.
 * 
 * @param {Object} props
 * @param {string} props.title - The main heading of the alert.
 * @param {string|React.ReactNode} props.description - Detailed message or additional content.
 * @param {React.ReactNode} props.icon - Lucide icon (default: AlertCircle).
 * @param {string} props.actionLabel - Text for the primary action button.
 * @param {Function} props.onAction - Callback function when the action button is clicked.
 * @param {string} props.variant - 'danger', 'warning', or 'success' (default: 'danger').
 * @param {string} props.className - Additional custom classes.
 */
const PriorityAlert = ({
  title,
  description,
  icon = <AlertCircle size={22} />,
  actionLabel,
  onAction,
  variant = "danger",
  className = "",
}) => {
  return (
    <div className={`priority-alert variant-${variant} ${className}`}>
      <div className="alert-content-wrapper">
        <div className="alert-icon-box">
          {icon}
        </div>
        <div className="alert-text-group">
          <h4>{title}</h4>
          {typeof description === "string" ? <p>{description}</p> : description}
        </div>
      </div>
      
      {actionLabel && onAction && (
        <button className="alert-btn-premium" onClick={onAction}>
          {actionLabel} <ArrowRight size={16} />
        </button>
      )}
    </div>
  );
};

export default PriorityAlert;

import React from "react";
import { CheckCircle, XCircle, X } from "lucide-react";
import "./StatusModal.css";

const StatusModal = (props) => {
  const {
    isOpen,
    onClose,
    type = "success",
    title,
    message,
    buttonText = "OK",
    onButtonClick,
    actions,
  } = props;

  if (!isOpen) return null;

  const handleClose = onButtonClick || onClose;

  return (
    <div className="status-modal-overlay" onClick={onClose}>
      <div
        className="status-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="status-modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className={`status-icon-anim ${type}`}>
          {type === "success" ? (
            <CheckCircle size={64} />
          ) : (
            <XCircle size={64} />
          )}
        </div>

        <h2 className="status-modal-title">{title}</h2>
        <p className="status-modal-message">{message}</p>

        <div className="status-modal-actions">
          {actions ? (
            actions
          ) : (
            <button className={`btn status-btn ${type}`} onClick={handleClose}>
              {buttonText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatusModal;

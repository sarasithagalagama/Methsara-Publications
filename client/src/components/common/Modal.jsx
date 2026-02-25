import React, { useEffect } from "react";
import { X } from "lucide-react";
import "./Modal.css";

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  actions,
  size = "md",
  className = "",
}) => {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="common-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className={`common-modal-content modal-${size} ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="common-modal-header">
          <h2 id="modal-title">{title}</h2>
          <button
            className="common-modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>
        <div className="common-modal-body">{children}</div>
        {actions && <div className="common-modal-footer">{actions}</div>}
      </div>
    </div>
  );
};

export default Modal;

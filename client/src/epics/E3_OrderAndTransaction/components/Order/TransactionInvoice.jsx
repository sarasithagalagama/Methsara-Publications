import React from "react";
import { X, Printer } from "lucide-react";
import "./Invoice.css";

const TransactionInvoice = ({ transaction, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  if (!transaction) return null;

  const createdAt = transaction.date || transaction.createdAt;
  const processedByName =
    typeof transaction.processedBy === "object"
      ? transaction.processedBy?.name
      : "Finance Team";

  return (
    <div className="invoice-overlay">
      <div className="invoice-container">
        <div className="invoice-actions no-print">
          <button onClick={handlePrint} className="btn-print">
            <Printer size={16} /> Print Invoice
          </button>
          <button onClick={onClose} className="btn-close">
            <X size={20} />
          </button>
        </div>

        <div className="invoice-content">
          <header className="invoice-header">
            <div className="company-logo">
              <img
                src="/assets/Logo.png"
                alt="Methsara Publications"
                style={{ height: "60px" }}
              />
            </div>
            <div className="invoice-title">
              <h1>TRANSACTION INVOICE</h1>
              <p>#TXN-{transaction._id.slice(-6).toUpperCase()}</p>
            </div>
          </header>

          <div className="invoice-details-grid">
            <div className="company-info">
              <h3>Methsara Publications</h3>
              <p>No. 123, Main Street</p>
              <p>Colombo, Sri Lanka</p>
              <p>Phone: +94 11 234 5678</p>
              <p>Email: info@methsarapublications.com</p>
            </div>

            <div className="client-info">
              <h3>Transaction Details</h3>
              <p>
                <strong>Type:</strong> {transaction.type}
              </p>
              <p>
                <strong>Direction:</strong>{" "}
                {transaction.isIncome ? "Income" : "Expense"}
              </p>
              <p>
                <strong>Status:</strong> {transaction.status || "Completed"}
              </p>
              <p>
                <strong>Processed By:</strong> {processedByName || "N/A"}
              </p>
            </div>

            <div className="order-meta">
              <p>
                <strong>Date:</strong>{" "}
                {createdAt ? new Date(createdAt).toLocaleDateString() : "N/A"}
              </p>
              <p>
                <strong>Reference:</strong> {transaction.relatedId || "Manual"}
              </p>
              <p>
                <strong>Invoice Ref:</strong> TXN-
                {transaction._id.slice(-6).toUpperCase()}
              </p>
            </div>
          </div>

          <table className="invoice-items-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Type</th>
                <th>Status</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{transaction.description || "Financial transaction"}</td>
                <td>{transaction.type}</td>
                <td>{transaction.status || "Completed"}</td>
                <td>
                  {transaction.isIncome ? "+" : "-"} Rs.{" "}
                  {Number(transaction.amount || 0).toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="invoice-totals">
            <div className="total-row grand-total">
              <span>
                {transaction.isIncome ? "Total Received:" : "Total Paid:"}
              </span>
              <span>
                {transaction.isIncome ? "+" : "-"} Rs.{" "}
                {Number(transaction.amount || 0).toLocaleString()}
              </span>
            </div>
          </div>

          <footer className="invoice-footer">
            <p>This document is generated for transaction record purposes.</p>
            <p className="small-text">
              Keep this invoice for auditing and reconciliation.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default TransactionInvoice;

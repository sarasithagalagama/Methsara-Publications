// ============================================
// Approval Request Model
// Purpose: Manage admin approvals for critical edits (Security Feature)
// ============================================

const mongoose = require("mongoose");

const approvalRequestSchema = new mongoose.Schema(
  {
    module: {
      type: String,
      enum: ["FinancialTransaction", "Supplier", "Inventory", "Product"],
      required: true,
    },
    action: {
      type: String,
      enum: ["Update", "Adjust Stock", "Delete"],
      required: true,
    },
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    targetData: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    reason: {
      type: String,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("ApprovalRequest", approvalRequestSchema);

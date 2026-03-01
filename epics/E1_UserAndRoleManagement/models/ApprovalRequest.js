// ============================================
// Approval Request Model
// Epic: E1 - User & Role Management
// Owner: IT24100548 (Galagama S.T)
// Purpose: Manage admin approvals for critical edits (Security Feature)
// ============================================

const mongoose = require("mongoose");

// [E1.12] ApprovalRequest: implements maker-checker pattern — non-admin proposes a change; admin approves/rejects it
const approvalRequestSchema = new mongoose.Schema(
  {
    // [E1.12] module: identifies which business area this request belongs to (routes approval to correct admin)
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
    // [E1.12] targetData: Mixed stores the full proposed change payload — applied directly on approval
    targetData: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // [E1.12] status lifecycle: Pending → Approved (change applied) or Rejected (change discarded)
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

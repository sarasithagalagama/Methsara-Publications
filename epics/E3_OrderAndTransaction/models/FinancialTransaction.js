// ============================================
// Financial Transaction Model
// Epic: E3 - Order & Transaction
// Owner: IT24100191 (Jayasinghe D.B.P)
// Purpose: Record salary, supplier, and refund transactions
// ============================================

const mongoose = require("mongoose");

const financialTransactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["Salary", "Supplier Payment", "Refund", "Bonus", "Other"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Completed", "Failed", "Cancelled"],
      default: "Completed",
    },
    date: {
      type: Date,
      default: Date.now,
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false, // Refers to UserID for Salary, SupplierID for Supplier Payment, OrderID for Refund
    },
    description: {
      type: String,
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isIncome: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model(
  "FinancialTransaction",
  financialTransactionSchema,
);

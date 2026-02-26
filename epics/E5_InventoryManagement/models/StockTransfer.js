// ============================================
// Stock Transfer Model
// Epic: E5 - Inventory Management
// Owner: IT24100264 (Bandara N W C D)
// Purpose: Inter-branch stock transfers (E5.4, E5.5)
// ============================================

const mongoose = require("mongoose");

const stockTransferSchema = new mongoose.Schema(
  {
    transferNumber: {
      type: String,
      unique: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    fromLocation: {
      type: String,
      required: true,
    },
    toLocation: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ["Requested", "Approved", "Rejected", "In Transit", "Completed"],
      default: "Requested",
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reason: {
      type: String,
      required: true,
    },
    notes: {
      type: String,
    },
    requestedDate: {
      type: Date,
      default: Date.now,
    },
    approvedDate: {
      type: Date,
    },
    completedDate: {
      type: Date,
    },
  },
  { timestamps: true },
);

// Auto-generate transfer number
stockTransferSchema.pre("save", async function (next) {
  if (!this.transferNumber) {
    const count = await this.constructor.countDocuments();
    this.transferNumber = `ST-${Date.now()}-${String(count + 1).padStart(4, "0")}`;
  }
  next();
});

module.exports = mongoose.model("StockTransfer", stockTransferSchema);

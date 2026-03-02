// ============================================
// Purchase Order Model
// Epic: E4 - Supplier Management
// Owner: IT24100799 (Gawrawa G H Y)
// Purpose: Purchase Order system (E4.2, E4.3)
// ============================================

const mongoose = require("mongoose");

const purchaseOrderSchema = new mongoose.Schema(
  {
    poNumber: {
      type: String,
      required: true,
      unique: true,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },
    items: [
      {
        // [E4.2] itemName: free-text description of what is being ordered from the vendor
        // (raw materials, printing supplies, print jobs, etc. — NOT our product catalog)
        itemName: {
          type: String,
          required: true,
          trim: true,
        },
        // Optional: link to a Product if ordering a reprint of a specific book
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        unitPrice: {
          type: Number,
          required: true,
          min: 0,
        },
        totalPrice: {
          type: Number,
          required: true,
        },
        receivedQty: {
          type: Number,
          default: 0,
        },
        isVerified: {
          type: Boolean,
          default: false,
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Received", "Dispatched", "Cancelled"],
      default: "Pending",
    },
    paymentRequested: {
      type: Boolean,
      default: false,
    },
    paymentStatus: {
      type: String,
      enum: ["Unpaid", "Paid"],
      default: "Unpaid",
    },
    isEmailed: {
      type: Boolean,
      default: false,
    },
    expectedDeliveryDate: {
      type: Date,
    },
    actualDeliveryDate: {
      type: Date,
    },
    location: {
      type: String,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    notes: {
      type: String,
    },
    // [E4.3] statusHistory: immutable audit trail of every status transition + who made it + when
    statusHistory: [
      {
        status: String,
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        changedAt: {
          type: Date,
          default: Date.now,
        },
        notes: String,
      },
    ],
  },
  { timestamps: true },
);

// [E4.2] Pre-save hook: auto-generates poNumber in format PO-YYMM-XXXX (e.g. PO-2402-0001)
purchaseOrderSchema.pre("save", async function (next) {
  if (!this.poNumber) {
    const count = await mongoose.model("PurchaseOrder").countDocuments();
    const dateStr = new Date().toISOString().slice(2, 7).replace("-", ""); // YYMM
    this.poNumber = `PO-${dateStr}-${String(count + 1).padStart(4, "0")}`;
  }
  next();
});

module.exports = mongoose.model("PurchaseOrder", purchaseOrderSchema);

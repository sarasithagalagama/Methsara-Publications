// ============================================
// Sales Order Model
// Epic: E4 - Supplier Management (Customer Orders)
// Owner: IT24100799 (Gawrawa G H Y)
// Purpose: Sales Order system for Distributors & Bookshops
// ============================================

const mongoose = require("mongoose");

const salesOrderSchema = new mongoose.Schema(
  {
    soNumber: {
      type: String,
      required: true,
      unique: true,
    },
    // Reference to Supplier (but supplierType must be 'Customer')
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
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
        dispatchedQty: {
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
      enum: [
        "Draft",
        "Confirmed",
        "Processing",
        "DispatchRequested", // [E4] Awaiting master_inventory_manager approval before stock is deducted
        "Dispatched",
        "Delivered",
        "Cancelled",
      ],
      default: "Draft",
    },
    // Payment tracking (customer owes us money)
    paymentStatus: {
      type: String,
      enum: ["Unpaid", "Partial", "Paid"],
      default: "Unpaid",
    },
    amountPaid: {
      type: Number,
      default: 0,
    },
    amountDue: {
      type: Number,
      required: true,
    },
    dueDate: {
      type: Date,
    },
    expectedDispatchDate: {
      type: Date,
    },
    actualDispatchDate: {
      type: Date,
    },
    expectedDeliveryDate: {
      type: Date,
    },
    actualDeliveryDate: {
      type: Date,
    },
    deliveryAddress: {
      street: String,
      city: String,
      postalCode: String,
    },
    // Location for inventory tracking
    location: {
      type: String,
      default: "Main Warehouse",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    notes: {
      type: String,
    },
    // Audit trail of status changes
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
    // Invoice details
    invoiceNumber: {
      type: String,
    },
    invoiceDate: {
      type: Date,
    },
    // Payment history
    paymentHistory: [
      {
        amount: Number,
        paymentDate: Date,
        paymentMethod: String,
        reference: String,
        note: String,
        recordedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
  },
  { timestamps: true },
);

// Auto-generate soNumber and compute amountDue BEFORE validation runs
salesOrderSchema.pre("validate", async function (next) {
  if (!this.soNumber) {
    const count = await mongoose.model("SalesOrder").countDocuments();
    const dateStr = new Date().toISOString().slice(2, 7).replace("-", ""); // YYMM
    this.soNumber = `SO-${dateStr}-${String(count + 1).padStart(4, "0")}`;
  }

  // Auto-calculate amount due (must be set before required validation fires)
  this.amountDue = (this.totalAmount || 0) - (this.amountPaid || 0);

  next();
});

// Update payment status based on amountPaid
salesOrderSchema.pre("save", function (next) {
  if (this.amountPaid === 0) {
    this.paymentStatus = "Unpaid";
  } else if (this.amountPaid >= this.totalAmount) {
    this.paymentStatus = "Paid";
  } else {
    this.paymentStatus = "Partial";
  }
  next();
});

module.exports = mongoose.model("SalesOrder", salesOrderSchema);

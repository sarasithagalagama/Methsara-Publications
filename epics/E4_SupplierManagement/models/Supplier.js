// ============================================
// Supplier Model
// Epic: E4 - Supplier Management
// Owner: IT24100799 (Gawrawa G H Y)
// Purpose: Supplier and Purchase Order management
// ============================================

const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, "Supplier name is required"],
    trim: true,
  },
  contactPerson: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    required: [true, "Phone is required"],
  },

  // [E4.1] supplierType: distinguishes between vendors (we pay) and customers (they pay us)
  supplierType: {
    type: String,
    enum: ["Vendor", "Customer"],
    required: true,
    default: "Vendor",
  },

  // [E4.1] category: classifies the partner type
  // Vendors: Material Supplier (printers, paper suppliers, etc.)
  // Customers: Distributor, Bookshop (they buy bulk from us)
  category: {
    type: String,
    enum: ["Material Supplier", "Distributor", "Bookshop", "Publisher"],
    default: "Material Supplier",
    required: true,
  },

  // Address
  address: {
    street: String,
    city: String, // Will store District
    postalCode: String,
  },

  // Business Details
  businessRegistration: {
    type: String,
    trim: true,
  },
  taxId: {
    type: String, // VAT or SVAT
    trim: true,
  },

  // [E4.5] paymentTerms: defines credit window for supplier invoices (Cash = pay immediately)
  paymentTerms: {
    type: String,
    enum: [
      "Cash",
      "Credit 7 days",
      "Credit 14 days",
      "Credit 30 days",
      "Credit 60 days",
    ],
    default: "Cash",
  },
  // [E4.5] creditLimit: maximum outstanding balance allowed before new POs are blocked
  creditLimit: {
    type: Number,
    default: 0,
  },
  bankDetails: {
    accountName: String,
    bankName: String,
    branchName: String,
    accountNumber: String,
  },
  // [E4.5] outstandingBalance:
  // For Vendors (supplierType='Vendor'): Amount WE owe THEM (payables)
  // For Customers (supplierType='Customer'): Amount THEY owe US (receivables)
  outstandingBalance: {
    type: Number,
    default: 0,
  },
  totalPaid: {
    type: Number,
    default: 0,
  },

  // For tracking debt status
  hasDebt: {
    type: Boolean,
    default: false,
  },
  lastPaymentDate: {
    type: Date,
  },

  // Status
  isActive: {
    type: Boolean,
    default: true,
  },
  // [E4.6] isVerified: admin manually verifies new suppliers before they can be assigned to POs
  isVerified: {
    type: Boolean,
    default: false,
  },

  // [E4.3] Performance Metrics: totalOrders and totalValue auto-incremented on each PO creation
  totalOrders: {
    type: Number,
    default: 0,
  },
  totalValue: {
    type: Number,
    default: 0,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 3,
  },

  // Notes
  notes: String,

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update timestamp
supplierSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Supplier", supplierSchema);

// ============================================
// Order Model
// Epic: E3 - Order & Transaction
// Owner: IT24100191 (Jayasinghe D.B.P)
// Purpose: Shopping cart and order management
// ============================================

const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  // Customer Information
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false, // Allow guest checkout
  },
  guestEmail: {
    type: String,
    required: function () {
      return !this.customer; // Required if no customer
    },
  },
  guestName: {
    type: String,
    required: function () {
      return !this.customer;
    },
  },

  // Order Items
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      productTitle: String,
      productISBN: String,
      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
      price: {
        type: Number,
        required: true,
      },
      subtotal: Number,
    },
  ],

  // Pricing
  subtotal: {
    type: Number,
    required: true,
  },
  discount: {
    type: Number,
    default: 0,
  },
  deliveryFee: {
    type: Number,
    default: 0,
  },
  total: {
    type: Number,
    required: true,
  },

  // Coupon Applied
  couponCode: String,
  couponDiscount: {
    type: Number,
    default: 0,
  },

  // Gift Voucher Applied
  giftVoucherCode: String,
  giftVoucherDiscount: {
    type: Number,
    default: 0,
  },

  // Delivery Address
  deliveryAddress: {
    name: String,
    phone: String,
    street: String,
    city: String,
    postalCode: String,
  },

  // Payment Information
  paymentMethod: {
    type: String,
    enum: ["COD", "Bank Transfer"],
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ["Pending", "Paid", "Failed", "Refunded"],
    default: "Pending",
  },
  bankSlipUrl: String, // For bank transfer payments

  // Order Status
  orderStatus: {
    type: String,
    enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
    default: "Pending",
  },

  // Status History
  statusHistory: [
    {
      status: String,
      timestamp: {
        type: Date,
        default: Date.now,
      },
      note: String,
    },
  ],

  // Fulfillment Location
  fulfillmentLocation: {
    type: String,
    required: true,
  },

  // Automated Vouchers
  generatedVouchers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GiftVoucher",
    },
  ],

  // Timestamps
  orderDate: {
    type: Date,
    default: Date.now,
  },
  deliveryDate: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Calculate subtotals
orderSchema.pre("save", function (next) {
  // Calculate item subtotals
  this.items.forEach((item) => {
    item.subtotal = item.price * item.quantity;
  });

  // Calculate order subtotal
  this.subtotal = this.items.reduce((sum, item) => sum + item.subtotal, 0);

  // Calculate total
  this.total =
    this.subtotal -
    this.discount -
    this.couponDiscount -
    this.giftVoucherDiscount +
    this.deliveryFee;

  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Order", orderSchema);

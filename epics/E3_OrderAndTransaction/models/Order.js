// ============================================
// Order Model
// Epic: E3 - Order & Transaction
// Owner: IT24100191 (Jayasinghe D.B.P)
// Purpose: Shopping cart and order management
// ============================================

const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  // [E3.4] customer: optional to support guest checkout (E3.3) — if absent, guestEmail/guestName are required
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false, // Allow guest checkout
  },
  // [E3.4] guestEmail/guestName: conditionally required when no logged-in customer is present
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
        // [E6.4] refPath: polymorphic reference — resolves to 'Product' or 'VoucherProduct' at query time
        refPath: "items.itemModel",
        required: true,
      },
      // [E6.4] itemModel discriminator lets orders mix regular books and gift voucher products
      itemModel: {
        type: String,
        required: true,
        enum: ["Product", "VoucherProduct"],
        default: "Product",
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
  // [E3.9] Tax fields — taxRate sourced from Finance Manager's Tax Configuration
  taxRate: {
    type: Number,
    default: 0,
  },
  taxAmount: {
    type: Number,
    default: 0,
  },
  total: {
    type: Number,
    required: true,
  },

  // [E6.3] Coupon discount tracked separately so finance reports can break down discount sources
  couponCode: String,
  couponDiscount: {
    type: Number,
    default: 0,
  },

  // [E6.4] Gift voucher discount tracked separately; balance deducted from GiftVoucher doc on save
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

// [E3.3] Pre-save: recalculates all item subtotals and the order total before every save
// Ensures total = subtotal + taxAmount - couponDiscount - giftVoucherDiscount + deliveryFee
orderSchema.pre("save", function (next) {
  // Calculate item subtotals
  this.items.forEach((item) => {
    item.subtotal = item.price * item.quantity;
  });

  // Calculate order subtotal
  this.subtotal = this.items.reduce((sum, item) => sum + item.subtotal, 0);

  // Calculate tax on subtotal (taxRate is a percentage, e.g. 18 = 18%)
  this.taxAmount = Math.round((this.subtotal * (this.taxRate || 0)) / 100);

  // Calculate total
  this.total =
    this.subtotal +
    this.taxAmount -
    this.discount -
    this.couponDiscount -
    this.giftVoucherDiscount +
    this.deliveryFee;

  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Order", orderSchema);

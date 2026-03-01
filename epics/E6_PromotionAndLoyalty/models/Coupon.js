// ============================================
// Coupon Model
// Epic: E6 - Promotions & Loyalty
// Owner: IT24101266 (Perera M.U.E)
// Purpose: Discount coupons and promotions
// ============================================

const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
  // Coupon Code
  code: {
    type: String,
    required: [true, "Coupon code is required"],
    unique: true,
    uppercase: true,
    trim: true,
  },

  // [E6.2] discountType: 'percentage' reduces by %, 'fixed' subtracts a flat LKR amount
  discountType: {
    type: String,
    enum: ["percentage", "fixed"],
    required: true,
  },
  discountValue: {
    type: Number,
    required: [true, "Discount value is required"],
    min: 0,
  },
  // [E6.2] maxDiscount: caps percentage discounts (e.g. 20% off but max LKR 500)
  maxDiscount: {
    type: Number, // Max discount for percentage type
    default: null,
  },

  // [E6.3] Usage tracking fields:
  // maxUsageCount: total redemptions allowed across all users (null = unlimited)
  // usagePerUser: how many times a single user can redeem this coupon (default 1)
  // currentUsageCount: incremented on each successful redemption for limit enforcement
  minPurchaseAmount: {
    type: Number,
    default: 0,
  },
  maxUsageCount: {
    type: Number,
    default: null, // null = unlimited
  },
  usagePerUser: {
    type: Number,
    default: 1,
  },
  currentUsageCount: {
    type: Number,
    default: 0,
  },

  // Validity Period
  validFrom: {
    type: Date,
    required: true,
    default: Date.now,
  },
  validUntil: {
    type: Date,
    required: true,
  },

  // [E6.2] applicableGrades: restricts coupon to students in specific grade levels (empty = all grades)
  applicableGrades: [
    {
      type: String,
      enum: [
        "Grade 6",
        "Grade 7",
        "Grade 8",
        "Grade 9",
        "Grade 10",
        "Grade 11",
        "Grade 12",
        "Grade 13",
      ],
    },
  ],
  applicableProducts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
  ],

  // Status
  isActive: {
    type: Boolean,
    default: true,
  },

  // Usage History
  usageHistory: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
      },
      discountApplied: Number,
      usedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],

  // Campaign
  campaignName: String,
  description: String,

  // Created By
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

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

// Validate coupon
couponSchema.methods.isValid = function () {
  const now = new Date();

  // Check if active
  if (!this.isActive) {
    return { valid: false, message: "Coupon is inactive" };
  }

  // Check date validity
  if (now < this.validFrom) {
    return { valid: false, message: "Coupon not yet valid" };
  }
  if (now > this.validUntil) {
    return { valid: false, message: "Coupon has expired" };
  }

  // Check usage limit
  if (this.maxUsageCount && this.currentUsageCount >= this.maxUsageCount) {
    return { valid: false, message: "Coupon usage limit reached" };
  }

  return { valid: true, message: "Coupon is valid" };
};

// Calculate discount
couponSchema.methods.calculateDiscount = function (orderTotal) {
  // Check minimum purchase
  if (orderTotal < this.minPurchaseAmount) {
    return 0;
  }

  let discount = 0;

  if (this.discountType === "percentage") {
    discount = (orderTotal * this.discountValue) / 100;
    if (this.maxDiscount && discount > this.maxDiscount) {
      discount = this.maxDiscount;
    }
  } else if (this.discountType === "fixed") {
    discount = this.discountValue;
  }

  return Math.min(discount, orderTotal); // Discount can't exceed order total
};

// Update timestamp
couponSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Coupon", couponSchema);

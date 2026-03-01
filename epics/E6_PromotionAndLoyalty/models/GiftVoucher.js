// ============================================
// Gift Voucher Model
// Epic: E6 - Promotion & Loyalty
// Owner: IT24101266 (Perera M.U.E)
// Purpose: Gift voucher system (E6.4)
// ============================================

const mongoose = require("mongoose");

// [E6.4] GiftVoucher: a monetary voucher with a balance that depletes across multiple uses
const giftVoucherSchema = new mongoose.Schema(
  {
    // [E6.4] code: auto-generated as 'GV-XXXXXXXX' in pre-validate hook if not supplied
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    // [E6.4] value = face value; balance = remaining amount after partial use (balance <= value)
    value: {
      type: Number,
      required: true,
      min: 0,
    },
    balance: {
      type: Number,
      required: true,
      min: 0,
    },
    purchasedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    recipientEmail: {
      type: String,
    },
    recipientName: {
      type: String,
    },
    message: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    // [E6.4] usageHistory: records each use of the voucher with order ref and amount deducted
    usageHistory: [
      {
        order: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Order",
        },
        amountUsed: {
          type: Number,
          required: true,
        },
        usedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true },
);

// [E6.4] Pre-validate: auto-generates a random GV-XXXXXXXX code if none was supplied by admin
giftVoucherSchema.pre("validate", function (next) {
  if (!this.code) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "GV-";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.code = code;
  }
  next();
});

module.exports = mongoose.model("GiftVoucher", giftVoucherSchema);

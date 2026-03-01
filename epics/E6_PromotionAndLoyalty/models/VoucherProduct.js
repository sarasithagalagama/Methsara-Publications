// ============================================
// Voucher Product Model
// Epic: E6 - Promotion & Loyalty
// Owner: IT24101266 (Perera M.U.E)
// Purpose: Catalog items for sellable gift vouchers
// ============================================

const mongoose = require("mongoose");

const voucherProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Voucher name is required"],
    trim: true,
  },
  description: {
    type: String,
    required: [true, "Description is required"],
  },
  price: {
    type: Number,
    required: [true, "Price is required"],
    min: [0, "Price cannot be negative"],
  },
  image: {
    type: String,
    default: "https://via.placeholder.com/300x200?text=Gift+Voucher",
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  displayOrder: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

voucherProductSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("VoucherProduct", voucherProductSchema);

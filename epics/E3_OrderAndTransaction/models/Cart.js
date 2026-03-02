// ============================================
// Cart Model
// Epic: E3 - Order & Transaction
// Owner: IT24100191 (Jayasinghe D.B.P)
// Purpose: Shopping cart management (E3.1, E3.2)
// ============================================

const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: "items.itemModel",
    required: true,
  },
  itemModel: {
    type: String,
    required: true,
    enum: ["Product", "VoucherProduct"],
    default: "Product",
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  price: {
    type: Number,
    required: true,
  },
});

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: [cartItemSchema],
    totalAmount: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    couponApplied: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
    },
  },
  {
    timestamps: true,
  },
);

// Calculate total before saving
cartSchema.pre("save", function (next) {
  this.totalAmount =
    this.items.reduce((sum, item) => sum + item.price * item.quantity, 0) -
    this.discount;
  next();
});

module.exports = mongoose.model("Cart", cartSchema);

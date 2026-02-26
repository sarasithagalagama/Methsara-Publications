// ============================================
// Location Model
// Epic: E5 - Inventory Management
// Purpose: Manage dynamic branch/warehouse locations (E5.7)
// ============================================

const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Location name is required"],
      unique: true,
      trim: true,
    },
    address: {
      type: String,
      required: [true, "Location address is required"],
    },
    contactNumber: {
      type: String,
      trim: true,
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    isMainWarehouse: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Location", locationSchema);

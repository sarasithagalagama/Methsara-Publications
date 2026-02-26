// ============================================
// Inventory Model
// Epic: E5 - Inventory Management
// Owner: IT24100264 (Bandara N W C D)
// Purpose: Multi-location stock tracking
// ============================================

const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema({
  // Product Reference
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  productTitle: String,
  productISBN: String,

  // Location
  location: {
    type: String,
    required: true,
  },

  // Stock Levels
  quantity: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  reservedQuantity: {
    type: Number,
    default: 0,
    min: 0,
  },
  availableQuantity: {
    type: Number,
    default: 0,
  },

  // Thresholds
  lowStockThreshold: {
    type: Number,
    default: 10,
  },
  reorderPoint: {
    type: Number,
    default: 20,
  },

  // Stock Adjustments History
  adjustments: [
    {
      type: {
        type: String,
        enum: [
          "Add",
          "Remove",
          "Damage",
          "Loss",
          "Found",
          "Transfer In",
          "Transfer Out",
          "Sale",
          "Return",
        ],
      },
      quantity: Number,
      reason: String,
      adjustedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
  ],

  // Status
  isLowStock: {
    type: Boolean,
    default: false,
  },
  isOutOfStock: {
    type: Boolean,
    default: false,
  },

  // Last Stock Check
  lastStockCheck: Date,
  lastRestockDate: Date,

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

// Calculate available quantity
inventorySchema.pre("save", function (next) {
  this.availableQuantity = this.quantity - this.reservedQuantity;
  this.isOutOfStock = this.availableQuantity === 0;
  this.isLowStock =
    this.availableQuantity > 0 &&
    this.availableQuantity <= this.lowStockThreshold;
  this.updatedAt = Date.now();
  next();
});

// Method to deduct stock
inventorySchema.methods.deductStock = function (quantity, reason = "Sale") {
  if (this.availableQuantity < quantity) {
    throw new Error("Insufficient stock");
  }
  this.quantity -= quantity;
  this.adjustments.push({
    type: "Remove",
    quantity: -quantity,
    reason: reason,
  });
};

// Method to add stock
inventorySchema.methods.addStock = function (quantity, reason = "Restock") {
  this.quantity += quantity;
  this.lastRestockDate = Date.now();
  this.adjustments.push({
    type: "Add",
    quantity: quantity,
    reason: reason,
  });
};

// Static method to sync only Main Branch stock to Product model (for Website display)
inventorySchema.statics.syncProductStock = async function (productId) {
  const Product = mongoose.model("Product");
  const Location = mongoose.model("Location");

  // 1. Find the name of the main warehouse/branch
  const mainLocation = await Location.findOne({ isMainWarehouse: true });
  const mainLocationName = mainLocation ? mainLocation.name : "Main";

  // 2. Fetch the stock for this product at the main location
  const mainInventory = await this.findOne({
    product: productId,
    location: mainLocationName,
  });

  // 3. Update the Product model's stock field (used for public website & catalog)
  await Product.findByIdAndUpdate(productId, {
    stock: mainInventory ? mainInventory.quantity : 0,
  });
};

// Sync after save
inventorySchema.post("save", function () {
  this.constructor.syncProductStock(this.product);
});

// Sync after remove (if any record is deleted)
inventorySchema.post("remove", function () {
  this.constructor.syncProductStock(this.product);
});

module.exports = mongoose.model("Inventory", inventorySchema);

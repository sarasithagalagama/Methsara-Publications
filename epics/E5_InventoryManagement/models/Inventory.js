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

  // [E5.1][E5.2] location: identifies the branch; each product has one Inventory doc per location
  location: {
    type: String,
    required: true,
  },

  // [E5.3] Three stock level fields:
  // quantity = physical stock on shelf
  // reservedQuantity = items in pending orders, not yet dispatched
  // availableQuantity = quantity - reservedQuantity (what's actually available to sell)
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

  // [E5.9] lowStockThreshold: triggers low-stock alert on dashboard when quantity falls <= this value
  lowStockThreshold: {
    type: Number,
    default: 10,
  },
  // [E5.9] reorderPoint: suggests re-order on PO creation when quantity drops below this value
  reorderPoint: {
    type: Number,
    default: 20,
  },

  // [E5.3] adjustments: immutable history of every stock change (type, qty, reason, who did it)
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
inventorySchema.methods.deductStock = function (
  quantity,
  reason = "Sale",
  userId = null,
) {
  if (this.availableQuantity < quantity) {
    throw new Error("Insufficient stock");
  }
  this.quantity -= quantity;
  const adj = { type: "Remove", quantity: -quantity, reason };
  if (userId) adj.adjustedBy = userId;
  this.adjustments.push(adj);
};

// Method to add stock
inventorySchema.methods.addStock = function (
  quantity,
  reason = "Restock",
  userId = null,
) {
  this.quantity += quantity;
  this.lastRestockDate = Date.now();
  const adj = { type: "Add", quantity, reason };
  if (userId) adj.adjustedBy = userId;
  this.adjustments.push(adj);
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

// ============================================
// Inventory Controller
// Epic: E5 - Inventory Management
// Owner: IT24100264 (Bandara N W C D)
// Purpose: Stock management (E5.1-E5.10)
// ============================================

const Inventory = require("../models/Inventory");
const Location = require("../models/Location");
const Product = require("../../E2_ProductCatalog/models/Product");

// [E5.1][E5.2] getStockByLocation: role-aware — location IM auto-scoped to their branch; master IM sees all
exports.getStockByLocation = async (req, res) => {
  try {
    const { search } = req.query;

    // [E5.2] location_inventory_manager is always scoped to assignedLocation regardless of URL param
    const filterLocation =
      req.user.role === "location_inventory_manager"
        ? req.params.location === "all"
          ? req.user.assignedLocation
          : req.params.location
        : req.params.location !== "all"
          ? req.params.location
          : null;

    let query =
      filterLocation && filterLocation !== "all"
        ? { location: filterLocation }
        : {};

    // 1. If searching, first find matching products to get their IDs
    let matchingProductIds = null;
    if (search) {
      const matchingProducts = await Product.find({
        isActive: true,
        $or: [
          { title: { $regex: search, $options: "i" } },
          { isbn: { $regex: search, $options: "i" } },
        ],
      }).select("_id");

      matchingProductIds = matchingProducts.map((p) => p._id);

      // Update inventory query to only look for these product IDs
      // (Falling back to the old fields just in case they match)
      query.$or = [
        { productTitle: { $regex: search, $options: "i" } },
        { productISBN: { $regex: search, $options: "i" } },
        { product: { $in: matchingProductIds } },
      ];
    }

    // 2. Fetch inventory based on query
    let inventory = await Inventory.find(query).populate({
      path: "product",
      match: { category: { $ne: "Gift Voucher" }, isActive: true },
    });

    // 2.1 Filter out inventory records where the product was filtered out by the match (e.g. Gift Vouchers)
    inventory = inventory.filter((item) => item.product !== null);

    // [E5.1] Dynamic Sync: auto-creates zero-stock Inventory records for products that have no record at this location
    // Prevents inventory gaps when new products are added without a manual stock setup step
    if (filterLocation && filterLocation !== "all" && !search) {
      const allActiveProducts = await Product.find({
        isActive: true,
        category: { $ne: "Gift Voucher" },
      }).select("_id title isbn");

      // Map existing inventory product IDs for quick lookup
      const existingProductIds = new Set(
        inventory
          .filter((item) => item.product) // safeguard against null populated products
          .map((item) => item.product._id.toString()),
      );

      const missingProducts = allActiveProducts.filter(
        (p) => !existingProductIds.has(p._id.toString()),
      );

      if (missingProducts.length > 0) {
        // Create missing inventory records
        const newInventoryRecords = missingProducts.map((p) => ({
          product: p._id,
          productTitle: p.title,
          productISBN: p.isbn,
          location: filterLocation,
          quantity: 0,
          reservedQuantity: 0,
          availableQuantity: 0,
          lowStockThreshold: 10, // Default
          reorderPoint: 20, // Default
        }));

        const insertedRecords = await Inventory.insertMany(newInventoryRecords);

        // We need to populate the newly inserted records to return them properly
        const populatedNewRecords = await Inventory.find({
          _id: { $in: insertedRecords.map((r) => r._id) },
        }).populate("product");

        inventory = [...inventory, ...populatedNewRecords];
      }
    }

    res.status(200).json({
      success: true,
      count: inventory.length,
      inventory,
    });
  } catch (error) {
    console.error("Get stock error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching stock",
      error: error.message,
    });
  }
};

// [E5.3] adjustStock: inventory managers and admin can adjust; location-based restrictions apply
exports.adjustStock = async (req, res) => {
  try {
    // [E5.3] Role restriction: only inventory managers or admin can manually adjust stock
    if (
      req.user.role !== "admin" &&
      req.user.role !== "master_inventory_manager" &&
      req.user.role !== "location_inventory_manager"
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only Inventory Managers can adjust stock.",
      });
    }

    const {
      inventoryId,
      productId,
      location,
      quantity,
      adjustment,
      reason,
      reorderPoint,
    } = req.body;

    let inventory;
    let adjustmentAmount = 0;

    // Determine adjustment amount (support both "adjustment" and "quantity")
    if (adjustment !== undefined) {
      adjustmentAmount = Number(adjustment);
    } else if (quantity !== undefined) {
      adjustmentAmount = Number(quantity);
    }

    if (isNaN(adjustmentAmount)) {
      return res.status(400).json({
        success: false,
        message: "Invalid adjustment amount",
      });
    }

    // Find inventory
    if (inventoryId) {
      inventory = await Inventory.findById(inventoryId);
      if (!inventory) {
        return res.status(404).json({
          success: false,
          message: "Inventory item not found",
        });
      }
    } else {
      // Legacy/Direct support via Product + Location
      if (!productId || !location) {
        return res.status(400).json({
          success: false,
          message:
            "Please provide either inventoryId OR productId and location",
        });
      }

      inventory = await Inventory.findOne({ product: productId, location });

      if (!inventory) {
        // Fetch product details for title and ISBN
        const product = await Product.findById(productId);
        if (!product) {
          return res.status(404).json({
            success: false,
            message: "Product not found",
          });
        }

        // Create new if not exists
        inventory = await Inventory.create({
          product: productId,
          productTitle: product.title,
          productISBN: product.isbn,
          location,
          quantity: 0, // Initialize at 0, then adjust
        });
      }
    }

    // [E5.3] Location-based permission check: master_inventory_manager defaults to main warehouse
    if (req.user.role === "master_inventory_manager") {
      // Resolve effective location for master IM:
      // if assignedLocation is "All" or unset → they own the main warehouse
      const effectiveLocation =
        !req.user.assignedLocation || req.user.assignedLocation === "All"
          ? null // will be resolved from DB below
          : req.user.assignedLocation;

      if (!effectiveLocation) {
        // Look up the main warehouse name
        const mainLoc = await Location.findOne({ isMainWarehouse: true });
        const mainWarehouseName = mainLoc
          ? mainLoc.name
          : "Colombo Main Warehouse";
        if (inventory.location !== mainWarehouseName) {
          return res.status(403).json({
            success: false,
            message: `Access denied. You can only adjust stock at the main warehouse (${mainWarehouseName}).`,
          });
        }
      } else if (inventory.location !== effectiveLocation) {
        return res.status(403).json({
          success: false,
          message: `Access denied. You can only adjust stock at your assigned location (${effectiveLocation}).`,
        });
      }
    }

    // [E5.3] Location inventory managers can only edit their assigned location
    if (req.user.role === "location_inventory_manager") {
      if (!req.user.assignedLocation) {
        return res.status(403).json({
          success: false,
          message: "No location assigned to your account.",
        });
      }
      if (inventory.location !== req.user.assignedLocation) {
        return res.status(403).json({
          success: false,
          message: `Access denied. You can only adjust stock at your assigned location (${req.user.assignedLocation}).`,
        });
      }
    }

    // Apply adjustment using model methods to ensure history is recorded
    if (adjustmentAmount > 0) {
      inventory.addStock(
        adjustmentAmount,
        reason || "Manual Adjustment",
        req.user._id,
      );
    } else if (adjustmentAmount < 0) {
      try {
        inventory.deductStock(
          Math.abs(adjustmentAmount),
          reason || "Manual Adjustment",
          req.user._id,
        );
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: err.message, // "Insufficient stock"
        });
      }
    } else {
      // Adjustment is 0, do nothing or just log?
      // Just save to trigger sync if needed, mostly no-op
    }

    // Update reorder point if provided (E5.7)
    if (reorderPoint !== undefined && !isNaN(parseInt(reorderPoint))) {
      inventory.reorderPoint = parseInt(reorderPoint);
    }

    await inventory.save();

    res.status(200).json({
      success: true,
      message: "Stock adjusted successfully",
      inventory,
    });
  } catch (error) {
    console.error("Adjust stock error:", error);
    res.status(500).json({
      success: false,
      message: "Error adjusting stock",
      error: error.message,
    });
  }
};

// Get low stock alerts (E5.9)
exports.getLowStockAlerts = async (req, res) => {
  try {
    // Only return alerts for locations that are actively registered in the system
    const activeLocations = await Location.find({ status: "Active" }).select(
      "name",
    );
    const validLocationNames = activeLocations.map((l) => l.name);

    let query = {
      location: { $in: validLocationNames },
      $expr: {
        $lte: [
          { $ifNull: ["$availableQuantity", "$quantity", 0] },
          { $ifNull: ["$reorderPoint", "$lowStockThreshold", 10] },
        ],
      },
    };

    // Priority: 1. User assigned location (RBAC), 2. Query Param (Dashboard filtering), 3. Global (Admin/Master)
    const filterLocation =
      req.user.role === "location_inventory_manager"
        ? req.user.assignedLocation
        : req.query.location;

    if (filterLocation && filterLocation !== "all") {
      query.location = filterLocation;
    }

    const lowStockItems = await Inventory.find(query).populate({
      path: "product",
      match: { category: { $ne: "Gift Voucher" }, isActive: true },
    });

    // Filter out null products (Gift Vouchers)
    const filteredLowStock = lowStockItems.filter(
      (item) => item.product !== null,
    );

    // Standardize field names for the frontend component
    const formattedAlerts = filteredLowStock.map((item) => ({
      ...item.toObject(),
      currentStock: item.availableQuantity,
      reorderLevel: item.reorderPoint || item.lowStockThreshold || 0,
    }));

    res.status(200).json({
      success: true,
      count: formattedAlerts.length,
      alerts: formattedAlerts,
    });
  } catch (error) {
    console.error("Get low stock alerts error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching low stock alerts",
      error: error.message,
    });
  }
};

// Sync all products with their aggregate inventory stock
exports.syncAllStock = async (req, res) => {
  try {
    const productIds = await Inventory.distinct("product");

    for (const productId of productIds) {
      await Inventory.syncProductStock(productId);
    }

    res.status(200).json({
      success: true,
      message: `Stock synchronized for ${productIds.length} products`,
    });
  } catch (error) {
    console.error("Sync all stock error:", error);
    res.status(500).json({
      success: false,
      message: "Error synchronizing stock",
      error: error.message,
    });
  }
};

// Get all stock movements (adjustments) (E5.10)
exports.getStockMovements = async (req, res) => {
  try {
    const { limit = 100 } = req.query;

    const filterLocation =
      req.user.role === "location_inventory_manager"
        ? req.user.assignedLocation
        : req.query.location;

    let query = {};
    if (filterLocation && filterLocation !== "all") {
      query.location = filterLocation;
    }

    const inventory = await Inventory.find(query)
      .populate({
        path: "product",
        select: "title isbn",
        match: { isActive: true },
      })
      .populate("adjustments.adjustedBy", "name");

    // Flatten all adjustments from all products/locations
    let movements = [];
    inventory.forEach((item) => {
      // Only include movements for active products
      if (item.product && item.adjustments && item.adjustments.length > 0) {
        item.adjustments.forEach((adj) => {
          movements.push({
            _id: adj._id,
            product: item.product,
            location: item.location,
            type: adj.type || "Manual",
            quantity: adj.quantity,
            reason: adj.reason,
            adjustedBy: adj.adjustedBy,
            timestamp: adj.timestamp,
          });
        });
      }
    });

    // Sort by most recent
    movements.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.status(200).json({
      success: true,
      count: movements.length,
      movements: movements.slice(0, limit),
    });
  } catch (error) {
    console.error("Get movements error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching stock movements",
      error: error.message,
    });
  }
};

// Update inventory settings (E5.7)
exports.updateInventorySettings = async (req, res) => {
  try {
    const { id } = req.params;
    const { lowStockThreshold, reorderPoint } = req.body;

    const inventory = await Inventory.findById(id);
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found",
      });
    }

    if (lowStockThreshold !== undefined)
      inventory.lowStockThreshold = lowStockThreshold;
    if (reorderPoint !== undefined) inventory.reorderPoint = reorderPoint;

    await inventory.save();

    res.status(200).json({
      success: true,
      message: "Inventory settings updated",
      inventory,
    });
  } catch (error) {
    console.error("Update inventory settings error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating inventory settings",
      error: error.message,
    });
  }
};

// Get aggregate inventory stats (Summary)
exports.getInventoryStats = async (req, res) => {
  try {
    const filterLocation =
      req.user.role === "location_inventory_manager"
        ? req.user.assignedLocation
        : req.query.location;

    let query = {};
    if (filterLocation && filterLocation !== "all") {
      query.location = filterLocation;
    }

    const allInventory = await Inventory.find(query).populate({
      path: "product",
      match: { category: { $ne: "Gift Voucher" }, isActive: true },
    });

    // Filter to exclude records where product is null (Gift Voucher)
    const physicalInventory = allInventory.filter(
      (item) => item.product !== null,
    );

    // 2. Fetch counts directly from their models for accurate totals (Real & Not Hardcoded)
    const totalActiveProducts = await Product.countDocuments({
      isActive: true,
      category: { $ne: "Gift Voucher" },
    });

    const totalLocations = await require("../models/Location").countDocuments({
      status: "Active",
    });

    // 3. Count total adjustments (E5.10)
    const adjustmentCount = physicalInventory.reduce(
      (sum, item) => sum + (item.adjustments ? item.adjustments.length : 0),
      0,
    );

    // Aggregation match stage for distribution
    let distributionMatch = {
      "productData.category": { $ne: "Gift Voucher" },
      "productData.isActive": true,
    };

    // Restrict chart only if the user is a location manager
    if (
      req.user.role === "location_inventory_manager" &&
      req.user.assignedLocation
    ) {
      distributionMatch.location = req.user.assignedLocation;
    }

    const itemsWithStockCount = physicalInventory.filter(
      (item) => item.product && item.availableQuantity > 0,
    ).length;

    const stats = {
      totalItems: totalActiveProducts,
      lowStock: physicalInventory.filter(
        (item) =>
          item.product &&
          item.availableQuantity > 0 &&
          item.availableQuantity <=
            (item.reorderPoint || item.lowStockThreshold || 10),
      ).length,
      outOfStock: filterLocation
        ? totalActiveProducts - itemsWithStockCount
        : physicalInventory.filter(
            (item) => item.product && item.availableQuantity === 0,
          ).length,
      locations: totalLocations,
      adjustments: adjustmentCount,
    };

    // Calculate distribution for chart (Excluding Gift Vouchers)
    // Real distribution across all active locations
    const allLocationsData = await require("../models/Location").find({
      status: "Active",
    });

    const distributionRaw = await Inventory.aggregate([
      {
        $lookup: {
          from: "products",
          localField: "product",
          foreignField: "_id",
          as: "productData",
        },
      },
      { $unwind: "$productData" },
      {
        $match: {
          "productData.category": { $ne: "Gift Voucher" },
          "productData.isActive": true,
        },
      },
      {
        $group: {
          _id: "$location",
          totalQuantity: { $sum: "$availableQuantity" },
        },
      },
    ]);

    // Map raw distribution to all locations to ensure 0s are represented
    const distribution = allLocationsData.map((loc) => {
      const dist = distributionRaw.find((d) => d._id === loc.name);
      return {
        _id: loc.name,
        totalQuantity: dist ? dist.totalQuantity : 0,
      };
    });

    // Sort by quantity descending
    distribution.sort((a, b) => b.totalQuantity - a.totalQuantity);

    res.status(200).json({
      success: true,
      stats,
      distribution,
    });
  } catch (error) {
    console.error("Get inventory stats error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching inventory stats",
    });
  }
};

module.exports = exports;

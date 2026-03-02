// ============================================
// Stock Transfer Controller
// Epic: E5 - Inventory Management
// Owner: IT24100264 (Bandara N W C D)
// Purpose: Request and approve transfers (E5.4, E5.5)
// Updated: Fixed export issue
// ============================================

const StockTransfer = require("../models/StockTransfer");
const Inventory = require("../models/Inventory");

// [E5.4] requestTransfer: validates source stock then creates a pending StockTransfer document
exports.requestTransfer = async (req, res) => {
  try {
    const { product, fromLocation, toLocation, quantity, reason } = req.body;

    if (fromLocation === toLocation) {
      return res
        .status(400)
        .json({ success: false, message: "Cannot transfer to same location" });
    }

    // [E5.4] Pre-validate: check source inventory BEFORE creating the transfer request
    const sourceInventory = await Inventory.findOne({
      product,
      location: fromLocation,
    });
    if (!sourceInventory || sourceInventory.quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: "Insufficient stock at source location",
      });
    }

    const transfer = await StockTransfer.create({
      product,
      fromLocation,
      toLocation,
      quantity,
      reason,
      requestedBy: req.user.id,
    });

    await transfer.populate("product requestedBy");

    res.status(201).json({
      success: true,
      message: "Transfer request created successfully",
      transfer,
    });
  } catch (error) {
    console.error("Request transfer error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating transfer request",
      error: error.message,
    });
  }
};

// [E5.5] approveTransfer: security-gated — only source location manager, master IM, or admin can approve
exports.approveTransfer = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, notes } = req.body; // action: 'approve' or 'reject'

    const transfer = await StockTransfer.findById(id);
    if (!transfer) {
      return res
        .status(404)
        .json({ success: false, message: "Transfer not found" });
    }

    if (transfer.status !== "Requested") {
      return res
        .status(400)
        .json({ success: false, message: "Transfer already processed" });
    }

    // [E5.5] Security check: only the source location's manager, or master IM / admin can approve
    const isMasterOrAdmin =
      req.user.role === "admin" || req.user.role === "master_inventory_manager";

    const isSourceManager =
      req.user.role === "location_inventory_manager" &&
      req.user.assignedLocation === transfer.fromLocation;

    if (!isMasterOrAdmin && !isSourceManager) {
      return res.status(403).json({
        success: false,
        message:
          "Unauthorized. Only the source location manager or administrators can approve this transfer.",
      });
    }

    if (action === "approve") {
      // Deduct from source — use save() so pre/post hooks recalculate availableQuantity & sync Product.stock
      const srcInventory = await Inventory.findOne({
        product: transfer.product,
        location: transfer.fromLocation,
      });
      if (!srcInventory || srcInventory.quantity < transfer.quantity) {
        return res
          .status(400)
          .json({ success: false, message: "Insufficient stock" });
      }
      srcInventory.deductStock(
        transfer.quantity,
        `Transfer Out to ${transfer.toLocation}: ${transfer.transferNumber}`,
        req.user.id,
      );
      await srcInventory.save();

      // Add to destination — use save() so pre/post hooks recalculate availableQuantity & sync Product.stock
      let destInventory = await Inventory.findOne({
        product: transfer.product,
        location: transfer.toLocation,
      });
      if (!destInventory) {
        destInventory = new Inventory({
          product: transfer.product,
          location: transfer.toLocation,
          quantity: 0,
          reservedQuantity: 0,
        });
      }
      destInventory.addStock(
        transfer.quantity,
        `Transfer In from ${transfer.fromLocation}: ${transfer.transferNumber}`,
        req.user.id,
      );
      await destInventory.save();

      transfer.status = "Completed";
      transfer.completedDate = Date.now();
    } else {
      transfer.status = "Rejected";
    }

    transfer.approvedBy = req.user.id;
    transfer.approvedDate = Date.now();
    transfer.notes = notes;

    await transfer.save();
    await transfer.populate("product requestedBy approvedBy");

    res.status(200).json({
      success: true,
      message: `Transfer ${action}d successfully`,
      transfer,
    });
  } catch (error) {
    console.error("Approve transfer error:", error);
    res
      .status(500)
      .json({ success: false, message: "Error processing transfer" });
  }
};

// Get All Transfers
exports.getAllTransfers = async (req, res) => {
  try {
    const { status, location } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (location) {
      filter.$or = [{ fromLocation: location }, { toLocation: location }];
    }

    const transfers = await StockTransfer.find(filter)
      .populate("product requestedBy approvedBy")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: transfers.length,
      transfers,
    });
  } catch (error) {
    console.error("Get transfers error:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching transfers" });
  }
};

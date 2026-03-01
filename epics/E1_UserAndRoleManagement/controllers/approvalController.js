// ============================================
// Approval Controller
// Epic: E1 - User & Role Management
// Owner: IT24100548 (Galagama S.T)
// Purpose: Handle Admin Approval Workflow
// ============================================

const ApprovalRequest = require("../models/ApprovalRequest");
const FinancialTransaction = require("../../E3_OrderAndTransaction/models/FinancialTransaction");
const Supplier = require("../../E4_SupplierManagement/models/Supplier");
const Inventory = require("../../E5_InventoryManagement/models/Inventory");
const Product = require("../../E2_ProductCatalog/models/Product");

// [E1.12] getPendingRequests: returns all unreviewed requests; cross-epic workflow — data from E3/E4/E5
exports.getPendingRequests = async (req, res) => {
  try {
    // [E1.12] Populate requestedBy so admin can see who made the change request (name, email, role)
    const requests = await ApprovalRequest.find({ status: "Pending" })
      .populate("requestedBy", "name email role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    console.error("Get pending requests error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching approval requests",
      error: error.message,
    });
  }
};

// [E1.12] reviewRequest: apply or reject a pending change request; master IM limited to Product/Inventory
exports.reviewRequest = async (req, res) => {
  try {
    const { status, remarks } = req.body; // Approved or Rejected
    const request = await ApprovalRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Approval request not found",
      });
    }

    if (request.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: `Request is already ${request.status}`,
      });
    }

    // [E1.12] Role-based module restrictions: master IM can only approve Product and Inventory requests
    if (req.user.role === "master_inventory_manager") {
      if (request.module !== "Product" && request.module !== "Inventory") {
        return res.status(403).json({
          success: false,
          message:
            "You are only authorized to review Product and Inventory requests",
        });
      }
    }

    if (status === "Approved") {
      // [E1.12] Apply targetData to the correct model based on module — handles 4 cross-epic models
      switch (request.module) {
        case "FinancialTransaction":
          await FinancialTransaction.findByIdAndUpdate(
            request.documentId,
            request.targetData,
            { runValidators: true },
          );
          break;
        case "Supplier":
          await Supplier.findByIdAndUpdate(
            request.documentId,
            request.targetData,
            { runValidators: true },
          );
          break;
        case "Inventory":
          if (request.action === "Adjust Stock") {
            const inventory = await Inventory.findById(request.documentId);
            if (inventory) {
              // targetData contains adjustment details
              inventory.quantity += request.targetData.quantityChange;
              inventory.movements.push({
                type: request.targetData.type,
                quantity: Math.abs(request.targetData.quantityChange),
                reason:
                  request.targetData.reason || "Admin Approved Adjustment",
                performedBy: request.requestedBy,
              });
              await inventory.save();
            }
          } else if (request.action === "Update") {
            await Inventory.findByIdAndUpdate(
              request.documentId,
              request.targetData,
              { runValidators: true },
            );
          }
          break;
        case "Product":
          if (request.action === "Delete") {
            await Product.findByIdAndUpdate(
              request.documentId,
              { isActive: false },
              { new: true },
            );
          }
          break;
      }
    }

    request.status = status;
    request.reviewedBy = req.user._id;
    request.reviewedAt = Date.now();
    request.reason = remarks || request.reason;
    await request.save();

    res.status(200).json({
      success: true,
      message: `Request ${status} successfully`,
      request,
    });
  } catch (error) {
    console.error("Review request error:", error);
    res.status(500).json({
      success: false,
      message: "Error reviewing approval request",
      error: error.message,
    });
  }
};

module.exports = exports;

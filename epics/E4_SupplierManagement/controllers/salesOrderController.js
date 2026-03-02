// ============================================
// Sales Order Controller
// Epic: E4 - Supplier Management (Customer Orders)
// Owner: IT24100799 (Gawrawa G H Y)
// Purpose: Sales Order management for Distributors & Bookshops
// ============================================

const SalesOrder = require("../models/SalesOrder");
const Supplier = require("../models/Supplier");
const Product = require("../../E2_ProductCatalog/models/Product");
const Inventory = require("../../E5_InventoryManagement/models/Inventory");
const Location = require("../../E5_InventoryManagement/models/Location");
const FinancialTransaction = require("../../E3_OrderAndTransaction/models/FinancialTransaction");

// [E4] Create Sales Order for a customer (Distributor/Bookshop)
exports.createSalesOrder = async (req, res) => {
  try {
    const {
      customer,
      items,
      expectedDispatchDate,
      expectedDeliveryDate,
      deliveryAddress,
      notes,
    } = req.body;

    // Verify customer exists and is of type 'Customer'
    const customerDoc = await Supplier.findById(customer);
    if (!customerDoc) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    if (customerDoc.supplierType !== "Customer") {
      return res.status(400).json({
        success: false,
        message:
          "Sales orders can only be created for Customers (Distributors/Bookshops)",
      });
    }

    // Validate items and calculate totals
    let totalAmount = 0;
    const processedItems = [];

    // Find main warehouse location for stock checks
    const mainWarehouse = await Location.findOne({ isMainWarehouse: true });
    const warehouseLocation = mainWarehouse ? mainWarehouse.name : null;

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.product}`,
        });
      }

      // Check inventory availability from main warehouse (live stock = quantity - reservedQuantity)
      const inventoryQuery = warehouseLocation
        ? { product: item.product, location: warehouseLocation }
        : { product: item.product };
      const inventory = await Inventory.findOne(inventoryQuery);
      const liveStock = inventory
        ? Math.max(
            0,
            (inventory.quantity ?? 0) - (inventory.reservedQuantity ?? 0),
          )
        : 0;

      if (!inventory || liveStock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product: ${product.title}. Available: ${liveStock}`,
          details: `Insufficient stock for product: ${product.title}. Available: ${liveStock}`,
        });
      }

      const itemTotal = item.quantity * item.unitPrice;
      totalAmount += itemTotal;

      processedItems.push({
        product: item.product,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: itemTotal,
      });
    }

    // Create sales order
    const salesOrder = await SalesOrder.create({
      customer,
      items: processedItems,
      totalAmount,
      amountDue: totalAmount,
      expectedDispatchDate,
      expectedDeliveryDate,
      deliveryAddress,
      notes,
      location: warehouseLocation || "Main Warehouse",
      createdBy: req.user._id,
      statusHistory: [
        {
          status: "Draft",
          changedBy: req.user._id,
          notes: "Sales order created",
        },
      ],
    });

    // Update customer's outstanding balance (they owe us)
    customerDoc.outstandingBalance =
      (customerDoc.outstandingBalance || 0) + totalAmount;
    customerDoc.hasDebt = true;
    customerDoc.totalOrders = (customerDoc.totalOrders || 0) + 1;
    customerDoc.totalValue = (customerDoc.totalValue || 0) + totalAmount;
    await customerDoc.save();

    res.status(201).json({
      success: true,
      message: "Sales order created successfully",
      salesOrder,
    });
  } catch (error) {
    console.error("Create sales order error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating sales order",
      details: error.message,
      error: error.message,
    });
  }
};

// [E4] Get all sales orders with filters
exports.getAllSalesOrders = async (req, res) => {
  try {
    const { status, customer, fromDate, toDate, paymentStatus } = req.query;

    let query = {};

    if (status) query.status = status;
    if (customer) query.customer = customer;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) query.createdAt.$lte = new Date(toDate);
    }

    const salesOrders = await SalesOrder.find(query)
      .populate("customer", "name category contactPerson email phone")
      .populate("items.product", "title isbn author")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: salesOrders.length,
      salesOrders,
    });
  } catch (error) {
    console.error("Get sales orders error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching sales orders",
      error: error.message,
    });
  }
};

// [E4] Get single sales order
exports.getSalesOrder = async (req, res) => {
  try {
    const salesOrder = await SalesOrder.findById(req.params.id)
      .populate("customer", "name category contactPerson email phone address")
      .populate("items.product", "title isbn author publisher")
      .populate("createdBy", "name email")
      .populate("statusHistory.changedBy", "name");

    if (!salesOrder) {
      return res.status(404).json({
        success: false,
        message: "Sales order not found",
      });
    }

    res.status(200).json({
      success: true,
      salesOrder,
    });
  } catch (error) {
    console.error("Get sales order error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching sales order",
      error: error.message,
    });
  }
};

// [E4] Update sales order status
exports.updateSOStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const salesOrder = await SalesOrder.findById(req.params.id);

    if (!salesOrder) {
      return res.status(404).json({
        success: false,
        message: "Sales order not found",
      });
    }

    // [E4] Supplier managers cannot dispatch directly — they submit a request for inventory manager approval
    if (status === "Dispatched" && req.user.role === "supplier_manager") {
      if (salesOrder.status !== "Processing") {
        return res.status(400).json({
          success: false,
          message:
            "Dispatch can only be requested for orders that are in Processing status",
        });
      }
      salesOrder.status = "DispatchRequested";
      salesOrder.statusHistory.push({
        status: "DispatchRequested",
        changedBy: req.user._id,
        notes:
          notes || "Dispatch requested — awaiting inventory manager approval",
      });
      await salesOrder.save();
      return res.status(200).json({
        success: true,
        message:
          "Dispatch request submitted. The inventory manager will review and approve.",
        salesOrder,
        dispatchRequested: true,
      });
    }

    // When status changes to 'Dispatched' (by admin/master_inventory_manager), reduce inventory
    if (status === "Dispatched" && salesOrder.status !== "Dispatched") {
      // Resolve real main warehouse name from Location document
      const mainWarehouse = await Location.findOne({ isMainWarehouse: true });
      const warehouseLocationName = mainWarehouse
        ? mainWarehouse.name
        : salesOrder.location || "Main Warehouse";

      for (const item of salesOrder.items) {
        // Try resolved main warehouse name first, fall back to salesOrder.location
        let inventory = await Inventory.findOne({
          product: item.product,
          location: warehouseLocationName,
        });

        // Fallback: try salesOrder.location if different
        if (
          !inventory &&
          salesOrder.location &&
          salesOrder.location !== warehouseLocationName
        ) {
          inventory = await Inventory.findOne({
            product: item.product,
            location: salesOrder.location,
          });
        }

        if (!inventory) {
          return res.status(400).json({
            success: false,
            message: `Inventory record not found for product ${item.product} at warehouse "${warehouseLocationName}". Cannot dispatch.`,
          });
        }

        // Check live stock before deducting
        const liveStock = Math.max(
          0,
          (inventory.quantity || 0) - (inventory.reservedQuantity || 0),
        );
        if (liveStock < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock to dispatch. Available: ${liveStock}, Required: ${item.quantity}`,
          });
        }

        // Reduce physical quantity; recalculate availableQuantity from live formula
        inventory.quantity = Math.max(
          0,
          (inventory.quantity || 0) - item.quantity,
        );
        inventory.availableQuantity = Math.max(
          0,
          inventory.quantity - (inventory.reservedQuantity || 0),
        );

        // Add adjustment record
        inventory.adjustments.push({
          type: "Remove",
          quantity: -item.quantity,
          reason: `SO ${salesOrder.soNumber} dispatched to customer`,
          adjustedBy: req.user._id,
          timestamp: Date.now(),
        });

        await inventory.save();
        item.dispatchedQty = item.quantity;
      }
      salesOrder.actualDispatchDate = new Date();
    }

    // When status changes to 'Delivered', update delivery date
    if (status === "Delivered" && salesOrder.status !== "Delivered") {
      salesOrder.actualDeliveryDate = new Date();
    }

    salesOrder.status = status;
    salesOrder.statusHistory.push({
      status,
      changedBy: req.user._id,
      notes,
    });

    await salesOrder.save();

    res.status(200).json({
      success: true,
      message: "Sales order status updated successfully",
      salesOrder,
    });
  } catch (error) {
    console.error("Update sales order status error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating sales order status",
      error: error.message,
    });
  }
};

// [E4] Record payment from customer for a sales order
exports.recordPaymentForSO = async (req, res) => {
  try {
    // Accept both naming conventions (PaymentModal sends method/note/date; legacy sends paymentMethod/notes)
    const { amount, paymentMethod, method, reference, notes, note, date } =
      req.body;
    const resolvedMethod = paymentMethod || method || "Other";
    const resolvedNote = notes || note || "";
    const resolvedDate = date ? new Date(date) : new Date();
    const salesOrder = await SalesOrder.findById(req.params.id).populate(
      "customer",
    );

    if (!salesOrder) {
      return res.status(404).json({
        success: false,
        message: "Sales order not found",
      });
    }

    if (amount <= 0 || amount > salesOrder.amountDue) {
      return res.status(400).json({
        success: false,
        message: `Invalid payment amount. Amount due: ${salesOrder.amountDue}`,
      });
    }

    // Update sales order payment tracking
    salesOrder.amountPaid += amount;
    salesOrder.amountDue -= amount;

    salesOrder.paymentHistory.push({
      amount,
      paymentDate: resolvedDate,
      paymentMethod: resolvedMethod,
      reference,
      note: resolvedNote,
      recordedBy: req.user._id,
    });

    await salesOrder.save();

    // Update customer's outstanding balance
    const customer = await Supplier.findById(salesOrder.customer._id);
    if (customer) {
      customer.outstandingBalance = Math.max(
        0,
        (customer.outstandingBalance || 0) - amount,
      );
      customer.totalPaid = (customer.totalPaid || 0) + amount;
      customer.lastPaymentDate = resolvedDate;
      customer.hasDebt = customer.outstandingBalance > 0;
      await customer.save();
    }

    // [E3 Integration] Create a FinancialTransaction so this income is visible
    // in the Finance Manager's revenue dashboard and daily trend charts
    await FinancialTransaction.create({
      type: "Customer Collection",
      amount,
      status: "Completed",
      date: resolvedDate,
      relatedId: salesOrder._id,
      description: `SO #${salesOrder.soNumber} — payment from ${customer?.name || "customer"} (${resolvedMethod})${reference ? ` ref: ${reference}` : ""}`,
      processedBy: req.user._id,
      isIncome: true,
    });

    res.status(200).json({
      success: true,
      message: "Payment recorded successfully",
      salesOrder,
      customerBalance: {
        outstandingBalance: customer.outstandingBalance,
        hasDebt: customer.hasDebt,
      },
    });
  } catch (error) {
    console.error("Record payment for SO error:", error);
    res.status(500).json({
      success: false,
      message: "Error recording payment",
      error: error.message,
    });
  }
};

// [E4] Cancel sales order
exports.cancelSalesOrder = async (req, res) => {
  try {
    const { notes } = req.body;
    const salesOrder = await SalesOrder.findById(req.params.id);

    if (!salesOrder) {
      return res.status(404).json({
        success: false,
        message: "Sales order not found",
      });
    }

    if (
      salesOrder.status === "Dispatched" ||
      salesOrder.status === "Delivered"
    ) {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel a dispatched or delivered order",
      });
    }

    // If order was confirmed and customer balance was updated, reverse it
    if (salesOrder.status !== "Draft") {
      const customer = await Supplier.findById(salesOrder.customer);
      if (customer) {
        customer.outstandingBalance = Math.max(
          0,
          customer.outstandingBalance - salesOrder.amountDue,
        );
        customer.hasDebt = customer.outstandingBalance > 0;
        customer.totalOrders = Math.max(0, customer.totalOrders - 1);
        customer.totalValue = Math.max(
          0,
          customer.totalValue - salesOrder.totalAmount,
        );
        await customer.save();
      }
    }

    salesOrder.status = "Cancelled";
    salesOrder.statusHistory.push({
      status: "Cancelled",
      changedBy: req.user._id,
      notes,
    });

    await salesOrder.save();

    res.status(200).json({
      success: true,
      message: "Sales order cancelled successfully",
      salesOrder,
    });
  } catch (error) {
    console.error("Cancel sales order error:", error);
    res.status(500).json({
      success: false,
      message: "Error cancelling sales order",
      error: error.message,
    });
  }
};

// [E4] Get sales order analytics
exports.getSalesOrderAnalytics = async (req, res) => {
  try {
    const salesOrders = await SalesOrder.find().populate(
      "customer",
      "name category",
    );

    const totalOrders = salesOrders.length;
    const totalRevenue = salesOrders
      .filter((so) => so.status !== "Cancelled")
      .reduce((sum, so) => sum + so.totalAmount, 0);
    const totalPaid = salesOrders.reduce((sum, so) => sum + so.amountPaid, 0);
    const totalOutstanding = salesOrders
      .filter((so) => so.paymentStatus !== "Paid")
      .reduce((sum, so) => sum + so.amountDue, 0);

    const statusBreakdown = {
      Draft: salesOrders.filter((so) => so.status === "Draft").length,
      Confirmed: salesOrders.filter((so) => so.status === "Confirmed").length,
      Processing: salesOrders.filter((so) => so.status === "Processing").length,
      Dispatched: salesOrders.filter((so) => so.status === "Dispatched").length,
      Delivered: salesOrders.filter((so) => so.status === "Delivered").length,
      Cancelled: salesOrders.filter((so) => so.status === "Cancelled").length,
    };

    const paymentBreakdown = {
      Unpaid: salesOrders.filter((so) => so.paymentStatus === "Unpaid").length,
      Partial: salesOrders.filter((so) => so.paymentStatus === "Partial")
        .length,
      Paid: salesOrders.filter((so) => so.paymentStatus === "Paid").length,
    };

    res.status(200).json({
      success: true,
      analytics: {
        totalOrders,
        totalRevenue,
        totalPaid,
        totalOutstanding,
        statusBreakdown,
        paymentBreakdown,
      },
    });
  } catch (error) {
    console.error("Get sales order analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching analytics",
      error: error.message,
    });
  }
};

// [E4] Get all sales orders pending dispatch approval (DispatchRequested status)
exports.getPendingSODispatchRequests = async (req, res) => {
  try {
    const salesOrders = await SalesOrder.find({ status: "DispatchRequested" })
      .populate("customer", "name category contactPerson email phone")
      .populate("items.product", "title isbn")
      .populate("createdBy", "name email")
      .populate("statusHistory.changedBy", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: salesOrders.length,
      salesOrders,
    });
  } catch (error) {
    console.error("Get pending SO dispatch requests error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching pending dispatch requests",
      error: error.message,
    });
  }
};

// [E4] Approve a dispatch request — deduct inventory and mark SO as Dispatched
// Only master_inventory_manager or admin
exports.approveSODispatch = async (req, res) => {
  try {
    const { notes } = req.body;
    const salesOrder = await SalesOrder.findById(req.params.id).populate(
      "customer",
    );

    if (!salesOrder) {
      return res
        .status(404)
        .json({ success: false, message: "Sales order not found" });
    }

    if (salesOrder.status !== "DispatchRequested") {
      return res.status(400).json({
        success: false,
        message: `Cannot approve dispatch: order is currently "${salesOrder.status}", expected "DispatchRequested"`,
      });
    }

    // Resolve main warehouse location
    const mainWarehouse = await Location.findOne({ isMainWarehouse: true });
    const warehouseLocationName = mainWarehouse
      ? mainWarehouse.name
      : salesOrder.location || "Main Warehouse";

    for (const item of salesOrder.items) {
      let inventory = await Inventory.findOne({
        product: item.product,
        location: warehouseLocationName,
      });

      // Fallback to SO's stored location
      if (
        !inventory &&
        salesOrder.location &&
        salesOrder.location !== warehouseLocationName
      ) {
        inventory = await Inventory.findOne({
          product: item.product,
          location: salesOrder.location,
        });
      }

      if (!inventory) {
        return res.status(400).json({
          success: false,
          message: `Inventory record not found for product ${item.product} at "${warehouseLocationName}". Cannot approve dispatch.`,
        });
      }

      const liveStock = Math.max(
        0,
        (inventory.quantity || 0) - (inventory.reservedQuantity || 0),
      );
      if (liveStock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock to dispatch. Available: ${liveStock}, Required: ${item.quantity}`,
        });
      }

      inventory.quantity = Math.max(
        0,
        (inventory.quantity || 0) - item.quantity,
      );
      inventory.availableQuantity = Math.max(
        0,
        inventory.quantity - (inventory.reservedQuantity || 0),
      );
      inventory.adjustments.push({
        type: "Remove",
        quantity: -item.quantity,
        reason: `SO ${salesOrder.soNumber} dispatched — approved by inventory manager`,
        adjustedBy: req.user._id,
        timestamp: Date.now(),
      });
      await inventory.save();
      item.dispatchedQty = item.quantity;
    }

    salesOrder.status = "Dispatched";
    salesOrder.actualDispatchDate = new Date();
    salesOrder.statusHistory.push({
      status: "Dispatched",
      changedBy: req.user._id,
      notes: notes || "Dispatch approved by inventory manager",
    });
    await salesOrder.save();

    res.status(200).json({
      success: true,
      message:
        "Dispatch approved. Inventory updated and SO marked as Dispatched.",
      salesOrder,
    });
  } catch (error) {
    console.error("Approve SO dispatch error:", error);
    res.status(500).json({
      success: false,
      message: "Error approving dispatch",
      error: error.message,
    });
  }
};

// [E4] Reject a dispatch request — return the SO to Processing status
// Only master_inventory_manager or admin
exports.rejectSODispatch = async (req, res) => {
  try {
    const { notes } = req.body;
    const salesOrder = await SalesOrder.findById(req.params.id);

    if (!salesOrder) {
      return res
        .status(404)
        .json({ success: false, message: "Sales order not found" });
    }

    if (salesOrder.status !== "DispatchRequested") {
      return res.status(400).json({
        success: false,
        message: `Cannot reject dispatch: order is currently "${salesOrder.status}", expected "DispatchRequested"`,
      });
    }

    salesOrder.status = "Processing";
    salesOrder.statusHistory.push({
      status: "Processing",
      changedBy: req.user._id,
      notes:
        notes ||
        "Dispatch request rejected by inventory manager — returned to Processing",
    });
    await salesOrder.save();

    res.status(200).json({
      success: true,
      message: "Dispatch request rejected. SO returned to Processing status.",
      salesOrder,
    });
  } catch (error) {
    console.error("Reject SO dispatch error:", error);
    res.status(500).json({
      success: false,
      message: "Error rejecting dispatch",
      error: error.message,
    });
  }
};

module.exports = exports;

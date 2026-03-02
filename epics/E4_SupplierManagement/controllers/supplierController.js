// ============================================
// Supplier Controller
// Epic: E4 - Supplier Management
// Owner: IT24100799 (Gawrawa G H Y)
// Purpose: Supplier and PO management (E4.1-E4.7)
// ============================================

const Supplier = require("../models/Supplier");
const FinancialTransaction = require("../../E3_OrderAndTransaction/models/FinancialTransaction");

// [E4.1] getAllSuppliers: returns only active suppliers (soft-delete pattern)
exports.getAllSuppliers = async (req, res) => {
  try {
    // [E4.1] isActive filter hides deactivated suppliers without removing their PO history
    const query = { isActive: true };

    // [E4.1] Optional supplierType filter: "Vendor" (PO form) or "Customer" (SO form)
    if (req.query.supplierType) {
      query.supplierType = req.query.supplierType;
    }

    // Optional category filter
    if (req.query.category) {
      query.category = req.query.category;
    }

    // Optional search filter
    if (req.query.search) {
      query.name = { $regex: req.query.search, $options: "i" };
    }

    const suppliers = await Supplier.find(query);

    res.status(200).json({
      success: true,
      count: suppliers.length,
      suppliers,
    });
  } catch (error) {
    console.error("Get suppliers error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching suppliers",
      error: error.message,
    });
  }
};

// [E4.1] getSupplier: fetch a single supplier by ID (used by admin approval diff view)
exports.getSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res
        .status(404)
        .json({ success: false, message: "Supplier not found" });
    }
    res.status(200).json({ success: true, supplier });
  } catch (error) {
    console.error("Get supplier error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching supplier",
      error: error.message,
    });
  }
};

// [E4.1] createSupplier: plain Supplier.create; no approval needed for creating new suppliers
exports.createSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.create(req.body);

    res.status(201).json({
      success: true,
      message: "Supplier created successfully",
      supplier,
    });
  } catch (error) {
    console.error("Create supplier error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating supplier",
      error: error.message,
    });
  }
};

// [E4.1][E1.12] updateSupplier: maker-checker — non-admin edits route through ApprovalRequest (cross-epic E1)
exports.updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    // [E1.12] Non-admin users cannot directly edit supplier data; creates an ApprovalRequest instead
    if (req.user.role !== "admin") {
      const ApprovalRequest = require("../../E1_UserAndRoleManagement/models/ApprovalRequest");

      const newRequest = await ApprovalRequest.create({
        module: "Supplier",
        action: "Update",
        documentId: req.params.id,
        targetData: req.body,
        requestedBy: req.user._id,
      });

      return res.status(202).json({
        success: true,
        pendingApproval: true,
        message: "Edit request submitted for Admin approval.",
        request: newRequest,
      });
    }

    const updatedSupplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      },
    );

    res.status(200).json({
      success: true,
      message: "Supplier updated successfully",
      supplier: updatedSupplier,
    });
  } catch (error) {
    console.error("Update supplier error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating supplier",
      error: error.message,
    });
  }
};

// Delete supplier (E4.1)
exports.deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true },
    );

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Supplier deleted successfully",
    });
  } catch (error) {
    console.error("Delete supplier error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting supplier",
      error: error.message,
    });
  }
};

// [E4.1] getTerminatedSuppliers: returns all partners with isActive: false
exports.getTerminatedSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find({ isActive: false });
    res.status(200).json({
      success: true,
      count: suppliers.length,
      suppliers,
    });
  } catch (error) {
    console.error("Get terminated suppliers error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching terminated suppliers",
      error: error.message,
    });
  }
};

// [E4.1] terminateSupplier: soft-terminates a partner (isActive: false); preserves PO history
exports.terminateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true },
    );
    if (!supplier) {
      return res
        .status(404)
        .json({ success: false, message: "Supplier not found" });
    }
    res.status(200).json({
      success: true,
      message: "Partner terminated successfully",
      supplier,
    });
  } catch (error) {
    console.error("Terminate supplier error:", error);
    res.status(500).json({
      success: false,
      message: "Error terminating supplier",
      error: error.message,
    });
  }
};

// [E4.1] restoreSupplier: re-activates a terminated partner (isActive: true)
exports.restoreSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true },
    );
    if (!supplier) {
      return res
        .status(404)
        .json({ success: false, message: "Supplier not found" });
    }
    res.status(200).json({
      success: true,
      message: "Partner restored successfully",
      supplier,
    });
  } catch (error) {
    console.error("Restore supplier error:", error);
    res.status(500).json({
      success: false,
      message: "Error restoring supplier",
      error: error.message,
    });
  }
};

// Get Supplier Analytics (E4.6)
exports.getSupplierAnalytics = async (req, res) => {
  try {
    const [suppliers, purchaseOrders] = await Promise.all([
      Supplier.find({ isActive: true }),
      PurchaseOrder.find({ status: "Received" }),
    ]);

    const totalSuppliers = suppliers.length;
    const bookshops = suppliers.filter((s) => s.category === "Bookshop").length;
    const distributors = suppliers.filter(
      (s) => s.category === "Distributor",
    ).length;

    // Calculate performance per supplier
    const performance = suppliers.map((supplier) => {
      const supplierPOs = purchaseOrders.filter(
        (po) => po.supplier.toString() === supplier._id.toString(),
      );

      const totalReceived = supplierPOs.length;
      const onTime = supplierPOs.filter(
        (po) =>
          po.actualDeliveryDate &&
          po.expectedDeliveryDate &&
          po.actualDeliveryDate <= po.expectedDeliveryDate,
      ).length;

      return {
        _id: supplier._id,
        name: supplier.name,
        category: supplier.category,
        totalOrders: totalReceived,
        onTimeRate: totalReceived > 0 ? (onTime / totalReceived) * 100 : 100,
        rating: supplier.rating || 0,
        defectRate: supplier.defectRate || 0, // Placeholder for defect rate
      };
    });

    // Aggregate stats
    const avgOnTime =
      performance.reduce((acc, p) => acc + p.onTimeRate, 0) /
        performance.length || 0;

    res.status(200).json({
      success: true,
      stats: {
        totalSuppliers,
        bookshops,
        distributors,
        avgOnTime: avgOnTime.toFixed(1),
        totalOrders: purchaseOrders.length,
      },
      performance,
    });
  } catch (error) {
    console.error("Get supplier analytics error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// [E4.5] Record payment TO a vendor (we pay them - reduces our payable debt)
exports.recordPaymentToVendor = async (req, res) => {
  try {
    const { id } = req.params;
    // Accept both naming conventions: PaymentModal sends method/note/date; legacy sends paymentMethod/notes
    const { amount, reference } = req.body;
    const resolvedMethod = req.body.method || req.body.paymentMethod || "Other";
    const resolvedNote = req.body.note || req.body.notes || "";
    const resolvedDate = req.body.date ? new Date(req.body.date) : new Date();

    const supplier = await Supplier.findById(id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    if (supplier.supplierType !== "Vendor") {
      return res.status(400).json({
        success: false,
        message: "This operation is only for Vendors (Material Suppliers)",
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Payment amount must be greater than zero",
      });
    }

    // Update vendor's balance (reduce what we owe them)
    supplier.outstandingBalance = Math.max(
      0,
      supplier.outstandingBalance - amount,
    );
    supplier.totalPaid += amount;
    supplier.lastPaymentDate = resolvedDate;
    supplier.hasDebt = supplier.outstandingBalance > 0;

    await supplier.save();

    // [E3 Integration] Record as expense in financial transactions
    await FinancialTransaction.create({
      type: "Supplier Payment",
      amount,
      status: "Completed",
      date: resolvedDate,
      relatedId: supplier._id,
      description: `Payment to vendor ${supplier.name} (${resolvedMethod})${reference ? ` ref: ${reference}` : ""}`,
      processedBy: req.user._id,
      isIncome: false,
    });

    res.status(200).json({
      success: true,
      message: "Payment to vendor recorded successfully",
      paymentDetails: {
        amount,
        method: resolvedMethod,
        reference,
        note: resolvedNote,
        date: resolvedDate,
      },
      supplier: {
        name: supplier.name,
        outstandingBalance: supplier.outstandingBalance,
        totalPaid: supplier.totalPaid,
        hasDebt: supplier.hasDebt,
      },
    });
  } catch (error) {
    console.error("Record payment to vendor error:", error);
    res.status(500).json({
      success: false,
      message: "Error recording payment",
      error: error.message,
    });
  }
};

// [E4.5] Record payment FROM a customer (they pay us - reduces their receivable debt)
exports.recordPaymentFromCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    // Accept both naming conventions: PaymentModal sends method/note/date; legacy sends paymentMethod/notes
    const { amount, reference } = req.body;
    const resolvedMethod = req.body.method || req.body.paymentMethod || "Other";
    const resolvedNote = req.body.note || req.body.notes || "";
    const resolvedDate = req.body.date ? new Date(req.body.date) : new Date();

    const customer = await Supplier.findById(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    if (customer.supplierType !== "Customer") {
      return res.status(400).json({
        success: false,
        message:
          "This operation is only for Customers (Distributors/Bookshops)",
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Payment amount must be greater than zero",
      });
    }

    // Update customer's balance (reduce what they owe us)
    customer.outstandingBalance = Math.max(
      0,
      customer.outstandingBalance - amount,
    );
    customer.totalPaid += amount;
    customer.lastPaymentDate = resolvedDate;
    customer.hasDebt = customer.outstandingBalance > 0;

    await customer.save();

    // [E3 Integration] Record as income in financial transactions
    await FinancialTransaction.create({
      type: "Customer Collection",
      amount,
      status: "Completed",
      date: resolvedDate,
      relatedId: customer._id,
      description: `Payment received from ${customer.name} (${resolvedMethod})${reference ? ` ref: ${reference}` : ""}`,
      processedBy: req.user._id,
      isIncome: true,
    });

    res.status(200).json({
      success: true,
      message: "Payment from customer recorded successfully",
      paymentDetails: {
        amount,
        method: resolvedMethod,
        reference,
        note: resolvedNote,
        date: resolvedDate,
      },
      customer: {
        name: customer.name,
        outstandingBalance: customer.outstandingBalance,
        totalPaid: customer.totalPaid,
        hasDebt: customer.hasDebt,
      },
    });
  } catch (error) {
    console.error("Record payment from customer error:", error);
    res.status(500).json({
      success: false,
      message: "Error recording payment",
      error: error.message,
    });
  }
};

// [E4.5] Get all suppliers/customers with outstanding debt
exports.getPartnersWithDebt = async (req, res) => {
  try {
    // Accept both ?supplierType= (from supplierService) and ?type= for backward compatibility
    const type = req.query.supplierType || req.query.type; // 'Vendor' or 'Customer' or 'all'

    let filter = { outstandingBalance: { $gt: 0 }, isActive: { $ne: false } };
    if (type && type !== "all") {
      filter.supplierType = type;
    }

    const partners = await Supplier.find(filter)
      .select(
        "name category supplierType outstandingBalance lastPaymentDate contactPerson phone email paymentTerms",
      )
      .sort({ outstandingBalance: -1 });

    const totalDebt = partners.reduce(
      (sum, p) => sum + p.outstandingBalance,
      0,
    );
    const vendorDebt = partners
      .filter((p) => p.supplierType === "Vendor")
      .reduce((sum, p) => sum + p.outstandingBalance, 0);
    const customerDebt = partners
      .filter((p) => p.supplierType === "Customer")
      .reduce((sum, p) => sum + p.outstandingBalance, 0);

    res.status(200).json({
      success: true,
      count: partners.length,
      summary: {
        totalDebt,
        vendorDebt, // Amount we owe to vendors (payables)
        customerDebt, // Amount customers owe to us (receivables)
      },
      partners,
    });
  } catch (error) {
    console.error("Get partners with debt error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching partners with debt",
      error: error.message,
    });
  }
};

module.exports = exports;

// ============================================
// Financial Controller
// Epic: E3 - Order & Transaction
// Owner: IT24100191 (Jayasinghe D.B.P)
// Purpose: Financial dashboard and reporting (E3.9, E3.10, E3.11)
// ============================================

const Order = require('../models/Order');
const User = require('../../E1_UserAndRoleManagement/models/User');
const FinancialTransaction = require('../models/FinancialTransaction');
const Supplier = require('../../E4_SupplierManagement/models/Supplier');
const PurchaseOrder = require('../../E4_SupplierManagement/models/PurchaseOrder');
const PDFDocument = require("pdfkit");
const { Parser } = require("json2csv");

// Financial Dashboard (E3.9)
const getFinancialDashboard = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // --- 1. Basic Stats Calculation ---
    // Paid Orders Revenue
    const orderRevenue = await Order.aggregate([
      { $match: { ...dateFilter, paymentStatus: "Paid" } },
      { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
    ]);

    // Financial Transactions Income
    const txIncome = await FinancialTransaction.aggregate([
      { $match: { ...dateFilter, isIncome: true, status: "Completed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    // Financial Transactions Expenses
    const txExpenses = await FinancialTransaction.aggregate([
      {
        $match: {
          ...dateFilter,
          isIncome: false,
          status: { $ne: "Cancelled" },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const revFromOrders = orderRevenue[0]?.total || 0;
    const revFromTx = txIncome[0]?.total || 0;
    const totalRevenue = revFromOrders + revFromTx;
    const totalExpenses = txExpenses[0]?.total || 0;
    const netIncome = totalRevenue - totalExpenses;

    // --- 2. Growth Calculation (Last 30 vs Prev 30) ---
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const currentMonthRevenue = await Order.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo }, paymentStatus: "Paid" } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]);
    const prevMonthRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
          paymentStatus: "Paid",
        },
      },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]);

    const currRev = currentMonthRevenue[0]?.total || 0;
    const prevRev = prevMonthRevenue[0]?.total || 0;
    let growth = 0;
    if (prevRev > 0) {
      growth = ((currRev - prevRev) / prevRev) * 100;
    } else if (currRev > 0) {
      growth = 100;
    }

    // --- 3. Daily Trend (Last 30 days) ---
    const dailyOrderTrend = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
          paymentStatus: "Paid",
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$total" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const dailyTxIncomeTrend = await FinancialTransaction.aggregate([
      {
        $match: {
          date: { $gte: thirtyDaysAgo },
          isIncome: true,
          status: "Completed",
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          revenue: { $sum: "$amount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Merge daily trends
    const trendMap = {};
    dailyOrderTrend.forEach((d) => {
      trendMap[d._id] = { revenue: d.revenue, orders: d.orders };
    });
    dailyTxIncomeTrend.forEach((d) => {
      if (!trendMap[d._id]) trendMap[d._id] = { revenue: 0, orders: 0 };
      trendMap[d._id].revenue += d.revenue;
    });

    const dailyTrend = Object.keys(trendMap)
      .sort()
      .map((date) => ({
        _id: date,
        revenue: trendMap[date].revenue,
        orders: trendMap[date].orders,
      }));

    res.status(200).json({
      success: true,
      dashboard: {
        summary: {
          totalRevenue,
          totalExpenses,
          netIncome,
          totalOrders: orderRevenue[0]?.count || 0,
          growth: Math.round(growth * 10) / 10,
        },
        dailyTrend,
      },
    });
  } catch (error) {
    console.error("Financial dashboard error:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching financial data" });
  }
};

// Generate Invoice (E3.10)
const generateInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId).populate(
      "customer items.product",
    );

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // Generate invoice data
    const invoice = {
      invoiceNumber: `INV-${order.orderNumber}`,
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      order: {
        orderNumber: order.orderNumber,
        orderDate: order.createdAt,
        status: order.status,
      },
      customer: {
        name: order.customer?.name || order.guestInfo?.name,
        email: order.customer?.email || order.guestInfo?.email,
        phone: order.guestInfo?.phone,
        address: order.deliveryAddress,
      },
      items: order.items.map((item) => ({
        product: item.product?.name,
        quantity: item.quantity,
        unitPrice: item.price,
        total: item.price * item.quantity,
      })),
      subtotal: order.total - (order.deliveryFee || 0),
      deliveryFee: order.deliveryFee || 0,
      discount: order.discount || 0,
      total: order.total,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
    };

    res.status(200).json({
      success: true,
      invoice,
    });
  } catch (error) {
    console.error("Generate invoice error:", error);
    res
      .status(500)
      .json({ success: false, message: "Error generating invoice" });
  }
};

// Process Refund (E3.11)
const processRefund = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { refundAmount, reason } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (order.status === "Cancelled" || order.status === "Refunded") {
      return res.status(400).json({
        success: false,
        message: "Order already cancelled or refunded",
      });
    }

    // Update order
    order.status = "Refunded";
    order.refund = {
      amount: refundAmount,
      reason,
      processedBy: req.user.id,
      processedAt: Date.now(),
    };

    await order.save();

    // Create financial transaction record
    await FinancialTransaction.create({
      type: "Refund",
      amount: refundAmount,
      relatedId: orderId,
      description: `Refund for Order #${order.orderNumber}. Reason: ${reason}`,
      processedBy: req.user.id,
      isIncome: false,
    });

    res.status(200).json({
      success: true,
      message: "Refund processed successfully",
      order,
    });
  } catch (error) {
    console.error("Process refund error:", error);
    res
      .status(500)
      .json({ success: false, message: "Error processing refund" });
  }
};

// CRUD: Get all transactions (Salary, Supplier Payments, Refunds)
const getTransactions = async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (startDate && endDate) {
      filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const transactions = await FinancialTransaction.find(filter)
      .sort({ date: -1 })
      .populate("processedBy", "name")
      .populate({
        path: "relatedId",
        refPath: "type", // Note: This needs careful handling if type is not the model name
      });

    res.status(200).json({ success: true, transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// CRUD: Create Transaction
const createTransaction = async (req, res) => {
  try {
    const { type, amount, relatedId, description, date, isIncome } = req.body;
    const transaction = await FinancialTransaction.create({
      type,
      amount,
      relatedId,
      description,
      date: date || Date.now(),
      processedBy: req.user.id,
      isIncome: isIncome !== undefined ? isIncome : false,
    });

    // Update related entity balance if necessary
    if (type === "Supplier Payment") {
      await Supplier.findByIdAndUpdate(relatedId, {
        $inc: { outstandingBalance: -amount },
      });
    }

    res.status(201).json({ success: true, transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// CRUD: Update Transaction
const updateTransaction = async (req, res) => {
  try {
    const { amount, description } = req.body;
    const oldTransaction = await FinancialTransaction.findById(req.params.id);
    if (!oldTransaction) {
      return res.status(404).json({ success: false, message: "Not found" });
    }

    // INTERCEPTION: Maker-Checker for Non-Admins
    if (req.user.role !== "admin") {
      const ApprovalRequest = require('../../E1_UserAndRoleManagement/models/ApprovalRequest');

      const newRequest = await ApprovalRequest.create({
        module: "FinancialTransaction",
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

    // Handle supplier balance adjustment if amount changed
    if (oldTransaction.type === "Supplier Payment" && amount !== undefined) {
      const difference = oldTransaction.amount - amount;
      await Supplier.findByIdAndUpdate(oldTransaction.relatedId, {
        $inc: { outstandingBalance: difference },
      });
    }

    const transaction = await FinancialTransaction.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );
    res.status(200).json({ success: true, transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// CRUD: Delete Transaction
const deleteTransaction = async (req, res) => {
  try {
    const transaction = await FinancialTransaction.findById(req.params.id);
    if (!transaction)
      return res.status(404).json({ success: false, message: "Not found" });

    // Reverse balance update if Supplier Payment
    if (transaction.type === "Supplier Payment") {
      await Supplier.findByIdAndUpdate(transaction.relatedId, {
        $inc: { outstandingBalance: transaction.amount },
      });
    }

    await transaction.deleteOne();
    res.status(200).json({ success: true, message: "Deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Pay Purchase Order (E3.9 / E4.7)
const payPurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const po = await PurchaseOrder.findById(id).populate("supplier");

    if (!po) {
      return res
        .status(404)
        .json({ success: false, message: "Purchase order not found" });
    }

    if (po.status !== "Received" && po.status !== "Dispatched") {
      return res.status(400).json({
        success: false,
        message: "Can only process payments for fulfilled orders",
      });
    }

    if (po.paymentStatus === "Paid") {
      return res
        .status(400)
        .json({ success: false, message: "Order already paid" });
    }

    // Update PO status
    po.paymentStatus = "Paid";
    po.statusHistory.push({
      status: po.status,
      changedBy: req.user.id,
      notes: "Payment processed by Finance",
    });

    await po.save();

    const isCollection =
      po.supplier &&
      (po.supplier.category === "Distributor" ||
        po.supplier.category === "Bookshop");

    // Create financial transaction
    await FinancialTransaction.create({
      type: isCollection ? "Partner Collection" : "Supplier Payment",
      amount: po.totalAmount,
      relatedId: po.supplier._id,
      description: isCollection
        ? `Payment collected from ${po.supplier.name} for Order #${po.poNumber}`
        : `Payment for Purchase Order #${po.poNumber}`,
      processedBy: req.user.id,
      date: Date.now(),
      isIncome: isCollection,
    });

    // Also update supplier balance
    await Supplier.findByIdAndUpdate(po.supplier._id, {
      $inc: { outstandingBalance: -po.totalAmount },
    });

    res.status(200).json({
      success: true,
      message: "Purchase order paid successfully",
      purchaseOrder: po,
    });
  } catch (error) {
    console.error("Pay PO error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// REPORTING: Generate Financial PDF (Backend)
const generateFinancialPDF = async (req, res) => {
  try {
    // Re-fetch calculations for accuracy
    const orders = await Order.find({ paymentStatus: "Paid" });
    const transactions = await FinancialTransaction.find().sort({ date: -1 });

    const totalRevenueFromOrders = orders.reduce(
      (sum, o) => sum + (o.total || 0),
      0,
    );
    const otherIncome = transactions
      .filter((t) => t.isIncome)
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalRevenue = totalRevenueFromOrders + otherIncome;

    const totalExpenses = transactions
      .filter((t) => !t.isIncome)
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    const netIncome = totalRevenue - totalExpenses;

    const doc = new PDFDocument({ size: "A4", margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Financial_Statement_${new Date().toISOString().split("T")[0]}.pdf`,
    );

    doc.pipe(res);

    // Branding
    doc
      .fontSize(22)
      .fillColor("#1a1a1a")
      .text("METHŠARA PUBLICATIONS", { align: "center" });
    doc
      .fontSize(10)
      .fillColor("#666666")
      .text("Quality Educational Resources Since 2005", { align: "center" });
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#cccccc").stroke();
    doc.moveDown();

    // Metadata
    doc
      .fontSize(9)
      .fillColor("#333333")
      .text("Document: Official Financial Statement");
    doc.text(`Date Generated: ${new Date().toLocaleDateString()}`);
    doc.text("Generated By: Digital Finance System (Backend)");
    doc.moveDown(2);

    // Revenue Analysis
    doc.fontSize(14).text("1. Revenue Analysis");
    doc.moveDown(0.5);

    const revenueY = doc.y;
    doc.fontSize(10).fillColor("#000000");
    doc.text("Gross Revenue:", 50, revenueY);
    doc.text(`Rs. ${totalRevenue.toLocaleString()}`, 200, revenueY, {
      align: "right",
      width: 100,
    });

    doc.text("Total Orders:", 50, revenueY + 15);
    doc.text(orders.length.toString(), 200, revenueY + 15, {
      align: "right",
      width: 100,
    });

    doc.moveDown(3);

    // Expense Summary
    doc.fontSize(14).text("2. Expense Summary");
    doc.moveDown(0.5);

    const expenseCategories = [
      { label: "Staff Salaries (Base)", type: "Salary" },
      { label: "Performance Bonuses", type: "Bonus" },
      { label: "Supplier Settlements", type: "Supplier Payment" },
      { label: "Customer Refunds", type: "Refund" },
      { label: "Other Operating Expenses", type: "Other" },
    ];

    let currentY = doc.y;
    expenseCategories.forEach((cat) => {
      const amount = transactions
        .filter((t) => t.type === cat.type && !t.isIncome)
        .reduce((s, c) => s + c.amount, 0);

      doc.fontSize(10).text(cat.label, 50, currentY);
      doc.text(`Rs. ${amount.toLocaleString()}`, 200, currentY, {
        align: "right",
        width: 100,
      });
      currentY += 15;
    });

    doc.font("Helvetica-Bold").text("TOTAL EXPENDITURE", 50, currentY + 5);
    doc.text(`Rs. ${totalExpenses.toLocaleString()}`, 200, currentY + 5, {
      align: "right",
      width: 100,
    });

    // Net Summary
    doc.moveDown(3);
    const summaryY = doc.y + 30;
    doc.rect(50, summaryY, 495, 30).fill("#f5f5f5");

    doc.fillColor(netIncome >= 0 ? "#166534" : "#991b1b");
    doc.fontSize(14).text("NET PROFIT / LOSS", 70, summaryY + 10);
    doc
      .fontSize(16)
      .text(`Rs. ${netIncome.toLocaleString()}`, 400, summaryY + 8, {
        align: "right",
      });

    // Signatures
    const bottomY = 700;
    doc.strokeColor("#333333").lineWidth(1);
    doc.moveTo(80, bottomY).lineTo(230, bottomY).stroke();
    doc.moveTo(350, bottomY).lineTo(500, bottomY).stroke();

    doc.fontSize(8).fillColor("#666666");
    doc.text("Prepared By", 80, bottomY + 5, { width: 150, align: "center" });
    doc.text("Digital Finance System", 80, bottomY + 15, {
      width: 150,
      align: "center",
    });

    doc.text("Authorized By", 350, bottomY + 5, {
      width: 150,
      align: "center",
    });
    doc.text("Managing Director", 350, bottomY + 15, {
      width: 150,
      align: "center",
    });

    doc.fontSize(7).text("CONFIDENTIAL BUSINESS DOCUMENT", 0, 750, {
      align: "center",
      width: 595,
    });

    doc.end();
  } catch (error) {
    console.error("PDF Gen Error:", error);
    res.status(500).send("Error generating PDF");
  }
};

// REPORTING: Generate Financial CSV (Backend)
const generateFinancialCSV = async (req, res) => {
  try {
    const transactions = await FinancialTransaction.find()
      .sort({ date: -1 })
      .populate("processedBy", "name");

    const fields = [
      {
        label: "Date",
        value: (row) => new Date(row.date).toLocaleDateString(),
      },
      { label: "Type", value: "type" },
      {
        label: "Category",
        value: (row) => (row.isIncome ? "Income" : "Expense"),
      },
      { label: "Amount", value: "amount" },
      { label: "Description", value: "description" },
      {
        label: "Processed By",
        value: (row) => row.processedBy?.name || "System",
      },
    ];

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(transactions);

    res.header("Content-Type", "text/csv");
    res.attachment("Financial_Transactions.csv");
    res.send(csv);
  } catch (error) {
    console.error("CSV Gen Error:", error);
    res.status(500).send("Error generating CSV");
  }
};

module.exports = {
  getFinancialDashboard,
  generateInvoice,
  processRefund,
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  payPurchaseOrder,
  generateFinancialPDF,
  generateFinancialCSV,
};

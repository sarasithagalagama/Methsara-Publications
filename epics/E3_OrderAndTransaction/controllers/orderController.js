// ============================================
// Order Controller
// Epic: E3 - Order & Transaction
// Owner: IT24100191 (Jayasinghe D.B.P)
// Features: Cart, Checkout, Order Tracking
// ============================================

const Order = require("../models/Order");
const Product = require("../../E2_ProductCatalog/models/Product");
const Inventory = require("../../E5_InventoryManagement/models/Inventory");
const Coupon = require("../../E6_PromotionAndLoyalty/models/Coupon");
const GiftVoucher = require("../../E6_PromotionAndLoyalty/models/GiftVoucher");
const VoucherProduct = require("../../E6_PromotionAndLoyalty/models/VoucherProduct");
const Campaign = require("../../E6_PromotionAndLoyalty/models/Campaign");
const Location = require("../../E5_InventoryManagement/models/Location");
const Review = require("../../E2_ProductCatalog/models/Review");

// [E3.3][E3.4] createOrder: cross-epic checkout handler (imports E2 Product, E5 Inventory, E6 Coupon/GiftVoucher/Campaign)
exports.createOrder = async (req, res) => {
  try {
    const {
      items,
      deliveryAddress,
      paymentMethod,
      bankSlipUrl,
      couponCode,
      giftVoucherCode,
      fulfillmentLocation,
      taxRate, // [E3.9] VAT/tax rate from Finance Manager's Tax Configuration (stored in client localStorage)
    } = req.body;

    const appliedTaxRate = Math.max(0, parseFloat(taxRate) || 0);

    // [E5.7] Resolve fulfillment location — defaults to the branch flagged isMainWarehouse=true
    let finalLocation = fulfillmentLocation;
    if (!finalLocation) {
      const mainLoc = await Location.findOne({ isMainWarehouse: true });
      finalLocation = mainLoc ? mainLoc.name : "Main";
    }

    // Validate items and calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const itemModel = item.itemModel || "Product";
      const Model = itemModel === "VoucherProduct" ? VoucherProduct : Product;

      const product = await Model.findById(item.product);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `${itemModel === "Product" ? "Product" : "Voucher"} ${item.product} not found`,
        });
      }

      // [E5.3] Inventory check: only for Products (books) — gift voucher products skip stock validation
      if (itemModel === "Product") {
        const inventories = await Inventory.find({ product: item.product });
        let totalAvailable = 0;

        if (inventories && inventories.length > 0) {
          totalAvailable = inventories.reduce(
            (sum, inv) => sum + (inv.availableQuantity || 0),
            0,
          );
        }

        if (totalAvailable < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for ${product.title} (Available: ${totalAvailable})`,
          });
        }
      }

      // [E6.5] Apply best active campaign discount to each product at checkout time
      let finalItemPrice = product.price;
      let originalItemPrice = product.price;

      if (itemModel === "Product") {
        const pricing = await Campaign.getDiscountedPrice(product);
        finalItemPrice = pricing.discountedPrice;
        originalItemPrice = pricing.originalPrice;
      }

      orderItems.push({
        product: product._id,
        itemModel,
        productTitle: product.title || product.name,
        productISBN: product.isbn || "VOUCHER",
        quantity: item.quantity,
        price: finalItemPrice,
        originalPrice: originalItemPrice,
        subtotal: finalItemPrice * item.quantity,
      });

      subtotal += finalItemPrice * item.quantity;
    }

    // [E6.3] Apply coupon discount: validateCoupon logic inline — calculates amount via coupon.calculateDiscount
    let couponDiscount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
      if (coupon) {
        const validation = coupon.isValid();
        if (validation.valid) {
          couponDiscount = coupon.calculateDiscount(subtotal);
        }
      }
    }

    // [E3.4] Delivery fee: free shipping over LKR 2000; otherwise flat LKR 300
    const deliveryFee = subtotal > 2000 ? 0 : 300;

    // [E6.4] Apply gift voucher: deducts from balance, capped at remaining order amount
    let giftVoucherDiscount = 0;
    let appliedVoucherDoc = null;
    if (giftVoucherCode) {
      appliedVoucherDoc = await GiftVoucher.findOne({
        code: giftVoucherCode.toUpperCase(),
        isActive: true,
      });

      if (appliedVoucherDoc) {
        if (new Date() > new Date(appliedVoucherDoc.expiryDate)) {
          return res.status(400).json({
            success: false,
            message: "Gift voucher has expired",
          });
        }
        if (appliedVoucherDoc.balance <= 0) {
          return res.status(400).json({
            success: false,
            message: "Gift voucher has no remaining balance",
          });
        }

        // Calculate amount to deduct (cannot exceed remaining order total before voucher)
        const totalBeforeVoucher = subtotal - couponDiscount + deliveryFee;
        giftVoucherDiscount = Math.min(
          appliedVoucherDoc.balance,
          totalBeforeVoucher,
        );
      } else {
        return res.status(404).json({
          success: false,
          message: "Invalid gift voucher code",
        });
      }
    }

    // Create order
    const order = await Order.create({
      customer: req.user ? req.user.id : null,
      guestEmail: req.body.guestEmail,
      guestName: req.body.guestName,
      items: orderItems,
      subtotal,
      couponCode,
      couponDiscount,
      giftVoucherCode: appliedVoucherDoc ? appliedVoucherDoc.code : undefined,
      giftVoucherDiscount,
      deliveryFee,
      taxRate: appliedTaxRate,
      // taxAmount and total are recalculated by the pre-save hook
      total:
        subtotal +
        Math.round((subtotal * appliedTaxRate) / 100) -
        couponDiscount -
        giftVoucherDiscount +
        deliveryFee,
      deliveryAddress,
      paymentMethod,
      bankSlipUrl,
      fulfillmentLocation: finalLocation,
      statusHistory: [
        {
          status: "Pending",
          timestamp: Date.now(),
        },
      ],
    });

    // Deduct from Gift Voucher Balance Document
    if (appliedVoucherDoc && giftVoucherDiscount > 0) {
      appliedVoucherDoc.balance -= giftVoucherDiscount;
      appliedVoucherDoc.usageHistory.push({
        order: order._id,
        amountUsed: giftVoucherDiscount,
      });
      await appliedVoucherDoc.save();
    }

    // Deduct inventory (ONLY for physical products)
    for (const item of orderItems) {
      if (item.itemModel === "Product") {
        let remainingToDeduct = item.quantity;
        const inventories = await Inventory.find({
          product: item.product,
          availableQuantity: { $gt: 0 },
        }).sort({ availableQuantity: -1 }); // Deduct from highest stock first

        for (const inventory of inventories) {
          if (remainingToDeduct <= 0) break;

          const deductionAmount = Math.min(
            inventory.availableQuantity,
            remainingToDeduct,
          );
          inventory.deductStock(deductionAmount, "Sale");
          await inventory.save();
          remainingToDeduct -= deductionAmount;
        }

        // Increment purchase count
        await Product.findByIdAndUpdate(item.product, {
          $inc: { purchaseCount: item.quantity },
        });
      }
    }

    // Update coupon usage
    if (couponCode && couponDiscount > 0) {
      await Coupon.findOneAndUpdate(
        { code: couponCode.toUpperCase() },
        {
          $inc: { currentUsageCount: 1 },
          $push: {
            usageHistory: {
              user: req.user ? req.user.id : null,
              order: order._id,
              discountApplied: couponDiscount,
            },
          },
        },
      );
    }

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create order",
      error: error.message,
    });
  }
};

// Get User Orders (E3.6, E3.7)
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user.id })
      .populate("items.product")
      .populate("generatedVouchers")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get orders",
      error: error.message,
    });
  }
};

// Get Single Order
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("items.product")
      .populate("generatedVouchers");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check which items have already been reviewed by the user
    let itemsWithReviewStatus = order.items.map((item) => item.toObject());
    if (req.user) {
      const userReviews = await Review.find({
        user: req.user.id,
        product: { $in: order.items.map((i) => i.product?._id || i.product) },
      });

      const reviewedProductIds = userReviews.map((r) => r.product.toString());

      itemsWithReviewStatus = itemsWithReviewStatus.map((item) => ({
        ...item,
        isReviewed: reviewedProductIds.includes(
          (item.product?._id || item.product).toString(),
        ),
      }));
    }

    res.status(200).json({
      success: true,
      order: {
        ...order.toObject(),
        items: itemsWithReviewStatus,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get order",
      error: error.message,
    });
  }
};

// Update Order Status (E3.8) - Admin/Inventory Manager
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus, note } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    order.orderStatus = orderStatus;
    order.statusHistory.push({
      status: `Order ${orderStatus}`,
      timestamp: Date.now(),
      note: note || `Order status updated to ${orderStatus}`,
    });

    if (orderStatus === "Delivered") {
      order.deliveryDate = Date.now();
      // If it reaches delivered, it's effectively paid (if COD)
      if (order.paymentMethod === "COD") {
        order.paymentStatus = "Paid";
      }
    }

    // AUTOMATION: Generate Gift Vouchers if order is confirmed (Processing/Shipped/Delivered)
    const confirmationStatuses = ["Processing", "Shipped", "Delivered"];
    if (
      confirmationStatuses.includes(orderStatus) &&
      (!order.generatedVouchers || order.generatedVouchers.length === 0)
    ) {
      const createdVouchers = [];

      for (const item of order.items) {
        if (item.itemModel === "VoucherProduct") {
          // Create vouchers for each quantity unit
          for (let i = 0; i < item.quantity; i++) {
            const voucher = await GiftVoucher.create({
              value: item.price,
              balance: item.price,
              expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year default
              purchasedBy: order.customer,
              recipientEmail: order.guestEmail || "",
              recipientName: order.guestName || "",
              message: `Purchased in Order #${order._id.toString().slice(-8).toUpperCase()}`,
            });
            createdVouchers.push(voucher._id);
          }
        }
      }

      if (createdVouchers.length > 0) {
        order.generatedVouchers = createdVouchers;
        console.log(
          `✅ Automated ${createdVouchers.length} Gift Vouchers for Order #${order._id}`,
        );
      }
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update order status",
      error: error.message,
    });
  }
};

// Update Payment Status - Finance Manager/Admin
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus, note } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    order.paymentStatus = paymentStatus;
    order.statusHistory.push({
      status: `Payment ${paymentStatus}`,
      timestamp: Date.now(),
      note: note || `Payment status updated to ${paymentStatus}`,
    });

    await order.save();

    res.status(200).json({
      success: true,
      message: "Payment status updated successfully",
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update payment status",
      error: error.message,
    });
  }
};

// Get All Orders (Admin only)
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("customer", "name email")
      .populate("items.product")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get orders",
      error: error.message,
    });
  }
};

// Get Dashboard Stats (Admin only)
exports.getDashboardStats = async (req, res) => {
  try {
    // 1. Revenue Stats (Last 7 days) - Mon-Sun
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 (Sun) - 6 (Sat)
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust when day is Sunday
    const startOfWeek = new Date(today);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const revenueAggregation = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfWeek },
          // status: { $ne: 'Cancelled' }
        },
      },
      {
        $group: {
          _id: { $dayOfWeek: "$createdAt" }, // 1 (Sun) - 7 (Sat)
          totalRevenue: { $sum: "$total" },
        },
      },
    ]);

    // Initialize with 0s for Mon-Sun
    // Chart expects: Mon, Tue, Wed, Thu, Fri, Sat, Sun
    const revenueData = Array(7).fill(0);

    revenueAggregation.forEach((item) => {
      // Mongo: 1=Sun, 2=Mon... 7=Sat
      // We want: Mon(0)... Sun(6)
      const index = item._id === 1 ? 6 : item._id - 2;
      if (index >= 0 && index < 7) {
        revenueData[index] = item.totalRevenue;
      }
    });

    // 2. Sales Stats (Top Categories)
    const salesAggregation = await Order.aggregate([
      { $unwind: "$items" },
      { $match: { "items.itemModel": "Product" } }, // Only lookup categories for Products
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      {
        $group: {
          _id: "$productDetails.category",
          count: { $sum: "$items.quantity" },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    const salesLabels = salesAggregation.map(
      (item) => item._id || "Uncategorized",
    );
    const salesData = salesAggregation.map((item) => item.count);

    res.status(200).json({
      success: true,
      revenue: revenueData,
      sales: {
        labels: salesLabels,
        data: salesData,
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get dashboard stats",
      error: error.message,
    });
  }
};

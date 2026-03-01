// ============================================
// Coupon Controller
// Epic: E6 - Promotion & Loyalty
// Owner: IT24101266 (Perera M.U.E)
// Purpose: Marketing and promotions (E6.1-E6.7)
// ============================================

const Coupon = require("../models/Coupon");
const GiftVoucher = require("../models/GiftVoucher");
const Campaign = require("../models/Campaign");
const Order = require("../../E3_OrderAndTransaction/models/Order");

// [E6.1] createCoupon: marketing_manager creates coupons via simple Coupon.create (no validation needed at creation)
exports.createCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.create(req.body);

    res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      coupon,
    });
  } catch (error) {
    console.error("Create coupon error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating coupon",
      error: error.message,
    });
  }
};

// Get all coupons
exports.getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: coupons.length,
      coupons,
    });
  } catch (error) {
    console.error("Get coupons error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching coupons",
      error: error.message,
    });
  }
};

// [E6.6] validateCoupon: single-query validation checks isActive + validFrom<=now<=validUntil atomically
exports.validateCoupon = async (req, res) => {
  try {
    const { code } = req.params;

    // [E6.6] Compound query: code match + isActive + date range — if any condition fails, returns 404
    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
      validFrom: { $lte: new Date() },
      validUntil: { $gte: new Date() },
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Invalid or expired coupon",
      });
    }

    // [E6.3] Second check: usage limit (cannot be in initial query since null = unlimited)
    if (
      coupon.maxUsageCount &&
      coupon.currentUsageCount >= coupon.maxUsageCount
    ) {
      return res.status(400).json({
        success: false,
        message: "Coupon usage limit reached",
      });
    }

    res.status(200).json({
      success: true,
      coupon,
    });
  } catch (error) {
    console.error("Validate coupon error:", error);
    res.status(500).json({
      success: false,
      message: "Error validating coupon",
      error: error.message,
    });
  }
};

// Apply coupon (E6.6)
exports.applyCoupon = async (req, res) => {
  try {
    const { code, orderAmount } = req.body;

    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
      validFrom: { $lte: new Date() },
      validUntil: { $gte: new Date() },
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Invalid or expired coupon",
      });
    }

    // Check minimum order amount
    if (coupon.minPurchaseAmount && orderAmount < coupon.minPurchaseAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount of Rs.${coupon.minPurchaseAmount} required`,
      });
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discountType === "percentage") {
      discount = (orderAmount * coupon.discountValue) / 100;
      if (coupon.maxDiscount) {
        discount = Math.min(discount, coupon.maxDiscount);
      }
    } else {
      discount = coupon.discountValue;
    }

    // Increment usage count
    coupon.currentUsageCount += 1;
    await coupon.save();

    res.status(200).json({
      success: true,
      message: "Coupon applied successfully",
      discount,
      coupon,
    });
  } catch (error) {
    console.error("Apply coupon error:", error);
    res.status(500).json({
      success: false,
      message: "Error applying coupon",
      error: error.message,
    });
  }
};

// Update Coupon
exports.updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!coupon) {
      return res
        .status(404)
        .json({ success: false, message: "Coupon not found" });
    }

    res.status(200).json({
      success: true,
      message: "Coupon updated successfully",
      coupon,
    });
  } catch (error) {
    console.error("Update coupon error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating coupon",
      error: error.message,
    });
  }
};

// ============================================
// Gift Voucher Functions (E6.4)
// ============================================

// Create Gift Voucher (E6.4)
exports.createGiftVoucher = async (req, res) => {
  try {
    const { value, recipientEmail, recipientName, message, expiryDate } =
      req.body;

    const voucher = await GiftVoucher.create({
      value,
      balance: value,
      purchasedBy: req.user.id,
      recipientEmail,
      recipientName,
      message,
      expiryDate:
        expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });

    res.status(201).json({
      success: true,
      message: "Gift voucher created successfully",
      voucher,
    });
  } catch (error) {
    console.error("Create gift voucher error:", error);
    res
      .status(500)
      .json({ success: false, message: "Error creating gift voucher" });
  }
};

// Validate Gift Voucher
exports.validateGiftVoucher = async (req, res) => {
  try {
    const { code } = req.body;
    const voucher = await GiftVoucher.findOne({ code: code.toUpperCase() });

    if (
      !voucher ||
      !voucher.isActive ||
      voucher.expiryDate < Date.now() ||
      voucher.balance <= 0
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired voucher" });
    }

    res.status(200).json({
      success: true,
      voucher: {
        code: voucher.code,
        balance: voucher.balance,
        expiryDate: voucher.expiryDate,
      },
    });
  } catch (error) {
    console.error("Validate voucher error:", error);
    res
      .status(500)
      .json({ success: false, message: "Error validating voucher" });
  }
};

// ============================================
// Campaign Functions (E6.5)
// ============================================

// Create Campaign (E6.5)
exports.createCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.create({
      ...req.body,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Campaign created successfully",
      campaign,
    });
  } catch (error) {
    console.error("Create campaign error:", error);
    res
      .status(500)
      .json({ success: false, message: "Error creating campaign" });
  }
};

// Get Active Campaigns (Public for Homepage)
exports.getActivePublicCampaigns = async (req, res) => {
  try {
    const now = new Date();
    const campaigns = await Campaign.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: campaigns.length,
      campaigns,
    });
  } catch (error) {
    console.error("Get public campaigns error:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching campaigns" });
  }
};

// Get All Campaigns (Admin Dashboard)

exports.getActiveCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: campaigns.length,
      campaigns,
    });
  } catch (error) {
    console.error("Get campaigns error:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching campaigns" });
  }
};

// Update Campaign
exports.updateCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!campaign) {
      return res
        .status(404)
        .json({ success: false, message: "Campaign not found" });
    }

    res.status(200).json({
      success: true,
      message: "Campaign updated successfully",
      campaign,
    });
  } catch (error) {
    console.error("Update campaign error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating campaign",
      error: error.message,
    });
  }
};

// Delete Coupon
exports.deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res
        .status(404)
        .json({ success: false, message: "Coupon not found" });
    }

    await coupon.deleteOne();

    res.status(200).json({
      success: true,
      message: "Coupon deleted successfully",
    });
  } catch (error) {
    console.error("Delete coupon error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting coupon",
      error: error.message,
    });
  }
};

// Delete Campaign
exports.deleteCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res
        .status(404)
        .json({ success: false, message: "Campaign not found" });
    }

    await campaign.deleteOne();

    res.status(200).json({
      success: true,
      message: "Campaign deleted successfully",
    });
  } catch (error) {
    console.error("Delete campaign error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting campaign",
      error: error.message,
    });
  }
};

// Get Marketing Analytics
exports.getMarketingAnalytics = async (req, res) => {
  try {
    const [
      coupons,
      campaigns,
      giftVouchers,
      ordersWithCoupons,
      allPaidOrdersLast7Days,
    ] = await Promise.all([
      Coupon.find(),
      Campaign.find(),
      GiftVoucher.find(),
      Order.find({
        couponCode: { $ne: null },
        paymentStatus: "Paid",
      }),
      Order.find({
        orderDate: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        paymentStatus: "Paid",
      }),
    ]);

    // 1. Basic Stats
    const totalUsed = coupons.reduce(
      (acc, c) => acc + (c.currentUsageCount || 0),
      0,
    );

    // Revenue tracking: Revenue from all orders that used a coupon
    const totalRev = ordersWithCoupons.reduce(
      (acc, o) => acc + (o.total || 0),
      0,
    );

    // 2. Conversion/CTR (Aggregate from campaigns)
    const campaignsWithViews = campaigns.filter((c) => c.analytics?.views > 0);
    const avgConv =
      campaignsWithViews.length > 0
        ? (campaignsWithViews.reduce(
            (acc, c) =>
              acc + (c.analytics.conversions || 0) / c.analytics.views,
            0,
          ) /
            campaignsWithViews.length) *
          100
        : 0;
    const avgCTR =
      campaignsWithViews.length > 0
        ? (campaignsWithViews.reduce(
            (acc, c) => acc + (c.analytics.clicks || 0) / c.analytics.views,
            0,
          ) /
            campaignsWithViews.length) *
          100
        : 0;

    // 3. Weekly Revenue Trend (Last 7 Days)
    // We show attributed revenue (revenue from orders with coupons) or total store revenue?
    // Usually marketing dashboard shows "Attributed Revenue". Let's show attributed revenue in the trend.
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const now = new Date();
    const trendData = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayName = days[d.getDay()];

      const dailyTotal = allPaidOrdersLast7Days
        .filter((o) => {
          const oDate = new Date(o.orderDate).toISOString().split("T")[0];
          return oDate === dateStr && o.couponCode; // Only orders with coupons for "Marketing Revenue"
        })
        .reduce((sum, o) => sum + o.total, 0);

      trendData.push({ _id: dayName, total: dailyTotal });
    }

    // 4. Calculate Trends for Dashboard (E6.7)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const usedToday = coupons.reduce((acc, c) => {
      const todayUsages = (c.usageHistory || []).filter(
        (u) => new Date(u.usedAt) >= oneDayAgo,
      ).length;
      return acc + todayUsages;
    }, 0);

    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const endingSoon = campaigns.filter(
      (c) =>
        c.isActive &&
        new Date(c.endDate) > new Date() &&
        new Date(c.endDate) <= sevenDaysFromNow,
    ).length;

    const totalVoucherBalance = giftVouchers.reduce(
      (acc, v) => (v.isActive ? acc + v.balance : acc),
      0,
    );

    res.status(200).json({
      success: true,
      stats: {
        activeCoupons: coupons.filter((c) => c.isActive).length,
        totalUsed,
        totalRevenue: totalRev,
        conversionRate: avgConv.toFixed(1),
        ctr: avgCTR.toFixed(1),
        giftVouchers: giftVouchers.length,
        totalVoucherBalance,
        usedToday,
        endingSoon,
        revenueTrend: trendData,
      },
    });
  } catch (error) {
    console.error("Get marketing analytics error:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching analytics" });
  }
};

// ============================================
// Gift Voucher Controller
// Epic: E6 - Promotion & Loyalty
// Owner: IT24101266 (Perera M.U.E)
// Purpose: Gift voucher system (E6.4)
// ============================================

const GiftVoucher = require("../models/GiftVoucher");
const VoucherProduct = require("../models/VoucherProduct");

// @desc    Create a new manual voucher (admin/manager)
// @route   POST /api/gift-vouchers
// @access  Private (Managers)
// [E6.4] createVoucher: admin/manager manually issues a voucher with face value; balance = value at creation
exports.createVoucher = async (req, res) => {
  try {
    const { value, expiryDate, recipientEmail, recipientName, message } =
      req.body;

    const voucher = await GiftVoucher.create({
      value,
      balance: value, // Initial balance = value
      // [E6.4] Default expiry: 1 year from now if not specified by admin
      expiryDate:
        expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      purchasedBy: req.user._id, // Created by admin/manager
      recipientEmail,
      recipientName,
      message,
    });

    res.status(201).json({
      success: true,
      voucher,
    });
  } catch (error) {
    console.error("Voucher creation error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error creating voucher",
    });
  }
};

// @desc    Get all vouchers
// @route   GET /api/gift-vouchers
// @access  Private (Managers)
exports.getAllVouchers = async (req, res) => {
  try {
    const vouchers = await GiftVoucher.find().sort("-createdAt");
    res.status(200).json({
      success: true,
      count: vouchers.length,
      vouchers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching vouchers",
      error: error.message,
    });
  }
};

// [E6.4] validateVoucher: checks isActive + not expired + balance > 0; returns balance for frontend display
exports.validateVoucher = async (req, res) => {
  try {
    const { code } = req.body;

    const voucher = await GiftVoucher.findOne({ code, isActive: true });

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: "Invalid or inactive voucher code",
      });
    }

    if (new Date() > new Date(voucher.expiryDate)) {
      return res.status(400).json({
        success: false,
        message: "Voucher has expired",
      });
    }

    if (voucher.balance <= 0) {
      return res.status(400).json({
        success: false,
        message: "Voucher has no remaining balance",
      });
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
    res.status(500).json({
      success: false,
      message: "Error validating voucher",
      error: error.message,
    });
  }
};

// [E6.4] getVoucherProducts: returns the VoucherProduct catalog (gift voucher denominations for sale)
exports.getVoucherProducts = async (req, res) => {
  try {
    const products = await VoucherProduct.find({ isActive: true }).sort(
      "displayOrder",
    );
    res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching voucher products",
      error: error.message,
    });
  }
};

// @desc    Create a new voucher product for catalog
// @route   POST /api/gift-vouchers/products
// @access  Private (Admin/Marketing)
exports.createVoucherProduct = async (req, res) => {
  try {
    const product = await VoucherProduct.create(req.body);
    res.status(201).json({
      success: true,
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating voucher product",
      error: error.message,
    });
  }
};

// @desc    Update a voucher product
// @route   PUT /api/gift-vouchers/products/:id
// @access  Private (Admin/Marketing)
exports.updateVoucherProduct = async (req, res) => {
  try {
    const product = await VoucherProduct.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );
    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating voucher product",
      error: error.message,
    });
  }
};

// @desc    Delete a voucher product
// @route   DELETE /api/gift-vouchers/products/:id
// @access  Private (Admin/Marketing)
exports.deleteVoucherProduct = async (req, res) => {
  try {
    await VoucherProduct.findByIdAndDelete(req.params.id);
    res.status(200).json({
      success: true,
      message: "Catalog item deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting catalog item",
      error: error.message,
    });
  }
};

// @desc    Delete an issued voucher
// @route   DELETE /api/gift-vouchers/:id
// @access  Private (Managers)
exports.deleteVoucher = async (req, res) => {
  try {
    const voucher = await GiftVoucher.findById(req.params.id);

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: "Voucher not found",
      });
    }

    await voucher.deleteOne();

    res.status(200).json({
      success: true,
      message: "Voucher deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting voucher",
      error: error.message,
    });
  }
};

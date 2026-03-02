// ============================================
// Cart Controller
// Epic: E3 - Order & Transaction
// Owner: IT24100191 (Jayasinghe D.B.P)
// Purpose: Shopping cart operations (E3.1, E3.2)
// ============================================

const Cart = require("../models/Cart");
const Product = require("../../E2_ProductCatalog/models/Product");
const VoucherProduct = require("../../E6_PromotionAndLoyalty/models/VoucherProduct");
const Campaign = require("../../E6_PromotionAndLoyalty/models/Campaign");

// [E3.1] getCart: refreshes item prices from Campaign on every fetch to keep flash-sale prices current
exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id }).populate(
      "items.product",
    );

    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }

    // [E6.5] Re-check active campaigns on every getCart so prices reflect any new promotions
    for (let item of cart.items) {
      if (item.product && item.itemModel === "Product") {
        const pricing = await Campaign.getDiscountedPrice(item.product);
        item.price = pricing.discountedPrice;
      }
    }

    res.status(200).json({
      success: true,
      cart,
    });
  } catch (error) {
    console.error("Get cart error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching cart",
      error: error.message,
    });
  }
};

// [E3.1][E6.4] addToCart: supports both Product and VoucherProduct via itemModel discriminator
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1, itemModel = "Product" } = req.body;

    // [E6.4] Dynamically select model to query — VoucherProduct for gift vouchers, Product for books
    const Model = itemModel === "VoucherProduct" ? VoucherProduct : Product;
    const product = await Model.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `${itemModel === "Product" ? "Product" : "Voucher"} not found`,
      });
    }

    let cart = await Cart.findOne({ user: req.user.id });

    // [E6.5] Apply best campaign discount when adding to cart (price stored, refreshed on getCart)
    let finalPrice = product.price;
    if (itemModel === "Product") {
      const pricing = await Campaign.getDiscountedPrice(product);
      finalPrice = pricing.discountedPrice;
    }

    if (!cart) {
      cart = await Cart.create({
        user: req.user.id,
        items: [
          {
            product: productId,
            itemModel,
            quantity,
            price: finalPrice,
          },
        ],
      });
    } else {
      const itemIndex = cart.items.findIndex(
        (item) =>
          item.product.toString() === productId && item.itemModel === itemModel,
      );

      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += quantity;
        cart.items[itemIndex].price = finalPrice;
      } else {
        cart.items.push({
          product: productId,
          itemModel,
          quantity,
          price: finalPrice,
        });
      }
      await cart.save();
    }

    cart = await Cart.findOne({ user: req.user.id }).populate("items.product");

    res.status(200).json({
      success: true,
      message: "Item added to cart",
      cart,
    });
  } catch (error) {
    console.error("Add to cart error:", error);
    res.status(500).json({
      success: false,
      message: "Error adding to cart",
      error: error.message,
    });
  }
};

// Update cart item quantity (E3.2)
exports.updateCartItem = async (req, res) => {
  try {
    const { productId, quantity, itemModel = "Product" } = req.body;

    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const itemIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId && item.itemModel === itemModel,
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Item not in cart",
      });
    }

    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      const Model = itemModel === "VoucherProduct" ? VoucherProduct : Product;
      const product = await Model.findById(productId);

      if (product && itemModel === "Product") {
        const pricing = await Campaign.getDiscountedPrice(product);
        cart.items[itemIndex].price = pricing.discountedPrice;
      } else if (product) {
        cart.items[itemIndex].price = product.price;
      }

      cart.items[itemIndex].quantity = quantity;
    }

    await cart.save();
    await cart.populate("items.product");

    res.status(200).json({
      success: true,
      message: "Cart updated",
      cart,
    });
  } catch (error) {
    console.error("Update cart error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating cart",
      error: error.message,
    });
  }
};

// Remove item from cart (E3.2)
exports.removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const { itemModel = "Product" } = req.query; // Send via query param or handle all matches

    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    cart.items = cart.items.filter(
      (item) =>
        !(
          item.product.toString() === productId && item.itemModel === itemModel
        ),
    );
    await cart.save();
    await cart.populate("items.product");

    res.status(200).json({
      success: true,
      message: "Item removed from cart",
      cart,
    });
  } catch (error) {
    console.error("Remove from cart error:", error);
    res.status(500).json({
      success: false,
      message: "Error removing from cart",
      error: error.message,
    });
  }
};

// Clear cart
exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    cart.items = [];
    cart.discount = 0;
    cart.couponApplied = null;
    await cart.save();

    res.status(200).json({
      success: true,
      message: "Cart cleared",
      cart,
    });
  } catch (error) {
    console.error("Clear cart error:", error);
    res.status(500).json({
      success: false,
      message: "Error clearing cart",
      error: error.message,
    });
  }
};

module.exports = exports;

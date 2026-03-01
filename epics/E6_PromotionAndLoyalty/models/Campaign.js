// ============================================
// Campaign Model
// Epic: E6 - Promotion & Loyalty
// Owner: IT24101266 (Perera M.U.E)
// Purpose: Seasonal campaigns (E6.5)
// ============================================

const mongoose = require("mongoose");

const campaignSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    // [E6.5] type: campaign category displayed on the frontend banner (Back to School, Flash Sale, etc.)
    type: {
      type: String,
      enum: [
        "Seasonal",
        "Flash Sale",
        "Clearance",
        "New Arrival",
        "Back to School",
      ],
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    discountType: {
      type: String,
      enum: ["Percentage", "Fixed Amount"],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    // [E6.5] applicableProducts: empty array = applies to ALL products; otherwise specific product whitelist
    applicableProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    applicableCategories: [
      {
        type: String,
      },
    ],
    minPurchaseAmount: {
      type: Number,
      default: 0,
    },
    bannerImage: {
      type: String,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    analytics: {
      views: {
        type: Number,
        default: 0,
      },
      clicks: {
        type: Number,
        default: 0,
      },
      conversions: {
        type: Number,
        default: 0,
      },
      revenue: {
        type: Number,
        default: 0,
      },
    },
  },
  { timestamps: true },
);

// [E6.5] getDiscountedPrice: static method — finds all active campaigns and returns the BEST (highest) discount
// Empty applicableProducts/applicableCategories arrays mean the campaign applies to every product
campaignSchema.statics.getDiscountedPrice = async function (product) {
  const now = new Date();
  const activeCampaigns = await this.find({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
  });

  let bestDiscount = 0;
  let discountedPrice = product.price;

  activeCampaigns.forEach((campaign) => {
    // Check if applicable to this product
    const isProductApplicable =
      campaign.applicableProducts.length === 0 ||
      campaign.applicableProducts.some(
        (id) => id.toString() === product._id.toString(),
      );

    const isCategoryApplicable =
      campaign.applicableCategories.length === 0 ||
      campaign.applicableCategories.includes(product.category);

    if (isProductApplicable || isCategoryApplicable) {
      let currentDiscount = 0;
      if (campaign.discountType === "Percentage") {
        currentDiscount = (product.price * campaign.discountValue) / 100;
      } else {
        currentDiscount = campaign.discountValue;
      }

      if (currentDiscount > bestDiscount) {
        bestDiscount = currentDiscount;
        discountedPrice = Math.max(0, product.price - currentDiscount);
      }
    }
  });

  return {
    originalPrice: product.price,
    discountedPrice: discountedPrice,
    hasDiscount: bestDiscount > 0,
    discountAmount: bestDiscount,
  };
};

module.exports = mongoose.model("Campaign", campaignSchema);

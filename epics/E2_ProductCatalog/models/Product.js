// ============================================
// Product Model
// Epic: E2 - Product Catalog
// Owner: IT24101314 (Appuhami H A P L)
// Purpose: Educational product management
// ============================================

const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  // Basic Product Information
  title: {
    type: String,
    required: [true, "Book title is required"],
    trim: true,
  },
  titleSinhala: {
    type: String,
    trim: true,
  },
  // [E2.11] language: tracks available languages for the book (English, Sinhala, or Both)
  language: {
    type: String,
    enum: ["English", "Sinhala", "Both"],
    default: "English",
  },
  author: {
    type: String,
    required: [true, "Author name is required"],
  },
  description: {
    type: String,
    required: [true, "Product description is required"],
  },
  // [E2.1] isbn: ISBN is the unique business key for books (used in search filter E2.4)
  isbn: {
    type: String,
    required: [true, "ISBN is required"],
    unique: true,
    trim: true,
  },
  pageCount: {
    type: Number,
    default: 0,
  },

  // Pricing & Sales
  price: {
    type: Number,
    required: [true, "Price is required"],
    min: [0, "Price cannot be negative"],
  },
  // [E6.5] isFlashSale: flag used by Campaign system to highlight flash-sale items on the frontend
  isFlashSale: {
    type: Boolean,
    default: false,
  },
  displayOrder: {
    type: Number,
    default: 0,
  },

  // Categories (Educational)
  category: {
    type: String,
    default: "General",
  },
  // [E4.1] supplier: links each product back to the supplying company (E4 Supplier module)
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Supplier",
  },
  // [E2.5] grade: allows students to filter by their grade level (multi-select supported in getProducts)
  grade: {
    type: String,
    required: [true, "Grade is required"],
    enum: [
      "Grade 6",
      "Grade 7",
      "Grade 8",
      "Grade 9",
      "Grade 10",
      "Grade 11",
      "Grade 12",
      "Grade 13",
      "Other",
    ],
  },
  subject: {
    type: String,
    required: [true, "Subject is required"],
  },
  // [E2.5] examType: secondary filter alongside grade (O/L, A/L, Scholarship, etc.)
  examType: {
    type: String,
    enum: ["O/L", "A/L", "Scholarship", "General", "Other"],
    default: "General",
  },
  stock: {
    type: Number,
    default: 0,
  },

  // Images
  image: {
    type: String,
    default: "https://via.placeholder.com/300x400?text=No+Image",
  },
  backCoverImage: {
    type: String,
    default: "",
  },
  images: [
    {
      url: String,
      alt: String,
    },
  ],

  // Product Status
  isActive: {
    type: Boolean,
    default: true,
  },
  // [E2.10] isArchived: soft-delete flag — archived products are hidden from catalog but preserved for order history
  isArchived: {
    type: Boolean,
    default: false,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },

  // Reviews & Ratings
  rating: {
    type: Number,
    default: 0,
  },
  // [E2.8] reviews: embedded sub-documents store verified-purchase reviews; isVerifiedPurchase checked in reviewController
  reviews: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      rating: {
        type: Number,
        min: 1,
        max: 5,
      },
      comment: String,
      isVerifiedPurchase: Boolean,
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  averageRating: {
    type: Number,
    default: 0,
  },
  totalReviews: {
    type: Number,
    default: 0,
  },

  // Analytics
  viewCount: {
    type: Number,
    default: 0,
  },
  // [E2.7] purchaseCount: tracks total sales; used by sort='popular' option in getProducts
  purchaseCount: {
    type: Number,
    default: 0,
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// [E2.8] Pre-save: recalculates averageRating and totalReviews whenever a review is added or removed
productSchema.pre("save", function (next) {
  this.updatedAt = Date.now();

  if (this.reviews && this.reviews.length > 0) {
    const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
    this.averageRating = (sum / this.reviews.length).toFixed(1);
    this.rating = this.averageRating;
    this.totalReviews = this.reviews.length;
  }

  next();
});

module.exports = mongoose.model("Product", productSchema);

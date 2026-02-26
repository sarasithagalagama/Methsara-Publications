// ============================================
// User Model
// Epic: E1 - User & Role Management
// Owner: IT24100548 (Galagama S.T)
// Purpose: Customer and Staff account management
// ============================================

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters"],
    select: false, // Don't return password in queries by default
  },
  phone: {
    type: String,
    trim: true,
  },

  // User Type: Customer or Staff
  userType: {
    type: String,
    enum: ["customer", "staff"],
    default: "customer",
  },

  // Role-Based Access Control (RBAC)
  role: {
    type: String,
    enum: [
      "customer", // Regular customer
      "admin", // System Administrator
      "master_inventory_manager", // Master Inventory Manager (all locations)
      "location_inventory_manager", // Location-Specific Inventory Manager
      "finance_manager", // Finance Manager
      "supplier_manager", // Supplier Manager
      "marketing_manager", // Marketing Manager
      "product_manager", // Product Manager
    ],
    default: "customer",
  },

  // Location Assignment (for inventory managers)
  assignedLocation: {
    type: String,
    default: null,
  },

  // Customer-Specific Fields
  addresses: [
    {
      label: String,
      street: String,
      city: String,
      postalCode: String,
      isDefault: Boolean,
    },
  ],

  // Account Status
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  emailVerificationToken: String,
  emailVerificationExpire: Date,

  // Password Reset
  resetPasswordToken: String,
  resetPasswordExpire: Date,

  // Force password change on first login (staff only)
  mustChangePassword: {
    type: Boolean,
    default: false,
  },

  // Staff-Specific Details (Added for HR/Business Management)
  nic: {
    type: String,
    unique: true,
    sparse: true, // Sparse allows customers to have null NICs while ensuring staff NICs are unique
    trim: true,
  },
  dateOfBirth: Date,
  address: String,
  city: String,
  emergencyContactName: String,
  emergencyContactPhone: String,
  hireDate: {
    type: Date,
    default: Date.now,
  },
  salary: {
    type: Number,
    default: 0,
  },
  nicFrontImage: String,
  nicBackImage: String,
  deliveryAddresses: [
    {
      label: String, // e.g., "Home", "Office"
      street: String,
      city: String,
      postalCode: String,
      phone: String,
      isDefault: {
        type: Boolean,
        default: false,
      },
    },
  ],
  recentlyViewed: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
      viewedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],

  // Last login tracking
  lastLogin: Date,

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

// Hash password before saving
userSchema.pre("save", async function (next) {
  // Only hash if password is modified
  if (!this.isModified("password")) {
    return next();
  }

  // Hash password with bcrypt
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Update timestamp on save
userSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("User", userSchema);

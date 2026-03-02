// ============================================
// MAIN SERVER FILE
// Methsara Publications Webstore
// Group: ISP_G05
// ============================================

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
require("dotenv").config();

// Import Routes
const authRoutes = require("./epics/E1_UserAndRoleManagement/routes/authRoutes");
const productRoutes = require("./epics/E2_ProductCatalog/routes/productRoutes");
const orderRoutes = require("./epics/E3_OrderAndTransaction/routes/orderRoutes");
const cartRoutes = require("./epics/E3_OrderAndTransaction/routes/cartRoutes");
const supplierRoutes = require("./epics/E4_SupplierManagement/routes/supplierRoutes");
const purchaseOrderRoutes = require("./epics/E4_SupplierManagement/routes/purchaseOrderRoutes"); // E4: Supplier Management
const salesOrderRoutes = require("./epics/E4_SupplierManagement/routes/salesOrderRoutes"); // E4: Sales Orders (Distributors/Bookshops)
const inventoryRoutes = require("./epics/E5_InventoryManagement/routes/inventoryRoutes");
const couponRoutes = require("./epics/E6_PromotionAndLoyalty/routes/couponRoutes");
const financialRoutes = require("./epics/E3_OrderAndTransaction/routes/financialRoutes"); // E3: Financial Management
const reviewRoutes = require("./epics/E2_ProductCatalog/routes/reviewRoutes");
const uploadRoutes = require("./epics/E2_ProductCatalog/routes/uploadRoutes");
const stockTransferRoutes = require("./epics/E5_InventoryManagement/routes/stockTransferRoutes"); // E5: Stock Transfers
const locationRoutes = require("./epics/E5_InventoryManagement/routes/locationRoutes"); // E5: Locations

// Initialize Express App
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(morgan("dev")); // Logging
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Database Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB Connected Successfully");
    console.log("📦 Database:", mongoose.connection.name);
  })
  .catch((error) => {
    console.error("❌ MongoDB Connection Error:", error.message);
    process.exit(1);
  });

// API Routes
app.use("/api/auth", authRoutes); // E1: User & Role Management
app.use("/api/products", productRoutes); // E2: Product Catalog
app.use("/api/orders", orderRoutes); // E3: Orders
app.use("/api/cart", cartRoutes); // E3: Shopping Cart
app.use("/api/financial", financialRoutes); // E3: Financial Management
app.use("/api/suppliers", supplierRoutes); // E4: Supplier Management
app.use("/api/purchase-orders", purchaseOrderRoutes); // E4: Supplier Management
app.use("/api/sales-orders", salesOrderRoutes); // E4: Sales Orders (Distributors/Bookshops)
app.use("/api/inventory", inventoryRoutes); // E5: Inventory Management
app.use("/api/coupons", couponRoutes); // E6: Promotion & Loyalty
app.use("/api/reviews", reviewRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/stock-transfers", stockTransferRoutes); // E5: Stock Transfers
app.use("/api/locations", locationRoutes); // E5: Locations
app.use(
  "/api/gift-vouchers",
  require("./epics/E6_PromotionAndLoyalty/routes/giftVoucherRoutes"),
); // E6: Gift Vouchers

const approvalRoutes = require("./epics/E1_UserAndRoleManagement/routes/approvalRoutes"); // Admin Approvals
app.use("/api/approvals", approvalRoutes);

// Health Check Route
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Methsara Publications API is running",
    timestamp: new Date().toISOString(),
  });
});

// Root Route
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Methsara Publications API",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      products: "/api/products",
      orders: "/api/orders",
      suppliers: "/api/suppliers",
      inventory: "/api/inventory",
      coupons: "/api/coupons",
    },
  });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Start Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`📍 API URL: http://localhost:${PORT}`);
});

module.exports = app;

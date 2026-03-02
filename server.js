// ============================================
// MAIN SERVER FILE
// Methsara Publications Webstore
// Group: ISP_G05
// ============================================

const dns = require("dns");
// Force Node.js to use public DNS for SRV lookups.
// On Windows the default DNS server (fe80::1 IPv6 link-local) is unreachable
// from Node.js's internal resolver, causing querySrv ECONNREFUSED on
// mongodb+srv:// URIs even though the cluster is up and healthy.
dns.setServers(["8.8.8.8", "1.1.1.1"]);

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
// Retries every 5 s (up to MONGO_MAX_RETRIES) so nodemon does not enter a
// crash-loop when the Atlas cluster is temporarily unreachable.
const MONGO_RETRY_INTERVAL_MS = 5000;
const MONGO_MAX_RETRIES = 12; // ~1 minute total

async function connectWithRetry(attempt = 1) {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("[DB] MongoDB connected successfully.");
    console.log("[DB] Database:", mongoose.connection.name);
  } catch (error) {
    console.error(
      `[DB] Connection error (attempt ${attempt}/${MONGO_MAX_RETRIES}): ${error.message}`
    );
    if (attempt < MONGO_MAX_RETRIES) {
      console.log(`[DB] Retrying in ${MONGO_RETRY_INTERVAL_MS / 1000}s...`);
      setTimeout(() => connectWithRetry(attempt + 1), MONGO_RETRY_INTERVAL_MS);
    } else {
      // Do not call process.exit() here — keeps the process alive so nodemon
      // does not restart in a crash-loop. DB-dependent routes will return 500
      // until the connection is restored on the next manual restart.
      console.error(
        "[DB] Could not connect to MongoDB after maximum retries. " +
        "Verify the Atlas cluster is not paused and that the current " +
        "IP is whitelisted in Atlas > Network Access."
      );
    }
  }
}

connectWithRetry();

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
  console.log(`[Server] Running on port ${PORT}`);
  console.log(`[Server] Environment: ${process.env.NODE_ENV}`);
  console.log(`[Server] API URL: http://localhost:${PORT}`);
});

module.exports = app;

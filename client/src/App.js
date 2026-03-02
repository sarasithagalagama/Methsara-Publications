// ============================================
// Main App Component
// Epic: E1 - User & Admin Management
// Owner: IT24100548 (Galagama S.T)
// Purpose: Application routing with RBAC
// ============================================

import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Context
import { AuthProvider } from "./epics/E1_UserAndRoleManagement/context/AuthContext";

// Layouts
import CustomerLayout from "./components/Layouts/CustomerLayout";
import DashboardLayout from "./components/Layouts/DashboardLayout";

// Auth Components
import ProtectedRoute from "./epics/E1_UserAndRoleManagement/components/ProtectedRoute";
import Login from "./epics/E1_UserAndRoleManagement/pages/Login";
import Register from "./epics/E1_UserAndRoleManagement/pages/Register";
import ForgotPassword from "./epics/E1_UserAndRoleManagement/pages/ForgotPassword";
import ResetPassword from "./epics/E1_UserAndRoleManagement/pages/ResetPassword";
import ProductList from "./epics/E2_ProductCatalog/pages/ProductList";
import Cart from "./epics/E3_OrderAndTransaction/pages/Cart";
import ManageProducts from "./epics/E2_ProductCatalog/pages/ManageProducts";
import OrderHistory from "./epics/E3_OrderAndTransaction/pages/OrderHistory";
import ProductDetail from "./epics/E2_ProductCatalog/pages/ProductDetail";
import Wishlist from "./epics/E2_ProductCatalog/pages/Wishlist";
import Checkout from "./epics/E3_OrderAndTransaction/pages/Checkout";
// ReviewModeration removed (feature deprecated)
import LowStockAlerts from "./epics/E5_InventoryManagement/pages/LowStockAlerts";
import OrderDetail from "./epics/E3_OrderAndTransaction/pages/OrderDetail";

// Customer Pages
import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import GiftVouchers from "./epics/E6_PromotionAndLoyalty/pages/GiftVouchers";

// Dashboard Pages
// E1 - User & Role Management Dashboards
import CustomerDashboard from "./epics/E1_UserAndRoleManagement/pages/CustomerDashboard";
import AdminDashboard from "./epics/E1_UserAndRoleManagement/pages/AdminDashboard";
import AdminUsers from "./epics/E1_UserAndRoleManagement/pages/AdminUsers";
import AdminOrders from "./epics/E1_UserAndRoleManagement/pages/AdminOrders";
import AdminSettings from "./epics/E1_UserAndRoleManagement/pages/AdminSettings";
// E2 - Product Catalog
import ProductManagerDashboard from "./epics/E2_ProductCatalog/pages/ProductManagerDashboard";
import CategoryManager from "./epics/E2_ProductCatalog/pages/CategoryManager";
// E3 - Order & Transaction
import FinanceManagerDashboard from "./epics/E3_OrderAndTransaction/pages/FinanceManagerDashboard";
// E4 - Supplier Management
import SupplierManagerDashboard from "./epics/E4_SupplierManagement/pages/SupplierManagerDashboard";
import CreatePurchaseOrder from "./epics/E4_SupplierManagement/pages/supplier/CreatePurchaseOrder";
import PurchaseOrderList from "./epics/E4_SupplierManagement/pages/supplier/PurchaseOrderList";
import SalesOrderList from "./epics/E4_SupplierManagement/pages/supplier/SalesOrderList";
import CreateSalesOrder from "./epics/E4_SupplierManagement/pages/supplier/CreateSalesOrder";
import DebtTracker from "./epics/E4_SupplierManagement/pages/supplier/DebtTracker";
import SupplierPerformance from "./epics/E4_SupplierManagement/pages/supplier/SupplierPerformance";
import DeliverySchedule from "./epics/E4_SupplierManagement/pages/supplier/DeliverySchedule";
import SupplierList from "./epics/E4_SupplierManagement/components/Suppliers/SupplierList";
// E5 - Inventory Management
import InventoryManagerDashboard from "./epics/E5_InventoryManagement/pages/InventoryManagerDashboard";
// E6 - Promotion & Loyalty
import MarketingManagerDashboard from "./epics/E6_PromotionAndLoyalty/pages/MarketingManagerDashboard";

import "./App.css";

function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "#333",
            color: "#fff",
            borderRadius: "8px",
            fontSize: "14px",
          },
          success: {
            iconTheme: {
              primary: "#5D4037", // Dark Brown
              secondary: "#fff",
            },
          },
        }}
      />
      <Router>
        <Routes>
          {/* =========================================
              PUBLIC ROUTES (Customer Layout)
             ========================================= */}
          <Route element={<CustomerLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/books" element={<ProductList />} />
            <Route path="/books/:id" element={<ProductDetail />} />
            <Route path="/books/:id" element={<ProductDetail />} />
            <Route path="/gift-vouchers" element={<GiftVouchers />} />

            {/* Customer Routes (Within Layout) */}
            <Route
              path="/customer/dashboard"
              element={
                <ProtectedRoute allowedRoles={["customer"]}>
                  <CustomerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cart"
              element={
                <ProtectedRoute allowedRoles={["customer"]}>
                  <Cart />
                </ProtectedRoute>
              }
            />
            <Route
              path="/wishlist"
              element={
                <ProtectedRoute allowedRoles={["customer"]}>
                  <Wishlist />
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute allowedRoles={["customer"]}>
                  <Checkout />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute allowedRoles={["customer"]}>
                  <OrderHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders/:id"
              element={
                <ProtectedRoute allowedRoles={["customer"]}>
                  <OrderDetail />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* =========================================
              AUTH ROUTES (No Layout)
             ========================================= */}
          <Route
            path="/login"
            element={<Navigate to="/?login=true" replace />}
          />
          <Route
            path="/register"
            element={<Navigate to="/?register=true" replace />}
          />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* =========================================
              CUSTOMER ROUTES
             ========================================= */}

          {/* =========================================
              MANAGER DASHBOARDS (Shared Layout)
             ========================================= */}
          <Route element={<DashboardLayout />}>
            {/* ADMIN */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/products"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <ManageProducts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminSettings />
                </ProtectedRoute>
              }
            />
            {/* SUPPLIER MANAGER */}
            <Route
              path="/supplier-manager/dashboard"
              element={
                <ProtectedRoute allowedRoles={["supplier_manager", "admin"]}>
                  <SupplierManagerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/supplier-manager/purchase-orders"
              element={
                <ProtectedRoute allowedRoles={["supplier_manager", "admin"]}>
                  <PurchaseOrderList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/supplier-manager/purchase-orders/create"
              element={
                <ProtectedRoute allowedRoles={["supplier_manager", "admin"]}>
                  <CreatePurchaseOrder />
                </ProtectedRoute>
              }
            />
            <Route
              path="/supplier-manager/sales-orders"
              element={
                <ProtectedRoute allowedRoles={["supplier_manager", "admin"]}>
                  <SalesOrderList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/supplier-manager/sales-orders/create"
              element={
                <ProtectedRoute allowedRoles={["supplier_manager", "admin"]}>
                  <CreateSalesOrder />
                </ProtectedRoute>
              }
            />
            <Route
              path="/supplier-manager/debt-tracker"
              element={
                <ProtectedRoute
                  allowedRoles={[
                    "supplier_manager",
                    "admin",
                    "finance_manager",
                  ]}
                >
                  <DebtTracker />
                </ProtectedRoute>
              }
            />
            <Route
              path="/supplier-manager/suppliers"
              element={
                <ProtectedRoute allowedRoles={["supplier_manager", "admin"]}>
                  <SupplierList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/supplier-manager/performance"
              element={
                <ProtectedRoute allowedRoles={["supplier_manager", "admin"]}>
                  <SupplierPerformance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/supplier-manager/schedule"
              element={
                <ProtectedRoute allowedRoles={["supplier_manager", "admin"]}>
                  <DeliverySchedule />
                </ProtectedRoute>
              }
            />
            {/* INVENTORY MANAGER */}
            <Route
              path="/inventory-manager/dashboard"
              element={
                <ProtectedRoute
                  allowedRoles={[
                    "master_inventory_manager",
                    "location_inventory_manager",
                    "admin",
                  ]}
                >
                  <InventoryManagerDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/inventory-manager/alerts"
              element={
                <ProtectedRoute
                  allowedRoles={[
                    "master_inventory_manager",
                    "location_inventory_manager",
                    "admin",
                  ]}
                >
                  <LowStockAlerts />
                </ProtectedRoute>
              }
            />
            {/* FINANCE MANAGER */}
            <Route
              path="/finance-manager/dashboard"
              element={
                <ProtectedRoute allowedRoles={["finance_manager", "admin"]}>
                  <FinanceManagerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/finance-manager/transactions"
              element={
                <ProtectedRoute allowedRoles={["finance_manager", "admin"]}>
                  <FinanceManagerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/finance-manager/payroll"
              element={
                <ProtectedRoute allowedRoles={["finance_manager", "admin"]}>
                  <FinanceManagerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/finance-manager/reports"
              element={
                <ProtectedRoute allowedRoles={["finance_manager", "admin"]}>
                  <FinanceManagerDashboard />
                </ProtectedRoute>
              }
            />
            {/* PRODUCT MANAGER */}
            <Route
              path="/product-manager/dashboard"
              element={
                <ProtectedRoute allowedRoles={["product_manager", "admin"]}>
                  <ProductManagerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/product-manager/products"
              element={
                <ProtectedRoute allowedRoles={["product_manager", "admin"]}>
                  <ManageProducts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/product-manager/categories"
              element={
                <ProtectedRoute allowedRoles={["product_manager", "admin"]}>
                  <CategoryManager />
                </ProtectedRoute>
              }
            />
            {/* MARKETING MANAGER */}
            <Route
              path="/marketing-manager/dashboard"
              element={
                <ProtectedRoute allowedRoles={["marketing_manager", "admin"]}>
                  <MarketingManagerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/marketing-manager/campaigns"
              element={
                <ProtectedRoute allowedRoles={["marketing_manager", "admin"]}>
                  <MarketingManagerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/marketing-manager/analytics"
              element={
                <ProtectedRoute allowedRoles={["marketing_manager", "admin"]}>
                  <MarketingManagerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/marketing-manager/gift-vouchers"
              element={
                <ProtectedRoute allowedRoles={["marketing_manager", "admin"]}>
                  <MarketingManagerDashboard />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Fallback for 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

# Methsara Publications — Project Output Report
> **System:** Online Bookshop Management System  
> **Generated:** 2026-04-22  
> **Report type:** Member Output Summary (per Epic)  
> **Total Epics:** 6 | **Total Members:** 5 (+1 shared admin)

---

## Summary Table

| Epic | Area | Owner ID | Owner Name | Backend Files | Frontend Pages | Status |
|------|------|----------|------------|:---:|:---:|:------:|
| E1 | User & Role Management | IT24100548 | Galagama S.T | 5 | 8 | ✅ Complete |
| E2 | Product Catalog | IT24101314 | Appuhami H A P L | 5 | 7 | ✅ Complete |
| E3 | Orders & Transactions | IT24100191 | Jayasinghe D.B.P | 6 | 5 | ✅ Complete |
| E4 | Supplier Management | IT24100799 | Gawrawa G H Y | 6 | 8 | ✅ Complete |
| E5 | Inventory Management | IT24100264 | Bandara N W C D | 6 | 3 | ✅ Complete |
| E6 | Promotion & Loyalty | IT24101266 | Perera M.U.E | 5 | 4 | ✅ Complete |

---

## Epic E1 — User & Role Management
**Owner:** IT24100548 — Galagama S.T  
**Role served:** Admin, All Users (Auth layer)

### Backend Deliverables
| File | Type | Purpose |
|------|------|---------|
| `models/User.js` | Model | User schema: name, email, password (bcrypt), role, salary, userType, deactivation flag |
| `models/Session.js` | Model | Active session tracking per user (token, expiry) |
| `models/ApprovalRequest.js` | Model | Pending admin approval requests for account changes |
| `controllers/authController.js` | Controller | Register, login, logout, profile CRUD, JWT issuance, role-based access |
| `controllers/approvalController.js` | Controller | Approval workflow: submit, list, approve/reject |
| `middleware/auth.js` | Middleware | JWT verification + role guard middleware used across all epics |
| `routes/authRoutes.js` | Routes | `/api/auth/*` — login, register, users CRUD, password reset |
| `routes/approvalRoutes.js` | Routes | `/api/approvals/*` — request submission and admin review |

### Frontend Deliverables
| File | Purpose |
|------|---------|
| `pages/Login.jsx` | Login form with JWT-based auth and role redirect |
| `pages/Register.jsx` | Self-registration with role selection (customer / staff) |
| `pages/ForgotPassword.jsx` | Request password reset via email token |
| `pages/ResetPassword.jsx` | Consume token and set new password |
| `pages/AdminDashboard.jsx` | System-wide KPIs, user management, approval queue, system health, backup |
| `pages/AdminUsers.jsx` | Full CRUD for all users with role assignment, invite, deactivation |
| `pages/AdminSettings.jsx` | Site configuration, staff emails, system toggles |
| `pages/CustomerDashboard.jsx` | Personal profile, order history summary, loyalty points |
| `context/AuthContext.js` | Global auth context — user state, login/logout, token persistence |
| `services/authService.js` | Axios wrappers for all `/api/auth` endpoints |

### Key Features Implemented
- JWT authentication with role-based guarding (Admin, Product Manager, Finance Manager, Supplier Manager, Inventory Manager, Marketing Manager, Customer)
- Session tracking and forced logout on expiry
- Admin approval workflow for sensitive account operations
- Password reset via email token
- Staff invite system (Admin can pre-register staff accounts)
- Account deactivation & reactivation by Admin

---

## Epic E2 — Product Catalog
**Owner:** IT24101314 — Appuhami H A P L  
**Role served:** Product Manager, Customers

### Backend Deliverables
| File | Type | Purpose |
|------|------|---------|
| `models/Product.js` | Model | Book schema: title, ISBN, author, category, price, stock, images, ratings |
| `models/Category.js` | Model | Product categories with slug and description |
| `models/Review.js` | Model | Customer review with star rating, comment, product ref |
| `controllers/productController.js` | Controller | Full product CRUD, search, filter, pagination, image upload |
| `controllers/reviewController.js` | Controller | Submit, list, update, delete product reviews |
| `routes/productRoutes.js` | Routes | `/api/products/*` — public browsing + manager CRUD |
| `routes/reviewRoutes.js` | Routes | `/api/reviews/*` — review submission and retrieval |
| `routes/uploadRoutes.js` | Routes | `/api/upload` — Multer image upload handling |

### Frontend Deliverables
| File | Purpose |
|------|---------|
| `pages/ProductList.jsx` | Public browsable catalog with filters, search, sort, pagination |
| `pages/ProductDetail.jsx` | Full book detail page with reviews, add-to-cart, wishlist |
| `pages/ManageProducts.jsx` | Product Manager: create/edit/delete books with image upload |
| `pages/CategoryManager.jsx` | Create and manage categories |
| `pages/ProductManagerDashboard.jsx` | Manager KPIs, low-stock alerts, pending approvals, recent activity |
| `pages/Wishlist.jsx` | Customer wishlist — save and manage favourite books |
| `components/Products/ProductCard.jsx` | Reusable product card with price, rating, quick-add |
| `components/Products/ProductList.jsx` | Grid/list view toggle component |
| `components/Products/ProductDetail.jsx` | Detailed view component used inside detail page |

### Key Features Implemented
- Full product catalog with ISBN, author, publisher, category, tags
- Multi-image upload via Multer
- Advanced search (title, author, ISBN) with category and price filters
- Star rating & review system with moderation
- Wishlist (add, remove, move to cart)
- Product Manager dashboard with stock analytics and approval queue

---

## Epic E3 — Orders & Transactions
**Owner:** IT24100191 — Jayasinghe D.B.P  
**Role served:** Finance Manager, Customers

### Backend Deliverables
| File | Type | Purpose |
|------|------|---------|
| `models/Order.js` | Model | Customer order: items, totals, delivery address, payment method/status, coupon |
| `models/Cart.js` | Model | Persistent shopping cart with items and quantities |
| `models/FinancialTransaction.js` | Model | Internal financial entries: salary, bonus, refund, expense, income |
| `controllers/orderController.js` | Controller | Place order, update status, payment confirmation, refund processing |
| `controllers/cartController.js` | Controller | Add/remove/update cart items, merge guest cart on login |
| `controllers/financialController.js` | Controller | Financial dashboard summary, transaction CRUD, salary/bonus recording |
| `routes/orderRoutes.js` | Routes | `/api/orders/*` — full order lifecycle |
| `routes/cartRoutes.js` | Routes | `/api/cart/*` — cart management |
| `routes/financialRoutes.js` | Routes | `/api/financial/*` — transactions, refunds, payroll, dashboard KPIs |

### Frontend Deliverables
| File | Purpose |
|------|---------|
| `pages/Cart.jsx` | Shopping cart with quantity controls, coupon input, subtotal |
| `pages/Checkout.jsx` | Multi-step checkout: address, payment (card / bank transfer / COD) |
| `pages/OrderHistory.jsx` | Customer order history with status tracking |
| `pages/OrderDetail.jsx` | Detailed order view with timeline and invoice download |
| `pages/FinanceManagerDashboard.jsx` | Finance KPIs, payment confirmation, payroll, supplier payments, invoice generator |
| `components/Order/Invoice.jsx` | Printable customer order invoice |
| `components/Order/TransactionInvoice.jsx` | Printable financial transaction invoice |

### Key Features Implemented
- Full checkout flow: Cart → Address → Payment → Confirmation
- Bank transfer payment with slip upload and Finance Manager verification
- COD and card payment support
- Coupon code redemption at checkout
- Finance Manager Dashboard: revenue KPIs, net income, growth %
- Payroll management (salary & bonus recording per staff member)
- Supplier payment settlement workflow
- Manual financial transaction entry (income/expense)
- **Transaction Invoice Generator** — filter, multi-select, and batch-print invoices (popup window, no UI interference)
- Purchase Order (PO) payment approval queue
- Refund processing with audit trail

---

## Epic E4 — Supplier Management
**Owner:** IT24100799 — Gawrawa G H Y  
**Role served:** Supplier Manager

### Backend Deliverables
| File | Type | Purpose |
|------|------|---------|
| `models/Supplier.js` | Model | Supplier profile: name, category, contact, payment terms, outstanding balance |
| `models/PurchaseOrder.js` | Model | PO from business to supplier: items, amounts, status, payment tracking |
| `models/SalesOrder.js` | Model | Sales order tracking for book distributors |
| `controllers/supplierController.js` | Controller | Supplier CRUD, performance metrics, debt tracking |
| `controllers/purchaseOrderController.js` | Controller | PO creation, approval, payment request, status updates |
| `controllers/salesOrderController.js` | Controller | Sales order management, fulfilment tracking |
| `routes/supplierRoutes.js` | Routes | `/api/suppliers/*` |
| `routes/purchaseOrderRoutes.js` | Routes | `/api/purchase-orders/*` |
| `routes/salesOrderRoutes.js` | Routes | `/api/sales-orders/*` |

### Frontend Deliverables
| File | Purpose |
|------|---------|
| `pages/SupplierManagerDashboard.jsx` | Dashboard: KPIs, overdue balances, PO queue, quick actions |
| `pages/supplier/PurchaseOrderList.jsx` | List, filter, and manage all purchase orders |
| `pages/supplier/CreatePurchaseOrder.jsx` | Create new PO with item lines and supplier selection |
| `pages/supplier/SalesOrderList.jsx` | List and manage sales orders for distributors |
| `pages/supplier/CreateSalesOrder.jsx` | Create sales order with book and quantity lines |
| `pages/supplier/DebtTracker.jsx` | Real-time outstanding balance tracker per supplier |
| `pages/supplier/SupplierPerformance.jsx` | Performance analytics: on-time delivery, quality score |
| `pages/supplier/DeliverySchedule.jsx` | Upcoming delivery calendar and schedule management |
| `components/Suppliers/SupplierList.jsx` | Filterable suppliers table with inline actions |
| `components/Suppliers/SupplierFormModal.jsx` | Add/edit supplier modal form |
| `components/Suppliers/PaymentModal.jsx` | Record payment against supplier outstanding balance |

### Key Features Implemented
- Full Supplier CRUD with category (Vendor / Distributor / Bookshop) and payment terms
- Purchase Order lifecycle: Draft → Approved → Payment Requested → Paid
- PO Payment Request flow (triggers Finance Manager notification)
- Sales Order creation and fulfilment tracking
- Supplier Debt Tracker with outstanding balances
- Supplier Performance analytics (delivery rate, quality metrics)
- Delivery Schedule view per supplier

---

## Epic E5 — Inventory Management
**Owner:** IT24100264 — Bandara N W C D  
**Role served:** Inventory Manager

### Backend Deliverables
| File | Type | Purpose |
|------|------|---------|
| `models/Inventory.js` | Model | Inventory record per product+location: qty, reorder level, shelf details |
| `models/Location.js` | Model | Warehouse location/branch definition |
| `models/StockTransfer.js` | Model | Transfer request between locations with status tracking |
| `controllers/inventoryController.js` | Controller | Stock CRUD, low-stock queries, bulk adjustment, receive stock |
| `controllers/locationController.js` | Controller | Location management (add/edit/delete branches) |
| `controllers/stockTransferController.js` | Controller | Create transfer, approve, complete, reject |
| `routes/inventoryRoutes.js` | Routes | `/api/inventory/*` |
| `routes/locationRoutes.js` | Routes | `/api/locations/*` |
| `routes/stockTransferRoutes.js` | Routes | `/api/stock-transfers/*` |

### Frontend Deliverables
| File | Purpose |
|------|---------|
| `pages/InventoryManagerDashboard.jsx` | Full-featured dashboard: stock tabs, transfers, receive, alerts |
| `pages/LowStockAlerts.jsx` | Dedicated low-stock alert page with reorder actions |
| `components/Inventory/InventoryDashboard.jsx` | Embedded stock summary component with charts |
| `components/Inventory/StockAdjustmentModal.jsx` | Manual stock adjustment (add / remove / set) |

### Key Features Implemented
- Multi-location inventory tracking (warehouse, branch)
- Real-time low-stock alerts with configurable reorder thresholds
- Stock Transfer workflow: request → approve/reject → complete
- Receive Stock module (record inbound deliveries)
- Bulk stock import/export
- Inventory dashboard KPIs: total items, low stock count, pending transfers
- Stock history and adjustment audit trail

---

## Epic E6 — Promotion & Loyalty
**Owner:** IT24101266 — Perera M.U.E  
**Role served:** Marketing Manager, Customers

### Backend Deliverables
| File | Type | Purpose |
|------|------|---------|
| `models/Coupon.js` | Model | Coupon: code, discount type (%), expiry, usage limit, min order value |
| `models/Campaign.js` | Model | Marketing campaign: name, type, target audience, date range, status |
| `models/GiftVoucher.js` | Model | Gift voucher: value, code, validity, claimed status |
| `models/VoucherProduct.js` | Model | Products linked to specific voucher promotions |
| `controllers/couponController.js` | Controller | Create, validate, apply, deactivate coupons; usage tracking |
| `controllers/giftVoucherController.js` | Controller | Issue, validate, claim, and track gift vouchers |
| `routes/couponRoutes.js` | Routes | `/api/coupons/*` |
| `routes/giftVoucherRoutes.js` | Routes | `/api/gift-vouchers/*` |

### Frontend Deliverables
| File | Purpose |
|------|---------|
| `pages/MarketingManagerDashboard.jsx` | Dashboard: campaign stats, coupon performance, voucher overview |
| `pages/marketing/GiftVoucherManagement.jsx` | Create and manage gift vouchers with product linking |
| `pages/GiftVouchers.jsx` | Customer-facing gift voucher redemption page |
| `components/Coupons/CouponList.jsx` | Coupon management table with activate/deactivate toggle |

### Key Features Implemented
- Coupon code system: percentage and flat discounts, expiry and usage caps
- Marketing campaign creation with target audience and date scheduling
- Gift Voucher issuance and customer redemption
- Coupon validation at checkout (E3 integration)
- Marketing dashboard KPIs: active campaigns, coupon usage rate, voucher distribution
- Campaign performance analytics

---

## Cross-Epic Integration Points

| Integration | Epics | Description |
|------------|-------|-------------|
| Auth middleware | E1 → All | JWT guard used on all protected routes across all 5 other epics |
| Stock deduction on order | E3 ↔ E5 | Placing an order reduces inventory count in E5 |
| Coupon validation at checkout | E6 → E3 | Coupon codes created in E6 are validated and applied in E3 checkout |
| PO payment request | E4 → E3 | Supplier Manager requests payment; Finance Manager approves in E3 dashboard |
| Supplier in finance settlement | E4 → E3 | Supplier list (E4) used in Finance Manager account settlement (E3) |
| Low stock alert to product manager | E5 → E2 | Low inventory triggers alerts visible in Product Manager dashboard |
| Staff payroll | E1 → E3 | Staff user records (E1) drive payroll management in Finance Manager (E3) |

---

## Shared Infrastructure

| Component | Location | Purpose |
|-----------|----------|---------|
| `server.js` | Root | Express app bootstrap, route mounting, CORS, middleware wiring |
| `DashboardHeader` | `client/src/components/dashboard/` | Shared header across all 5 manager dashboards |
| `StatCard` | `client/src/components/dashboard/` | Reusable KPI metric card |
| `PriorityAlert` | `client/src/components/dashboard/` | Cross-dashboard urgent action banner |
| `Modal / ConfirmModal` | `client/src/components/common/` | Reusable modal dialogs |
| `Forms (Input, Select, Button)` | `client/src/components/common/` | Design-system form components |
| `RevenueChart / SalesChart` | `client/src/components/dashboard/charts/` | Chart.js wrappers for analytics |
| `dashboard.css` | `client/src/components/dashboard/` | Shared CSS design tokens and layout classes |

---

## File Count Summary

| Epic | Backend Files | Frontend Files | Total |
|------|:---:|:---:|:---:|
| E1 — User & Role Management | 8 | 10 | **18** |
| E2 — Product Catalog | 8 | 9 | **17** |
| E3 — Orders & Transactions | 9 | 7 | **16** |
| E4 — Supplier Management | 9 | 11 | **20** |
| E5 — Inventory Management | 9 | 4 | **13** |
| E6 — Promotion & Loyalty | 8 | 4 | **12** |
| **Total** | **51** | **45** | **96** |

---

*Report generated by Antigravity — 2026-04-22*  
*File: `docs/reports/project_outputs_report.md`*

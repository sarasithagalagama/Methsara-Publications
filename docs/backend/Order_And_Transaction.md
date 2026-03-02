# E3 – Order & Transaction

**Epic Owner:** IT24100191 – Jayasinghe D.B.P  
**Stack:** Node.js · Express · Mongoose · MongoDB · PDFKit / csv-writer  
**Base URL:** `/api/orders` · `/api/cart` · `/api/financial`

---

## 1. Folder Structure

```
E3_OrderAndTransaction/
├── controllers/
│   ├── orderController.js      – Order lifecycle (create, update status/payment)
│   ├── cartController.js       – Shopping cart management
│   └── financialController.js  – Financial dashboard, transactions, reports
├── middleware/
│   └── (uses E1 auth middleware)
├── models/
│   ├── Order.js                – Order schema (guest + auth, dual discounts)
│   ├── Cart.js                 – Cart schema with auto-calculated total
│   └── FinancialTransaction.js – Income/expense ledger
└── routes/
    ├── orderRoutes.js
    ├── cartRoutes.js
    └── financialRoutes.js
```

---

## 2. How the Backend / API Works

### Order Creation Cross-Epic Flow

```
POST /api/orders
       │
       ▼
  orderController.createOrder()
       │
       ├──► E6: validate coupon / gift voucher → compute discounts
       │
       ├──► E2: verify products exist, get current price
       │
       ├──► E5: deduct stock (reservedStock++ / availableStock--)
       │
       ├──► Create Order document in MongoDB
       │
       ├──► Create FinancialTransaction (income) automatically
       │
       └──► Return { order, totalAfterDiscount, savingsAmount }
```

This is the most complex function in the project — a single order creation touches **4 epics** (E2 products, E3 order/financial, E5 inventory, E6 promotions).

### Cart Flow

```
Customer browses → addToCart → Cart.items[] updated
Customer views cart → getCart() recalculates all prices from
                       current Product documents (live price sync)
Customer checks out → createOrder() → Cart cleared
```

---

## 3. All Functions

### `orderController.js`

| Function | Purpose | Auth |
|---|---|---|
| `createOrder(req, res)` | Full order creation: validates cart items, applies coupon/voucher/campaign discounts, deducts inventory (E5), creates Order + FinancialTransaction, clears cart. Supports guest checkout. | Optional (guest or logged-in) |
| `getMyOrders(req, res)` | Returns all orders for the logged-in customer, paginated, sorted newest first. | Customer |
| `getOrder(req, res)` | Get single order by ID. Customers can only view their own orders; managers see any. | Yes |
| `getAllOrders(req, res)` | Admin/manager view of all orders with filters (status, date range, payment method) and pagination. | Admin / Finance / Inventory / Product Mgr |
| `updateOrderStatus(req, res)` | Change order lifecycle status (pending → processing → shipped → delivered). Validates status transition. | Admin / Inventory Mgr / Product Mgr |
| `updatePaymentStatus(req, res)` | Change payment status (pending → paid → refunded). Updates associated FinancialTransaction. | Admin / Finance Mgr |
| `getDashboardStats(req, res)` | Returns aggregate stats: total orders, revenue today/week/month, orders by status. | Admin |

### `cartController.js`

| Function | Purpose | Auth |
|---|---|---|
| `getCart(req, res)` | Fetch cart for logged-in user. For each item, re-fetches current price from Product collection (prevents stale prices). Recalculates cart total. | Yes |
| `addToCart(req, res)` | Add a product to cart. If product already in cart, increments quantity. Validates product exists and has sufficient stock before adding. | Yes |
| `updateCartItem(req, res)` | Change the quantity of a cart item. If quantity set to 0, removes the item. Validates stock availability. | Yes |
| `removeFromCart(req, res)` | Remove a specific product from cart by productId. | Yes |
| `clearCart(req, res)` | Removes all items from cart. Called automatically after successful order creation. | Yes |

### `financialController.js`

| Function | Purpose | Auth |
|---|---|---|
| `getFinancialDashboard(req, res)` | Returns KPIs: total revenue (Orders + FinancialTransactions), total expenses, net income, daily revenue trend (last 30 days), growth % vs prior 30 days. | Finance Mgr / Admin |
| `getTransactions(req, res)` | Filterable list of all non-archived FinancialTransaction records (filter: type, date range). | Finance Mgr / Admin |
| `getTransaction(req, res)` | Get a single FinancialTransaction by ID. | Finance Mgr / Admin |
| `createTransaction(req, res)` | Manually create a transaction (e.g., Salary, Other expense). For type "Supplier Payment" also decrements supplier `outstandingBalance`. | Finance Mgr / Admin |
| `updateTransaction(req, res)` | Edit a transaction. Non-admin edits route through maker-checker (ApprovalRequest). Admin edits applied immediately. Adjusts supplier balance if Supplier Payment amount changed. | Finance Mgr / Admin |
| `archiveTransaction(req, res)` | Soft-archive a transaction (`isArchived: true`). Record is preserved in DB but hidden from all views. | Finance Mgr / Admin |
| `generateInvoice(req, res)` | Generate invoice data for a specific order. Returns structured JSON (invoice number, customer, items, totals). | Finance Mgr / Admin |
| `processRefund(req, res)` | Mark an order as "Refunded", create a `Refund` FinancialTransaction (isIncome: false), update order status. | Finance Mgr / Admin |
| `generateFinancialPDF(req, res)` | Export full financial statement as PDF (PDFKit). Aggregates revenue from Orders + FinancialTransactions, expenses categorized by type. | Finance Mgr / Admin |
| `generateFinancialCSV(req, res)` | Export all FinancialTransaction records as CSV file (json2csv). | Finance Mgr / Admin |
| `payPurchaseOrder(req, res)` | Mark a received vendor PO as paid. Creates a "Supplier Payment" FinancialTransaction (isIncome: false). Reduces vendor `outstandingBalance` and updates `totalPaid`. | Finance Mgr / Admin |

---

## 4. CRUD API Endpoints

### Order Routes — `/api/orders`

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/` | Optional | Any / Guest | Create order |
| GET | `/my-orders` | Yes | Customer | My orders list |
| GET | `/stats` | Yes | Admin | Dashboard stats |
| GET | `/:id` | Yes | Any | Single order |
| GET | `/` | Yes | Admin / Finance / Inventory / Product Mgr | All orders |
| PUT | `/:id/status` | Yes | Admin / Inventory / Product Mgr | Update order status |
| PUT | `/:id/payment` | Yes | Admin / Finance Mgr | Update payment status |

### Cart Routes — `/api/cart`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | Yes | Get cart with live prices |
| POST | `/add` | Yes | Add item to cart |
| PUT | `/update` | Yes | Update item quantity |
| DELETE | `/remove/:productId` | Yes | Remove item from cart |
| DELETE | `/clear` | Yes | Clear entire cart |

### Financial Routes — `/api/financial`

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/dashboard` | Yes | Finance Mgr / Admin | KPIs and daily trend chart |
| GET | `/invoices/:orderId` | Yes | Finance Mgr / Admin | Generate invoice JSON |
| GET | `/reports/pdf` | Yes | Finance Mgr / Admin | Download PDF financial statement |
| GET | `/reports/csv` | Yes | Finance Mgr / Admin | Download CSV of all transactions |
| POST | `/refunds/:orderId` | Yes | Finance Mgr / Admin | Process refund (marks order as Refunded) |
| GET | `/transactions` | Yes | Finance Mgr / Admin | All non-archived transactions |
| GET | `/transactions/:id` | Yes | Finance Mgr / Admin | Single transaction by ID |
| POST | `/transactions` | Yes | Finance Mgr / Admin | Create manual transaction |
| PUT | `/transactions/:id` | Yes | Finance Mgr / Admin | Update transaction (non-admins: maker-checker) |
| PATCH | `/transactions/:id/archive` | Yes | Finance Mgr / Admin | Soft-archive transaction (hidden, not deleted) |
| PUT | `/purchase-orders/:id/pay` | Yes | Finance Mgr / Admin | Pay PO — creates FinancialTransaction + reduces vendor balance |

---

## 5. Database — How It Works & Where Data Is Saved

### MongoDB Collections

#### `orders` (model: `Order.js`)
```
{
  _id: ObjectId,
  orderNumber: String (auto-generated, e.g., ORD-241215-001),
  user: ObjectId (ref: User) | null    ← null for guest checkout
  guestInfo: { name, email, phone }    ← populated for guest checkout
  items: [{
    product: ObjectId (ref: Product),
    productType: String (refPath discriminator: 'Product' or 'VoucherProduct'),
    title: String (snapshot at order time),
    price: Number (snapshot at order time),
    quantity: Number,
    discount: Number
  }],
  subtotal: Number,
  couponDiscount: Number,
  voucherDiscount: Number,
  campaignDiscount: Number,
  totalAmount: Number,
  couponCode: String,
  giftVoucherCode: String,
  status: String (enum: pending | processing | shipped | delivered | cancelled),
  paymentMethod: String (enum: cash | card | online),
  paymentStatus: String (enum: pending | paid | refunded),
  shippingAddress: { street, city, state, zipCode, country },
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

**Price Snapshot:** Item prices are copied into the order at creation time. Even if the product price changes later, the order record preserves the price that was actually charged.

**refPath Polymorphism:** `items.productType` tells Mongoose which collection to use when populating `items.product`. This allows both `Product` and `VoucherProduct` items in the same order.

**Guest Checkout:** If `optionalProtect` finds no JWT, `req.user` is null. The order is created with `user: null` and `guestInfo` populated from the request body.

#### `carts` (model: `Cart.js`)
```
{
  _id: ObjectId,
  user: ObjectId (ref: User, unique),  ← one cart per user
  items: [{
    product: ObjectId,
    productType: String (refPath),
    quantity: Number,
    price: Number (cached, refreshed on getCart)
  }],
  total: Number,
  updatedAt: Date
}
```

**Pre-save hook:** Before save, the total is recalculated as `sum(item.price * item.quantity)` for all items.

**Price Refresh:** `getCart` re-fetches each product's current price from `Product` collection before returning the cart. This prevents a customer from viewing a stale price in their cart if a product's price was changed.

#### `financialtransactions` (model: `FinancialTransaction.js`)
```
{
  _id: ObjectId,
  type: String (enum: "Salary" | "Supplier Payment" | "Refund" | "Bonus" | "Customer Collection" | "Other"),
  description: String,
  amount: Number (required),
  isIncome: Boolean  ← true=revenue (e.g. Customer Collection), false=expense (Supplier Payment, Salary, Refund)
  relatedId: ObjectId  ← SupplierID (Supplier Payment/Customer Collection), OrderID (Refund), UserID (Salary)
  status: String (enum: "Pending" | "Completed" | "Failed" | "Cancelled", default: "Completed"),
  processedBy: ObjectId (ref: User, required),
  date: Date (default: Date.now),
  isArchived: Boolean (default: false)  ← soft-delete; archived records are preserved in DB but hidden from views
  createdAt: Date,
  updatedAt: Date
}
```

**Transaction Types:**
| Type | isIncome | Auto-created by | When |
|---|---|---|---|
| `Supplier Payment` | false (expense) | E3 `payPurchaseOrder` or E4 `recordPaymentToVendor` | Finance Manager pays a vendor PO or records manual vendor payment |
| `Customer Collection` | true (income) | E4 `recordPaymentForSO` or `recordPaymentFromCustomer` | Customer pays for a Sales Order or direct collection recorded |
| `Refund` | false (expense) | E3 `processRefund` | Finance Manager processes an order refund |
| `Salary` | false (expense) | Finance Manager manual | Payroll entries |
| `Bonus` | false (expense) | Finance Manager manual | Performance bonus entries |
| `Other` | either | Finance Manager manual | Miscellaneous income or expense |

**Relationships:**
- `orders.user` → `users` (E1)
- `orders.items.product` → `products` (E2) or `voucherproducts` (E6)
- `carts.user` → `users` (E1)
- `financialtransactions.relatedId` → `users` (Salary), `suppliers` (E4 Supplier Payment/Customer Collection), `orders` (Refund)

**Indexes:**
- `cart.user` — unique index (one cart per user)
- `orders.orderNumber` — unique index
- `financialtransactions.date` — for fast date-range queries on financial dashboard

---

## 6. Validations Used

### Mongoose Schema (Order.js)
```javascript
status: { enum: ['pending','processing','shipped','delivered','cancelled'] }
paymentStatus: { enum: ['pending','paid','refunded'] }
paymentMethod: { enum: ['cash','card','online'] }
totalAmount: { required: true, min: 0 }
items: { required: true }  // minimum 1 item validated in controller
```

### Mongoose Schema (FinancialTransaction.js)
```javascript
amount: { required: true }
type:   { enum: ['Salary','Supplier Payment','Refund','Bonus','Customer Collection','Other'], required: true }
status: { enum: ['Pending','Completed','Failed','Cancelled'], default: 'Completed' }
processedBy: { required: true, ref: 'User' }
```

### Controller-Level Validations (orderController.js)
- **createOrder:** verifies each `productId` exists in DB and is not archived
- **createOrder:** checks each product's stock ≥ requested quantity (E5 sync)
- **createOrder:** validates coupon code via E6 `validateCoupon` logic (not expired, usage limit not reached, minimum order met)
- **createOrder:** validates gift voucher via E6 `validateVoucher` logic (active, sufficient balance)
- **updateOrderStatus:** prevents invalid status transitions (e.g., cannot go from `delivered` back to `pending`)

### Controller-Level Validations (cartController.js)
- **addToCart:** checks `Product.stock >= quantity` before adding
- **updateCartItem:** checks stock availability for new quantity

---

## 7. User Stories

| # | As a… | I want to… | So that… |
|---|---|---|---|
| US-3.1 | Customer | Add products to my shopping cart | I can continue browsing and purchase multiple items at once |
| US-3.2 | Customer | See live prices in my cart (refreshed from current product prices) | I always see the accurate price even if it changed since I added the item |
| US-3.3 | Customer | Place an order from my cart with my delivery address and payment method | I can complete my purchase and receive the books I need |
| US-3.4 | Guest | Place an order without creating an account | I can make a quick purchase without registration |
| US-3.5 | Customer | Apply a coupon code or gift voucher at checkout | I can use my discount or credit to reduce the total I pay |
| US-3.6 | Customer | View my full order history with status updates | I can track what I ordered and whether it has been shipped or delivered |
| US-3.7 | Customer | View a single order's details, items, and pricing breakdown | I can verify what was charged and what discounts were applied |
| US-3.8 | Admin | View all orders with filters by status, date, and payment method | I can monitor the store's sales activity and quickly find specific orders |
| US-3.9 | Admin / Inventory Manager | Update an order's delivery status (pending → processing → shipped → delivered) | Customers receive accurate delivery updates |
| US-3.10 | Finance Manager | Update an order's payment status (pending → paid → refunded) | The financial ledger reflects the actual payment state |
| US-3.11 | Finance Manager | View the financial dashboard with revenue KPIs and charts | I can monitor daily/weekly/monthly revenue, expenses, and net profit |
| US-3.12 | Finance Manager | Export transactions as a PDF or CSV report for a date range | I can provide financial summaries to management and for audits |
| US-3.13 | Finance Manager | Process a refund on a completed order | The customer's payment is reversed and the ledger is updated automatically |
| US-3.14 | Finance Manager | Manually log an expense transaction (rent, utilities, salaries) | All business costs are captured in the financial ledger |
| US-3.15 | Finance Manager | Generate and download a PDF invoice for any order | I can send official invoices to customers or bulk buyers |

---

## 8. Frontend Implementation

### Component Map

| Page / Component | File Path | What It Does |
|---|---|---|
| Cart Page | `client/src/epics/E3_OrderAndTransaction/pages/Cart.jsx` | Displays cart items with live prices; quantity controls; remove buttons; displays subtotal |
| Checkout Page | `client/src/epics/E3_OrderAndTransaction/pages/Checkout.jsx` | Delivery address form; payment method selector; coupon/voucher code input; order total breakdown; Place Order button |
| Order Confirmation | `client/src/epics/E3_OrderAndTransaction/pages/OrderConfirmation.jsx` | Success screen showing order number, items, total, and estimated delivery |
| My Orders Page | `client/src/epics/E3_OrderAndTransaction/pages/MyOrders.jsx` | Customer's order list sorted by date; status badges; link to order detail |
| Order Detail Page | `client/src/epics/E3_OrderAndTransaction/pages/OrderDetail.jsx` | Full order breakdown: items, individual discounts, coupon/voucher applied, final total, status timeline |
| Admin Orders Table | `client/src/epics/E3_OrderAndTransaction/pages/AllOrders.jsx` | Paginated table with status/date/payment filters; inline status update dropdowns |
| Financial Dashboard | `client/src/epics/E3_OrderAndTransaction/pages/FinancialDashboard.jsx` | KPI cards (revenue, expenses, net profit); daily revenue chart; top-selling products by revenue |
| Transactions Table | `client/src/epics/E3_OrderAndTransaction/pages/Transactions.jsx` | Filterable, paginated list of all `FinancialTransaction` records; manual entry form |
| Reports Page | `client/src/epics/E3_OrderAndTransaction/pages/Reports.jsx` | Date-range picker; Download PDF / Download CSV buttons; triggers report generation endpoints |
| Cart Icon (Navbar) | `client/src/components/common/CartIcon.jsx` | Shows item count badge; updates in real-time when items are added/removed |

### Data Flow — Add to Cart → Checkout → Order

```
1. Customer clicks "Add to Cart" on ProductDetail
         │
         ▼
   POST /api/cart/add  { productId, quantity }
   Server: validates stock, adds/increments item
         │
         ▼
2. Customer views Cart page
   GET /api/cart
   Server: re-fetches current product prices, recalculates total
         │
         ▼
3. Customer enters address, selects payment, applies coupon
   Frontend calls POST /api/coupons/validate (preview only)
         │
         ▼
4. Customer clicks "Place Order"
   POST /api/orders { shippingAddress, paymentMethod, couponCode, giftVoucherCode }
         │
         ▼
   createOrder():
     ├── validates each product (exists, not archived)
     ├── checks stock (E5 inventory)
     ├── applies campaign discount per item
     ├── validates + applies coupon (E6) → increments usageCount
     ├── validates + deducts gift voucher balance (E6)
     ├── decrements inventory (E5: reservedStock++)
     ├── creates Order document
     ├── creates FinancialTransaction (type: 'order', isIncome: true)
     └── clears Cart
         │
         ▼
5. Response: { order, orderNumber, totalAmount }
   Frontend redirects to /order-confirmation/:orderNumber
```

### Data Flow — Financial Report Generation

```
Finance Manager selects date range on Reports page
         │
         ▼
Click "Download PDF"
   GET /api/financial/reports/pdf?startDate=...&endDate=...
         │
         ▼
Server queries FinancialTransaction collection for date range
Generates PDF using PDFKit
Sets headers: Content-Type: application/pdf, Content-Disposition: attachment
         │
         ▼
Browser triggers file download
```

### Guest Checkout Flow

```
Guest visits site (no JWT in localStorage)
         │
         ▼
Checkout page: shows extra fields (name, email, phone)
         │
         ▼
POST /api/orders { guestInfo: { name, email, phone }, items, ... }
  (optionalProtect middleware: req.user = null, no error)
         │
         ▼
Order created with user: null, guestInfo populated
Guest can track order by email reference
```

### Financial Transaction Auto-Creation

Every time an order is successfully placed, a `FinancialTransaction` is automatically created — **no finance manager action needed**:
```javascript
// Inside createOrder() after Order.save():
await FinancialTransaction.create({
  type: "order",
  isIncome: true,
  amount: order.totalAmount,
  referenceId: order._id,
  referenceModel: "Order",
  description: `Order ${order.orderNumber}`,
  date: new Date()
});
```
This keeps the financial ledger always in sync with sales without manual data entry.

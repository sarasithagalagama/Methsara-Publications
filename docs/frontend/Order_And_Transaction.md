# E3 – Order & Transaction (Frontend)

**Epic Owner:** IT24100191 – Jayasinghe D.B.P  
**Stack:** React · Axios · React Router  
**Consumes API:** `/api/orders` · `/api/cart` · `/api/financial`

---

## 1. Folder Structure

```
E3_OrderAndTransaction/
├── components/
│   ├── Order/
│   │   ├── Invoice.jsx          – Printable invoice layout for a single order
│   │   └── Invoice.css
│   └── Orders/
│       ├── Cart.jsx             – Cart sidebar / embedded cart component
│       ├── Checkout.jsx         – Multi-step checkout form component
│       ├── OrderList.jsx        – Reusable order table (used in history + admin)
│       └── Orders.css
├── pages/
│   ├── Cart.jsx                 – /cart page (full-page cart view)
│   ├── Cart.css
│   ├── Checkout.jsx             – /checkout page
│   ├── Checkout.css
│   ├── OrderDetail.jsx          – /orders/:id detail view
│   ├── OrderDetail.css
│   ├── OrderHistory.jsx         – /orders – customer's order history
│   ├── OrderHistory.css
│   ├── FinanceManagerDashboard.jsx  – Finance manager landing page + revenue KPIs
│   └── FinanceManagerDashboard.css
└── services/
    └── orderService.js          – Axios calls for orders, cart, and financial endpoints
```

---

## 2. How the Frontend Works

### Shopping Flow

```
Customer adds product to cart
        │
        ▼
orderService.addToCart()  →  POST /api/cart (backend persists cart)
        │
        ▼
Customer visits /cart  →  Cart.jsx page
        │
orderService.getCart()  →  GET /api/cart
        │
  Renders item list with live-synced prices from backend
        │
  "Proceed to Checkout" button
        │
        ▼
/checkout  →  Checkout.jsx page
        │
  ① Delivery address form
  ② Payment method (COD / Bank Transfer)
  ③ Coupon code input  →  couponService.validateCoupon()
  ④ "Place Order" → orderService.createOrder()
        │
        ▼
POST /api/orders  (touches E2, E5, E6 on backend)
        │
        ▼
Redirect to /orders/:id  →  OrderDetail.jsx
```

### Finance Manager Flow

```
Finance Manager logs in → /finance/dashboard
        │
        ▼
FinanceManagerDashboard.jsx
        │
  KPI cards: Revenue, Expenses, Net Income, Daily trend chart
        │
  Table: all recent orders + payment status toggles
        │
  Table: FinancialTransactions (income, expenses, supplier payments)
```

---

## 3. All Components & Pages

### `components/Order/Invoice.jsx`

Printable invoice layout. Receives an order object as prop and renders a formatted A4-style invoice with company header, order items table, totals, and payment info. Triggered from `OrderDetail.jsx` via a "Print Invoice" button. Generates invoices using a dedicated popup window approach to print only the transaction data without the surrounding page UI.

---

### `components/Orders/Cart.jsx`

Cart component (used both as a sidebar drawer and on the full `/cart` page). Shows items with quantity stepper, remove button, and real-time subtotal. Delegates to `orderService`.

---

### `components/Orders/Checkout.jsx`

Multi-step checkout form component:
1. Delivery address (pre-filled from user profile if logged in)
2. Payment method selection
3. Coupon / gift voucher code entry with live validation
4. Order summary and "Place Order" button

---

### `components/Orders/OrderList.jsx`

Reusable table component that renders a list of orders with columns: order ID, date, status badge, payment status, total. Accepts `orders` array and optional `onStatusChange` callback. Used in both customer order history and admin/finance tables.

---

### `pages/Cart.jsx`

Full-page cart at `/cart`. Renders the `Cart` component with full-width layout. Includes cart total, coupon field, and checkout CTA button.

---

### `pages/Checkout.jsx`

Checkout page at `/checkout`. Renders the `Checkout` component. On successful order creation, clears cart and navigates to the new order's detail page.

---

### `pages/OrderDetail.jsx`

Order detail page at `/orders/:id`. Shows full order breakdown: items, quantities, applied discounts, delivery address, payment status, order status timeline, and "Print Invoice" button.

---

### `pages/OrderHistory.jsx`

Customer's order history at `/orders`. Lists all orders for the logged-in user sorted newest-first. Each row links to `/orders/:id`. Includes status filter tabs (All, Pending, Shipped, Delivered).

---

### `pages/FinanceManagerDashboard.jsx`

Finance manager home at `/finance/dashboard`. Displays:
- Revenue KPI cards (today, this week, this month)
- Net income (revenue minus expenses)
- Daily revenue trend (line chart – last 30 days)
- Transactions management table with search, pagination, and archive/edit actions
- Order table with payment status update controls
- Consolidated action sections for streamlined workflow

---

## 4. Service Methods

### `services/orderService.js`

| Method | API Call | Purpose |
|---|---|---|
| `createOrder(data)` | `POST /api/orders` | Place order; includes items, address, payment method, coupon. |
| `getMyOrders()` | `GET /api/orders/my-orders` | Customer: fetch own order history. |
| `getOrder(id)` | `GET /api/orders/:id` | Fetch single order detail. |
| `getAllOrders()` | `GET /api/orders` | Admin / Finance: fetch all orders. |
| `updateOrderStatus(id, data)` | `PUT /api/orders/:id/status` | Change order lifecycle status. |
| `updatePaymentStatus(id, data)` | `PUT /api/orders/:id/payment` | Mark order as paid / refunded. |
| `getCart()` | `GET /api/cart` | Fetch customer's current cart (live price sync). |
| `addToCart(data)` | `POST /api/cart` | Add product to cart. |
| `updateCartItem(productId, data)` | `PUT /api/cart/:productId` | Change item quantity. |
| `removeFromCart(productId)` | `DELETE /api/cart/:productId` | Remove item from cart. |
| `clearCart()` | `DELETE /api/cart` | Empty the cart. |
| `getFinancialDashboard()` | `GET /api/financial/dashboard` | KPIs for finance manager. |
| `getTransactions(filters)` | `GET /api/financial/transactions` | Filtered transaction list. |
| `createTransaction(data)` | `POST /api/financial/transactions` | Manual expense/income entry. |
| `updateTransaction(id, data)` | `PUT /api/financial/transactions/:id` | Edit a transaction. |
| `archiveTransaction(id)` | `PUT /api/financial/transactions/:id/archive` | Soft-archive a transaction. |


---

## 📌 Viva Preparation: Where are the Validations?

For your final viva, the examiners will likely ask: **"Where is your validation code? Show us in the codebase."**

Here is exactly where to look for the **Frontend** validations:

### 1. Component State Validations (React State)
Before any form is submitted to the backend, we validate the user input directly in the React components to provide immediate feedback and reduce server load.
*   **Where to find it:** Open `client/src/epics/E[Number]_[EpicName]/components/[ComponentName].jsx` or `pages/[PageName].jsx`
*   **What to show:** Show the `handleSubmit` or `onSubmit` functions. Point out the `if (formData.password !== formData.confirmPassword)` or `if (formData.phone.length < 10)` statements. Explain how we use `setError('...')` to update the UI with validation messages.

### 2. HTML5 Native Validations
We utilize standard HTML5 form validations to ensure basic rules are met before the JavaScript logic even runs.
*   **Where to find it:** Look at the JSX inside the `return ( ... )` block of the form components.
*   **What to show:** Point to the input fields and show the `required`, `type="email"`, `type="tel"`, `min`, and `max` attributes.

### 3. API Error Handling (Catching Backend Validations)
If a validation fails on the backend (e.g., duplicate ISBN or Email), the frontend catches it and displays it gracefully to the user.
*   **Where to find it:** Look at the `try...catch` block inside the form submission handler.
*   **What to show:** Point to the `catch (err)` block where we do `setError(err.response?.data?.message || 'Failed')`. This proves the frontend handles edge cases safely.

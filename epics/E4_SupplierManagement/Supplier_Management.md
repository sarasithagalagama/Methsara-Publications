# E4 – Supplier Management

**Epic Owner:** IT24100799 – Gawrawa G H Y  
**Stack:** Node.js · Express · Mongoose · MongoDB  
**Base URL:** `/api/suppliers` · `/api/purchase-orders` · `/api/sales-orders`

---

## 1. Folder Structure

```
E4_SupplierManagement/
├── controllers/
│   ├── supplierController.js       – Supplier CRUD + verification + analytics + payment tracking
│   ├── purchaseOrderController.js  – PO lifecycle for vendors (we pay them)
│   └── salesOrderController.js     – SO lifecycle for customers (they pay us)
├── middleware/
│   └── (uses E1 auth middleware)
├── models/
│   ├── Supplier.js                 – Supplier/Customer schema with payment terms
│   ├── PurchaseOrder.js            – PO schema for vendors (payables)
│   └── SalesOrder.js               – SO schema for customers (receivables)
└── routes/
    ├── supplierRoutes.js
    ├── purchaseOrderRoutes.js
    └── salesOrderRoutes.js
```

---

## 2. How the Backend / API Works

### Business Logic Change - Two Types of Partners

**Type 1: Vendors (Material Suppliers, Printers)**
- They provide materials/services TO US
- We OWE them money (PAYABLES)
- We use **Purchase Orders** to track what we buy from them
- We track debt we need to pay them

**Type 2: Customers (Distributors, Bookshops)**
- They BUY books FROM US in bulk
- They OWE us money (RECEIVABLES)  
- We use **Sales Orders** to track what they buy from us
- We track debt they need to pay us

```
Request → authenticate (protect) → authorize(supplier_manager / admin)
                  │
                  ▼
    supplierController  OR  purchaseOrderController  OR  salesOrderController
                  │
         Mongoose + MongoDB
                  │
                  ▼
          JSON Response
```

### Purchase Order Status Flow (for Vendors)

```
Draft ──► Sent ──► Confirmed ──► Received ──► Completed
   │                                │
   └──── Cancelled ◄────────────────┘
                         (from any stage)
```

When a PO reaches **Received**, the controller automatically calls the **E5 Inventory** module to add the received stock.

### Sales Order Status Flow (for Customers)

```
Draft ──► Confirmed ──► Processing ──► DispatchRequested ──► Dispatched ──► Delivered
   │                                          │                    │
   └──── Cancelled ◄─────────────────────────┘           (IM approves)
```

When a Supplier Manager requests dispatch (`Processing → Dispatched`), the system creates a **DispatchRequested** intermediate state requiring Inventory Manager approval. The Inventory Manager can approve (triggers E5 stock deduction and moves to `Dispatched`) or reject (returns to `Processing`). This prevents unauthorized stock removals.

When an SO is approved and reaches **Dispatched**, the controller reduces inventory stock.

### Payment Tracking

- **Vendors**: `outstandingBalance` = Amount WE owe THEM
- **Customers**: `outstandingBalance` = Amount THEY owe US
- Both track `hasDebt`, `lastPaymentDate`, and `totalPaid`
- Debt is marked and can be queried separately for payables vs receivables

---

## 3. All Functions

### `supplierController.js`

| Function | Purpose | Auth |
|---|---|---|
| `getAllSuppliers(req, res)` | Returns all suppliers with optional filters: `category`, `supplierType`, `search`. Supports pagination. | Supplier Mgr / Admin / Finance Mgr |
| `getSupplier(req, res)` | Get a single supplier/customer by ID. Used by admin approval diff view and partner detail pages. | Supplier Mgr / Admin / Finance Mgr |
| `createSupplier(req, res)` | Create a new supplier/customer record. Validates that supplier email is unique. | Supplier Mgr / Admin |
| `updateSupplier(req, res)` | If a `supplier_manager` requests an update, creates an `ApprovalRequest` (maker-checker). If `admin` requests, applies immediately. | Supplier Mgr / Admin |
| `deleteSupplier(req, res)` | Delete a supplier. Blocked if supplier has active orders. | Supplier Mgr / Admin |
| `getSupplierAnalytics(req, res)` | Returns per-supplier spend totals, pending order counts, top suppliers by order volume. | Supplier Mgr / Admin / Finance Mgr |
| `recordPaymentToVendor(req, res)` | Record payment TO a vendor (Material Supplier/Printer). Reduces the amount we owe them. | Finance Mgr / Admin |
| `recordPaymentFromCustomer(req, res)` | Record payment FROM a customer (Distributor/Bookshop). Reduces the amount they owe us. | Finance Mgr / Admin |
| `getPartnersWithDebt(req, res)` | Returns all vendors/customers with outstanding debt. Can filter by type. Shows payables vs receivables separately. | Supplier Mgr / Admin / Finance Mgr |

### `purchaseOrderController.js` (For Vendors - We Pay Them)

| Function | Purpose | Auth |
|---|---|---|
| `createPurchaseOrder(req, res)` | Create a PO for a vendor. Auto-generates `poNumber` (format: PO-YYMM-XXXX). Validates supplier is of type 'Vendor'. Increases vendor's outstanding balance. | Supplier Mgr / Admin |
| `getAllPurchaseOrders(req, res)` | List all POs with filters: `status`, `supplier`, `date range`. Paginated. | Supplier Mgr / Admin / Finance Mgr |
| `getPurchaseOrder(req, res)` | Get single PO with full supplier and item details populated. | Supplier Mgr / Admin / Finance Mgr |
| `updatePOStatus(req, res)` | Advance PO status. On transition to `Received`: triggers E5 inventory update (adds received quantities). Appends entry to `statusHistory`. | Supplier Mgr / Admin |
| `requestPayment(req, res)` | Marks a PO as payment requested, attaches payment amount. | Supplier Mgr / Admin |
| `emailPurchaseOrder(req, res)` | Sends PO details to the supplier's email address (via nodemailer). | Supplier Mgr / Admin |
| `verifyDelivery(req, res)` | Records delivery confirmation (actual quantities received vs ordered). Triggers partial inventory update if quantities differ. | Supplier Mgr / Admin |

### `salesOrderController.js` (For Customers - They Pay Us)

| Function | Purpose | Auth |
|---|---|---|
| `createSalesOrder(req, res)` | Create an SO for a customer (Distributor/Bookshop). Auto-generates `soNumber` (format: SO-YYMM-XXXX). Validates supplier is of type 'Customer'. Increases customer's outstanding balance. Checks inventory availability. | Supplier Mgr / Admin |
| `getAllSalesOrders(req, res)` | List all SOs with filters: `status`, `customer`, `paymentStatus`, `date range`. Paginated. | Supplier Mgr / Admin / Finance Mgr |
| `getSalesOrder(req, res)` | Get single SO with full customer and item details populated. | Supplier Mgr / Admin / Finance Mgr |
| `updateSOStatus(req, res)` | Advance SO status. Supplier managers requesting `Dispatched` creates `DispatchRequested` intermediary (requires IM approval). On actual `Dispatched` (by admin/MIM): triggers E5 inventory reduction. On `Delivered`: records delivery date. | Supplier Mgr / Admin / MIM |
| `recordPaymentForSO(req, res)` | Record customer payment for a specific sales order. Updates SO `amountPaid`/`amountDue`/`paymentStatus`. Updates customer's `outstandingBalance`. Creates a "Customer Collection" FinancialTransaction (E3 integration). | Finance Mgr / Admin |
| `cancelSalesOrder(req, res)` | Cancel a sales order. Reverses customer balance if order was not yet dispatched. Cannot cancel after dispatch. | Supplier Mgr / Admin |
| `getSalesOrderAnalytics(req, res)` | Returns sales order analytics: total revenue, payments received, outstanding receivables, status and payment breakdown. | Supplier Mgr / Admin / Finance Mgr |
| `getPendingSODispatchRequests(req, res)` | Returns all SOs with status `DispatchRequested` — the queue for Inventory Manager review. | MIM / Admin |
| `approveSODispatch(req, res)` | Approves a dispatch request: validates live inventory, deducts stock (E5), moves SO to `Dispatched`, records actual dispatch date. | MIM / Admin |
| `rejectSODispatch(req, res)` | Rejects a dispatch request: returns SO to `Processing` status without any inventory changes. | MIM / Admin |

---

## 4. CRUD API Endpoints

### Supplier Routes — `/api/suppliers`

All routes require: `protect + authorize(supplier_manager | admin | finance_manager)`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | List all suppliers/customers (filters: category, supplierType, search) |
| GET | `/terminated` | List terminated (soft-deleted) partners |
| GET | `/analytics` | Supplier spend and performance analytics |
| GET | `/debt` | Get all partners with outstanding debt (payables & receivables) |
| GET | `/:id` | Get single supplier/customer by ID |
| POST | `/` | Create new supplier/customer |
| PUT | `/:id` | Update supplier (maker-checker for non-admin) |
| PUT | `/:id/terminate` | Soft-terminate supplier (isActive: false) |
| PUT | `/:id/restore` | Restore terminated supplier |
| POST | `/:id/payment-to-vendor` | Record payment TO a vendor (reduces what we owe them) |
| POST | `/:id/payment-from-customer` | Record payment FROM a customer (reduces what they owe us) |
| DELETE | `/:id` | Hard delete supplier |

### Purchase Order Routes — `/api/purchase-orders` (For Vendors)

All routes require: `protect + authorize(supplier_manager | admin | finance_manager)`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/` | Create PO for a vendor (Material Supplier) |
| GET | `/` | List all POs with filters |
| GET | `/:id` | Get single PO details |
| PUT | `/:id/status` | Update PO status (triggers inventory on 'Received') |
| PUT | `/:id/payment` | Request/record payment to vendor |
| POST | `/:id/email` | Email PO to vendor |
| PUT | `/:id/verify-delivery` | Confirm delivery from vendor |

### Sales Order Routes — `/api/sales-orders` (For Customers)

All routes require: `protect + authorize(supplier_manager | admin | finance_manager | master_inventory_manager)`

| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/` | Supplier Mgr / Admin | Create SO for a customer (Distributor/Bookshop) |
| GET | `/` | All above | List all SOs with filters |
| GET | `/analytics` | All above | Sales order analytics (revenue, receivables) |
| GET | `/pending-dispatch` | MIM / Admin | Queue of SOs awaiting dispatch approval |
| GET | `/:id` | All above | Get single SO details |
| PUT | `/:id/status` | All above | Update SO status (Supplier Mgr → DispatchRequested; MIM/Admin → Dispatched) |
| POST | `/:id/payment` | Finance Mgr / Admin | Record payment from customer for this SO |
| PUT | `/:id/cancel` | Supplier Mgr / Admin | Cancel sales order |
| POST | `/:id/approve-dispatch` | MIM / Admin only | Approve dispatch request — deducts inventory + marks Dispatched |
| POST | `/:id/reject-dispatch` | MIM / Admin only | Reject dispatch request — returns SO to Processing |

---

## 5. Database — How It Works & Where Data Is Saved

### MongoDB Collections

#### `suppliers` (model: `Supplier.js`)
```javascript
{
  _id: ObjectId,
  name: String (required),
  contactPerson: String (required),
  email: String (required, unique, lowercase),
  phone: String (required),
  
  // New field to distinguish business relationship
  supplierType: String (enum: "Vendor" | "Customer", required, default: "Vendor"),
  
  // Category classification
  // Vendor types: "Material Supplier" (printers, paper suppliers, etc.)
  // Customer types: "Distributor", "Bookshop"
  category: String (enum: "Material Supplier" | "Distributor" | "Bookshop" | "Publisher"),
  
  address: {
    street: String,
    city: String,
    postalCode: String
  },
  businessRegistration: String,
  taxId: String,
  
  paymentTerms: String (enum: "Cash" | "Credit 7 days" | "Credit 14 days" | "Credit 30 days" | "Credit 60 days"),
  creditLimit: Number (default: 0),
  
  bankDetails: {
    accountName: String,
    bankName: String,
    branchName: String,
    accountNumber: String
  },
  
  // Dual-purpose balance tracking:
  // For Vendors (supplierType='Vendor'): Amount WE owe THEM (payables)
  // For Customers (supplierType='Customer'): Amount THEY owe US (receivables)
  outstandingBalance: Number (default: 0),
  totalPaid: Number (default: 0),
  hasDebt: Boolean (default: false),
  lastPaymentDate: Date,
  
  // Performance metrics
  totalOrders: Number (default: 0),
  totalValue: Number (default: 0),
  rating: Number (min: 1, max: 5, default: 3),
  
  // Status
  isActive: Boolean (default: true),
  isVerified: Boolean (default: false),
  
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### `purchaseorders` (model: `PurchaseOrder.js`) - For Vendors (We Pay Them)
```javascript
{
  _id: ObjectId,
  poNumber: String (unique, auto-generated: PO-YYMM-XXXX),
  supplier: ObjectId (ref: Supplier, required, must be supplierType='Vendor'),
  items: [{
    // free-text description of what is ordered (raw materials, printing supplies, print jobs, etc.)
    itemName: String (required, trim),
    // Optional link to a Product if ordering a reprint of a specific book
    product: ObjectId (ref: Product, optional),
    quantity: Number (required, min: 1),
    unitPrice: Number (required, min: 0),
    totalPrice: Number (required),
    receivedQty: Number (default: 0),
    isVerified: Boolean (default: false)
  }],
  totalAmount: Number (required, min: 0),
  status: String (enum: "Pending" | "Approved" | "Received" | "Dispatched" | "Cancelled"),
  paymentRequested: Boolean (default: false),
  paymentStatus: String (enum: "Unpaid" | "Paid", default: "Unpaid"),
  isEmailed: Boolean (default: false),
  expectedDeliveryDate: Date,
  actualDeliveryDate: Date,
  location: String (required),
  createdBy: ObjectId (ref: User, required),
  notes: String,
  statusHistory: [{
    status: String,
    changedBy: ObjectId (ref: User),
    changedAt: Date (default: Date.now),
    notes: String
  }],
  createdAt: Date,
  updatedAt: Date
}
```

**Note:** PO items use free-text `itemName` because Vendor POs are for raw materials and services (printing, paper, binding supplies) — NOT our sellable book catalog. The optional `product` field can be used when ordering a reprint of a specific book title.

**Pre-save hook (PurchaseOrder.js):** Auto-generates `poNumber` in format PO-YYMM-XXXX:
```javascript
const count = await PurchaseOrder.countDocuments();
const dateStr = new Date().toISOString().slice(2, 7).replace("-", ""); // YYMM
this.poNumber = `PO-${dateStr}-${String(count + 1).padStart(4, "0")}`;
```

#### `salesorders` (model: `SalesOrder.js`) - For Customers (They Pay Us)
```javascript
{
  _id: ObjectId,
  soNumber: String (unique, auto-generated: SO-YYMM-XXXX),
  customer: ObjectId (ref: Supplier, required, must be supplierType='Customer'),
  items: [{
    product: ObjectId (ref: Product, required),
    quantity: Number (required, min: 1),
    unitPrice: Number (required, min: 0),
    totalPrice: Number (required),
    dispatchedQty: Number (default: 0),
    isVerified: Boolean (default: false)
  }],
  totalAmount: Number (required, min: 0),
  status: String (enum: "Draft" | "Confirmed" | "Processing" | "DispatchRequested" | "Dispatched" | "Delivered" | "Cancelled"),
  // DispatchRequested: Supplier Manager has requested dispatch; awaiting Inventory Manager approval
  
  // Payment tracking (customer owes us)
  paymentStatus: String (enum: "Unpaid" | "Partial" | "Paid", default: "Unpaid"),
  amountPaid: Number (default: 0),
  amountDue: Number (required),
  dueDate: Date,
  
  // Dates
  expectedDispatchDate: Date,
  actualDispatchDate: Date,
  expectedDeliveryDate: Date,
  actualDeliveryDate: Date,
  
  deliveryAddress: {
    street: String,
    city: String,
    postalCode: String
  },
  
  createdBy: ObjectId (ref: User, required),
  notes: String,
  
  // Audit trail
  statusHistory: [{
    status: String,
    changedBy: ObjectId (ref: User),
    changedAt: Date (default: Date.now),
    notes: String
  }],
  
  // Invoice
  invoiceNumber: String,
  invoiceDate: Date,
  
  // Payment history
  paymentHistory: [{
    amount: Number,
    paymentDate: Date,
    paymentMethod: String,
    reference: String,
    note: String,
    recordedBy: ObjectId (ref: User)
  }],
  
  createdAt: Date,
  updatedAt: Date
}
```

**Pre-save hooks (SalesOrder.js):**
1. Auto-generates `soNumber` in format SO-YYMM-XXXX
2. Auto-calculates `amountDue = totalAmount - amountPaid`
3. Auto-updates `paymentStatus` based on `amountPaid`

---

## 6. Business Logic Summary

### Two Types of Business Relationships

#### 1. Vendors (Material Suppliers, Printers) - `supplierType: "Vendor"`

**What they do:**
- They provide materials and services TO US (printing, paper supply, binding, etc.)
- They deliver physical books and materials to our warehouse

**Financial relationship:**
- We OWE them money (PAYABLES)
- We create **Purchase Orders (PO)** to buy from them
- When PO is created: their `outstandingBalance` increases (debt we owe them)
- When we pay them: use `/api/suppliers/:id/payment-to-vendor` to reduce debt

**Workflow:**
```
Create PO → Vendor produces/delivers → We receive goods (inventory increased) → We pay vendor
```

#### 2. Customers (Distributors, Bookshops) - `supplierType: "Customer"`

**What they do:**
- They BUY books FROM US in bulk quantities
- They sell books to end consumers through their own channels

**Financial relationship:**
- They OWE us money (RECEIVABLES)
- We create **Sales Orders (SO)** to sell to them
- When SO is created: their `outstandingBalance` increases (debt they owe us)
- When they pay us: use `/api/suppliers/:id/payment-from-customer` or `/api/sales-orders/:id/payment` to reduce debt

**Workflow:**
```
Create SO → We check inventory → We dispatch goods (inventory decreased) → Customer receives → Customer pays us
```

### Debt Tracking

**Vendors (PAYABLES - We pay them):**
- `GET /api/suppliers/debt?type=Vendor` → Shows all vendors we owe money to
- Each vendor's `outstandingBalance` = Total amount we owe them
- Record payment: `POST /api/suppliers/:id/payment-to-vendor`

**Customers (RECEIVABLES - They pay us):**
- `GET /api/suppliers/debt?type=Customer` → Shows all customers who owe us money
- Each customer's `outstandingBalance` = Total amount they owe us
- Record payment: `POST /api/suppliers/:id/payment-from-customer` or `POST /api/sales-orders/:id/payment`

### Inventory Integration

**Purchase Orders (from Vendors):**
- Vendor POs are for **raw materials and services** (printing, paper, binding supplies) — NOT the sellable book catalog
- When PO status → `Received`: Records the actual delivery date only
- **Inventory is NOT automatically updated** from Vendor POs; book stock is managed separately via the Inventory Management module (E5)
- The `itemName` field (free-text) confirms that PO items are often not linked to Product catalog entries

**Sales Orders (to Customers):**
- **Before creation**: Validates sufficient live stock (`quantity - reservedQuantity`) at main warehouse location
- When SO status changes from `DispatchRequested → Dispatched` (approved by Inventory Manager):
  - Automatically **DECREASES** book inventory at warehouse
  - Updates `quantity` and recalculates `availableQuantity = quantity - reservedQuantity`
  - Creates adjustment record: `{ type: "Remove", reason: "SO dispatched to customer" }`
- Location-based: stock is deducted from the SO's location (main warehouse)

**Dispatch Approval Gate (E4 ↔ E5 integration):**
```
Supplier Manager clicks "Request Dispatch"
        │
        ▼
SO status → DispatchRequested  (no inventory change yet)
        │
        ▼
Inventory Manager sees request in pending-dispatch queue
        │
   ┌────┴────┐
Approve     Reject
   │            │
   ▼            ▼
Inventory   SO returns to Processing
deducted    (no inventory change)
SO → Dispatched
```

**Inventory Model Fields Used:**
```javascript
{
  product: ObjectId,
  location: String,
  quantity: Number,           // Physical stock
  availableQuantity: Number,  // Available for sale (quantity - reserved)
  adjustments: [{             // Audit trail of all changes
    type: String,
    quantity: Number,
    reason: String,
    adjustedBy: ObjectId,
    timestamp: Date
  }]
}
```

### Payment Integration (E3 Financial Management)

**For Vendors (We Pay Them):**

1. **When PO is Created:**
   - Supplier's `outstandingBalance` increases by PO totalAmount
   - Supplier's `hasDebt` set to true
   - Tracks: "We owe them money"

2. **When Payment is Made:**
   - Option A: Use `POST /api/suppliers/:id/payment-to-vendor`
     - Directly record payment to vendor
     - Updates supplier balance
   - Option B: Use `PUT /api/financial/purchase-orders/:id/pay` (E3 Integration)
     - Marks PO as paid
     - Creates FinancialTransaction (type: "Supplier Payment", isIncome: false)
     - Updates supplier's outstanding balance
     - Updates `totalPaid` and `lastPaymentDate`

**For Customers (They Pay Us):**

1. **When SO is Created:**
   - Customer's `outstandingBalance` increases by SO totalAmount
   - Customer's `hasDebt` set to true
   - Tracks: "They owe us money"

2. **When Payment is Received:**
   - Option A: Use `POST /api/sales-orders/:id/payment`
     - Records payment for specific SO
     - Updates SO `amountPaid`, `amountDue`, `paymentStatus`
     - Updates customer balance and marks as paid when fully paid
     - Maintains payment history on SO
   - Option B: Use `POST /api/suppliers/:id/payment-from-customer`
     - Directly record payment from customer
     - Useful for partial payments or payments not tied to specific SO

**Financial Transaction Model:**
```javascript
{
  type: "Supplier Payment" | "Partner Collection" | "Salary" | "Refund",
  amount: Number,
  relatedId: ObjectId,  // Supplier ID or Order ID
  isIncome: Boolean,    // false for vendor payments, true for customer payments
  processedBy: ObjectId,
  date: Date,
  status: "Completed" | "Pending" | "Failed"
}
```

### Key Differences

| Aspect | Purchase Order (Vendor) | Sales Order (Customer) |
|--------|------------------------|------------------------|
| Direction | We BUY from them | We SELL to them |
| Money Flow | We pay OUT | We receive IN |
| Balance Type | Payable (we owe) | Receivable (they owe) |
| Inventory | Increases on receive | Decreases on dispatch |
| Document ID | PO-YYMM-XXXX | SO-YYMM-XXXX |
| Status Flow | Draft→Sent→Confirmed→Received | Draft→Confirmed→Processing→DispatchRequested→Dispatched→Delivered |
| Dispatch Gate | N/A | Supplier Mgr requests; Inventory Mgr approves before stock is deducted |

---

## 7. Validations Used

### Mongoose Schema (Supplier.js)
```javascript
name:          { required: true, trim: true }
email:         { required: true, unique: true, lowercase: true }
phone:         { required: true }
contactPerson: { required: true }
supplierType:  { enum: ['Vendor','Customer'], required: true, default: 'Vendor' }
category:      { enum: ['Material Supplier','Distributor','Bookshop','Publisher'] }
paymentTerms:  { enum: ['Cash','Credit 7 days','Credit 14 days','Credit 30 days','Credit 60 days'] }
```

### Mongoose Schema (PurchaseOrder.js)
```javascript
supplier:    { required: true, ref: 'Supplier' }
totalAmount: { required: true, min: 0 }
status:      { enum: ['Pending','Approved','Received','Dispatched','Cancelled'] }
items[].itemName: { required: true, type: String, trim: true }  // free-text item description
items[].product:  { ref: 'Product', optional: true }            // optional link to catalog
location:    { required: true }
```

### Mongoose Schema (SalesOrder.js)
```javascript
customer:    { required: true, ref: 'Supplier' }
totalAmount: { required: true, min: 0 }
amountDue:   { required: true }
status:      { enum: ['Draft','Confirmed','Processing','DispatchRequested','Dispatched','Delivered','Cancelled'] }
paymentStatus: { enum: ['Unpaid','Partial','Paid'] }
items:       { validate: arr => arr.length > 0 }  // must have at least 1 item
```

### Controller-Level Validations

**Supplier Operations:**
- **createSupplier:** checks `email` uniqueness (MongoDB unique index error caught + re-thrown as 400)
- **deleteSupplier:** queries both `PurchaseOrder` and `SalesOrder` — rejects if any active orders exist
- **recordPaymentToVendor:** validates `supplierType === 'Vendor'` and `amount > 0`
- **recordPaymentFromCustomer:** validates `supplierType === 'Customer'` and `amount > 0`

**Purchase Order Operations:**
- **createPurchaseOrder:** validates supplier exists and `supplierType === 'Vendor'`
- **createPurchaseOrder:** requires each `item.itemName` (free-text description); `item.product` (ProductId) is optional and only validated if provided
- **createPurchaseOrder:** checks `item.quantity > 0` and `item.unitPrice >= 0` for each item
- **updatePOStatus:** validates against allowed transition map; on `Received` sets actualDeliveryDate (no auto inventory update)

**Sales Order Operations:**
- **createSalesOrder:** validates customer exists and `supplierType === 'Customer'`
- **createSalesOrder:** checks live inventory (`quantity - reservedQuantity`) for each product before order creation
- **createSalesOrder:** validates `item.quantity > 0` and `item.unitPrice >= 0`
- **updateSOStatus:** Supplier Managers requesting `Dispatched` triggers `DispatchRequested` (not immediate inventory change)
- **updateSOStatus:** Only `master_inventory_manager` or `admin` can directly set `Dispatched` (bypassing DispatchRequested)
- **approveSODispatch:** validates SO is in `DispatchRequested` status; checks live stock per item; deducts inventory; sets `Dispatched`
- **rejectSODispatch:** validates SO is in `DispatchRequested` status; returns to `Processing` — no inventory changes
- **recordPaymentForSO:** validates `amount > 0` and `amount <= amountDue`
- **cancelSalesOrder:** prevents cancellation after status is 'Dispatched' or 'Delivered'

---

## 8. User Stories

| # | As a… | I want to… | So that… |
|---|---|---|---|
| US-4.1 | Supplier Manager | Add a new business partner (vendor or customer) with type, contact info, payment terms, and bank details | The partner is recorded in the system and linked to future order and payment activity |
| US-4.2 | Supplier Manager | Set whether a partner is a Vendor (we buy from them) or a Customer (they buy from us) | Purchase Orders and Sales Orders are created for the correct party and debt flows in the correct direction |
| US-4.3 | Supplier Manager | Filter the partner directory by Vendor or Customer type | I can quickly view only vendors or only bulk customers without scrolling through the full list |
| US-4.4 | Supplier Manager | Search and filter partners by name, category, and verification status | I can locate specific partners quickly from a large list |
| US-4.5 | Supplier Manager | Create a Purchase Order (PO) for a vendor with items, quantities, unit prices, and expected delivery date | I formally record what we are buying from a vendor and increase our payable to them |
| US-4.6 | Supplier Manager | Advance a PO through its status flow (Pending → Sent → Confirmed → Received) | I can track the delivery lifecycle and trigger automatic inventory addition when goods are received |
| US-4.7 | Supplier Manager | Email a Purchase Order to the vendor directly from the system | The vendor receives the PO details electronically without manual copy-paste |
| US-4.8 | Supplier Manager | Create a Sales Order (SO) for a bulk customer (distributor/bookshop) | I formally record what we are selling and increase the customer's receivable balance |
| US-4.9 | Supplier Manager | Advance an SO through its status flow (Draft → Confirmed → Processing → Dispatch Request → Dispatched → Delivered) | The dispatch request is reviewed and approved by the Inventory Manager before stock is physically deducted |
| US-4.9a | Master Inventory Manager | Review and approve or reject a Sales Order dispatch request | Stock is only deducted after I verify availability, preventing unauthorized inventory removal |
| US-4.10 | Finance Manager | Record a payment made to a vendor | The vendor's outstanding balance (our payable to them) is reduced |
| US-4.11 | Finance Manager | Record a payment received from a bulk customer | The customer's outstanding balance (their receivable to us) is reduced |
| US-4.12 | Finance Manager | Record a payment against a specific Sales Order | The SO payment status updates (Unpaid → Partial → Paid) and the customer's balance decreases |
| US-4.13 | Supplier Manager / Finance Manager | View the Debt Tracker dashboard | I can see at a glance: total we owe vendors (payables), total customers owe us (receivables), net cash position, and individual overdue partners |
| US-4.14 | Admin | Directly update any supplier/customer record | Changes take effect immediately without going through the approval workflow |
| US-4.15 | Supplier Manager | Request an update to sensitive supplier fields (bank details, payment terms) | The change is reviewed by an admin before being applied (maker-checker protection) |
| US-4.16 | Supplier Manager / Finance Manager | View a summary of all outstanding Sales Orders with payment status | I can follow up with customers whose payments are overdue |

---

## 9. Frontend Implementation

### Component Map

| Page / Component | File Path | What It Does |
|---|---|---|
| Supplier Manager Dashboard | `client/src/epics/E4_SupplierManagement/pages/SupplierManagerDashboard.jsx` | Overview: stat cards (total partners, pending POs, outstanding SOs, revenue); quick-action links to all sub-pages |
| Partner Directory | `client/src/epics/E4_SupplierManagement/components/Suppliers/SupplierList.jsx` | Full partner list; Vendor/Customer type toggle; category tab filter; search; debt badge on cards with outstanding balance; CRUD actions |
| Partner Form Modal | `client/src/epics/E4_SupplierManagement/components/Suppliers/SupplierFormModal.jsx` | Add/Edit partner form; `supplierType` (Vendor/Customer) selector; category options auto-populate based on type; payment terms; bank details; real-time validation |
| Purchase Order List | `client/src/epics/E4_SupplierManagement/pages/supplier/PurchaseOrderList.jsx` | Table of all POs; status filter chips; search by PO# or vendor; contextual status action buttons; email PO action |
| Create Purchase Order | `client/src/epics/E4_SupplierManagement/pages/supplier/CreatePurchaseOrder.jsx` | Multi-item PO form; vendor-only partner filter; free-text `itemName` per line (no product dropdown, since POs are for raw materials); unit price input; location dropdown; form validation |
| Sales Order List | `client/src/epics/E4_SupplierManagement/pages/supplier/SalesOrderList.jsx` | Table of all SOs with status filter chips (including DispatchRequested); search by SO# or customer; contextual next-step action buttons — dispatch shows "Request Dispatch" for Supplier Manager; payment recording per order; view detail modal with items and payment history |
| Create Sales Order | `client/src/epics/E4_SupplierManagement/pages/supplier/CreateSalesOrder.jsx` | Multi-item SO form; customer-only partner filter; product selector with unit price auto-fill; inventory location dropdown; payment terms; warning banner showing new receivable amount |
| Payment Modal | `client/src/epics/E4_SupplierManagement/components/Suppliers/PaymentModal.jsx` | Reusable payment recording modal — 3 modes: `vendor` (pay vendor), `customer` (collect from customer), `so` (collect for specific SO); validates amount, method, date, reference; prevents overpayment |
| Debt Tracker | `client/src/epics/E4_SupplierManagement/pages/supplier/DebtTracker.jsx` | Summary cards: Total Payable (red), Total Receivable (green), Net Position; two tabs: "Vendors We Owe" and "Customers Who Owe Us"; days-since-last-payment indicator with overdue highlighting; one-click payment recording |
| Supplier Service | `client/src/epics/E4_SupplierManagement/services/supplierService.js` | Centralized Axios API service for all E4 endpoints; consumed by all E4 pages and components |

### Data Flow — Create Purchase Order

```
Supplier Manager opens Create PO form
         │
         ▼
Fetches partner list: GET /api/suppliers?supplierType=Vendor
Fetches products:     GET /api/products
         │
         ▼
Fills PO form: select vendor, add items (itemName + qty + unit price), choose location
         │
         ▼
POST /api/purchase-orders
  Server:
  ├── validates supplier exists and supplierType === 'Vendor'
  ├── validates each item has itemName (optional: product ref)
  ├── auto-generates poNumber (PO-YYMM-XXXX)
  ├── saves PurchaseOrder document
  └── increments vendor.outstandingBalance (we now owe them)
         │
         ▼
Navigates back to PurchaseOrderList
Vendor card in SupplierList now shows amber "Debt" badge
```

### Data Flow — Advance PO to Received

```
Supplier Manager clicks "Mark Received" on a PO
         │
         ▼
PUT /api/purchase-orders/:id/status  { status: "Received" }
  Server:
  ├── validates transition: Confirmed → Received
  ├── records actualDeliveryDate
  └── appends to statusHistory
         │
         ▼
Note: Vendor PO items are raw materials/services (printing, paper, etc.)
Book inventory is managed separately in E5 Inventory Management.
Finance team can pay the vendor using /api/financial/purchase-orders/:id/pay
```

### Data Flow — Create Sales Order & Dispatch

```
Supplier Manager opens Create SO form
         │
         ▼
Fetches customers:  GET /api/suppliers?supplierType=Customer
Fetches products:   GET /api/products
         │
         ▼
Fills SO form: select customer, add items, set payment terms and location
Warning banner shows: "Rs. X will be added to customer's receivable"
         │
         ▼
POST /api/sales-orders
  Server:
  ├── validates customer.supplierType === 'Customer'
  ├── checks availableQuantity in Inventory for each item at location
  ├── auto-generates soNumber (SO-YYMM-XXXX)
  ├── saves SalesOrder document (status: Draft, paymentStatus: Unpaid)
  └── increments customer.outstandingBalance (they now owe us)
         │
         ▼
Manager advances status to Dispatched:
PUT /api/sales-orders/:id/status  { status: "Dispatched" }
  Server (when called by supplier_manager):
  ├── validates current status is Processing
  └── sets status to DispatchRequested (intermediary — no inventory change)
         │
         ▼
Inventory Manager sees request in GET /api/sales-orders/pending-dispatch
         │
   ┌─────┴──────┐
Approve            Reject
   │                  │
   ▼                  ▼
POST /api/sales-orders/:id/approve-dispatch   POST /api/sales-orders/:id/reject-dispatch
  Server:                                       Server:
  ├── checks live stock per item                ├── returns SO to Processing
  └── triggers E5 inventory reduction:          └── no inventory changes
        for each item:
          Inventory.findOneAndUpdate(
            { product, location },
            { $inc: { quantity: -qty } }
          )
  SO → Dispatched, actualDispatchDate set
```

### Data Flow — Payment Recording (PaymentModal)

```
Finance Manager clicks "Record Payment" on a vendor in Debt Tracker
         │
         ▼
PaymentModal opens (mode: "vendor")
Shows: outstanding balance, payment method options
         │
         ▼
Fills: amount (≤ outstanding), method, date, reference
         │
         ▼
POST /api/suppliers/:id/payment-to-vendor  { amount, method, date, reference }
  Server:
  ├── validates supplierType === 'Vendor'
  ├── decrements vendor.outstandingBalance
  ├── updates vendor.totalPaid and lastPaymentDate
  └── sets vendor.hasDebt = false if balance reaches 0
         │
         ▼
Debt Tracker refreshes — vendor balance updated or removed from list
```

### Vendor vs Customer Partner Type — UI Behaviour

| UI Element | Vendor Behaviour | Customer Behaviour |
|---|---|---|
| Type toggle in SupplierList | Shows vendors only when "Vendor" selected | Shows customers only when "Customer" selected |
| Category options in form | Material Supplier, Publisher | Distributor, Bookshop |
| Debt badge on card | "We Owe: Rs. X" (amber) | "They Owe: Rs. X" (amber) |
| Debt Tracker tab | "Vendors We Owe" (payables) | "Customers Who Owe Us" (receivables) |
| Payment modal context banner | "We owe them Rs. X" | "They owe us Rs. X" |
| Payment modal button label | "Record Payment" | "Record Collection" |

### Sidebar Navigation (supplier_manager role)

```
Overview         → /supplier-manager/dashboard
Partner Directory → /supplier-manager/suppliers
Purchase Orders  → /supplier-manager/purchase-orders
Sales Orders     → /supplier-manager/sales-orders
Debt Tracker     → /supplier-manager/debt-tracker
```

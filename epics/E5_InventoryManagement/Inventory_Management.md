# E5 – Inventory Management

**Epic Owner:** IT24100264 – Bandara N W C D  
**Stack:** Node.js · Express · Mongoose · MongoDB  
**Base URL:** `/api/inventory` · `/api/locations` · `/api/stock-transfers`

---

## 1. Folder Structure

```
E5_InventoryManagement/
├── controllers/
│   ├── inventoryController.js      – Stock view, adjust, alerts, reports
│   ├── locationController.js       – Warehouse/branch location management
│   └── stockTransferController.js  – Inter-location stock movement
├── middleware/
│   └── (uses E1 auth middleware)
├── models/
│   ├── Inventory.js                – Stock record (product × location)
│   ├── Location.js                 – Warehouse / branch locations
│   └── StockTransfer.js            – Transfer request / approval records
└── routes/
    ├── inventoryRoutes.js
    ├── locationRoutes.js
    └── stockTransferRoutes.js
```

---

## 2. How the Backend / API Works

### Core Inventory Design

Every `Inventory` document represents the stock of **one product at one location**:
```
Inventory = { product: ObjectId, location: ObjectId, quantity, reserved, available }
```

This is a **many-to-many join table** pattern in a document database. To find all stock for a product:
```javascript
Inventory.find({ product: productId })  // one row per location
```
To find all stock at a location:
```javascript
Inventory.find({ location: locationId })  // one row per product
```

### Role-Scoped Access

```
master_inventory_manager
     ├── can see ALL locations
     └── can adjust stock at ANY location

location_inventory_manager
     ├── can only see THEIR assigned location (req.user.assignedLocation)
     └── can only request transfers (cannot approve their own)
```

### Stock Transfer Flow

```
location_inventory_manager OR master_inventory_manager
         │
         ▼  POST /api/stock-transfers/request
  StockTransfer created (status: Requested)
  Source location: availableStock decremented (held)
         │
         ▼  PUT /api/stock-transfers/:id/approve
  Master Inventory Manager approves
         │
    ┌────┴────┐
  Approve   Reject
    │          │
    ▼          ▼
 Stock        Held stock
 moved to     restored at
 destination  source
```

---

## 3. All Functions

### `inventoryController.js`

| Function | Purpose | Auth |
|---|---|---|
| `getStockByLocation(req, res)` | Returns all inventory records at a specific location. Location inventory managers can only query their assigned location (`authorizeLocation` check). Master managers see any. Also runs Dynamic Sync — queries each product's `stock` field and reconciles with Inventory doc if discrepancy found. | Inventory Mgr / Admin |
| `adjustStock(req, res)` | Manually add or subtract stock at a location. Only Master Inventory Manager can approve directly; regular adjustments by location managers create an `ApprovalRequest` (E1 maker-checker). Records the adjustment in `adjustments` history array. | MIM / Admin (direct); LIM (via approval) |
| `getLowStockAlerts(req, res)` | Returns all Inventory documents where `availableStock <= lowStockThreshold`. Sorted by severity (most critical first). | Inventory Mgr / Admin |
| `getStockMovements(req, res)` | Returns the `adjustments` history array from all Inventory documents, flattened and sorted by date. Shows who adjusted what and when. | Inventory Mgr / Admin |
| `getInventoryStats(req, res)` | Dashboard summary: total SKUs tracked, total units in stock, total locations, number of low-stock items, number of out-of-stock items. | Inventory Mgr / Admin |
| `syncAllStock(req, res)` | Utility: iterates every Product and every Inventory document. For each product, checks if the sum of `availableStock` across all location inventories matches `product.stock`. Corrects any discrepancies. | MIM / Admin |
| `updateInventorySettings(req, res)` | Update thresholds: `lowStockThreshold` and `reorderPoint` on a specific Inventory document. Used to configure when alerts trigger. | MIM / Admin |

### `locationController.js`

| Function | Purpose | Auth |
|---|---|---|
| `getLocations(req, res)` | List all warehouse/branch locations. Implements self-healing: if no `isMainWarehouse: true` location exists, it creates one automatically. | Inventory Mgr / Admin |
| `createLocation(req, res)` | Create a new warehouse or branch location. If `isMainWarehouse: true` is set, clears that flag from all other locations first. Only one main warehouse allowed. | MIM / Admin |
| `updateLocation(req, res)` | Update location details (name, address, manager assignment, `isMainWarehouse` flag). | MIM / Admin |
| `deleteLocation(req, res)` | Delete a location. Blocked if any Inventory documents still reference it. | MIM / Admin |

### `stockTransferController.js`

| Function | Purpose | Auth |
|---|---|---|
| `requestTransfer(req, res)` | Request stock movement from one location to another. Validates: source location has enough `availableStock`. Creates a `StockTransfer` document with `status: Requested`. Decrements `availableStock` at source (reserved for transfer). | Inventory Mgr / Admin |
| `approveTransfer(req, res)` | Approve or reject a pending transfer. If approved: decrements `quantity` at source, increments `quantity` and `availableStock` at destination. If rejected: restores held `availableStock` at source. Updates `StockTransfer.status`. Role check: cannot approve a transfer you requested. | MIM / Admin |
| `getAllTransfers(req, res)` | List all stock transfer requests with filters (status, from/to location, date range). | Inventory Mgr / Admin |

---

## 4. CRUD API Endpoints

### Inventory Routes — `/api/inventory`

All routes require: `protect + authorize(master_inventory_manager | location_inventory_manager | admin)`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/location/:location` | View stock at a location |
| POST | `/adjust` | Adjust stock quantity |
| GET | `/alerts` | Low stock alerts |
| GET | `/movements` | Stock movement history |
| GET | `/stats` | Inventory dashboard stats |
| GET | `/sync-all` | Manual stock sync utility |
| PUT | `/:id` | Update inventory thresholds |

### Location Routes — `/api/locations`

| Method | Endpoint | Auth (Role) | Description |
|---|---|---|---|
| GET | `/` | Inventory Mgr / Admin | List all locations |
| POST | `/` | MIM / Admin | Create location |
| PUT | `/:id` | MIM / Admin | Update location |
| DELETE | `/:id` | MIM / Admin | Delete location |

### Stock Transfer Routes — `/api/stock-transfers`

| Method | Endpoint | Auth (Role) | Description |
|---|---|---|---|
| POST | `/request` | Inventory Mgr / Admin | Request a transfer |
| PUT | `/:id/approve` | MIM / Admin | Approve or reject |
| GET | `/` | Inventory Mgr / Admin | List all transfers |

---

## 5. Database — How It Works & Where Data Is Saved

### MongoDB Collections

#### `inventories` (model: `Inventory.js`)
```
{
  _id: ObjectId,
  product: ObjectId (ref: Product, required),
  location: ObjectId (ref: Location, required),

  // Three stock fields:
  quantity: Number (default: 0),        ← total physical units
  reservedStock: Number (default: 0),   ← units held for pending orders / transfers
  availableStock: Number (default: 0),  ← quantity - reservedStock (what can be sold)

  lowStockThreshold: Number (default: 10),  ← alert if availableStock <= this
  reorderPoint: Number (default: 20),        ← suggested reorder level

  adjustments: [{
    type: String (enum: add | subtract | transfer_in | transfer_out | order_deduction),
    quantity: Number,
    reason: String,
    adjustedBy: ObjectId (ref: User),
    adjustedAt: Date
  }],

  createdAt: Date,
  updatedAt: Date
}
```

**Compound Unique Index:** `{ product: 1, location: 1 }` ensures only one Inventory document per product-location pair. Attempting to create a duplicate throws a MongoDB unique key error.

**The Three Stock Fields Explained:**
- `quantity` — The total number of physical units at this location (including reserved)
- `reservedStock` — Units in pending orders or pending transfers (cannot be sold)
- `availableStock` — What customers can actually order = `quantity - reservedStock`

When an order is placed: `reservedStock += quantity`, `availableStock -= quantity`  
When an order is shipped: `quantity -= quantity`, `reservedStock -= quantity` (no change to available)  
When stock is added (PO received): `quantity += received`, `availableStock += received`

#### `locations` (model: `Location.js`)
```
{
  _id: ObjectId,
  name: String (required, unique),
  address: { street, city, state, zipCode },
  isMainWarehouse: Boolean (default: false),
  manager: ObjectId (ref: User),
  phone: String,
  email: String,
  isActive: Boolean (default: true),
  createdAt: Date
}
```

**Self-Healing Main Warehouse:** `getLocations` checks if any location has `isMainWarehouse: true`. If none exists (e.g., during initial setup or if it was accidentally removed), the controller automatically creates a default "Main Warehouse" location. This prevents the system from entering an invalid state.

#### `stocktransfers` (model: `StockTransfer.js`)
```
{
  _id: ObjectId,
  product: ObjectId (ref: Product),
  fromLocation: ObjectId (ref: Location),
  toLocation: ObjectId (ref: Location),
  quantity: Number (required, min: 1),
  status: String (enum: Requested | Approved | Rejected | Completed),
  requestedBy: ObjectId (ref: User),
  approvedBy: ObjectId (ref: User),
  requestedAt: Date,
  approvedAt: Date,
  notes: String
}
```

**Relationships:**
- `inventories.product` → `products` (E2)
- `inventories.location` → `locations`
- `stocktransfers.fromLocation` / `toLocation` → `locations`
- `stocktransfers.requestedBy` / `approvedBy` → `users` (E1)
- `inventories.adjustments.adjustedBy` → `users` (E1)

**Indexes:**
- `inventories.{ product, location }` — unique compound index
- `inventories.availableStock` — for fast low-stock queries
- `locations.name` — unique index
- `stocktransfers.status` — for filtering by transfer status

---

## 6. Validations Used

### Mongoose Schema (Inventory.js)
```javascript
quantity:      { default: 0, min: [0, 'Stock cannot be negative'] }
reservedStock: { default: 0, min: 0 }
availableStock:{ default: 0, min: 0 }
// compound unique: { product: 1, location: 1 }
adjustments.type: { enum: ['add','subtract','transfer_in','transfer_out','order_deduction'] }
```

### Mongoose Schema (StockTransfer.js)
```javascript
quantity: { required: true, min: [1, 'Transfer quantity must be at least 1'] }
status:   { enum: ['Requested','Approved','Rejected','Completed'] }
fromLocation: { required: true }
toLocation:   { required: true }
```

### Controller-Level Validations
- **requestTransfer:** checks `fromLocation !== toLocation` (cannot transfer to same location)
- **requestTransfer:** verifies `Inventory.availableStock >= requested quantity` at source
- **adjustStock:** negative adjustments checked — cannot subtract more than current `quantity`
- **approveTransfer:** verifies `status === 'Requested'` before allowing approval
- **deleteLocation:** checks `Inventory.countDocuments({ location: id }) === 0` before allowing delete

---

## 7. User Stories

| # | As a… | I want to… | So that… |
|---|---|---|---|
| US-5.1 | Master Inventory Manager | View the current stock levels for every product at every warehouse/branch location | I can see the complete inventory picture across the whole business |
| US-5.2 | Master Inventory Manager | Manually adjust stock quantity at any location (add or subtract) | I can correct discrepancies or log write-offs immediately |
| US-5.3 | Master Inventory Manager | View a dashboard showing total SKUs, total units, locations, low-stock count, and out-of-stock count | I get an instant health check of the inventory without running manual queries |
| US-5.4 | Master Inventory Manager | View all stock movement history (who adjusted what, when, and why) | I have a full audit trail for accountability and reporting |
| US-5.5 | Master Inventory Manager | Receive low-stock alerts for products that fall below their configured threshold | I can proactively reorder before stock runs out |
| US-5.6 | Master Inventory Manager | Approve or reject a stock transfer between locations | Transfers go through a second review before stock physically moves |
| US-5.7 | Master Inventory Manager | Create and manage warehouse/branch locations | New branches can be added to the system and assigned to managers |
| US-5.8 | Location Inventory Manager | View the stock levels at my assigned location only | I can manage my local inventory without seeing or modifying other locations |
| US-5.9 | Location Inventory Manager | Request a stock transfer from another location to mine | I can replenish my local stock without directly adjusting it |
| US-5.10 | Location Inventory Manager | Submit a stock adjustment request (not direct update) | Changes to my local stock are reviewed by a master manager before taking effect |
| US-5.11 | Admin | Run a full stock sync utility | Any data drift between product and inventory records is automatically corrected |
| US-5.12 | E3 System (automatic) | Deduct stock when a customer order is placed | Available inventory reflects what can actually still be sold |
| US-5.13 | Master Inventory Manager | Manually add stock for books received from printing/production | Book inventory is updated accurately after new stock arrives, since Vendor POs track raw materials not sellable books |
| US-5.14 | E4 System (automatic) | Deduct stock when a Sales Order is marked as Dispatched | Bulk dispatches to distributors are accurately reflected in stock levels |

---

## 8. Frontend Implementation

### Component Map

| Page / Component | File Path | What It Does |
|---|---|---|
| Inventory Dashboard | `client/src/epics/E5_InventoryManagement/pages/InventoryDashboard.jsx` | Stat cards: total SKUs, total units, low-stock count, out-of-stock count; shortcut to alerts |
| Stock by Location | `client/src/epics/E5_InventoryManagement/pages/StockByLocation.jsx` | Select a location → table of all products at that location with quantity, reserved, available, and threshold indicators |
| Low Stock Alerts | `client/src/epics/E5_InventoryManagement/pages/LowStockAlerts.jsx` | List of Inventory docs where availableStock ≤ lowStockThreshold; severity colour-coded; sorted by urgency |
| Adjust Stock Modal | `client/src/epics/E5_InventoryManagement/components/AdjustStockModal.jsx` | Form to add or subtract stock; MIM submits directly; LIM submits for approval via ApprovalRequest |
| Stock Movements | `client/src/epics/E5_InventoryManagement/pages/StockMovements.jsx` | Flattened adjustments history across all inventory docs; shows who made each change and the reason |
| Location Manager | `client/src/epics/E5_InventoryManagement/pages/LocationManager.jsx` | CRUD table for warehouse/branch locations; main-warehouse flag toggle |
| Stock Transfer Page | `client/src/epics/E5_InventoryManagement/pages/StockTransfers.jsx` | LIM: request transfer form; MIM: pending transfer list with approve/reject buttons |

### Data Flow — Stock Deduction (E3 Order)

```
Customer places order (E3 createOrder)
         │
         ▼
For each item in the order:
  Inventory.findOneAndUpdate(
    { product: item.productId, location: mainWarehouseId },
    { $inc: { reservedStock: +qty, availableStock: -qty } }
  )
  Appends adjustment: { type: 'order_deduction', quantity: qty, reason: 'Customer order #...' }
         │
         ▼
AvailableStock decreases immediately — item can no longer be ordered by others
When order ships → quantity also decrements, reservedStock decrements
```

### Data Flow — Stock Addition (Manual / E5 Adjust)

```
Note: Vendor Purchase Orders (E4) track raw materials and services — NOT sellable book inventory.
Inventory for books is added manually via the Inventory Management module.

Master Inventory Manager opens Adjust Stock modal
         │
         ▼
POST /api/inventory/adjust  { product, location, quantity, type: 'Add', reason }
  Server:
  ├── validates user role (MIM = direct; LIM = creates ApprovalRequest)
  ├── increments inventory.quantity and recalculates availableQuantity
  └── appends adjustment record with adjustedBy and timestamp
         │
         ▼
New stock is immediately available for customer orders and sales orders
```

### Data Flow — Stock Transfer Request / Approval

```
Location Manager fills transfer request form
  From: [their assigned location]  To: [destination]  Product: [X]  Qty: [N]
         │
         ▼
POST /api/stock-transfers/request
  Server:
  ├── checks availableStock at source ≥ N
  ├── creates StockTransfer doc (status: Requested)
  └── decrements availableStock at source (units held)
         │
         ▼
Master Manager sees request in Stock Transfers page
         │
   ┌─────┴─────┐
Approve        Reject
   │               │
   ▼               ▼
quantity moves  held stock
to destination  restored at source
```

### Three Stock Fields Explained

Every `Inventory` doc tracks three numbers for a product at a location:

```
quantity        = total physical units present at this location
reservedStock   = units held for pending orders + pending transfers (cannot be sold)
availableStock  = quantity - reservedStock  (what customers/orders can actually get)
```

Example:
```
Quantity: 100  |  Reserved: 15  |  Available: 85
                    ↑                   ↑
              (10 in E3 orders    (what the store can still sell)
               5 in transit transfer)
```

### Role Access Summary

| Action | MIM / Admin | LIM |
|---|---|---|
| View stock at any location | Yes | No (own location only) |
| Direct stock adjustment | Yes (immediate) | No (creates ApprovalRequest) |
| Approve stock transfers | Yes | No |
| Request stock transfer | Yes | Yes |
| Create/delete locations | Yes | No |

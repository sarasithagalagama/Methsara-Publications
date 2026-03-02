# E5 – Inventory Management (Frontend)

**Epic Owner:** IT24100264 – Bandara N W C D  
**Stack:** React · Axios · React Router  
**Consumes API:** `/api/inventory` · `/api/locations` · `/api/stock-transfers`

---

## 1. Folder Structure

```
E5_InventoryManagement/
├── components/
│   └── Inventory/              – Reusable inventory table/form components
├── pages/
│   ├── InventoryManagerDashboard.jsx  – Inventory manager landing page
│   ├── InventoryManagerDashboard.css
│   ├── LowStockAlerts.jsx             – Low stock alert list and reorder actions
│   └── LowStockAlerts.css
└── services/
    └── inventoryService.js            – Axios calls for inventory, locations, stock transfers
```

---

## 2. How the Frontend Works

### Role-Scoped Views

```
master_inventory_manager logs in
        │
        ▼
InventoryManagerDashboard.jsx
        │
  inventoryService.getAllInventory()  →  GET /api/inventory/all
        │
  Shows stock for ALL locations in one table
        │
  Can: adjust stock at any location, approve/reject transfer requests

─────────────────────────────────────────────────────────

location_inventory_manager logs in
        │
        ▼
InventoryManagerDashboard.jsx (same page, different data)
        │
  inventoryService.getInventoryByLocation(user.assignedLocation)
        →  GET /api/inventory/location/:location
        │
  Shows stock for THEIR location only
        │
  Can: request stock transfers to/from other locations
```

### Stock Transfer Flow

```
location_inventory_manager requests a transfer
        │
        ▼
stockTransferService.requestTransfer({ product, fromLocation, toLocation, quantity, reason })
        │
        ▼
POST /api/stock-transfers/request → creates StockTransfer doc (status: Pending)
        │
        ▼
master_inventory_manager sees pending request in dashboard
        │
  Approve → stockTransferService.approveTransfer(id)
             PUT /api/stock-transfers/:id/approve
             → backend atomically decrements fromLocation, increments toLocation
        │
  Reject  → stockTransferService.rejectTransfer(id)
```

---

## 3. All Components & Pages

### `components/Inventory/`

Reusable inventory UI components:
- **InventoryTable** – Displays stock records with columns: product, location, quantity, reserved, available. Supports inline stock adjustment action.
- **StockAdjustmentForm** – Modal form for manual stock adjustment (product, location, +/- amount, reason). Used by master inventory manager.
- **TransferRequestForm** – Form for requesting inter-location transfers. Used by location inventory managers.

---

### `pages/InventoryManagerDashboard.jsx`

Landing page for all inventory manager roles at `/inventory/dashboard`. Displays:

- **KPI cards:** Total products tracked, total stock units, locations count, pending transfers
- **Inventory table:** Role-scoped (all locations vs. own location)
- **Stock adjustment button:** Opens `StockAdjustmentForm` (master only)
- **Pending transfers section:** Approve / reject buttons (master only) or "My pending requests" (location only)
- **Low stock banner:** Quick link to `LowStockAlerts.jsx` if any items are below reorder level

---

### `pages/LowStockAlerts.jsx`

Dedicated page at `/inventory/low-stock`. Lists all products where `availableStock < reorderLevel` for the manager's scope. Each row shows: product name, location, current stock, reorder level, and a shortcut to request a transfer or adjust stock. Allows export to CSV.

---

## 4. Service Methods

### `services/inventoryService.js`

**Inventory**

| Method | API Call | Purpose |
|---|---|---|
| `getAllInventory()` | `GET /api/inventory/all` | Master: fetch stock across all locations. |
| `getInventoryByLocation(location)` | `GET /api/inventory/location/:location` | Location manager: fetch own warehouse stock. |
| `getProductInventory(productId)` | `GET /api/inventory/product/:productId` | Get all location stocks for one product. |
| `updateInventory(data)` | `POST /api/inventory` | Create or update an inventory record. |
| `adjustStock(data)` | `POST /api/inventory/adjust` | Manual stock adjustment with reason logged. |
| `getLowStockItems(location)` | `GET /api/inventory/low-stock` | Fetch items below reorder threshold. |

**Stock Transfers**

| Method | API Call | Purpose |
|---|---|---|
| `stockTransferService.requestTransfer(data)` | `POST /api/stock-transfers/request` | Location manager requests transfer between locations. |
| `stockTransferService.getTransfers(params)` | `GET /api/stock-transfers` | Fetch all transfers (filterable by status/location). |
| `stockTransferService.approveTransfer(id)` | `PUT /api/stock-transfers/:id/approve` | Master: approve and execute stock movement. |
| `stockTransferService.rejectTransfer(id)` | `PUT /api/stock-transfers/:id/reject` | Master: reject a pending transfer. |

**Locations**

| Method | API Call | Purpose |
|---|---|---|
| `locationService.getLocations()` | `GET /api/locations` | Fetch all warehouses/branches. |
| `locationService.createLocation(data)` | `POST /api/locations` | Create new location. |
| `locationService.updateLocation(id, data)` | `PUT /api/locations/:id` | Edit location details. |
| `locationService.deleteLocation(id)` | `DELETE /api/locations/:id` | Remove a location (only if no stock assigned). |

---

## 5. Key Design Notes

- **Inventory = Product × Location:** One `Inventory` document per product-location pair. The dashboard groups these into a tree view by location.
- **availableStock = quantity − reservedStock:** The `reserved` field is incremented by E3 when an order is placed and decremented on dispatch. The frontend always shows `available` to the manager.
- **Role gating is double-enforced:** The frontend conditionally renders controls (e.g., hides "Adjust Stock" for location managers), but the backend also rejects unauthorized requests independently.

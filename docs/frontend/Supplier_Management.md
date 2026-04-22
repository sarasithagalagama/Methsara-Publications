# E4 – Supplier Management (Frontend)

**Epic Owner:** IT24100799 – Gawrawa G H Y  
**Stack:** React · Axios · React Router  
**Consumes API:** `/api/suppliers` · `/api/purchase-orders` · `/api/sales-orders`

---

## 1. Folder Structure

```
E4_SupplierManagement/
├── components/
│   └── Suppliers/
│       ├── PaymentModal.jsx         – Record a payment against a supplier's outstanding balance
│       ├── SupplierFormModal.jsx    – Create / edit supplier form in a modal dialog
│       ├── SupplierFormModal.css
│       ├── SupplierList.jsx         – Table of all suppliers/partners with actions
│       └── SupplierList.css
├── pages/
│   ├── SupplierManagerDashboard.jsx – Supplier manager landing page with KPIs
│   ├── SupplierManagerDashboard.css
│   └── supplier/                    – Nested supplier detail and order pages
└── services/
    └── supplierService.js           – Axios calls for all supplier/PO/SO endpoints
```

---

## 2. How the Frontend Works

```
Supplier Manager logs in → /supplier/dashboard
        │
        ▼
SupplierManagerDashboard.jsx
        │
  KPI cards: total vendors, total customers, outstanding payables, outstanding receivables
        │
  SupplierList.jsx  (Vendor tab | Customer tab)
        │
  Actions per row:
    ├─ Edit → SupplierFormModal.jsx  →  supplierService.updateSupplier()
    ├─ Record Payment → PaymentModal.jsx  →  supplierService.recordPayment()
    ├─ Terminate → supplierService.terminateSupplier()
    └─ View Orders → /supplier/:id  (nested detail page)
```

### Purchase Order vs Sales Order Concept

```
Vendor (they supply us)          Customer/Distributor (they buy from us)
        │                                      │
  Purchase Order (PO)                   Sales Order (SO)
  "We owe them"  →  PAYABLES            "They owe us"  →  RECEIVABLES
        │                                      │
  Record PO payment                     Record SO payment received
        │                                      │
  supplierService.recordPOPayment()     supplierService.recordSOPayment()
```

---

## 3. All Components & Pages

### `components/Suppliers/SupplierList.jsx`

Main supplier listing table. Columns: name, type (Vendor / Customer), contact, outstanding balance, status, actions. Tabs to switch between Vendors and Customers. Supports search by name or registration number.

---

### `components/Suppliers/SupplierFormModal.jsx`

Create / edit supplier form inside a `<Modal>`. Fields: company name, type, registration number, contact person, email, phone, address, payment terms (Net 30, Net 60, etc.). On submit calls `supplierService.createSupplier()` or `updateSupplier()`.

---

### `components/Suppliers/PaymentModal.jsx`

Records a payment made to a vendor (reduces `outstandingBalance`). Fields: amount, payment method, reference number, notes. On submit calls `supplierService.recordPayment()` which internally creates a `FinancialTransaction` of type "Supplier Payment" (cross-epic to E3).

---

### `pages/SupplierManagerDashboard.jsx`

Landing page for `supplier_manager` role at `/supplier/dashboard`. Displays:
- Summary KPI cards (active vendors, active customers, total payables, total receivables)
- Supplier analytics (on-time delivery rate, quality score)
- `SupplierList` component with full CRUD controls
- Purchase Orders table for vendors
- Sales Orders table for distributor/bookshop customers

---

## 4. Service Methods

### `services/supplierService.js`

| Method | API Call | Purpose |
|---|---|---|
| `getSuppliers(params)` | `GET /api/suppliers` | List all suppliers; pass `?supplierType=Vendor\|Customer` to filter. |
| `getSupplier(id)` | `GET /api/suppliers/:id` | Fetch single supplier detail. |
| `createSupplier(data)` | `POST /api/suppliers` | Create new vendor or customer partner. |
| `updateSupplier(id, data)` | `PUT /api/suppliers/:id` | Edit supplier details. |
| `deleteSupplier(id)` | `DELETE /api/suppliers/:id` | Hard delete supplier. |
| `terminateSupplier(id)` | `PUT /api/suppliers/:id/terminate` | Soft-terminate (sets status to Terminated). |
| `restoreSupplier(id)` | `PUT /api/suppliers/:id/restore` | Re-activate a terminated supplier. |
| `getTerminatedSuppliers()` | `GET /api/suppliers/terminated` | List all terminated partners. |
| `getAnalytics()` | `GET /api/suppliers/analytics` | Per-supplier KPIs. |
| `recordPayment(id, data)` | `POST /api/suppliers/:id/payment` | Record payment to vendor (decrements balance). |
| `getPurchaseOrders(params)` | `GET /api/purchase-orders` | List POs (vendor orders we receive). |
| `createPurchaseOrder(data)` | `POST /api/purchase-orders` | Create PO for a vendor. |
| `updatePOStatus(id, data)` | `PUT /api/purchase-orders/:id/status` | Advance PO lifecycle status. |
| `recordPOPayment(id, data)` | `POST /api/purchase-orders/:id/payment` | Pay against a PO. |
| `getSalesOrders(params)` | `GET /api/sales-orders` | List SOs (orders from distributors/bookshops). |
| `createSalesOrder(data)` | `POST /api/sales-orders` | Create SO for a customer distributor. |
| `updateSOStatus(id, data)` | `PUT /api/sales-orders/:id/status` | Advance SO lifecycle status. |
| `recordSOPayment(id, data)` | `POST /api/sales-orders/:id/payment` | Record payment received from customer. |


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

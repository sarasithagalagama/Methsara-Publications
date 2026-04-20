# Final Report - Methsara Publications Webstore

This file is the complete content draft for the final report. Paste it into the official module template file:

- IE2091 Final Report Template.doc
- IE2091 Final Report Cover Page.doc

## Cover Page Details

- Module: IE2091
- Project: Methsara Publications Webstore
- Group: ISP_G05
- Institution: Sri Lanka Institute of Information Technology
- Submission Month: April 2026

Team Members:
- IT24100548 - Galagama S.T
- IT24101314 - Appuhami H A P L
- IT24100191 - Jayasinghe D.B.P
- IT24100799 - Gawrawa G H Y
- IT24100264 - Bandara N W C D
- IT24101266 - Perera M.U.E

---

## 1. Executive Summary

Methsara Publications Webstore is a complete MERN-stack business platform designed for a multi-branch educational bookstore. The system digitizes operations that were previously manual and fragmented, including customer sales, supplier coordination, inventory control, financial tracking, and promotional campaign management.

The implemented solution is organized into six epics and supports role-specific operational dashboards for admin, product, finance, supplier, inventory, and marketing staff. The platform improves availability (24/7 access), reduces operational delays (automated workflows), and improves decision quality (real-time data visibility across branches).

---

## 2. Business Problem

Before implementation, the organization experienced the following issues:

- Inventory was tracked manually at branch level, causing delays and stock mismatch.
- Procurement and supplier interactions were slow and difficult to audit.
- Business reports and decision data were not available in real time.
- Customer purchase access was limited to physical store hours.
- There was no integrated role-based system for end-to-end operations.

---

## 3. Project Objectives

- Build a secure, role-driven web platform for the end-to-end publication lifecycle.
- Implement digital workflows for catalog, orders, suppliers, inventory, and promotions.
- Enable cross-branch inventory visibility and transfer controls.
- Provide checkout flexibility (customer/guest, COD, bank transfer proof upload).
- Provide finance and management dashboards with actionable operational metrics.

---

## 4. Implemented Scope by Epic

### E1 - User and Role Management (Owner: IT24100548)

Implemented:
- Customer registration and secure login with JWT.
- Role-based access control across protected routes.
- Session handling and account status controls.
- Admin user management and approval workflow support.

Key backend endpoints:
- `/api/auth/*`
- `/api/approvals/*`

### E2 - Product Catalog (Owner: IT24101314)

Implemented:
- Product CRUD with images, metadata, categories, and grading.
- Public product browsing with search/filter/sort.
- Product detail pages and review management.
- Featured and campaign-adjusted pricing display logic.

Key backend endpoints:
- `/api/products/*`
- `/api/reviews/*`
- `/api/upload/*`

### E3 - Order and Transaction (Owner: IT24100191)

Implemented:
- Cart management and checkout flow.
- Guest and authenticated order creation.
- Payment status and order status handling.
- Finance transactions, reporting, invoice/refund support.

Key backend endpoints:
- `/api/orders/*`
- `/api/cart/*`
- `/api/financial/*`

### E4 - Supplier Management (Owner: IT24100799)

Implemented:
- Supplier/customer partner management.
- Purchase order and sales order lifecycle flows.
- Payment tracking for payables/receivables.
- Dispatch request integration with inventory approval flow.

Key backend endpoints:
- `/api/suppliers/*`
- `/api/purchase-orders/*`
- `/api/sales-orders/*`

### E5 - Inventory Management (Owner: IT24100264)

Implemented:
- Multi-location inventory visibility and role-scoped access.
- Stock adjustments with audit trail.
- Inter-location stock transfer requests and approvals.
- Low-stock alerts, stats, and stock movement history.

Key backend endpoints:
- `/api/inventory/*`
- `/api/locations/*`
- `/api/stock-transfers/*`

### E6 - Promotion and Loyalty (Owner: IT24101266)

Implemented:
- Coupon management and checkout validation logic.
- Campaign-based automatic discount overlays.
- Gift voucher issuance, validation, and redemption support.
- Marketing analytics endpoints for usage visibility.

Key backend endpoints:
- `/api/coupons/*`
- `/api/gift-vouchers/*`

---

## 5. Technical Architecture

Technology stack:
- Frontend: React, React Router, Axios
- Backend: Node.js, Express
- Database: MongoDB with Mongoose
- Security: JWT-based auth, bcrypt password hashing

Architectural characteristics:
- Modular epic-based code structure (independent controllers/routes/models by domain).
- REST API contract between frontend pages/services and backend controllers.
- Role-based middleware (`protect`, `authorize`) at route level.
- Cross-epic orchestration for business transactions (for example E3 checkout uses E2, E5, E6).

---

## 6. Core End-to-End Workflows

### Workflow A: Customer Purchase

1. User browses products (E2).
2. User adds items to cart (E3).
3. User checks out with payment option and optional discount (E3 + E6).
4. Order is stored and inventory is adjusted (E3 + E5).
5. Finance records are updated (E3).

### Workflow B: Supplier Replenishment

1. Supplier manager creates purchase order (E4).
2. PO status is advanced and delivery is verified (E4).
3. Received items update branch inventory (E4 + E5).
4. Financial payment records are created/updated (E3 + E4).

### Workflow C: Stock Transfer Between Branches

1. Location manager requests transfer (E5).
2. Master inventory manager approves/rejects (E5).
3. Inventory quantities are updated atomically across locations (E5).

---

## 7. Non-Functional Coverage

Security:
- Password hashing with bcrypt.
- JWT verification and role authorization on protected APIs.

Reliability:
- Controlled status transitions in order/PO/SO processes.
- Audit-friendly movement/status histories.

Usability:
- Dashboard-oriented, role-specific UI flows.
- Search/filter and guided forms for operational tasks.

Maintainability:
- Epic-level separation and reusable service/component patterns.
- Clear controller/service boundaries and modular routes.

---

## 8. Validation and Testing Summary

Validation evidence included/expected:

- API-level verification of role restrictions:
	- Unauthorized role receives blocked response for protected endpoints.
- Functional scenario checks:
	- Product creation and browse flow.
	- Cart to checkout with coupon/voucher validation.
	- PO receive to inventory update.
	- Transfer request to approval execution.
- Data integrity checks:
	- Inventory movement logs after adjustments/transfers.
	- Transaction creation during order/refund/payment events.

---

## 9. Challenges and Lessons Learned

Key challenges:
- Managing cross-epic dependencies in transaction-critical paths.
- Keeping status transitions consistent across multiple manager roles.
- Maintaining UI consistency while supporting dark/light themes and role-specific dashboards.

Lessons learned:
- Modular epic architecture improves team parallelization.
- Route-level authorization plus frontend role gating improves safety.
- Early workflow mapping reduces integration regressions.

---

## 10. Project Outcomes

Delivered outcomes:
- A working end-to-end digital commerce and operations platform.
- Unified visibility for catalog, orders, supplier flows, inventory, and promotions.
- Role-aware dashboards and operational controls for multiple staff functions.
- A codebase that can be extended for deployment-grade enhancements.

---

## 11. Future Enhancements

- Production email service for verification and reset automation.
- Online payment gateway integration.
- Advanced analytics and forecasting modules.
- Mobile client for customer and internal operations.
- Additional workflow automation for supplier communication.

---

## 12. References

- `docs/RE_Assignment_2_Report.md`
- `docs/backend/User_And_Role_Management.md`
- `docs/backend/Product_Catalog.md`
- `docs/backend/Order_And_Transaction.md`
- `docs/backend/Supplier_Management.md`
- `docs/backend/Inventory_Management.md`
- `docs/backend/Promotion_And_Loyalty.md`
- `docs/frontend/User_And_Role_Management.md`
- `docs/frontend/Product_Catalog.md`
- `docs/frontend/Order_And_Transaction.md`
- `docs/frontend/Supplier_Management.md`
- `docs/frontend/Inventory_Management.md`
- `docs/frontend/Promotion_And_Loyalty.md`
- `README.md`

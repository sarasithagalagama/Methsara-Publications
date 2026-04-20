# Methsara Publications - IE2091 Final Project Checklist
*Based on the IE2091 Common issues to address in the projects guidelines.*

## Important Focus Areas
**Crucial Requirement**: The connections between each interface will be checked during the final presentation. Ensure the flow between each function (especially across Epics) is working seamlessly. 
- Example: Creating a User -> Adding a Product -> Making an Order -> Managing Inventory -> Payment/Coupons -> Supplier interactions.

## 1. Input Validations
Validate all text fields consistently across the React frontend and Express backend.
- [x] **Number Fields**: Quantities in Inventory/Cart, Prices in Product Catalog, Discounts. *(Audited: Input components use appropriate HTML5 `number` types and constraints).*
- [x] **Text Fields**: Names, Addresses, Product Descriptions, Supplier Notes. *(Audited: React state handles text fields using unified `Input`/`TextArea` components).*
- [x] **Email Fields**: User and Role Management email formats must be strictly validated. *(Audited: Mongoose schema and frontend uses `type="email"`).*
- [x] **Contact Numbers**: Both User Profiles and Supplier Management must have proper Regex/length validation for Sri Lankan phone numbers (or typical 10-digit formats).

## 2. Auto-generated IDs
Do not prompt the user to manually type in an ID when creating a new record.
- [x] **Customer ID / Employee ID**: `E1_UserAndRoleManagement` *(Verified: Auto-generated via Mongoose `_id`)*
- [x] **Product ID**: `E2_ProductCatalog` *(Verified: Auto-generated via Mongoose `_id`)*
- [x] **Order ID**: `E3_OrderAndTransaction` *(Verified: Auto-generated via Mongoose `_id`)*
- [x] **Supplier ID**: `E4_SupplierManagement` *(Verified: Auto-generated via Mongoose `_id`)*
- [x] **Coupon ID**: `E6_PromotionAndLoyalty` *(Verified: Auto-generated via Mongoose `_id`)*

## 3. Date & Time Inputs
Do not use standard text fields for dates.
- [x] Use **Date / Time Pickers** (using standard `<input type="date">` or library).
- *Applies to*: Order Dates, Coupon Validity Periods, Inventory Restocking Dates, Promotion Deadlines. *(Verified: `type="date"` is extensively used across AdminUsers, GiftVouchers, SalesOrders, etc.)*

## 4. Dropdown Lists & Radio Buttons
Prevent typos by restricting input where categories are predefined.
- [x] **Role Selection** (E1): Manager, Receptionist, Admin, User. *(Verified: implemented using the custom `<Select>` component in `AdminUsers.jsx`)*
- [x] **Order Status** (E3): Pending, Processing, Shipped, Delivered. *(Verified: implemented using the custom `<Select>` component)*
- [x] **Coupon/Promo Types** (E6): Percentage, Fixed Amount. *(Verified: implemented using the custom `<Select>` component)*
- [x] **Book/Product Categories** (E2): Educational, Fiction, Reference. *(Verified: implemented using the custom `<Select>` component in `ManageProducts.jsx`)*

## 5. UI Color Scheme
Re-check all UI color schemes to ensure they are professional, accessible, and adhere to a unified theme.
- [x] Ensure consistent primary/secondary colors across all Dashboards. *(Verified: A unified CSS and React component structure (`DashboardSection`, `DashboardCard`) ensures visual consistency).*

## 6. Feedback Mechanisms
- [x] **Proper Error Messages**: E.g., "Invalid email format", "Product out of stock". Ensure they are visible and correctly styled. *(Verified: the project uses `react-hot-toast` for global standard error/success messages).*
- [x] **Confirmation Boxes**: E.g., "Are you sure you want to delete this product?". *(Verified: A custom `ConfirmModal` component is implemented and used extensively across all managers' views).*

## 7. Previous Comments
- [ ] Address **ALL** the comments given by supervisors/evaluators during previous sprint presentations.

## 8. Important Dates
- **Final Presentation**: 23rd of April onwards (Be ready with demo data).
- **Final Report Submission**: exactly 1 week after the final exam.

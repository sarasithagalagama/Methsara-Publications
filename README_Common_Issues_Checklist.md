# Methsara Publications - IE2091 Final Project Checklist
*Based on the IE2091 Common issues to address in the projects guidelines.*

## Important Focus Areas
**Crucial Requirement**: The connections between each interface will be checked during the final presentation. Ensure the flow between each function (especially across Epics) is working seamlessly. 
- Example: Creating a User -> Adding a Product -> Making an Order -> Managing Inventory -> Payment/Coupons -> Supplier interactions.

## 1. Input Validations
Validate all text fields consistently across the React frontend and Express backend.
- [ ] **Number Fields**: Quantities in Inventory/Cart, Prices in Product Catalog, Discounts.
- [ ] **Text Fields**: Names, Addresses, Product Descriptions, Supplier Notes.
- [ ] **Email Fields**: User and Role Management email formats must be strictly validated.
- [ ] **Contact Numbers**: Both User Profiles and Supplier Management must have proper Regex/length validation for Sri Lankan phone numbers (or typical 10-digit formats).

## 2. Auto-generated IDs
Do not prompt the user to manually type in an ID when creating a new record.
- [ ] **Customer ID / Employee ID**: `E1_UserAndRoleManagement`
- [ ] **Product ID**: `E2_ProductCatalog`
- [ ] **Order ID**: `E3_OrderAndTransaction`
- [ ] **Supplier ID**: `E4_SupplierManagement`
- [ ] **Coupon ID**: `E6_PromotionAndLoyalty`

## 3. Date & Time Inputs
Do not use standard text fields for dates.
- [ ] Use **Date / Time Pickers** (e.g., standard `<input type="date">` or a React library like react-datepicker) instead of typing manually.
- *Applies to*: Order Dates, Coupon Validity Periods, Inventory Restocking Dates, Promotion Deadlines.

## 4. Dropdown Lists & Radio Buttons
Prevent typos by restricting input where categories are predefined.
- [ ] **Role Selection** (E1): Manager, Receptionist, Admin, User (Use Dropdowns/Radio buttons).
- [ ] **Order Status** (E3): Pending, Processing, Shipped, Delivered.
- [ ] **Coupon/Promo Types** (E6): Percentage, Fixed Amount.
- [ ] **Book/Product Categories** (E2): Educational, Fiction, Reference.

## 5. UI Color Scheme
Re-check all UI color schemes to ensure they are professional, accessible, and adhere to a unified theme across the entire application (Methsara Publications).
- Ensure consistent primary/secondary colors across all Dashboards (Finance Manager, Marketing Manager, Product Manager, etc.).
- Useful Tools: [Coolors](https://coolors.co/), UI Color Picker.

## 6. Feedback Mechanisms
- [ ] **Proper Error Messages**: E.g., "Invalid email format", "Product out of stock". Ensure they are visible and correctly styled.
- [ ] **Confirmation Boxes**: E.g., "Are you sure you want to delete this product?" / "Confirm Order Placement". Should be implemented using React state/modals (not just raw JS `alert()`).

## 7. Previous Comments
- [ ] Address **ALL** the comments given by supervisors/evaluators during previous sprint presentations.

## 8. Important Dates
- **Final Presentation**: 23rd of April onwards (Be ready with demo data).
- **Final Report Submission**: exactly 1 week after the final exam.

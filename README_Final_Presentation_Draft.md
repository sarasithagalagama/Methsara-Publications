# Methsara Publications - IE2091 Final Presentation Draft

## Presentation Specifications
- **Duration**: 30 minutes total.
- **Structure**: Marketing Video Introduction -> Individual Component Demos -> VIVA (Code/Database Review).
- **Member Presentation Time**: ~3 minutes per group member (assuming 6 members for 6 Epics, that's 18 minutes of pure demo).
- **Style**: "Marketing Presentation" format. **No PPT slides required**. Instead, focus completely on the live application.

## 1. Introduction (2-3 mins)
- Screen the **Marketing Video** (See `README_Marketing_Video_Plan.md`) as the primary solution narrative. 
- Briefly explain what Methsara Publications system is capable of solving.

## 2. Integrated Demonstration Flow (Logical Order) (18-20 mins)
Demonstrate the *integrated* product. Do not show fragmented, individual pieces.
*Pro-tip: Utilize a "Demo Button" to auto-fill large forms during the presentation to save time.*

### A. E1_UserAndRoleManagement
- **Presenter**: [Member Name]
- **Flow**: Register a new Customer and log in. Show Admin dashboard creating a Staff user. 
- **Key Points**: Input validation on Email/Contact, Auto-generated Customer IDs.

### B. E2_ProductCatalog
- **Presenter**: [Member Name]
- **Flow**: Log in as Product Manager. Perform a quick CRUD operation: Add a new educational book (use Demo Button to auto-fill), update price, show newly added book in the frontend catalog.
- **Key Points**: Image upload handling, dropdown for Book Category.

### C. E6_PromotionAndLoyalty
- **Presenter**: [Member Name]
- **Flow**: Log in as Marketing Manager. Create a promo code / coupon for the new book (with Date Picker).
- **Key Points**: Date picker validation, auto-generated Coupon ID.

### D. E3_OrderAndTransaction
- **Presenter**: [Member Name]
- **Flow**: As a Customer, apply the created coupon to the cart, checkout, and process payment. Log in as Finance/Sales Manager to view/approve the order.
- **Key Points**: Correct price deduction, Order status dropdowns.

### E. E5_InventoryManagement & E4_SupplierManagement
- **Presenter**: [Member Names]
- **Flow**: Show inventory levels dropping after the customer places the order. Automatically or manually trigger a restock request to a Supplier.
- **Key Points**: System integration between Transaction, Inventory, and Supplier.

## 3. Mandatory Demonstration Checklist for Each Component
While demoing, each member *must* explicitly highlight:
- [ ] **CRUD Operations** using real/substantial dummy data.
- [ ] **UI Design** & Aesthetic consistency matches the Marketing theme.
- [ ] **Input Validations** (Purposefully break a rule to show the error message, e.g., type an invalid email).
- [ ] **Unit Tests** (Show terminal or test coverage report proving unit tests were performed).
- [ ] **Report Generation** (Generate at least **1 report/dashboard** per member component, e.g., Sales Report, Inventory Report).
- [ ] **Future Work** (Briefly mention what could be enhanced for their specific Epic).

## 4. VIVA and Technical Review (10-15 mins)
- **Preparation**: The VIVA focuses on Code and Database review.
- Every member must completely understand their code (React components, Express controllers) and their respective MongoDB schemas (Mongoose).
- Have your VS Code open and ready to explain routing, `server.js` integration, and specific logic.
- Ensure the **Jira Board** is 100% updated before stepping into the presentation.

## Presentation Prep actions
- Deploy or run locally (ensure laptop connects flawlessly to projector).
- Populate the MongoDB Atlas database with **plenty of data** beforehand so lists and dashboards don't look empty.

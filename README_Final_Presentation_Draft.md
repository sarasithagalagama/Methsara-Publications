# Methsara Publications - IE2091 Final Presentation Draft

## Presentation Specifications
- **Date**: 23rd of April onwards.
- **Duration**: 30 minutes total (15 mins Presentation + 15 mins VIVA).
- **Passing Criteria**: Must score >= 45% for the final presentation and viva to pass the module.
- **Structure**: Marketing Video Introduction -> Integrated Component Demos in Logical Order -> VIVA (Code/Database Review).
- **Member Presentation Time**: ~3 minutes per group member (assuming 6 members for 6 Epics, that's 18 minutes of pure demo).
- **Style**: "Marketing Presentation" format. **No PPT slides required**. Instead, focus completely on the live application.
- **Crucial Metric**: The connections between each interface will be checked during the final presentation. Ensure the flow between each function across Epics is working properly.

## 1. Introduction (2-3 mins)
- Screen the **Marketing Video** (See `README_Marketing_Video_Plan.md`) as the primary solution narrative. 
- Briefly explain what Methsara Publications system is capable of solving.

## 2. Integrated Demonstration Flow (Logical Order) (15-18 mins)
Demonstrate the *integrated* product. Do not show fragmented, individual pieces. Focus on demonstrating your product in a logical order (e.g., customer, order, payment).
*Pro-tip: Utilize a "Demo Button" to auto-fill large forms during the presentation to save time.*

### A. E1_UserAndRoleManagement
- **Presenter**: Galagama S.T (IT24100548)
- **Flow**: Register a new Customer and log in. Show Admin dashboard creating a Staff user.
- **Key Points**: Input validation (Email/Contact Number), Auto-generated Customer/Employee IDs. Proper error messages if registration fails.

### B. E2_ProductCatalog
- **Presenter**: Appuhami H A P L (IT24101314)
- **Flow**: Log in as Product Manager. Perform a quick CRUD operation: Add a new educational book (use Demo Button to auto-fill), update price, show newly added book in the frontend catalog available for customers.
- **Key Points**: Image upload handling, dropdown list for Book Category, Confirmation boxes on deletion.

### C. E6_PromotionAndLoyalty
- **Presenter**: Perera M.U.E (IT24101266)
- **Flow**: Log in as Marketing Manager. Create a promo code / coupon for the new book.
- **Key Points**: Date/Time picker for validity, Auto-generated Coupon ID, Dropdown for Promo Type.

### D. E3_OrderAndTransaction
- **Presenter**: Jayasinghe D.B.P (IT24100191)
- **Flow**: As a Customer, apply the created coupon to the cart, checkout, and process payment. Log in as Finance/Sales Manager to view/approve the order.
- **Key Points**: Connections between interfaces working properly (Cart -> Checkout -> Payment -> Order Dashboard), Order status dropdowns.

### E. E5_InventoryManagement
- **Presenter**: Bandara N W C D (IT24100264)
- **Flow**: Show inventory levels dropping after the customer places the order. Automatically trigger low-stock alerts.
- **Key Points**: System integration between Transaction and Inventory.

### F. E4_SupplierManagement
- **Presenter**: Gawrawa G H Y (IT24100799)
- **Flow**: Manually trigger a restock request to a Supplier based on the low inventory. 
- **Key Points**: Auto-generated Supplier IDs, contact number validation, sending stock requests.
## 3. Mandatory Demonstration Checklist for Each Component
While demoing, each member *must* explicitly highlight:
- [ ] **CRUD Operations**: Demonstrate creating, reading, updating, and deleting using real/substantial dummy data.
- [ ] **UI Design**: Aesthetic consistency matches the Marketing theme. Verify color schemes are professional and accessible.
- [ ] **Input Validations**: Purposefully break a rule to show the error message (e.g., type an invalid email or text in a number field).
- [ ] **Input Components**: Showcase the use of Date/Time pickers and Dropdowns/Radio buttons instead of allowing users to type where categories are known.
- [ ] **Feedback Mechanisms**: Show proper error messages and confirmation boxes.
- [ ] **Unit Tests**: Show terminal or test coverage report proving unit tests were performed.
- [ ] **Report Generation**: Generate at least **1 report/dashboard** per member component summarizing outputs.
- [ ] **Future Work**: Briefly mention what could be enhanced for their specific Epic.
- [ ] **Previous Comments**: Be prepared to demonstrate that you addressed all the comments given during previous presentations.

## 4. VIVA and Technical Review (15 mins)
- **Preparation**: The VIVA is a 15-minute session following the presentation, mainly focusing on Code and Database review.
- Every member must completely understand their code (React components, Express controllers) and their respective MongoDB schemas (Mongoose).
- Have your VS Code open and ready to explain routing, `server.js` integration, and specific logic.
- Ensure the **Jira Board** is 100% updated before stepping into the presentation.

## 5. Pre-Presentation Checklist

To ensure a smooth delivery on presentation day, please review these final preparation steps:

- [ ] **Technical Readiness**: Deploy your application or ensure it runs flawlessly in your local environment. Don't forget to verify that your laptop connects to the projector without any display issues!
- [ ] **Data Preparation**: Populate your MongoDB Atlas database with a realistic amount of dummy data beforehand. Having rich data makes your dashboards come alive and ensures your demonstration is engaging and impactful.

You've got this! Good luck with the presentation!

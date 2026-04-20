# Final Presentation Content - ISP_G05

Use this file to build the final slide deck directly. It includes exact slide objectives, key bullet content, and suggested speaker notes.

## Slide 1 - Title

On slide:
- Methsara Publications Webstore
- Module: IE2091
- Group: ISP_G05
- Team members and student IDs

Speaker note:
- Introduce the project as a full-stack digital transformation for a multi-branch educational bookstore.

## Slide 2 - Organization Context

On slide:
- Domain: Educational publishing and distribution
- Branch network: Main + Balangoda + Kottawa
- Product types: Textbooks, revision guides, exam prep materials

Speaker note:
- Explain how branch operations and educational seasonality make inventory and order coordination critical.

## Slide 3 - Problem Statement

On slide:
- Manual stock and supplier processes
- Limited visibility across locations
- Slow restocking and transfer cycle
- Customer purchase limited by physical operations

Speaker note:
- Emphasize that the core issue was not only sales, but lack of integrated operational control.

## Slide 4 - Proposed Solution

On slide:
- One integrated MERN platform
- Customer + staff workflows in same system
- Role-based secure access
- Real-time operational dashboards

Speaker note:
- Position the project as both an e-commerce system and an internal operations platform.

## Slide 5 - Architecture Overview

On slide:
- Frontend: React
- Backend: Node.js + Express REST API
- Database: MongoDB + Mongoose
- Security: JWT + bcrypt + role middleware

Speaker note:
- Mention epic-based modular structure used for team parallel development.

## Slide 6 - Epic Structure

On slide:
- E1 User and Role Management
- E2 Product Catalog
- E3 Orders and Transactions
- E4 Supplier Management
- E5 Inventory Management
- E6 Promotion and Loyalty

Speaker note:
- Briefly map each epic to one business function owner.

## Slide 7 - E1 and E2 Highlights

On slide:
- Auth, RBAC, session handling
- Staff and customer role routing
- Product CRUD, search/filter/sort, review workflow
- Image upload and category management

Speaker note:
- Show one login flow and one product-management screen.

## Slide 8 - E3 Highlights

On slide:
- Cart and checkout (user + guest)
- COD and bank transfer proof support
- Order lifecycle and payment status management
- Finance dashboard and transaction logs

Speaker note:
- Explain that order creation orchestrates product, inventory, and promotion logic.

## Slide 9 - E4 and E5 Highlights

On slide:
- Supplier/customer partner lifecycle
- Purchase orders and sales orders
- Dispatch request approval gate
- Stock adjustment, transfer approval, low-stock alerts

Speaker note:
- Highlight cross-epic integration where inventory and supplier actions are tightly linked.

## Slide 10 - E6 Highlights

On slide:
- Coupon validation and application
- Campaign-based automatic discounts
- Gift voucher issue and redemption
- Marketing analytics endpoints

Speaker note:
- Clarify campaign vs coupon vs voucher differences.

## Slide 11 - Data and API Snapshot

On slide:
- Core collections: users, products, orders, suppliers, inventory, transfers, coupons
- Sample APIs:
	- `/api/auth/*`
	- `/api/products/*`
	- `/api/orders/*`
	- `/api/inventory/*`
	- `/api/coupons/*`

Speaker note:
- Mention secure route controls and typed status flows for consistency.

## Slide 12 - Quality and NFR Coverage

On slide:
- Security: Auth + RBAC + hashed credentials
- Reliability: Controlled status transitions + logging
- Usability: Dashboard-driven role UX
- Maintainability: Modular epic architecture

Speaker note:
- Keep this short and evidence-driven.

## Slide 13 - Team Contributions

On slide:
- IT24100548 - E1 User and Role
- IT24101314 - E2 Product Catalog
- IT24100191 - E3 Order and Transaction
- IT24100799 - E4 Supplier Management
- IT24100264 - E5 Inventory Management
- IT24101266 - E6 Promotion and Loyalty

Speaker note:
- Mention integration and testing were done collaboratively across epics.

## Slide 14 - Challenges and Resolutions

On slide:
- Cross-epic transaction dependencies
- Status consistency across multiple manager roles
- Theme/UX consistency across dashboards
- Data integrity during stock/order updates

Speaker note:
- Provide one concrete fix example for each challenge.

## Slide 15 - Outcomes and Impact

On slide:
- End-to-end working platform delivered
- Faster operational workflows
- Better branch-level visibility
- Improved readiness for scale and automation

Speaker note:
- Tie outcomes back to the original business problems.

## Slide 16 - Future Roadmap

On slide:
- Online payment gateway
- Email automation
- Mobile companion app
- Advanced analytics and forecasting

Speaker note:
- Position future items as incremental upgrades to current architecture.

## Slide 17 - Closing and Q&A

On slide:
- Thank you
- Questions
- Team details

Speaker note:
- Invite technical and business questions.

---

## Live Demo Script (6-8 minutes)

1. Login with two roles (Admin and Inventory Manager) to prove role-based routing.
2. Show product search/filter and one product detail page.
3. Show cart to checkout flow including coupon/voucher validation.
4. Show supplier order flow and pending dispatch request.
5. Show inventory transfer request and approval queue.
6. Show marketing coupon/campaign management screen.

---

## Slide Asset Checklist

- Dashboard screenshots for each epic.
- One architecture diagram.
- One API evidence screenshot (authorized + unauthorized route behavior).
- One workflow diagram (order or transfer).
- One before/after operational comparison slide.

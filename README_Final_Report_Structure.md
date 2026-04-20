# Methsara Publications - IE2091 Final Report Structure

## Formatting Rules (Crucial)
- **Cover Page**: Use “IE2091 Final report Cover Page.doc”. Remove blue lines, insert project details. ALL lines must be black.
- **Font Settings**: Times New Roman, 12 pts for Main text. Line spacing: 1.5.
- **Page Limits**: Max 50 pages (excluding appendices).
- **Numbering**: Number every image and data table. Refer to them in the text (e.g., "As seen in Table 2..."). Page numbers must appear on the lower right-hand corner (excluding Cover Page).
- **Draft Review**: Must show draft to supervisor, get comments, apply corrections before final Courseweb upload.

## Report Sections & Mark Breakdown (Total: 10% of Final Grade)
Ensure EACH member contributes to their respective Epic within these sections.

### 1. Abstract (4%)
- Summary of Methsara Publications webstore.
- High-level overview of the MERN architecture and the core business problem solved.

### 2. Problem Statement (5%)
- Explain the real-world issues faced by Methsara Publications (e.g., lack of synchronized inventory, manual supplier orders, inefficient product cataloging, messy user permission management).

### 3. Product Scope (5%)
- Clearly list the 6 Epics / modules covered in this project:
  1. User & Role Management
  2. Product Catalog
  3. Order & Transaction
  4. Supplier Management
  5. Inventory Management
  6. Promotion & Loyalty
- Emphasize what is *in* scope and *out* of scope.

### 4. Project Report Structure (3%)
- Just a brief chapter explaining how this 50-page report is organized.

### 5. Requirements and Analysis (10%)
- Summary of Functional and Non-Functional Requirements.
- Must include context from previous RE assignments, including use cases related to the 6 Epics.

### 6. Design (15%)
- **System Architecture**: Highlighting the React frontend reacting to the Node.js/Express backend, interacting with MongoDB Atlas.
- **Database/Schema Design**: Add your Entity Relationship Diagram or Mongoose Schema relationships.
- **UI/UX Design**: Include a few selected wireframes or screenshots of the customized Methsara Dashboards.

### 7. Implementation (15%)
- Discuss the tech stack (React, Node, Express, MongoDB).
- Highlight key logic in your components (e.g., How JWT auth was implemented in `E1`, how image uploads work in `E2`, how coupons are verified in `E6`).

### 8. Testing (10%)
- **Unit Testing / Integration Testing**: Show examples of Jest tests or Postman API testing performed on the backend controllers.
- Test Cases table with Pass/Fail status. Include input validation test scenarios.

### 9. Assessment of Project Results (10%)
- To what extent did the final product meet the original problem statement?
- Share the success of the integrated features (e.g., Customer can buy without crashing the server).

### 10. Lessons Learned (10%)
- Technical mapping: Learning MERN stack, overcoming MongoDB connectivity issues, mastering React Hooks.
- Soft skills: Team coordination across 6 discrete Epics, Git version control, Jira board management.

### 11. Future Work (10%)
- Specific upcoming features. (E.g., Integrating a real Payment Gateway for E3, adding AI recommendations for E2, automated supplier bidding for E4).

### 12. References (3%)
- IEEE or APA style referencing for all external libraries, tools, and tutorials used.

## Appendices (Does NOT count to 50 pages)
- Any extra long code snippets.
- Detailed test cases if they take up too much room.

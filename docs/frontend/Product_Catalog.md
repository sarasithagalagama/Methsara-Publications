# E2 – Product Catalog (Frontend)

**Epic Owner:** IT24101314 – Appuhami H A P L  
**Stack:** React · Axios · React Router  
**Consumes API:** `/api/products` · `/api/reviews` · `/api/upload`

---

## 1. Folder Structure

```
E2_ProductCatalog/
├── components/
│   └── Products/
│       ├── ProductCard.jsx      – Single product tile (image, title, price, rating)
│       ├── ProductDetail.jsx    – Full product detail view component
│       ├── ProductList.jsx      – Grid/list of ProductCards with filtering UI
│       └── Products.css
├── pages/
│   ├── ProductList.jsx          – /products page (public browsing)
│   ├── ProductList.css
│   ├── ProductDetail.jsx        – /products/:id page (single product view)
│   ├── ProductDetail.css
│   ├── ManageProducts.jsx       – Product manager: CRUD table for all products
│   ├── ManageProducts.css
│   ├── CategoryManager.jsx      – Product manager: manage product categories
│   ├── ProductManagerDashboard.jsx  – Product manager landing page with KPIs
│   ├── ProductManagerDashboard.css
│   ├── Wishlist.jsx             – Customer's saved/wishlist products
│   └── Wishlist.css
└── services/
    └── productService.js        – Axios calls for all product/review endpoints
```

---

## 2. How the Frontend Works

```
Customer visits /products
        │
        ▼
ProductList.jsx (page)
        │
  renders ProductList component
        │
        ▼
productService.getProducts(filters)  →  GET /api/products?search=&grade=...
        │
        ▼
ProductCard.jsx  ×  N  (one per product)
        │
  click a card
        │
        ▼
/products/:id  →  ProductDetail.jsx (page)
        │
productService.getProduct(id)  →  GET /api/products/:id
        │
  renders: images, description, reviews, add-to-cart button
```

### Product Manager Flow

```
Product Manager logs in → redirected to /product-manager/dashboard
        │
        ▼
ProductManagerDashboard.jsx
        │
        ├─ "Manage Products" → ManageProducts.jsx
        │         │
        │   CRUD table → productService.create/update/delete/archive
        │
        └─ "Manage Categories" → CategoryManager.jsx
                  │
            category CRUD → productService.getCategories / createCategory / etc.
```

---

## 3. All Components & Pages

### `components/Products/ProductCard.jsx`

Displays a product in grid view: cover image, title, author, price (with discounted price overlaid if a campaign is active), average star rating, and an "Add to Cart" button. Navigates to `/products/:id` on click.

---

### `components/Products/ProductList.jsx`

Renders a responsive grid of `ProductCard` components. Accepts `products` array as prop. Used by both the public `ProductList` page and embedded search results.

---

### `components/Products/ProductDetail.jsx`

Full product view component: image gallery, full description, metadata (ISBN, grade, publisher), reviews list, review submission form, and related products section.

---

### `pages/ProductList.jsx`

Public product browsing page at `/products`. Contains the filter sidebar (grade, subject, price range) and sort controls. Calls `productService.getProducts()` on filter change with debounce.

---

### `pages/ProductDetail.jsx`

Full product page at `/products/:id`. Fetches product by route param. Renders the `ProductDetail` component. Shows "Add to Cart" (requires login) and "Add to Wishlist" buttons.

---

### `pages/ManageProducts.jsx`

Staff-only page at `/product-manager/products`. Paginated product table with:
- Create new product form (with image upload via `POST /api/upload/product-image`)
- Inline edit fields
- Archive / unarchive toggle
- Delete with confirmation dialog

---

### `pages/CategoryManager.jsx`

Staff-only page for managing product categories. Create, rename, and delete categories. Shows product count per category (delete is blocked if products are assigned).

---

### `pages/ProductManagerDashboard.jsx`

Landing dashboard for `product_manager` role. Displays KPI cards (total products, low stock alerts, pending reviews, top-viewed products). Navigation links to ManageProducts and CategoryManager.

---

### `pages/Wishlist.jsx`

Customer page at `/wishlist`. Shows products the customer has saved. Allows removing items and adding them to cart directly. Uses localStorage or a backend wishlist endpoint.

---

## 4. Service Methods

### `services/productService.js`

| Method | API Call | Purpose |
|---|---|---|
| `getProducts(filters)` | `GET /api/products` | Browse with search, grade, subject, price range, sort filters. |
| `getProduct(id)` | `GET /api/products/:id` | Fetch single product with reviews. |
| `createProduct(data)` | `POST /api/products` | Create product (Product Mgr / Admin). |
| `updateProduct(id, data)` | `PUT /api/products/:id` | Partial update (Product Mgr / Admin). |
| `deleteProduct(id)` | `DELETE /api/products/:id` | Hard delete product. |
| `archiveProduct(id)` | `PUT /api/products/:id/archive` | Soft-delete (hide from public). |
| `unarchiveProduct(id)` | `PUT /api/products/:id/unarchive` | Restore archived product. |
| `addReview(id, data)` | `POST /api/products/:id/reviews` | Submit customer review. |
| `getCategories()` | `GET /api/products/categories` | Fetch all categories with product counts. |
| `createCategory(data)` | `POST /api/products/categories` | Create new category. |
| `renameCategory(id, data)` | `PUT /api/products/categories/:id` | Rename a category. |
| `deleteCategory(id)` | `DELETE /api/products/categories/:id` | Delete empty category. |
| `uploadImage(formData)` | `POST /api/upload/product-image` | Upload product cover image; returns URL. |
| `getFeatured()` | `GET /api/products/featured` | Fetch featured products for homepage. |
| `getRelated(id)` | `GET /api/products/:id/related` | Fetch related products (same category/grade). |


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

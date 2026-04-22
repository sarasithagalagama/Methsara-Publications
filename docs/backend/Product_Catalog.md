# E2 – Product Catalog

**Epic Owner:** IT24101314 – Appuhami H A P L  
**Stack:** Node.js · Express · Mongoose · MongoDB · Multer (file upload)  
**Base URL:** `/api/products` · `/api/reviews` · `/api/upload`

---

## 1. Folder Structure

```
E2_ProductCatalog/
├── controllers/
│   ├── productController.js   – Full product CRUD, categories, reviews, analytics
│   └── reviewController.js   – Review creation and retrieval (standalone)
├── middleware/
│   └── (uses E1 auth middleware)
├── models/
│   ├── Product.js             – Product schema with grade/examType enums
│   ├── Review.js              – Customer review schema
│   └── Category.js            – Product category schema
├── routes/
│   ├── productRoutes.js       – Product & category endpoints
│   ├── reviewRoutes.js        – Review endpoints
│   └── uploadRoutes.js        – Image upload via Multer
└── uploads/                   – Uploaded product images stored here
```

---

## 2. How the Backend / API Works

```
HTTP Request  (e.g., POST /api/products)
        │
        ▼
   server.js  ──► app.use('/api/products', productRoutes)
                              │
                              ▼
                   productRoutes.js (router)
                              │
                    ┌─────────┴─────────┐
                    │ protect + authorize │   ← JWT check + role check
                    └─────────┬─────────┘
                              │
                              ▼
                   productController.js
                       createProduct()
                              │
                    ┌─────────┴─────────┐
                    │   Mongoose save    │   ← validates + inserts to MongoDB
                    └─────────┬─────────┘
                              │
                              ▼
                    { success: true, data: {...} }
```

**Image Upload Flow:**
```
POST /api/upload/product-image
        │
        ▼
  uploadRoutes.js → Multer middleware
        │         (filters: only image/*, max 5MB)
        │
        ▼
  File saved to: epics/E2_ProductCatalog/uploads/
        │
        ▼
  Response: { url: '/uploads/filename.jpg' }
        │
        ▼
  That URL is stored in Product.images[]
```

---

## 3. All Functions

### `productController.js`

| Function | Purpose | Auth |
|---|---|---|
| `getProducts(req, res)` | Browse products with search (title, author, ISBN), filter (category, grade, examType, price range, availability), sort (price, rating, newest), paginate. Also overlays Campaign discounts on returned prices. | Public |
| `getProduct(req, res)` | Get single product by ID. Populates reviews. Overlays active Campaign discount. Increments view count. | Public |
| `createProduct(req, res)` | Create new product. Validates required fields. Links to existing Category. | Product Mgr / Admin |
| `updateProduct(req, res)` | Partial update any product field. | Product Mgr / Admin |
| `deleteProduct(req, res)` | Hard delete a product (removes from DB). Also deletes associated reviews. | Product Mgr / Admin |
| `archiveProduct(req, res)` | Soft-delete: sets `isArchived: true`. Product no longer appears in public listings. | Product Mgr / Admin |
| `unarchiveProduct(req, res)` | Restores an archived product: sets `isArchived: false`. | Product Mgr / Admin |
| `addReview(req, res)` | Customer submits a review. Checks `isVerifiedPurchase` (must have bought the product). Updates product's average rating. | Customer |
| `moderateReview(req, res)` | Product manager approves or hides a review (`isApproved` flag). | Product Mgr / Admin |
| `toggleReviewHelpful(req, res)` | Adds or removes user from `helpfulVotes` array on Review. | Any logged-in user |
| `getRelatedProducts(req, res)` | Returns products in the same category and grade, excluding the current product. | Public |
| `getCategories(req, res)` | Returns all categories with a count of active products in each. | Public |
| `createCategory(req, res)` | Create a new product category. | Product Mgr / Admin |
| `renameCategory(req, res)` | Rename an existing category. | Product Mgr / Admin |
| `deleteCategory(req, res)` | Delete a category, only if no products are assigned to it. | Product Mgr / Admin |
| `getProductAnalytics(req, res)` | Returns sales count, view count, review stats per product. | Product Mgr / Admin |
| `getFeatured(req, res)` | Returns products where `isFeatured: true`. | Public |
| `getByGrade(req, res)` | Returns products filtered by a specific exam grade. | Public |

### `reviewController.js`

| Function | Purpose | Auth |
|---|---|---|
| `getReviews(req, res)` | Get all approved reviews for a product, sorted by date. | Public |
| `createReview(req, res)` | Alternative standalone review creation. Enforces one-review-per-product-per-user. | Customer |

---

## 4. CRUD API Endpoints

### Product Routes — `/api/products`

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/` | No | — | Browse all products (filter/search/sort) |
| GET | `/categories` | No | — | List all categories |
| POST | `/categories` | Yes | Product Mgr / Admin | Create category |
| GET | `/:id/related` | No | — | Related products |
| GET | `/:id` | No | — | Product detail |
| POST | `/:id/reviews` | Yes | Customer | Submit review |
| PUT | `/:id/reviews/:reviewId/helpful` | Yes | Any | Toggle helpful vote |
| POST | `/` | Yes | Product Mgr / Admin / Mktg Mgr | Create product |
| PUT | `/:id` | Yes | Product Mgr / Admin / Mktg Mgr | Update product |
| DELETE | `/:id` | Yes | Product Mgr / Admin | Delete product |
| PUT | `/:id/archive` | Yes | Product Mgr / Admin | Archive product |
| PUT | `/:id/unarchive` | Yes | Product Mgr / Admin | Unarchive product |
| GET | `/analytics/:id` | Yes | Product Mgr / Admin | Product analytics |
| PUT | `/:id/reviews/:reviewId/moderate` | Yes | Product Mgr / Admin | Moderate review |

### Upload Routes — `/api/upload`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/product-image` | Yes | Upload image, returns URL path |

---

## 5. Database — How It Works & Where Data Is Saved

### MongoDB Collections

#### `products` (model: `Product.js`)
```
{
  _id: ObjectId,
  title: String (required),
  author: String (required),
  ISBN: String (unique),
  description: String,
  price: Number (required, min: 0),
  images: [String]        ← array of URL paths like '/uploads/abc.jpg'
  category: ObjectId (ref: Category),
  grade: String (enum: Grade 1–13, A/L, O/L, etc.),
  examType: String (enum: Local, London, Cambridge, etc.),
  publisher: String,
  language: String (enum: English, Sinhala, Tamil),
  stock: Number (min: 0),
  isFeatured: Boolean (default: false),
  isArchived: Boolean (default: false),
  viewCount: Number (default: 0),
  salesCount: Number (default: 0),
  averageRating: Number (default: 0),
  numReviews: Number (default: 0),
  reviews: [ObjectId] (ref: Review),
  createdAt: Date,
  updatedAt: Date
}
```

**Soft Delete:** `isArchived: true` hides products from public browsing without removing them from the database. You can restore them later.

**Campaign Discount Overlay:** When a product is returned by the API, `Campaign.getDiscountedPrice(product)` is called. This queries the `Campaign` collection for any active campaigns that include this product's grade or category and applies the best available discount to the returned price. The original `price` in MongoDB is not modified.

#### `reviews` (model: `Review.js`)
```
{
  _id: ObjectId,
  product: ObjectId (ref: Product),
  user: ObjectId (ref: User),
  rating: Number (required, 1–5),
  comment: String (required),
  isVerifiedPurchase: Boolean (default: false),
  isApproved: Boolean (default: true),
  helpfulVotes: [ObjectId] (ref: User),
  createdAt: Date
}
```

**Verified Purchase:** When a review is created, the controller checks if the user has a completed order containing this product. If yes, `isVerifiedPurchase: true` is set, which adds a badge in the UI.

**One Per User:** A compound index `{ product: 1, user: 1 }` with `unique: true` prevents duplicate reviews.

#### `categories` (model: `Category.js`)
```
{
  _id: ObjectId,
  name: String (required, unique),
  description: String,
  createdAt: Date
}
```

**Relationships:**
- `products.category` → `categories` (many-to-one)
- `products.reviews` → `reviews` (one-to-many)
- `reviews.user` → `users` (many-to-one from E1)

**File Storage:**
Product images are saved to the filesystem at:
```
epics/E2_ProductCatalog/uploads/<generated-filename>.jpg
```
The URL path stored in MongoDB is `/uploads/<filename>`. The Express server serves this folder as static files.

---

## 6. Validations Used

### Mongoose Schema (Product.js)
```javascript
title:  { required: [true, 'Title is required'], trim: true }
price:  { required: true, min: [0, 'Price cannot be negative'] }
ISBN:   { unique: true, sparse: true }  // sparse: allows multiple null ISBNs
grade:  { enum: ['Grade 1','Grade 2',...,'A/L','O/L'] }
examType: { enum: ['Local','London','Cambridge','Edexcel'] }
language: { enum: ['English','Sinhala','Tamil'] }
```

### Mongoose Schema (Review.js)
```javascript
rating:  { required: true, min: 1, max: 5 }
comment: { required: true, minlength: 10 }
```

### Controller-Level Validations
- **createProduct:** verifies `category` ObjectId exists in `Category` collection
- **addReview:** checks user has not already reviewed this product (compound unique index), checks verified purchase
- **deleteCategory:** queries `Product.countDocuments({ category: id })` — rejects if count > 0
- **Multer (upload):** `fileFilter` checks `mimetype.startsWith('image/')`, `limits.fileSize: 5 * 1024 * 1024` (5 MB max)

---

## 7. User Stories

| # | As a… | I want to… | So that… |
|---|---|---|---|
| US-2.1 | Customer | Browse all products with search by title, author, or ISBN | I can quickly find the books I am looking for |
| US-2.2 | Customer | Filter products by grade, category, exam type, price range, and language | I see only the publications relevant to my education level |
| US-2.3 | Customer | View a product's full details (description, images, specs, reviews) | I have enough information to decide whether to purchase |
| US-2.4 | Customer | See campaign-discounted prices automatically on product listings | I know the current sale price without entering any code |
| US-2.5 | Customer | Submit a star rating and review for a product I have purchased | I can share my feedback with other buyers |
| US-2.6 | Customer | Mark another customer's review as helpful | I can signal which reviews are most useful to others |
| US-2.7 | Product Manager | Create a new product with title, author, ISBN, price, grade, category, and images | New publications appear in the store for customers to browse and purchase |
| US-2.8 | Product Manager | Update any product field (price, stock, description, images) | Listings stay accurate as publishing details change |
| US-2.9 | Product Manager | Archive a product that is no longer available | It disappears from public browsing without losing historical order data |
| US-2.10 | Product Manager | Unarchive a previously archived product | I can re-list a publication when it becomes available again |
| US-2.11 | Product Manager | Create, rename, and delete product categories | The catalog stays organized and relevant categories are maintained |
| US-2.12 | Product Manager | Moderate customer reviews (approve or hide) | Inappropriate or spam reviews do not appear on product pages |
| US-2.13 | Product Manager | View per-product analytics (sales count, views, review stats) | I can identify top-performing and underperforming titles |

---

## 8. Frontend Implementation

### Component Map

| Page / Component | File Path | What It Does |
|---|---|---|
| Product Listing Page | `client/src/epics/E2_ProductCatalog/pages/ProductList.jsx` | Grid of product cards with search bar, filter sidebar (grade, category, price), sort dropdown, and pagination |
| Product Detail Page | `client/src/epics/E2_ProductCatalog/pages/ProductDetail.jsx` | Full product info, image gallery, campaign discount badge, Add to Cart button, review list |
| Product Card | `client/src/epics/E2_ProductCatalog/components/ProductCard.jsx` | Reusable card showing thumbnail, title, price (with discounted price if applicable), rating stars |
| Review Section | `client/src/epics/E2_ProductCatalog/components/ReviewSection.jsx` | Lists approved reviews; submit-review form for verified purchasers; helpful vote toggle |
| Product Manager Dashboard | `client/src/epics/E2_ProductCatalog/pages/ProductManagerDashboard.jsx` | Stats overview: total products, categories, low-stock items, recent reviews pending moderation |
| Product Form | `client/src/epics/E2_ProductCatalog/components/ProductForm.jsx` | Create/edit form with all fields; image upload via `POST /api/upload/product-image`; Multer handles the file |
| Category Manager | `client/src/epics/E2_ProductCatalog/components/CategoryManager.jsx` | Lists all categories with product count; create/rename/delete actions |

### Data Flow — Product Browse

```
Customer visits /products
         │
         ▼
ProductList mounts → GET /api/products?page=1&limit=12&grade=...
         │
         ▼
Server: applies filters, overlays Campaign discounts, paginates
         │
         ▼
Response: { products: [...], totalCount, totalPages }
         │
         ▼
Renders ProductCard grid
Each card shows:
  - product.price          (original)
  - product.discountedPrice (if campaign active, shown in red with strikethrough)
```

### Data Flow — Create Product (Manager)

```
Manager fills Product Form
         │
  ┌──────┴──────┐
Upload image?   No image?
  │                │
POST /api/upload/product-image
  │ (Multer saves file, returns URL)
  └──────┬──────┘
         │
POST /api/products { title, price, category, images: [url], ... }
         │
         ▼
Product saved to MongoDB → appears in public listing
```

### Data Flow — Submit Review

```
Customer views ProductDetail (after purchasing)
         │
         ▼
Review form submitted → POST /api/products/:id/reviews
         │
         ▼
Controller checks: Order.find({ user, items.product: productId, status: 'delivered' })
         │
   ┌─────┴─────┐
  Found?      Not found?
   │               │
isVerifiedPurchase: true   isVerifiedPurchase: false
   │               │
Saved to Review collection
         │
         ▼
product.averageRating + numReviews recalculated via aggregation
```

### Where Campaign Discounts Show

Campaign discount overlay runs **server-side** in `getProducts` and `getProduct`. The frontend does not need any special logic — it simply checks:
```javascript
// ProductCard.jsx
{product.discountedPrice && product.discountedPrice < product.price ? (
  <>
    <span className="line-through text-gray-400">Rs. {product.price}</span>
    <span className="text-red-600 font-bold">Rs. {product.discountedPrice}</span>
  </>
) : (
  <span>Rs. {product.price}</span>
)}


---

## 📌 Viva Preparation: Where are the Validations?

For your final viva, the examiners will likely ask: **"Where is your validation code? Show us in the codebase."**

Here is exactly where to look for the **Backend** validations:

### 1. Controller-Level Validations (Custom Logic)
The majority of backend validations are implemented directly inside the controller files before processing the requests. We do not use third-party libraries like Zod or Joi; we use native JavaScript logic and Regular Expressions to ensure maximum control and performance.
*   **Where to find it:** Open `epics/E[Number]_[EpicName]/controllers/[name]Controller.js`
*   **What to show:** Look for `if (!field)` checks, regex validations like `emailRegex.test(email)` or `phoneRegex.test(phone)`, and numeric bounds checking (e.g., checking if stock > 0, calculating age from dateOfBirth).

### 2. Mongoose Schema Validations (Model-Level)
We also enforce data integrity at the database level using Mongoose built-in validators.
*   **Where to find it:** Open `epics/E[Number]_[EpicName]/models/[name].js`
*   **What to show:** Show the schema definitions where fields have `required: true`, `minlength`, `maxlength`, `enum` arrays, and `unique: true`. Also mention that controllers use `{ runValidators: true }` when performing updates (e.g., `findByIdAndUpdate`).

### 3. Business Logic Validations (Cross-Epic)
Certain actions require validations across different modules (e.g., you cannot delete a product if it still has inventory stock).
*   **Where to find it:** Open the respective controller (e.g., `productController.js`).
*   **What to show:** Point to the code where the controller queries another model (e.g., querying the `Inventory` model before allowing a product deletion) to ensure business rules are respected.

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

## 7. How to Change Colors (Frontend)

The product listing, product detail, and review pages are in `client/src/epics/E2_ProductCatalog/`.

### Step 1 — Tailwind Config
Edit `client/tailwind.config.js` to change brand colors used across E2 components:
```javascript
theme: {
  extend: {
    colors: {
      primary: '#2563EB',      // product cards, buttons
      accent:  '#F59E0B',      // star ratings (currently yellow-400)
      badge:   '#10B981',      // "Verified Purchase" badge (green)
      danger:  '#EF4444',      // out of stock label
    }
  }
}
```

### Step 2 — Star Rating Colors
Find the star rating component and change:
```jsx
// Change star color
<Star className="text-yellow-400" />   // to any Tailwind color
<Star className="text-accent" />       // after adding to config
```

### Step 3 — Product Card
Find `ProductCard.jsx` (or similar) and update background/border:
```jsx
<div className="bg-white border border-gray-200 rounded-lg ...">
// change bg-white → bg-slate-50, border-gray-200 → border-primary etc.
```

---

## 8. Viva Q&A

**Q1: What is a soft delete and why use it for products?**  
A: A soft delete sets a flag (`isArchived: true`) instead of removing the document from the database. This is important for data integrity — if a product was part of past orders, deleting it would break order history records. Archived products are hidden from public listings but remain queryable for admin reporting.

**Q2: How does the Campaign discount overlay work without changing the database price?**  
A: In `getProducts` and `getProduct`, after fetching the product, the controller calls `Campaign.getDiscountedPrice(product)`. This is a static method on the `Campaign` model that queries active campaigns and returns the lowest applicable price. The discounted price is added to the response object as `discountedPrice` without modifying the `price` stored in MongoDB. This keeps historical pricing intact.

**Q3: Why is ISBN marked `sparse: true` in the unique index?**  
A: Normal `unique` indexes treat `null` values as equal, which would prevent having more than one product without an ISBN. The `sparse: true` option tells MongoDB to only include documents that have the field in the index — documents where ISBN is `null` or absent are excluded from the uniqueness check.

**Q4: How does verified purchase work?**  
A: When a customer submits a review, the controller queries the `Order` collection for any order by that user that contains the product ID and has a `status` of `delivered` or `completed`. If found, `isVerifiedPurchase: true` is set on the review document. This prevents fake reviews from people who never bought the product.

**Q5: How does product image upload work?**  
A: Multer middleware intercepts the `multipart/form-data` request on `POST /api/upload/product-image`. It validates the file type (images only) and size (max 5MB), then saves it to the `uploads/` folder with a unique generated filename. The server returns the URL path, which is then stored in `Product.images[]`.

**Q6: How is the average rating maintained?**  
A: Every time a review is created, the controller runs an aggregation query on the `Review` collection: `Review.aggregate([{ $match: { product: productId } }, { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } }])`. The result updates `product.averageRating` and `product.numReviews`. This ensures the rating is always accurate.

**Q7: Why are reviews stored in a separate collection instead of embedded in Product?**  
A: MongoDB documents have a 16MB size limit. If reviews were embedded, a product with thousands of reviews would hit this limit. Separate collection also allows independent querying, pagination, and moderation of reviews without loading the entire product document.

**Q8: What does the `getRelatedProducts` function use to find related products?**  
A: It queries for products where `category` matches the current product's category AND `grade` matches. It excludes the current product (`_id: { $ne: productId }`) and limits results to 4. This is based on subject relevance — students browsing a Grade 10 Science book should see other Grade 10 Science resources.

**Q9: How does the search work in `getProducts`?**  
A: If a `search` query parameter is provided, the controller builds a MongoDB `$or` query:
```javascript
{ $or: [
  { title: { $regex: search, $options: 'i' } },
  { author: { $regex: search, $options: 'i' } },
  { ISBN: { $regex: search, $options: 'i' } }
]}
```
`$options: 'i'` makes it case-insensitive. Regex search is used here since full-text search (`$text`) requires a text index, which would need to be added to the schema for better performance at scale.

**Q10: What is the difference between `deleteProduct` and `archiveProduct`?**  
A: `deleteProduct` permanently removes the document from MongoDB — it cannot be recovered. `archiveProduct` sets `isArchived: true` — the product disappears from public view but remains in the database and can be restored. Use archive for products that may be re-listed; use delete only for products created by mistake.

**Q11: How does pagination work in `getProducts`?**  
A: The client sends `?page=1&limit=12`. The controller calculates `skip = (page - 1) * limit`. Mongoose query: `.skip(skip).limit(limit)`. A separate `Product.countDocuments(filter)` query returns the total matching product count, which the frontend uses to render page navigation.

**Q12: How does the `helpful` vote system work?**  
A: The `Review.helpfulVotes` field is an array of User ObjectIds. `toggleReviewHelpful` checks if `req.user._id` is already in the array. If yes, it removes it (`$pull`); if no, it adds it (`$addToSet`). `$addToSet` prevents the same user from being added twice.

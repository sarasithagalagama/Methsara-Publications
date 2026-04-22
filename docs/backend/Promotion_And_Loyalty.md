# E6 – Promotion & Loyalty

**Epic Owner:** IT24101266 – Perera M.U.E  
**Stack:** Node.js · Express · Mongoose · MongoDB  
**Base URL:** `/api/coupons` · `/api/gift-vouchers`

---

## 1. Folder Structure

```
E6_PromotionAndLoyalty/
├── controllers/
│   ├── couponController.js        – Coupon CRUD + Campaign CRUD + analytics
│   └── giftVoucherController.js   – Gift voucher + voucher product management
├── middleware/
│   └── (uses E1 auth middleware)
├── models/
│   ├── Coupon.js                  – Discount coupon schema
│   ├── Campaign.js                – Automatic product discount campaigns
│   ├── GiftVoucher.js             – Pre-purchased vouchers with balance
│   └── VoucherProduct.js          – Products purchasable with vouchers
└── routes/
    ├── couponRoutes.js
    └── giftVoucherRoutes.js
```

---

## 2. How the Backend / API Works

### Three Promotion Mechanisms

This epic manages three distinct promotion types, each with different mechanics:

```
1. CAMPAIGN (Automatic)
   ┌─────────────────────────────────┐
   │ Admin creates a campaign with   │
   │ discount % for a grade/category │
   └────────────┬────────────────────┘
                │ Campaign.getDiscountedPrice() is called
                │ automatically by E2 getProducts/getProduct
                ▼
   Customers see discounted price without entering any code

2. COUPON (Code-Based)
   Customer enters code at checkout
                │
                ▼
   POST /api/coupons/validate → checks code validity
                │
                ▼
   POST /api/coupons/apply   → returns discount amount
                │
                ▼
   E3 createOrder uses the discount

3. GIFT VOUCHER (Balance-Based)
   Customer has a voucher code (GV-XXXXXXXX)
                │
                ▼
   POST /api/gift-vouchers/validate → checks balance
                │
                ▼
   E3 createOrder deducts from voucher balance
```

### Why Validation and Application are Separate Endpoints

`/validate` only **checks** if a code is valid (does not mark it used). `/apply` is called during actual order creation and marks the coupon as used / deducts voucher balance. This separation allows the frontend to show a "coupon valid! You save LKR 500" message before the customer commits to the order.

---

## 3. All Functions

### `couponController.js`

| Function | Purpose | Auth |
|---|---|---|
| `createCoupon(req, res)` | Create a new coupon code with type (percentage / fixed), discount value, min order amount, max discount cap, usage limit, expiry date, and applicable grades. | Marketing Mgr / Admin |
| `getAllCoupons(req, res)` | List all coupons with usage stats. Includes expired/inactive coupons for admin review. | Marketing Mgr / Admin |
| `validateCoupon(req, res)` | Check if a coupon code is valid for a given order. Runs compound checks: exists, not expired, active, usage limit not reached, minimum order met, grade matches. Returns the discount amount. Does NOT increment usage count. | Yes (any logged-in user) |
| `applyCoupon(req, res)` | Same checks as validate, but also increments `usageCount` and optionally adds `userId` to `usedBy` array. Called during checkout. | Yes |
| `updateCoupon(req, res)` | Update any coupon field (discount amount, expiry, active status). | Marketing Mgr / Admin |
| `deleteCoupon(req, res)` | Permanently delete a coupon. | Marketing Mgr / Admin |
| `createCampaign(req, res)` | Create a time-bounded automatic discount campaign targeting specific grades or categories. | Marketing Mgr / Admin |
| `getActiveCampaigns(req, res)` | Returns all campaigns where today's date is between `startDate` and `endDate`. Protected (dashboard). | Marketing Mgr / Admin |
| `getActivePublicCampaigns(req, res)` | Same as above but PUBLIC — no auth needed. Used by frontend to show active promotions on the homepage. | No auth |
| `updateCampaign(req, res)` | Update campaign details or extend/shorten dates. | Marketing Mgr / Admin |
| `deleteCampaign(req, res)` | Delete a campaign. Products immediately lose that campaign's discount. | Marketing Mgr / Admin |
| `getMarketingAnalytics(req, res)` | Returns coupon usage stats, top coupons by usage, campaign reach, total discount given out across all channels. | Marketing Mgr / Admin |

### `giftVoucherController.js`

| Function | Purpose | Auth |
|---|---|---|
| `createVoucher(req, res)` | Create a new gift voucher. Auto-generates a unique code (`GV-XXXXXXXX`). Sets `balance = value` (full amount available). | Marketing Mgr / Admin |
| `getAllVouchers(req, res)` | List all gift vouchers with their current balance and usage history. | Marketing Mgr / Admin |
| `validateVoucher(req, res)` | Check if a voucher code is active and has sufficient balance for the requested amount. Does NOT deduct balance (read-only check). | Public |
| `getVoucherProducts(req, res)` | List all `VoucherProduct` catalog items (physical gift voucher products customers can purchase). | Public |
| `createVoucherProduct(req, res)` | Add a new voucher denomination to the catalog (e.g., LKR 500, LKR 1000, LKR 2000 gift cards). | Marketing Mgr / Admin |
| `updateVoucherProduct(req, res)` | Update a voucher product's price, description, or availability. | Marketing Mgr / Admin |
| `deleteVoucherProduct(req, res)` | Remove a voucher product from the catalog. | Marketing Mgr / Admin |
| `deleteVoucher(req, res)` | Delete a gift voucher. Cannot delete if balance has been partially used. | Marketing Mgr / Admin |

---

## 4. CRUD API Endpoints

### Coupon Routes — `/api/coupons`

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/campaigns/active` | No | — | Public active campaigns |
| POST | `/` | Yes | Marketing Mgr / Admin | Create coupon |
| GET | `/` | Yes | Marketing Mgr / Admin | List all coupons |
| DELETE | `/:id` | Yes | Marketing Mgr / Admin | Delete coupon |
| PUT | `/:id` | Yes | Marketing Mgr / Admin | Update coupon |
| POST | `/validate` | Yes | Any | Validate coupon code |
| POST | `/apply` | Yes | Any | Apply coupon (marks used) |
| POST | `/campaigns` | Yes | Marketing Mgr / Admin | Create campaign |
| GET | `/campaigns` | Yes | Marketing Mgr / Admin | List all campaigns |
| DELETE | `/campaigns/:id` | Yes | Marketing Mgr / Admin | Delete campaign |
| PUT | `/campaigns/:id` | Yes | Marketing Mgr / Admin | Update campaign |
| GET | `/analytics` | Yes | Marketing Mgr / Admin | Marketing analytics |

### Gift Voucher Routes — `/api/gift-vouchers`

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/validate` | No | — | Validate voucher code |
| GET | `/products` | No | — | List voucher products |
| GET | `/` | Yes | Marketing Mgr / Admin | List all vouchers |
| POST | `/` | Yes | Marketing Mgr / Admin | Create voucher |
| POST | `/products` | Yes | Marketing Mgr / Admin | Create voucher product |
| PUT | `/products/:id` | Yes | Marketing Mgr / Admin | Update voucher product |
| DELETE | `/products/:id` | Yes | Marketing Mgr / Admin | Delete voucher product |
| DELETE | `/:id` | Yes | Marketing Mgr / Admin | Delete voucher |

---

## 5. Database — How It Works & Where Data Is Saved

### MongoDB Collections

#### `coupons` (model: `Coupon.js`)
```
{
  _id: ObjectId,
  code: String (required, unique, uppercase),
  discountType: String (enum: percentage | fixed),
  discountValue: Number (required, min: 0),
  maxDiscount: Number  ← cap for percentage discounts (e.g., max LKR 500 off)
  minOrderAmount: Number (default: 0),
  applicableGrades: [String]  ← empty = applies to all grades
  usageLimit: Number (default: null = unlimited),
  usageCount: Number (default: 0),
  usedBy: [ObjectId] (ref: User),
  isActive: Boolean (default: true),
  expiryDate: Date,
  description: String,
  createdBy: ObjectId (ref: User),
  createdAt: Date
}
```

**Compound Validation Logic in `validateCoupon`:**
```
1. Coupon exists?           → 404 if not
2. isActive === true?       → 400 if inactive
3. expiryDate > now?        → 400 if expired
4. usageCount < usageLimit? → 400 if limit reached
5. orderTotal >= minOrderAmount? → 400 if below minimum
6. product grade in applicableGrades? → 400 if grade not applicable
```

**Discount Calculation:**
```javascript
if (coupon.discountType === 'percentage') {
  discount = (orderTotal * coupon.discountValue) / 100;
  if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
} else {
  // fixed
  discount = Math.min(coupon.discountValue, orderTotal);
}
```

#### `campaigns` (model: `Campaign.js`)
```
{
  _id: ObjectId,
  name: String (required),
  description: String,
  type: String (enum: percentage | fixed),
  discountValue: Number (required, min: 0),
  startDate: Date (required),
  endDate: Date (required),
  applicableGrades: [String],
  applicableCategories: [ObjectId] (ref: Category),
  isActive: Boolean (default: true),
  createdBy: ObjectId (ref: User),
  createdAt: Date
}
```

**Static Method `Campaign.getDiscountedPrice(product)`:**
```javascript
Campaign.statics.getDiscountedPrice = async function(product) {
  const now = new Date();
  const campaigns = await this.find({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
    $or: [
      { applicableGrades: product.grade },
      { applicableCategories: product.category }
    ]
  });
  // Apply best (largest) discount found
  let bestDiscount = 0;
  campaigns.forEach(c => {
    const d = c.type === 'percentage'
      ? (product.price * c.discountValue) / 100
      : c.discountValue;
    bestDiscount = Math.max(bestDiscount, d);
  });
  return product.price - bestDiscount;
};
```
This static method is called by E2 `getProducts` and `getProduct` to overlay campaign pricing.

#### `giftvouchers` (model: `GiftVoucher.js`)
```
{
  _id: ObjectId,
  code: String (unique, auto-generated: GV-XXXXXXXX),
  value: Number (required)   ← original full value
  balance: Number            ← remaining balance (starts equal to value)
  isActive: Boolean (default: true),
  expiryDate: Date,
  purchasedBy: ObjectId (ref: User),
  usageHistory: [{
    amount: Number,
    orderId: ObjectId (ref: Order),
    usedAt: Date
  }],
  createdBy: ObjectId (ref: User),
  createdAt: Date
}
```

**Code Generation (pre-save hook):**
```javascript
if (!this.code) {
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  this.code = `GV-${random}`;  // e.g., GV-A3F92C1B
}
```

**On use (during E3 createOrder):**
```javascript
voucher.balance -= amountToDeduct;
voucher.usageHistory.push({ amount: amountToDeduct, orderId, usedAt: new Date() });
if (voucher.balance === 0) voucher.isActive = false;
await voucher.save();
```

#### `voucherproducts` (model: `VoucherProduct.js`)
```
{
  _id: ObjectId,
  name: String (required),         ← e.g., "LKR 500 Gift Card"
  description: String,
  price: Number (required),         ← what the customer pays to buy the voucher
  denomination: Number (required),  ← the voucher's face value (credit added)
  image: String,
  isAvailable: Boolean (default: true),
  createdAt: Date
}
```

This is the "catalog" of gift vouchers available for purchase. When a customer buys a `VoucherProduct`, a new `GiftVoucher` document is created with `value = denomination` and `balance = denomination`, and the code is emailed to them.

**Relationships:**
- `coupons.createdBy` → `users` (E1)
- `coupons.usedBy` → `users` (E1)
- `campaigns.applicableCategories` → `categories` (E2)
- `giftvouchers.purchasedBy` / `createdBy` → `users` (E1)
- `giftvouchers.usageHistory.orderId` → `orders` (E3)
- `voucherproducts` referenced by E3 `Cart` and `Order` via refPath

**Indexes:**
- `coupons.code` — unique index
- `giftvouchers.code` — unique index
- `campaigns.startDate` / `endDate` — for date range queries
- `campaigns.applicableGrades` — array index for grade lookups

---

## 6. Validations Used

### Mongoose Schema (Coupon.js)
```javascript
code:          { required: true, unique: true, uppercase: true, trim: true }
discountType:  { enum: ['percentage', 'fixed'], required: true }
discountValue: { required: true, min: [0, 'Discount cannot be negative'] }
expiryDate:    { required: true }
usageLimit:    { min: 1 }  // if provided must be at least 1
```
For `percentage` type: a custom Mongoose validator checks `discountValue <= 100`.

### Mongoose Schema (Campaign.js)
```javascript
name:          { required: true }
discountValue: { required: true, min: 0 }
startDate:     { required: true }
endDate:       { required: true }
// Custom validator: endDate must be after startDate
```

### Mongoose Schema (GiftVoucher.js)
```javascript
value:   { required: true, min: [1, 'Voucher value must be at least 1'] }
balance: { min: [0, 'Balance cannot be negative'] }
```

### Controller-Level Validations
- **validateCoupon:** full 6-step compound check (see database section above)
- **validateVoucher:** checks `isActive`, `balance >= requestedAmount`, `expiryDate > now`
- **createCampaign:** validates `endDate > startDate`
- **deleteVoucher:** checks `voucher.balance === voucher.value` (no partial use) before allowing delete
- **createVoucherProduct:** checks `denomination >= price` (voucher value should be ≥ purchase price)

---

## 7. User Stories

| # | As a… | I want to… | So that… |
|---|---|---|---|
| US-6.1 | Marketing Manager | Create a discount campaign for a specific grade or category with a date range | All matching products automatically show the discounted price during the campaign period without any customer action |
| US-6.2 | Marketing Manager | View all active and past campaigns with start/end dates and discount values | I can track what promotions are currently running and plan future ones |
| US-6.3 | Marketing Manager | Create a coupon code with a discount type (percentage or fixed), usage limit, minimum order amount, and applicable grades | Customers can enter the code at checkout to receive the defined discount |
| US-6.4 | Marketing Manager | View coupon usage statistics (how many times used, total discount given) | I can measure the effectiveness of each coupon promotion |
| US-6.5 | Marketing Manager | Create a gift voucher with a face value and expiry date | Customers can purchase and redeem the voucher as store credit |
| US-6.6 | Marketing Manager | View all gift vouchers with their remaining balances and usage history | I can monitor voucher liability and detect any misuse |
| US-6.7 | Marketing Manager | Add voucher denomination products to the store catalog (e.g., LKR 500 Gift Card) | Customers can purchase vouchers as gifts or personal store credit |
| US-6.8 | Customer | Enter a coupon code at checkout and see the discount previewed before placing the order | I know exactly how much I will save before committing to the purchase |
| US-6.9 | Customer | Enter a gift voucher code at checkout and have the balance deducted from my total | I can use my store credit to pay for books |
| US-6.10 | Customer | See campaign-discounted prices on product listings and detail pages without entering any code | I automatically benefit from active promotions when browsing |
| US-6.11 | Customer | Use a gift voucher partially (without needing to use the full balance at once) | I can spend my voucher credit across multiple orders |

---

## 8. Frontend Implementation

### Component Map

| Page / Component | File Path | What It Does |
|---|---|---|
| Marketing Dashboard | `client/src/epics/E6_PromotionAndLoyalty/pages/MarketingDashboard.jsx` | Overview: active campaigns, total coupons issued, total discount given, voucher liability summary |
| Campaign Manager | `client/src/epics/E6_PromotionAndLoyalty/pages/CampaignManager.jsx` | CRUD table for campaigns; create/edit form with grade and category targeting, date range picker, discount type/value |
| Coupon Manager | `client/src/epics/E6_PromotionAndLoyalty/pages/CouponManager.jsx` | CRUD table for coupons; create form with all fields; usage count and status badge per row |
| Gift Voucher Manager | `client/src/epics/E6_PromotionAndLoyalty/pages/GiftVoucherManager.jsx` | Table of all voucher instances with code, value, balance, expiry; link to usage history per voucher |
| Voucher Products Page | `client/src/epics/E6_PromotionAndLoyalty/pages/VoucherProducts.jsx` | Catalog of purchasable gift card denominations; create/update/delete entries |
| Analytics Page | `client/src/epics/E6_PromotionAndLoyalty/pages/MarketingAnalytics.jsx` | Charts: coupon usage over time, top coupons by savings, campaign reach, total discount distributed |
| Coupon Input (Checkout) | `client/src/epics/E3_OrderAndTransaction/components/CouponInput.jsx` | Text input for coupon code; calls `/validate` on blur to show inline savings preview; code passed to createOrder on submit |
| Voucher Input (Checkout) | `client/src/epics/E3_OrderAndTransaction/components/VoucherInput.jsx` | Text input for GV code; calls `/gift-vouchers/validate` to show remaining balance; passed to createOrder |

### Data Flow — Campaign Discount (Automatic)

```
Marketing Manager creates a Campaign:
  POST /api/coupons/campaigns
  { name, discountType, discountValue, startDate, endDate, applicableGrades, applicableCategories }
         │
         ▼
  Saved to 'campaigns' collection
         │
         ▼
Customer browses products:
  GET /api/products
         │
         ▼
  For each product, server calls:
    Campaign.getDiscountedPrice(product)
      → queries campaigns where isActive=true, today between startDate-endDate,
        grade or category matches
      → returns best (largest) discount
         │
         ▼
  Product in response includes: { price: 500, discountedPrice: 400 }
  (original price unchanged in MongoDB)
         │
         ▼
Frontend ProductCard shows:
  ~~Rs. 500~~  Rs. 400  (strikethrough + red reduced price)
```

### Data Flow — Coupon at Checkout

```
Customer types coupon code in CouponInput
         │
         ▼
POST /api/coupons/validate  { code, orderTotal, items }
  Server runs 6-step check (exists, active, not expired, usage limit, min order, grade match)
         │
   ┌─────┴─────┐
 Valid?       Invalid?
   │               │
Shows: "You save Rs. X"   Shows inline error message
Stores discount in state
         │
         ▼
Customer clicks Place Order
  POST /api/orders  { ..., couponCode: "SUMMER20" }
  Server calls applyCoupon internally:
    ├── runs same 6 checks again (re-validates)
    ├── calculates final discount
    ├── increments coupon.usageCount
    └── adds req.user._id to coupon.usedBy
```

### Data Flow — Gift Voucher Partial Use

```
Customer enters GV-A3F92C1B in VoucherInput
         │
         ▼
POST /api/gift-vouchers/validate  { code, amount: orderTotal }
  Server: checks isActive, balance >= amount, not expired
  Returns: { valid: true, balance: 750, code }
         │
         ▼
Customer places order (total: Rs. 400, voucher balance: Rs. 750)
  createOrder deducts Rs. 400:
    voucher.balance = 350  (Rs. 350 remains for future orders)
    voucher.usageHistory.push({ amount: 400, orderId })
    if (balance === 0) voucher.isActive = false
         │
         ▼
Voucher still active with Rs. 350 remaining
Customer can use it again on next order
```

### Three Promotion Types — Summary

| Type | Trigger | Code needed? | Stored in | Affects DB price? |
|---|---|---|---|---|
| Campaign | Automatic (date range) | No | `campaigns` | No (overlay only) |
| Coupon | Customer enters code | Yes | `coupons` | No (discount tracked in `Order.couponDiscount`) |
| Gift Voucher | Customer enters code | Yes (GV-XXXX) | `giftvouchers` | No (balance deducted from `GiftVoucher.balance`) |


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

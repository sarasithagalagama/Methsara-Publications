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

## 7. How to Change Colors (Frontend)

Promotion pages are in `client/src/epics/E6_PromotionAndLoyalty/`.

### Promotional Banner Colors
```jsx
// Homepage campaign banner
<div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-lg">
  <h2>Sale! 20% off all Grade 10 books</h2>
</div>
// Change from-purple-600 and to-indigo-600 to customize gradient
```

### Coupon Success / Error State Colors
```jsx
// When coupon is valid
<div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded">
  ✓ Coupon applied! You save LKR 500
</div>

// When coupon is invalid
<div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded">
  ✗ Coupon expired or invalid
</div>
// Change bg-green-50, border-green-200, text-green-700 etc. to your palette
```

### Gift Voucher Card Design
```jsx
<div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-6 text-white shadow-xl">
  <span className="text-3xl font-bold">LKR 1,000</span>
  <p>Gift Voucher</p>
  <p className="font-mono text-sm opacity-75">GV-A3F92C1B</p>
</div>
// Modify the gradient colors to create different voucher card designs
```

### Global Tailwind Config
```javascript
// client/tailwind.config.js
theme: {
  extend: {
    colors: {
      promo:   '#7C3AED',  // Purple — used for sale badges and campaign banners
      voucher: '#F59E0B',  // Amber — used for gift voucher cards
    }
  }
}
```

---

## 8. Viva Q&A

**Q1: What is the difference between a Coupon, a Campaign, and a Gift Voucher?**  
A: These are three different promotion mechanisms:
- **Campaign** — automatic, no code needed. Admin sets a date range and discount percentage for a grade/category. Products automatically show discounted prices. No customer action required.
- **Coupon** — code-based. The customer enters a specific code at checkout (e.g., `SUMMER20`). One-time or limited-use. The system validates and applies the discount.
- **Gift Voucher** — balance-based. A customer purchases an LKR-denominated voucher (a credit). They use the voucher code at checkout and the amount is deducted from their voucher balance, which can be used across multiple orders (partial use supported).

**Q2: How does the Campaign discount apply automatically without any customer action?**  
A: The `Campaign` model has a static method `getDiscountedPrice(product)`. Every time E2's `getProducts` or `getProduct` is called, this static method queries the `Campaign` collection for any active campaigns covering the product's grade or category. If found, it calculates and returns the discounted price. The field `discountedPrice` is added to the API response, and the frontend displays it. The original `product.price` in MongoDB is never changed.

**Q3: Why are `/validate` and `/apply` separate endpoints?**  
A: UX and data integrity. The customer enters their coupon code and the frontend immediately calls `/validate` to give them feedback ("Your code is valid! You save LKR 300") without committing anything. This preview is read-only. Only when the customer clicks "Place Order" does `/apply` run (as part of `createOrder`), which actually increments `usageCount`. This prevents a coupon from being "used up" if the customer decides not to complete the order.

**Q4: How does the `maxDiscount` cap work for percentage coupons?**  
A: For high-value orders, an uncapped percentage discount could be too large. `maxDiscount` limits this:
```
Order total:     LKR 10,000
Coupon:          20% off, maxDiscount: LKR 1,000
Raw discount:    LKR 2,000 (20% of 10,000)
Capped discount: LKR 1,000 (hit the maxDiscount ceiling)
Final total:     LKR 9,000
```
Without the cap, the store would lose LKR 2,000 on a large order.

**Q5: How is a gift voucher code generated uniquely?**  
A: A Mongoose pre-save hook generates the code before the document is saved:
```javascript
const random = crypto.randomBytes(4).toString('hex').toUpperCase();
this.code = `GV-${random}`;
```
`crypto.randomBytes(4)` generates 4 cryptographically random bytes = 8 hexadecimal characters. Combined with the `GV-` prefix, this gives 16^8 = ~4.3 billion possible codes. A unique index on `code` catches the extremely rare collision at the DB level, and a retry loop regenerates if collision occurs.

**Q6: What happens when a gift voucher's balance runs out?**  
A: When the voucher balance reaches zero, `isActive` is automatically set to `false`. The next `validateVoucher` call will return "Voucher balance is empty". The `usageHistory` array records every deduction, preserving a full audit trail of how the voucher was used.

**Q7: How does `applicableGrades` on a coupon work?**  
A: `applicableGrades` is an array of grade strings (e.g., `['Grade 10', 'Grade 11', 'O/L']`). If the array is empty, the coupon applies to any order. If populated, at least one product in the cart must have a `grade` that is in this array. The validation query:
```javascript
const hasApplicableItem = cartItems.some(item =>
  coupon.applicableGrades.includes(item.product.grade)
);
```

**Q8: Why does the `Campaign.getDiscountedPrice()` return "best discount" instead of stacking all campaigns?**  
A: Stacking multiple campaigns would create unpredictable discounts and could result in products being sold at a loss. The "best discount" approach gives the customer the maximum single benefit available while keeping the business's pricing controlled. If you wanted cumulative discounts, you'd need to add business rules about which campaigns can combine.

**Q9: What is a `VoucherProduct` and why is it separate from `GiftVoucher`?**  
A: `VoucherProduct` is the catalog item that appears in the store for customers to purchase (e.g., "LKR 1,000 Gift Card" for LKR 950). Think of it as the product listing. `GiftVoucher` is the actual voucher instance with a unique code and balance — created when a customer successfully purchases a `VoucherProduct`. This separation follows the product/instance pattern: one `VoucherProduct` definition can result in many `GiftVoucher` instances.

**Q10: How does the `getMarketingAnalytics` function work?**  
A: It aggregates data across multiple collections:
- From `Coupon`: `{ $group: { _id: null, totalDiscountGiven: { $sum: { $multiply: ['$usageCount', '$discountValue'] } } } }`
- From `Campaign`: counts active vs expired campaigns, estimates reach by querying products in applicable grades
- Returns: total savings given to customers, most popular coupon codes, campaign performance metrics

**Q11: How are promotions applied together when a customer uses both a coupon and a campaign discount?**  
A: They apply to different amounts:
1. **Campaign discount** — applied per-item, BEFORE subtotal. Each item's unit price is reduced by the campaign percentage
2. **Coupon discount** — applied to the post-campaign subtotal (a flat amount or percentage of the reduced subtotal)
3. **Gift voucher** — deducted last, from the grand total after both discounts

All three discount amounts are stored separately in the `Order` document (`couponDiscount`, `voucherDiscount`, `campaignDiscount`) so the financial team can see exactly how revenue was affected by each promotion type.

**Q12: What prevents a coupon from being used by the same user twice?**  
A: The `usedBy` array stores user IDs of everyone who has used the coupon. In `validateCoupon`:
```javascript
if (coupon.usedBy.includes(req.user._id.toString())) {
  return res.status(400).json({ message: 'You have already used this coupon' });
}
```
When `applyCoupon` runs, the user's ID is added: `coupon.usedBy.push(req.user._id)`. The combination of `usageLimit` (total uses across all users) and `usedBy` tracking (per-user prevention) gives full usage control.

# E6 – Promotion & Loyalty (Frontend)

**Epic Owner:** IT24101266 – Perera M.U.E  
**Stack:** React · Axios · React Router  
**Consumes API:** `/api/coupons` · `/api/gift-vouchers`

---

## 1. Folder Structure

```
E6_PromotionAndLoyalty/
├── components/
│   └── Coupons/                      – Reusable coupon form and table components
├── pages/
│   ├── MarketingManagerDashboard.jsx – Marketing manager landing page
│   ├── MarketingManagerDashboard.css
│   ├── GiftVouchers.jsx              – Gift voucher management page
│   ├── GiftVouchers.css
│   └── marketing/                    – Campaign and coupon sub-pages
└── services/
    └── couponService.js              – Axios calls for coupons, campaigns, and gift vouchers
```

---

## 2. How the Frontend Works

### Three Promotion Types

```
1. CAMPAIGN (automatic price override)
   Marketing Manager creates campaign (grade + discount %)
            │
   couponService.createCampaign()  →  POST /api/coupons/campaigns
            │
   E2 ProductList / ProductDetail automatically shows discounted prices
   (no code needed by customer – applied server-side on getProducts)

2. COUPON (code-based at checkout)
   Marketing Manager creates coupon
            │
   couponService.createCoupon()  →  POST /api/coupons
            │
   Customer enters code in Checkout.jsx (E3)
            │
   couponService.validateCoupon(code, total)  →  POST /api/coupons/validate
            │
   E3 createOrder applies the discount

3. GIFT VOUCHER (pre-purchased balance)
   Marketing Manager creates a voucher product
            │
   Customer purchases that voucher product (via normal E3 checkout)
            │
   Customer receives GV-XXXXXXXX code via email
            │
   Customer enters code in Checkout.jsx (E3) to redeem balance
```

### Marketing Manager Flow

```
Marketing Manager logs in → /marketing/dashboard
        │
        ▼
MarketingManagerDashboard.jsx
        │
  ├─ Campaigns tab: create/edit/delete discount campaigns
  ├─ Coupons tab: create/edit/deactivate coupon codes
  ├─ Gift Vouchers tab → GiftVouchers.jsx
  │       ├─ Voucher products management
  │       └─ Issued vouchers list + balance tracking
  └─ Analytics: coupon usage rate, redemption stats
```

---

## 3. All Components & Pages

### `components/Coupons/`

Reusable coupon UI components:
- **CouponTable** – Management table listing all coupons with columns: code, discount type, value, usage count, expiry, status. Includes deactivate toggle and delete action.
- **CouponFormModal** – Create / edit coupon modal. Fields: code (auto-generate option), discount type (Percentage / Fixed), value, minimum purchase amount, max usage count, valid until date.
- **CampaignFormModal** – Create / edit campaign modal. Fields: name, target grade/category, discount percentage, start and end dates.

---

### `pages/MarketingManagerDashboard.jsx`

Landing page for `marketing_manager` role at `/marketing/dashboard`. Displays:

- **KPI cards:** Active campaigns, active coupons, total vouchers issued, total discount given (this month)
- **Coupon usage analytics:** Bar chart of top-used coupons
- **Campaigns table:** Active campaigns with edit / deactivate controls
- **Coupons table:** Full coupon management with `CouponFormModal` for create/edit

---

### `pages/GiftVouchers.jsx`

Gift voucher management page at `/marketing/gift-vouchers`. Two sections:

**Voucher Products:**
- List of products customers can purchase to receive a voucher code
- Create / edit / delete voucher products
- Set voucher face value and validity period

**Issued Vouchers:**
- List of all issued voucher codes with status (Active / Redeemed / Expired)
- Remaining balance per voucher
- Search by voucher code or customer name

---

## 4. Service Methods

### `services/couponService.js`

**Coupons**

| Method | API Call | Purpose |
|---|---|---|
| `getCoupons()` | `GET /api/coupons` | Fetch all coupons for management table. |
| `getCoupon(id)` | `GET /api/coupons/:id` | Fetch single coupon detail. |
| `createCoupon(data)` | `POST /api/coupons` | Create coupon (code, discountType, value, limits). |
| `updateCoupon(id, data)` | `PUT /api/coupons/:id` | Edit coupon fields. |
| `deleteCoupon(id)` | `DELETE /api/coupons/:id` | Remove a coupon. |
| `validateCoupon(code, total)` | `POST /api/coupons/validate` | Check code validity at checkout (used by E3). |

**Campaigns**

| Method | API Call | Purpose |
|---|---|---|
| `getCampaigns()` | `GET /api/coupons/campaigns` | List all campaigns. |
| `createCampaign(data)` | `POST /api/coupons/campaigns` | Create automatic discount campaign. |
| `updateCampaign(id, data)` | `PUT /api/coupons/campaigns/:id` | Edit campaign settings. |
| `deleteCampaign(id)` | `DELETE /api/coupons/campaigns/:id` | Remove a campaign. |

**Gift Vouchers**

| Method | API Call | Purpose |
|---|---|---|
| `getGiftVouchers(params)` | `GET /api/gift-vouchers` | Fetch all issued voucher codes. |
| `getVoucherProducts()` | `GET /api/gift-vouchers/products` | Fetch purchasable voucher products. |
| `createVoucherProduct(data)` | `POST /api/gift-vouchers/products` | Create a new voucher product. |
| `updateVoucherProduct(id, data)` | `PUT /api/gift-vouchers/products/:id` | Edit voucher product. |
| `deleteVoucherProduct(id)` | `DELETE /api/gift-vouchers/products/:id` | Remove voucher product. |
| `validateVoucher(code)` | `POST /api/gift-vouchers/validate` | Check voucher code + remaining balance (used by E3). |

---

## 5. Key Design Notes

- **Campaign vs Coupon distinction:** Campaigns apply automatically to entire product grades/categories — no action needed from the customer. Coupons require a code to be typed at checkout. If both apply to the same product, the backend combines discounts.
- **Gift vouchers are pre-purchased products:** A customer first buys a voucher (E3 checkout), then receives a code, then redeems that code as partial or full payment on a future order.
- **Coupon validation is always backend-enforced:** The frontend calls `/validate` before showing the discount to the user, but E3's `createOrder` re-validates on the backend so the discount cannot be tampered with client-side.

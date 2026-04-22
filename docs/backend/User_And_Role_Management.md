# E1 – User & Role Management

**Epic Owner:** IT24100548 – Galagama S.T  
**Stack:** Node.js · Express · Mongoose · MongoDB · JWT  
**Base URL:** `/api/auth` · `/api/approvals`

---

## 1. Folder Structure

```
E1_UserAndRoleManagement/
├── controllers/
│   ├── authController.js          – Auth logic (register, login, sessions, password)
│   ├── authController_deactivation.js – Account activation/deactivation helpers
│   └── approvalController.js      – Maker-checker approval workflow
├── middleware/
│   └── auth.js                    – protect, authorize, generateToken
├── models/
│   ├── User.js                    – User schema (8 roles)
│   ├── Session.js                 – Active session tracking
│   └── ApprovalRequest.js        – Pending change approvals
└── routes/
    ├── authRoutes.js              – Auth API endpoints
    └── approvalRoutes.js          – Approval workflow endpoints
```

---

## 2. How the Backend / API Works

```
HTTP Request
     │
     ▼
server.js  →  app.use('/api/auth', authRoutes)
                          │
                          ▼
               authRoutes.js (router)
                          │
                    ┌─────┴─────┐
                    │  protect  │  ← verifies JWT, attaches req.user
                    └─────┬─────┘
                          │
                 ┌────────┴────────┐
                 │  authorize(role)│  ← checks req.user.role
                 └────────┬────────┘
                          │
                          ▼
                 Controller function
                          │
                      Mongoose
                          │
                        MongoDB
                          │
                          ▼
                   JSON Response
```

Every API call follows this exact pipeline. Middleware runs **before** the controller. If any middleware rejects the request, the controller never executes.

---

## 3. All Functions

### `authController.js`

| Function | Purpose | Auth Required |
|---|---|---|
| `register(req, res)` | Register a new customer account. Sets `role: 'customer'` by default. Saves User + creates Session record. | No |
| `login(req, res)` | Authenticate by email + password. `comparePassword()` bcrypt check. Returns JWT + user object + session ID. | No |
| `getMe(req, res)` | Returns currently logged-in user's profile from `req.user`. | Yes |
| `createStaff(req, res)` | Admin creates a staff account with a specific role. Sends temporary password. | Admin |
| `getAllUsers(req, res)` | Returns paginated list of all users, filterable by role and status. | Admin / Finance Mgr |
| `updateProfile(req, res)` | User updates their own `name`, `phone`, `address`. Cannot change role or email here. | Yes |
| `changePassword(req, res)` | Verifies old password then sets new hashed password. Revokes all other sessions. | Yes |
| `forgotPassword(req, res)` | Generates a password-reset token, stores hashed version in User doc, sends email link. | No |
| `resetPassword(req, res)` | Validates reset token (expiry + hash match), sets new password, clears token. | No |
| `deactivateUser(req, res)` | Admin sets `isActive: false` on a user. All their sessions are revoked. | Admin |
| `reactivateUser(req, res)` | Admin sets `isActive: true` on a user. | Admin |
| `updateUser(req, res)` | Admin edits any user field (role, status, etc.). | Admin / Finance Mgr |
| `getSessions(req, res)` | Returns all active sessions for the logged-in user. | Yes |
| `logout(req, res)` | Deletes current session (from `Session` collection). Clears cookie. | Yes |
| `revokeSession(req, res)` | Deletes a specific session by ID from `Session` collection. | Yes |
| `getSecurityLogs(req, res)` | Returns recent login/logout activity for admin monitoring. | Admin |
| `requestPasswordReset(req, res)` | Admin triggers a force-reset for another user; sends email. | Admin |
| `forceChangePassword(req, res)` | User satisfies a forced password change requirement (after admin reset). | Yes |

### `authController_deactivation.js`

| Function | Purpose |
|---|---|
| `deactivateAccount(userId)` | Sets `isActive: false`, revokes all sessions for that user. |
| `reactivateAccount(userId)` | Sets `isActive: true` for a previously deactivated user. |

### `approvalController.js`

| Function | Purpose | Auth Required |
|---|---|---|
| `getPendingRequests(req, res)` | Returns all `ApprovalRequest` docs with `status: 'pending'`. Populated with requester info. | Admin / Master Inventory Mgr |
| `reviewRequest(req, res)` | Admin approves or rejects a pending request. Updates `ApprovalRequest.status`, applies the change if approved (e.g., updates supplier), logs reviewer + timestamp. | Admin / Master Inventory Mgr |

### `middleware/auth.js`

| Function | Signature | Purpose |
|---|---|---|
| `generateToken(userId)` | `(id) → string` | Signs a JWT with `id` payload. Expiry: 7 days. Uses `JWT_SECRET` env var. |
| `protect` | Express middleware | Reads `Authorization: Bearer <token>` header. Verifies JWT. Loads user from DB. Attaches `req.user`. Rejects if token missing, invalid, or user not found. |
| `authorize(...roles)` | `(...roles) → middleware` | Returns middleware that checks `req.user.role` is in the allowed `roles` array. Sends 403 if unauthorized. |
| `authorizeLocation` | Express middleware | Checks that `req.user.assignedLocation` matches the requested location ID. Used for location-scoped inventory managers. |
| `optionalProtect` | Express middleware | Like `protect` but does NOT reject if no token is present. Used for guest-checkout endpoints where auth is optional. |

---

## 4. CRUD API Endpoints

### Auth Routes — `/api/auth`

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/register` | No | — | Register new customer |
| POST | `/login` | No | — | Login, get JWT |
| POST | `/forgot-password` | No | — | Send reset email |
| POST | `/reset-password` | No | — | Reset password with token |
| GET | `/me` | Yes | Any | Get own profile |
| PUT | `/profile` | Yes | Any | Update own profile |
| PUT | `/change-password` | Yes | Any | Change own password |
| GET | `/sessions` | Yes | Any | List active sessions |
| POST | `/logout` | Yes | Any | Log out current session |
| POST | `/sessions/:id/revoke` | Yes | Any | Revoke specific session |
| POST | `/force-change-password` | Yes | Any | Satisfy force-reset |
| POST | `/create-staff` | Yes | Admin | Create staff account |
| GET | `/users` | Yes | Admin / Finance Mgr | List all users |
| PUT | `/users/:id` | Yes | Admin / Finance Mgr | Update any user |
| PUT | `/users/:id/deactivate` | Yes | Admin | Deactivate user |
| PUT | `/users/:id/reactivate` | Yes | Admin | Reactivate user |
| POST | `/users/:id/force-reset` | Yes | Admin | Force password reset |
| GET | `/logs` | Yes | Admin | View security logs |

### Approval Routes — `/api/approvals`

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/` | Yes | Admin / MIM | List pending approvals |
| PUT | `/:id` | Yes | Admin / MIM | Approve or reject request |

---

## 5. Database — How It Works & Where Data Is Saved

### MongoDB Collections

#### `users` (model: `User.js`)
```
{
  _id: ObjectId,
  name: String (required, 2–50 chars),
  email: String (unique, lowercase),
  password: String (bcrypt hashed, min 8 chars),
  role: String (enum, see below),
  phone: String,
  address: { street, city, state, zipCode, country },
  isActive: Boolean (default: true),
  assignedLocation: ObjectId (ref: Location — for location managers),
  passwordResetToken: String (hashed),
  passwordResetExpiry: Date,
  createdAt: Date,
  updatedAt: Date
}
```
**Roles enum:** `customer | admin | master_inventory_manager | location_inventory_manager | finance_manager | supplier_manager | marketing_manager | product_manager`

**Pre-save hook:** Before every `save()`, if `password` is modified, bcrypt hashes it automatically (`bcrypt.hash(password, 10)`).

**Instance method:** `user.comparePassword(candidate)` — runs `bcrypt.compare()`, returns boolean.

#### `sessions` (model: `Session.js`)
```
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  token: String (hashed JWT),
  deviceInfo: String,
  ipAddress: String,
  createdAt: Date  ← TTL index: auto-deleted after 30 days
}
```
**TTL Index:** `createdAt: 1, expireAfterSeconds: 2592000` — MongoDB automatically deletes sessions older than 30 days. No manual cleanup needed.

#### `approvalrequests` (model: `ApprovalRequest.js`)
```
{
  _id: ObjectId,
  requestedBy: ObjectId (ref: User),
  action: String (e.g., 'UPDATE_SUPPLIER', 'ADJUST_STOCK'),
  targetModel: String (e.g., 'Supplier', 'Inventory'),
  targetId: ObjectId,
  targetData: Mixed (the full proposed change payload),
  status: String (enum: pending | approved | rejected),
  reviewedBy: ObjectId (ref: User),
  reviewedAt: Date,
  notes: String,
  createdAt: Date
}
```
This is the **maker-checker** pattern: any sensitive action (e.g., adjusting stock, updating a supplier) creates an `ApprovalRequest`. An admin then reviews and either approves (triggering the actual change) or rejects it.

**Relationships:**
- `users` → `sessions` (one-to-many, user has many sessions)
- `users` → `approvalrequests` (one-to-many via `requestedBy`)
- `approvalrequests` referenced by E4 Supplier and E5 Inventory epics

---

## 6. Validations Used

### Mongoose Schema Validators (User.js)
```javascript
name:     { required: true, minlength: 2, maxlength: 50 }
email:    { required: true, unique: true, lowercase: true, match: /email-regex/ }
password: { required: true, minlength: 8, select: false }
role:     { enum: ['customer','admin','master_inventory_manager', ...] }
```

### Controller-Level Validations
- **register:** checks that email does not already exist (`User.findOne({ email })`)
- **login:** verifies user exists and `isActive: true` before comparing password
- **changePassword:** confirms old password matches before allowing new password set
- **resetPassword:** validates token expiry (`passwordResetExpiry > Date.now()`) and SHA-256 hash match
- **createStaff:** ensures `role` provided is not `customer`

---

## 7. User Stories

| # | As a… | I want to… | So that… |
|---|---|---|---|
| US-1.1 | New customer | Register an account with my name, email, and password | I can place orders and track my purchase history |
| US-1.2 | Customer | Log in securely using my email and password | I can access my personal dashboard and manage orders |
| US-1.3 | Customer | Reset my password via a link sent to my email | I can regain access if I forget my password |
| US-1.4 | Customer | Update my profile (name, phone, delivery address) | My orders are delivered to the correct address |
| US-1.5 | Customer | View all my active login sessions | I know which devices are currently signed in to my account |
| US-1.6 | Customer | Log out from a specific device remotely | I can secure my account if I lose access to a device |
| US-1.7 | Admin | Create staff accounts with specific roles | Each team member can access only their relevant module |
| US-1.8 | Admin | Deactivate a staff account immediately | Terminated employees lose system access without delay |
| US-1.9 | Admin | View the list of all users filtered by role or status | I can audit accounts and spot suspicious or inactive users |
| US-1.10 | Admin | View security logs (login/logout activity) | I can detect and investigate unauthorized access attempts |
| US-1.11 | Admin | Force a password reset for any staff account | I can enforce security policy when credentials are compromised |
| US-1.12 | Admin | Approve or reject pending change requests | Sensitive data changes are verified by a second person before going live |
| US-1.13 | Supplier Manager | Submit a supplier field update as a change request | Updates to critical fields (e.g., bank details) are reviewed before applying |
| US-1.14 | Location Inventory Manager | Submit a stock adjustment request | Manual stock changes are reviewed by a master manager before taking effect |

---

## 8. Frontend Implementation

### Component Map

| Page / Component | File Path | What It Does |
|---|---|---|
| Login Page | `client/src/epics/E1_UserAndRoleManagement/pages/Login.jsx` | Email + password form; JWT stored to `localStorage`; redirects to role-specific dashboard on success |
| Register Page | `client/src/epics/E1_UserAndRoleManagement/pages/Register.jsx` | Customer self-registration form (name, email, password, confirm password) with real-time validation |
| Profile Page | `client/src/epics/E1_UserAndRoleManagement/pages/Profile.jsx` | Displays and edits own name, phone, address; separate form section for password change |
| User Management | `client/src/epics/E1_UserAndRoleManagement/pages/UserManagement.jsx` | Admin table of all users; create-staff modal; inline role edit; deactivate/reactivate toggle |
| Approval Queue | `client/src/epics/E1_UserAndRoleManagement/pages/ApprovalRequests.jsx` | Admin list of pending `ApprovalRequest` docs; approve/reject with optional reviewer notes |
| Auth Context | `client/src/context/AuthContext.jsx` | Global React context; holds `user`, `token`, `login()`, `logout()` helpers; consumed by all protected components |
| API Config | `client/src/api/config.js` | Shared Axios instance with `baseURL: "/api"` and request interceptor that auto-attaches `Authorization: Bearer <token>` |

### Data Flow — Login

```
User fills Login form
         │
         ▼
POST /api/auth/login  { email, password }
         │
         ▼
Server returns { token, user: { _id, name, role } }
         │
         ▼
localStorage.setItem("token", token)
AuthContext.setUser(user)
         │
         ▼
React Router redirects based on user.role:
  admin              → /admin/dashboard
  supplier_manager   → /supplier-manager/dashboard
  finance_manager    → /finance/dashboard
  product_manager    → /product-manager/dashboard
  (customer)         → / (public home)
```

### Data Flow — Protected Route

```
User navigates to /supplier-manager/suppliers
         │
         ▼
<ProtectedRoute allowedRoles={["supplier_manager","admin"]}>
         │
         ▼
Reads localStorage token → checks user.role
         │
   ┌─────┴─────┐
 allowed?    not allowed?
   │              │
renders       redirects to /unauthorized
component
```

### Auth Token Usage Pattern

Every API call from the frontend attaches the JWT via the shared Axios instance:
```javascript
// client/src/api/config.js
import axios from "axios";
const api = axios.create({ baseURL: "/api" });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
export default api;
```
All epics import this `api` instance in their service files (e.g., `supplierService.js`, etc.) so the token is automatically included in every request without repetition.

### Role → Dashboard Routing

| Role | Dashboard Route |
|---|---|
| `admin` | `/admin/dashboard` |
| `finance_manager` | `/finance/dashboard` |
| `supplier_manager` | `/supplier-manager/dashboard` |
| `master_inventory_manager` | `/inventory/dashboard` |
| `location_inventory_manager` | `/inventory/dashboard` |
| `product_manager` | `/product-manager/dashboard` |
| `marketing_manager` | `/marketing/dashboard` |
| `customer` | `/` (public home) |

---

## 9. Error Handling

All controllers return consistent JSON error responses:
```json
{ "success": false, "message": "Descriptive error message" }
```
HTTP status codes used:
- `200` / `201` — success
- `400` — bad request (missing/invalid data)
- `401` — unauthorized (no token / invalid token)
- `403` — forbidden (valid token but insufficient role)
- `404` — not found
- `500` — internal server error


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

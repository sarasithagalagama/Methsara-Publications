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

## 7. How to Change Colors (Frontend)

The frontend for E1 (login, registration, profile pages) uses **Tailwind CSS**.

### Step 1 — Global Theme Colors
Edit `client/tailwind.config.js`:
```javascript
theme: {
  extend: {
    colors: {
      primary: '#1E40AF',    // change this for buttons, links
      secondary: '#9333EA',  // change this for accents
    }
  }
}
```

### Step 2 — Component-Level
Find the login page component (e.g., `client/src/epics/E1_UserAndRoleManagement/`) and change `className` values:
```jsx
// Before
<button className="bg-blue-600 text-white ...">Login</button>

// After
<button className="bg-primary text-white ...">Login</button>
```

### Step 3 — Global CSS
For base styles, edit `client/src/index.css` or `client/src/App.css`.

---

## 8. Viva Q&A

**Q1: Why do you use JWT instead of sessions stored in the database for authentication?**  
A: JWTs are stateless — the server does not need to look up a session record on every request. The token itself contains the user ID and is cryptographically signed. However, in this project we ALSO store session records in MongoDB (`Session` collection) so we can revoke individual sessions (e.g., logout from a specific device). This gives us the best of both worlds: stateless verification speed + revocation capability.

**Q2: Why are there 8 roles instead of just "admin" and "user"?**  
A: The principle of least privilege. Each staff member should only have access to the functionality they need for their job. A `supplier_manager` cannot view financial dashboards; a `finance_manager` cannot create products. This reduces the blast radius if an account is compromised.

**Q3: What is the maker-checker pattern and why is it used?**  
A: It's a two-person-rule for sensitive operations. When a `supplier_manager` wants to update a supplier's bank details, instead of changing the data immediately, an `ApprovalRequest` is created. An `admin` must then review and approve it. This prevents unauthorized or accidental changes to critical data.

**Q4: How does password reset work securely?**  
A: A cryptographically random token is generated (`crypto.randomBytes(32)`). The **raw** token is emailed to the user. The **SHA-256 hash** of that token is stored in the database. When the user submits the token, we hash it and compare it with the stored hash. This means even if the database is breached, the raw token is not exposed.

**Q5: What happens when a user is deactivated?**  
A: `isActive` is set to `false`. All their `Session` records are deleted. The `protect` middleware checks `isActive` on every request, so they cannot log in again even with a valid JWT until an admin reactivates them.

**Q6: How does the TTL index on Session work?**  
A: MongoDB's TTL (Time-To-Live) index automatically deletes documents after a specified number of seconds. The `createdAt` field with `expireAfterSeconds: 2592000` (30 days) means MongoDB's background task checks and deletes expired sessions every 60 seconds. No cron job needed.

**Q7: What is `select: false` on the password field?**  
A: By default, Mongoose includes all fields in query results. `select: false` on `password` means it is **never** returned in query results unless explicitly requested with `.select('+password')`. This prevents passwords from accidentally appearing in API responses.

**Q8: Why do you hash the JWT in the Session collection instead of storing it raw?**  
A: If the `sessions` collection is ever leaked, stored raw JWTs could be used to make authenticated requests. Storing hashed JWTs means the attacker gets useless hashes. The comparison on logout/revocation is done by hashing the incoming token and comparing.

**Q9: What does `optionalProtect` middleware do?**  
A: It attempts to verify a JWT token if present in the `Authorization` header, but does not reject the request if no token exists. This is used for guest checkout (E3 `createOrder`) — logged-in users get their order linked to their account, but guests can also place orders without an account.

**Q10: How does role-based access control work technically?**  
A: `authorize(...roles)` is a higher-order function that returns Express middleware. It reads `req.user.role` (populated by `protect`) and checks if it is in the `roles` array. If not, it returns HTTP 403. Because these are Express middleware functions chained in the route definition, they execute sequentially: protect → authorize → controller.

**Q11: How are sessions managed across multiple devices?**  
A: Each login creates a new `Session` document with the device info and IP address. A user can see all their active sessions via `GET /api/auth/sessions` and revoke any individual session using `POST /api/auth/sessions/:id/revoke`. Logging out only removes the current session, not all sessions.

**Q12: What is `assignedLocation` used for?**  
A: Location Inventory Managers are restricted to managing stock only at their assigned warehouse location. The `authorizeLocation` middleware checks that `req.user.assignedLocation` matches the location being queried in E5 inventory routes. This prevents one location manager from viewing or adjusting stock at another location.

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

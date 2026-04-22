# E1 – User & Role Management (Frontend)

**Epic Owner:** IT24100548 – Galagama S.T  
**Stack:** React · Axios · Context API · React Router  
**Consumes API:** `/api/auth` · `/api/approvals`

---

## 1. Folder Structure

```
E1_UserAndRoleManagement/
├── components/
│   ├── Auth/
│   │   ├── Login.jsx                  – Standalone login form component
│   │   ├── Register.jsx               – Standalone register form component
│   │   ├── AuthModals.jsx             – Login + Register as modal dialogs
│   │   ├── AuthModals.css
│   │   └── Auth.css
│   ├── profile/
│   │   ├── ProfileSettingsModal.jsx   – Edit profile / change password modal
│   │   └── ProfileSettingsModal.css
│   ├── ChangePasswordModal.jsx        – Dedicated change-password dialog
│   ├── ForcePasswordResetModal.jsx    – Shown on login when forcePasswordReset flag is true
│   └── ProtectedRoute.js             – HOC that guards routes by role
├── context/
│   └── AuthContext.js                 – Global auth state (user, token, login, logout)
├── pages/
│   ├── Login.jsx                      – /login page
│   ├── Register.jsx                   – /register page
│   ├── ForgotPassword.jsx             – /forgot-password page
│   ├── ResetPassword.jsx              – /reset-password/:token page
│   ├── AdminDashboard.jsx             – Admin home dashboard
│   ├── AdminDashboard.css
│   ├── AdminUsers.jsx                 – Admin: list, create, edit, deactivate users
│   ├── AdminOrders.jsx                – Admin: order management table
│   ├── AdminSettings.jsx              – Admin: system-level settings panel
│   ├── AdminSettings.css
│   ├── CustomerDashboard.jsx          – Customer home dashboard
│   ├── CustomerDashboard.css
│   └── Auth.css
└── services/
    └── authService.js                 – Axios calls for all auth endpoints
```

---

## 2. How the Frontend Works

```
React App renders
       │
       ▼
AuthContext.js  ← wraps entire app with user state
       │
  localStorage  ← persists token + user object across page refreshes
       │
       ▼
ProtectedRoute.js
       │
  checks req'd role ──► matches? → render page
                   └──► no match → redirect to /login or /unauthorized
       │
       ▼
Page Component (e.g. AdminDashboard.jsx)
       │
       ▼
authService.js ──► api/config.js (Axios) ──► Backend /api/auth/*
```

### Auth State Flow

```
User submits Login form
        │
        ▼
authService.login()  →  POST /api/auth/login
        │
        ▼
Response: { token, user }
        │
   localStorage.setItem('token')
   localStorage.setItem('user')
        │
        ▼
AuthContext updates → user state propagates to all components
        │
        ▼
ProtectedRoute redirects to role-appropriate dashboard
```

---

## 3. All Components & Pages

### `context/AuthContext.js`

| Export | Purpose |
|---|---|
| `AuthProvider` | Wraps app; reads token from localStorage on mount to restore session. |
| `useAuth()` | Hook that returns `{ user, token, login, logout, updateUser }`. |

---

### `components/ProtectedRoute.js`

| Prop | Purpose |
|---|---|
| `roles` | Array of allowed role strings (e.g. `['admin', 'finance_manager']`). If `user.role` is not in the list, redirects to `/unauthorized`. |

---

### `components/Auth/`

| Component | Purpose |
|---|---|
| `Login.jsx` | Controlled form with email + password. Calls `authService.login()`. Shows error from API response. |
| `Register.jsx` | Name, email, password, confirm-password form. Calls `authService.register()`. |
| `AuthModals.jsx` | Wraps both Login and Register as `<Modal>` dialogs, toggling between them. Used on the Home page hero section. |

---

### `components/profile/ProfileSettingsModal.jsx`

Allows logged-in users to update their name, phone, and address. Calls `PUT /api/auth/profile`. Closes on success and re-fetches user data into context.

---

### `components/ChangePasswordModal.jsx`

Form: old password → new password → confirm new password. Calls `PUT /api/auth/change-password`. On success, logs the user out (all sessions revoked on backend).

---

### `components/ForcePasswordResetModal.jsx`

Rendered automatically after login if `user.forcePasswordReset === true`. Prevents navigation until the password is changed.

---

### `pages/AdminDashboard.jsx`

Staff-only landing page. Displays summary cards (total users, recent orders, revenue snapshot). Links to all admin sub-pages. Features a "Critical Actions" section equipped with essential utilities including Staff Invite, One-Click Backup, and System Health Monitor.

---

### `pages/AdminUsers.jsx`

Full user management table for admins:
- View all users with role and status filters
- Create staff accounts (triggers temp-password email via backend)
- Deactivate / reactivate users
- Edit user role

---

### `pages/AdminOrders.jsx`

Order management table scoped to admin view. Allows status changes and payment mark-up. Delegates to E3 order service.

---

### `pages/AdminSettings.jsx`

System configuration panel. Currently manages approval workflow settings and system-level toggles.

---

### `pages/CustomerDashboard.jsx`

Customer home after login. Shows recent orders, wishlist shortcut, loyalty points balance, and account links.

---

### `pages/ForgotPassword.jsx`

Email input form. Calls `POST /api/auth/forgot-password`. Displays a confirmation message telling the user to check their email.

---

### `pages/ResetPassword.jsx`

Reads `:token` from URL params. New password + confirm form. Calls `POST /api/auth/reset-password/:token`.

---

## 4. Service Methods

### `services/authService.js`

| Method | API Call | Purpose |
|---|---|---|
| `register(userData)` | `POST /api/auth/register` | Register new customer; stores token + user in localStorage. |
| `login(credentials)` | `POST /api/auth/login` | Authenticate; stores token + user in localStorage. |
| `logout()` | — | Clears localStorage token and user. |
| `getCurrentUser()` | — | Reads and parses user from localStorage. |
| `getMe()` | `GET /api/auth/me` | Fetch fresh profile from server (re-syncs context). |
| `updateProfile(data)` | `PUT /api/auth/profile` | Update name, phone, address. |
| `changePassword(data)` | `PUT /api/auth/change-password` | Requires old password + new password. |
| `forgotPassword(email)` | `POST /api/auth/forgot-password` | Sends reset email link. |
| `resetPassword(token, data)` | `POST /api/auth/reset-password/:token` | Finalises password reset. |
| `getAllUsers(params)` | `GET /api/auth/users` | Admin: fetch user list with filters. |
| `createStaff(data)` | `POST /api/auth/create-staff` | Admin: create staff account. |
| `updateUser(id, data)` | `PUT /api/auth/users/:id` | Admin: update any user. |
| `deactivateUser(id)` | `PUT /api/auth/users/:id/deactivate` | Admin: deactivate user account. |
| `reactivateUser(id)` | `PUT /api/auth/users/:id/reactivate` | Admin: reactivate user account. |

---

## 5. Role → Dashboard Routing

| Role | Landing Page |
|---|---|
| `admin` | `/admin/dashboard` → `AdminDashboard.jsx` |
| `customer` | `/customer/dashboard` → `CustomerDashboard.jsx` |
| `product_manager` | `/product-manager/dashboard` → E2 `ProductManagerDashboard.jsx` |
| `finance_manager` | `/finance/dashboard` → E3 `FinanceManagerDashboard.jsx` |
| `supplier_manager` | `/supplier/dashboard` → E4 `SupplierManagerDashboard.jsx` |
| `master_inventory_manager` / `location_inventory_manager` | `/inventory/dashboard` → E5 `InventoryManagerDashboard.jsx` |
| `marketing_manager` | `/marketing/dashboard` → E6 `MarketingManagerDashboard.jsx` |


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

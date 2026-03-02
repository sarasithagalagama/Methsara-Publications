# Methsara Publications Webstore

An e-commerce platform for Methsara Publications — Educational Materials. Built with the MERN stack (MongoDB, Express, React, Node.js).

---

## Prerequisites

### 1. Install Node.js

Node.js (v18 or later) is required to run both the server and the client.

1. Go to [https://nodejs.org](https://nodejs.org)
2. Download the **LTS** version
3. Run the installer with default settings
4. Verify:

```bash
node -v
npm -v
```

Both commands should print a version number (e.g. `v20.x.x` and `10.x.x`).

### 2. Install Git

1. Go to [https://git-scm.com](https://git-scm.com) and download the installer
2. Run the installer with default settings
3. Verify:

```bash
git --version
```

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/sarasithagalagama/Methsara-Publications.git
cd Methsara-Publications
```

### 2. Install root dependencies

```bash
npm install
```

### 3. Install client dependencies

```bash
cd client
npm install
cd ..
```

> **Note:** The `.env` file and product image uploads are already included in the repository — no additional configuration is needed.

---

## Running the App

From the root directory, start both the server and client together:

```bash
npm start
```

This uses `concurrently` to launch:
- **Backend** (Express + MongoDB) on `http://localhost:5001`
- **Frontend** (React) on `http://localhost:3000`

The React app will open automatically in your browser.

### Run server only

```bash
npm run server
```

### Run client only

```bash
npm run client
```

---

## Troubleshooting

### MongoDB connection error on Windows (`querySrv ECONNREFUSED`)

Node.js on Windows sometimes cannot reach the system DNS server for SRV record
lookups, which are required by `mongodb+srv://` URIs. This is already fixed in
`server.js` by calling `dns.setServers(["8.8.8.8", "1.1.1.1"])` before any
Mongoose connection is made. No action is needed — it works out of the box.

If you still see a connection error, the most likely cause is that your IP address
is not whitelisted in MongoDB Atlas:

1. Log in at [https://cloud.mongodb.com](https://cloud.mongodb.com)
2. Go to **Network Access**
3. Add your current IP, or add `0.0.0.0/0` to allow any IP during development

The server will automatically retry the connection every 5 seconds (up to 12
attempts) without crashing, so you can add your IP and it will connect without a
restart.

### `'concurrently' is not recognized`

Run `npm install` in the root directory to restore missing dependencies:

```bash
npm install
```

### `'react-scripts' is not recognized`

Run `npm install` inside the `client` folder:

```bash
cd client
npm install
```

### Port already in use (`EADDRINUSE :5001` or `:3000`)

A previous server process is still running on that port. Find and kill it:

**Windows:**
```bash
netstat -ano | findstr :5001
taskkill /PID <PID> /F
```

Replace `5001` with `3000` for the React dev server. Then run `npm start` again.

### React dev server deprecation warnings (`DEP0176`, `DEP_WEBPACK_DEV_SERVER_*`)

These warnings are internal to `react-scripts@5.0.1` and cannot be fixed in
application code. They are suppressed via `client/.env`:

```
NODE_OPTIONS=--no-deprecation
```

This file is already included in the repository.

### Images not loading

Product images are served from the `uploads/` folder, which is included in the
repository. If images are still missing, ensure the backend is running on port
`5001`.

---

## Project Structure

```
Methsara-Publications/
├── server.js               # Express entry point
├── .env                    # Environment variables (DB URI, JWT secret, port)
├── package.json            # Root dependencies and scripts
├── uploads/                # Uploaded product images (served as static files)
├── epics/                  # Backend feature modules (controllers, models, routes)
│   ├── E1_UserAndRoleManagement/
│   ├── E2_ProductCatalog/
│   ├── E3_OrderAndTransaction/
│   ├── E4_SupplierManagement/
│   ├── E5_InventoryManagement/
│   └── E6_PromotionAndLoyalty/
└── client/                 # React frontend
    ├── .env                # Frontend env overrides (deprecation warning suppression)
    ├── public/
    └── src/
        ├── components/
        ├── epics/          # Frontend feature modules
        └── pages/
```

---

## Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Frontend  | React 18, React Router, Chart.js  |
| Backend   | Node.js, Express                  |
| Database  | MongoDB Atlas, Mongoose           |
| Auth      | JWT, bcryptjs                     |
| Dev Tools | Nodemon, Concurrently, Jest       |

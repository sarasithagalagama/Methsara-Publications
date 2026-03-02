# Methsara Publications Webstore

An e-commerce platform for Methsara Publications — Educational Materials. Built with the MERN stack (MongoDB, Express, React, Node.js).

---

## Prerequisites

### 1. Install Node.js

Node.js is required to run both the server and the client.

1. Go to [https://nodejs.org](https://nodejs.org)
2. Download the **LTS** version (recommended)
3. Run the installer and follow the prompts
4. Verify the installation by opening a terminal and running:

```bash
node -v
npm -v
```

Both commands should print a version number (e.g. `v20.x.x` and `10.x.x`).

### 2. Install Git

1. Go to [https://git-scm.com](https://git-scm.com) and download the installer
2. Run the installer with default settings
3. Verify with:

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

> **Note:** The `.env` file and product image uploads are already included in the repository — no extra configuration needed.

---

## Running the App

From the root directory, run both the server and client together:

```bash
npm start
```

This uses `concurrently` to start:
- **Backend** (Express) on `http://localhost:5001`
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

### Port already in use (EADDRINUSE)

A previous server process is still running. Kill it by finding the PID on the port and stopping it:

**Windows:**
```bash
netstat -ano | findstr :5001
taskkill /PID <PID> /F
```

Then run `npm start` again.

### Images not loading

Product images are served from the `uploads/` folder. This folder is included in the repository, so images should load automatically after cloning. If images are still missing, ensure the backend is running on port `5001`.

---

## Project Structure

```
Methsara-Publications/
├── server.js               # Express entry point
├── package.json            # Root dependencies & scripts
├── epics/                  # Backend features (controllers, models, routes)
│   ├── E1_UserAndRoleManagement/
│   ├── E2_ProductCatalog/
│   ├── E3_OrderAndTransaction/
│   ├── E4_SupplierManagement/
│   ├── E5_InventoryManagement/
│   └── E6_PromotionAndLoyalty/
└── client/                 # React frontend
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
| Database  | MongoDB, Mongoose                 |
| Auth      | JWT, bcryptjs                     |
| Dev Tools | Nodemon, Concurrently, Jest       |

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

### 2. Install Git (optional, for cloning)

If you need to clone the repository:

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

### 2. Set up environment variables

Create a `.env` file in the root directory with the following values:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

### 3. Install root dependencies

From the root of the project:

```bash
npm install
```

### 4. Install client dependencies

```bash
cd client
npm install
cd ..
```

---

## Running the App

From the root directory, run both the server and client together:

```bash
npm start
```

This uses `concurrently` to start:
- **Backend** (Express) on `http://localhost:5000`
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

### MongoDB connection error

Make sure your `MONGO_URI` in `.env` is correct and your MongoDB instance (local or Atlas) is running.

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

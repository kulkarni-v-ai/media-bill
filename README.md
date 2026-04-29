# Media Billing POS

A full-stack billing Point-of-Sale system for Polaroids, Posters & Stickers.

## Quick Start

### 1. Backend Setup

```bash
cd backend

# Copy and fill in your MongoDB URI
copy .env.example .env
# Edit .env: set MONGODB_URI to your MongoDB Atlas connection string

npm install
npm run seed     # Creates sample data + default accounts
npm run dev      # Starts on http://localhost:5000
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev      # Starts on http://localhost:5173
```

---

## Default Login Accounts (after seed)

| Role    | Email                  | Password    |
|---------|------------------------|-------------|
| Admin   | admin@media.com        | admin123    |
| Manager | manager@media.com      | manager123  |
| Cashier | cashier@media.com      | cashier123  |
| Viewer  | viewer@media.com       | viewer123   |

---

## Features

- **Billing**: Add items, see Polaroids in a separate section, Posters/Stickers grouped together
- **Stock Guard**: Items with 0 stock are visually blocked (out-of-stock overlay) and API-level rejection
- **QR Payment**: Select QR1–QR4 per bill, stored and reported on
- **RBAC**: Admin, Manager, Cashier, Viewer with role-gated routes
- **Admin-only**: Category totals (polaroid vs others) hidden from cashier/viewer
- **Reports**: Daily sales, QR-wise breakdown, top items, revenue chart
- **Low Stock Alerts**: Pulse badge + alert banner when stock ≤ threshold

## Deployment

### Backend → Render
- Build command: `npm install`
- Start command: `node src/server.js`
- Add env vars: `MONGODB_URI`, `JWT_SECRET`, `CLIENT_ORIGIN`, `NODE_ENV=production`

### Frontend → Vercel / Netlify
- Build command: `npm run build`
- Output dir: `dist`
- Add env var: `VITE_API_URL` (if not using Vite proxy)

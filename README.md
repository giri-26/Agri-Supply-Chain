# Agri Supply Chain Tracking and Management System

A LAN-based, full-stack platform for tracking agricultural products from **Farmer → Collection Center → Warehouse → Transport → Retailer → Customer**, built to run entirely on a local network with no cloud dependencies.

## Current Build Status

**Fully built and functional (this phase):**
- Farmers: add/edit/delete, farmer profile with farms, photo upload, search
- Products/Crops: add/edit/delete, categories, images, quantity/harvest date/unit/status
- Inventory: available stock, incoming/outgoing stock ledger, warehouse + batch management, search/filters
- Collection Centers: create/update, assign farmers, capacity/location/contact, accept/reject product deliveries
- Orders: create, accept/reject/cancel/fulfill, status history
- Shipments: create, assign vehicle/driver, live GPS tracking with route map, delivery status
- Buyers: registration, profile, purchase history, active orders
- Reports: daily/weekly/monthly sales, farmer/product/shipment/inventory reports, Excel export
- Analytics Dashboard: KPI cards (revenue, farmers, products, active shipments, pending orders) + charts
- Notifications: real-time via Socket.IO, dedicated notifications page
- Profile: edit profile, upload photo, change password

**Carried over from the previous phase, unmodified:**
- JWT authentication (login/signup/forgot/reset password) — untouched
- Core dashboard shell, protected routes, dark theme, Socket.IO setup — untouched
- Public customer tracking page — untouched

**Two minimal, necessary additions to the auth layer** (everything else in auth is untouched):
- Added `buyer` to the list of valid signup roles (`authValidation.js`) — required for the new Buyers module to have an account type at all.
- Added a `buyer` role row via the additive migration — same reason, no existing role changed.

No other authentication, login, signup, or dashboard code was regenerated or modified.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 (Vite), Tailwind CSS v4, Framer Motion, React Router, Axios |
| Backend | Node.js, Express.js |
| Database | PostgreSQL (local, no cloud) |
| Auth | JWT (access + refresh), BCrypt |
| Real-time | Socket.IO |
| Maps | Leaflet.js + OpenStreetMap |
| Charts | Chart.js |
| QR Codes | `qrcode` (server), `qrcode.react` / `html5-qrcode` (client) |
| Logging | Winston |

## Project Structure

```
agri-supply-chain/
├── backend/
│   ├── src/
│   │   ├── config/         # env + database pool
│   │   ├── controllers/    # request handlers
│   │   ├── routes/         # Express routers
│   │   ├── middleware/     # auth, RBAC, rate limiting, upload, error handling
│   │   ├── models/         # raw parameterized SQL data access
│   │   ├── services/       # business logic
│   │   ├── validations/    # express-validator rule sets
│   │   ├── utils/          # logger, JWT, ID generation, audit logging
│   │   └── sockets/        # Socket.IO setup
│   ├── uploads/            # farmer/product/profile images (gitignored)
│   ├── logs/                # winston log files (gitignored)
│   ├── server.js
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/            # axios client + endpoint definitions
│   │   ├── context/        # Auth, Socket, Theme providers
│   │   ├── components/     # DashboardLayout, StatCard, nav config
│   │   ├── pages/          # auth pages, dashboard, customer tracking
│   │   └── routes/         # ProtectedRoute
│   └── .env.example
├── database/
│   ├── schema.sql
│   └── seed.sql
└── docs/
    ├── LAN_SETUP.md
    ├── DATABASE_SETUP.md
    └── API_DOCUMENTATION.md
```

## Quick Start

See `docs/DATABASE_SETUP.md` and `docs/LAN_SETUP.md` for full detail. Short version:

```bash
# 1. Create the database and load schema + seed data + module migration
createdb agri_supply_chain
psql -d agri_supply_chain -f database/schema.sql
psql -d agri_supply_chain -f database/seed.sql
psql -d agri_supply_chain -f database/migrations/002_add_modules.sql

# 2. Backend
cd backend
cp .env.example .env      # edit DB credentials + SERVER_LOCAL_IP
npm install
npm run dev               # http://localhost:5000

# 3. Frontend (in a new terminal)
cd frontend
cp .env.example .env      # point VITE_API_BASE_URL at your server's LAN IP
npm install
npm run dev                # http://localhost:5173
```

Default admin login: `admin@agrichain.local` / `Admin@12345` — **change this immediately after first login.**

## Other devices on the LAN

Any device on the same network reaches the app at `http://SERVER_LOCAL_IP:5173`, and the frontend talks to the API at `http://SERVER_LOCAL_IP:5000/api`. See `docs/LAN_SETUP.md` for firewall notes and finding your local IP.

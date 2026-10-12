# API Documentation

Base URL: `http://SERVER_LOCAL_IP:5000/api`

All responses follow the shape:
```json
{ "success": true|false, "message": "...", "data": {...} }
```

Authenticated routes require a header: `Authorization: Bearer <accessToken>`. The refresh token is stored in an httpOnly cookie automatically set at login.

---

## Auth (`/api/auth`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | Public | Register a new user. `{ fullName, email, phone?, password, role }`. Roles: `farmer`, `collection_center`, `warehouse_manager`, `transporter`, `retailer`, `customer`. Some roles require admin approval before first login. |
| POST | `/login` | Public | `{ email, password }` → returns `accessToken` + user, sets refresh cookie |
| POST | `/refresh` | Cookie | Issues a new access token from the refresh cookie |
| POST | `/logout` | Cookie | Invalidates the refresh token |
| POST | `/forgot-password` | Public | `{ email }` → generates a reset token (returned directly in this LAN build since there's no outbound email service) |
| POST | `/reset-password` | Public | `{ token, newPassword }` |
| GET | `/me` | Bearer | Returns the current authenticated user |

Password rule: minimum 8 characters, at least one uppercase, one lowercase, one number, one special character.

---

## Admin (`/api/admin`) — role: `admin`

| Method | Path | Description |
|---|---|---|
| GET | `/dashboard-stats` | Farmer/product/shipment/inventory/order/alert counts |
| GET | `/users?role=&search=&page=&limit=` | Paginated user list, filterable by role or name/email search |
| PATCH | `/users/:id/approve` | Approve a pending registration |
| PATCH | `/users/:id/reject` | Reject a pending registration |
| PATCH | `/users/:id/active` | `{ isActive: true|false }` — activate/deactivate a user |
| GET | `/activity-logs?page=&limit=` | Paginated audit log |

---

## Tracking (`/api/tracking`) — Public, no auth

| Method | Path | Description |
|---|---|---|
| GET | `/:trackingId` | Full product journey: product details, farm info, images, collection records, warehouse/batch history, shipment history, and a chronological timeline. Powers both the Customer Tracking page and QR-code scans. |

---

## Notifications (`/api/notifications`) — any authenticated role

| Method | Path | Description |
|---|---|---|
| GET | `/?page=&limit=` | List notifications for the current user (direct + role-broadcast + global) |
| PATCH | `/:id/read` | Mark a notification as read |

Real-time delivery: connect a Socket.IO client to the server root with `auth: { token: accessToken }`. The server joins each socket to `user:<id>` and `role:<role>` rooms and emits a `notification` event whenever one is created.

---

## Scaffolded modules (business logic in next build phase)

These are wired into the API with correct authentication/role gates and currently return their planned endpoint list at `GET /`:

| Base path | Role | Planned endpoints |
|---|---|---|
| `/api/farmers` | `farmer`, `admin` | Register farm, register product + QR generation, update harvest quantity, upload product images |
| `/api/collection` | `collection_center`, `admin` | Scan product, accept/reject with quality & weight verification, list records |
| `/api/warehouse` | `warehouse_manager`, `admin` | Create batch + shelf assignment, inventory list with low-stock/expiry alerts, environment logs |
| `/api/transport` | `transporter`, `admin` | Register vehicle, create shipment, update status (pickup/dispatch/delivered/cancelled), push live GPS location |
| `/api/retailer` | `retailer`, `admin` | Receive/verify shipment, view stock, record sale/order |
| `/api/reports` | `admin`, `warehouse_manager`, `transporter`, `retailer` | PDF/Excel export for inventory, shipments, farmers, sales |
| `/api/search` | any authenticated role | Global search across farmers, products, tracking IDs, vehicles, warehouses |

---

## Error format

```json
{
  "success": false,
  "message": "Validation failed",
  "details": [{ "field": "email", "message": "A valid email is required" }]
}
```

## Rate limits

- General API: 300 requests / 15 minutes per IP
- Auth endpoints (`/login`, `/register`, `/forgot-password`, `/reset-password`): 20 requests / 15 minutes per IP

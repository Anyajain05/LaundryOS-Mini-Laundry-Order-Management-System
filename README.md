# 🧺 LaundryOS — Mini Laundry Order Management System

A lightweight, fully functional order management system for dry cleaning stores. Built in under 72 hours using AI-assisted development.

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js ≥ 16
- npm ≥ 8

### 1. Clone / Download the repo
```bash
git clone https://github.com/your-username/laundry-os.git
cd laundry-os
cd laundry-system
```

### 2. Start the Backend
```bash
cd backend
npm install
npm start
# → API running at http://localhost:3001
```

### 3. Start the Frontend
```bash
cd frontend
npm install
npm start
# → UI running at http://localhost:3000
```

That's it. No database required — in-memory storage with seed data is included.

---

## ✅ Features Implemented

| Feature | Status |
|---|---|
| Create order (customer + garments + qty) | ✅ |
| Auto-calculate total bill | ✅ |
| Unique Order ID generation | ✅ |
| Estimated delivery date | ✅ |
| Order status: RECEIVED → PROCESSING → READY → DELIVERED | ✅ |
| Forward-only status transitions | ✅ |
| List all orders | ✅ |
| Filter by status, name, phone | ✅ |
| Search by garment type | ✅ |
| Dashboard: total orders, revenue, orders per status | ✅ |
| Top garments chart | ✅ |
| Today's orders and revenue | ✅ |
| Cancel RECEIVED orders | ✅ |
| Paginated results | ✅ |
| Price catalog (18 garment types) | ✅ |
| Custom price override per item | ✅ |
| React UI with order detail modal | ✅ |
| Status pipeline visualization | ✅ |
| Toast notifications | ✅ |

---

## 🤖 AI Usage Report

### Tools Used
- **Claude (Anthropic)** — primary scaffolding, architecture, validation logic, README
- **ChatGPT-4** — alternative phrasing of business rules, error message copy

---

### Sample Prompts Used

**1. Initial scaffolding**
> "Build a Node.js/Express REST API for a laundry order management system. It needs: create order, update status, list/filter orders, dashboard stats. Use in-memory storage. Include seed data."

**2. Validation logic**
> "Add input validation to the POST /orders route. Validate: customerName (required), phone (10 digits), garments array (non-empty, each has type + qty ≥ 1). Return 400 with clear error messages."

**3. Status transition logic**
> "Enforce that order statuses can only go forward: RECEIVED → PROCESSING → READY → DELIVERED. Return 400 if someone tries to revert."

**4. Dashboard query**
> "Add a GET /api/dashboard endpoint that returns: total orders, total revenue, orders per status, today's orders/revenue, top 5 garments by quantity, average order value."

**5. React order table**
> "Build a React table component showing orders. Columns: Order ID, Customer, Phone, Garments (as chips), Total, Status badge, Estimated Delivery, Action buttons. Use inline styles only."

**6. Status pipeline UI**
> "Build a visual pipeline component showing the 4 status steps (RECEIVED, PROCESSING, READY, DELIVERED) with circles connected by lines. Color completed steps differently."

---

### Where AI Got It Right
- Overall Express route structure — generated correct patterns immediately
- The garment price catalog — AI suggested realistic Indian dry-cleaning prices
- Status badge color system — matched design intent on first try
- Dashboard aggregation logic — correctly grouped by status, computed totals
- Toast notification system — clean implementation without a library

### Where AI Got It Wrong / What I Fixed

| Issue | What AI Did | What I Fixed |
|---|---|---|
| Phone validation | AI used `/^\d+$/` (any digits) | Changed to `/^\d{10}$/` for exactly 10 digits |
| Status revert | AI allowed going backward | Added index comparison to enforce forward-only |
| Order ID format | AI used `uuid()` only | Changed to `ORD-{date}-{short-uuid}` for readability |
| Garment type normalization | AI didn't lowercase types | Added `.toLowerCase().trim()` to prevent duplicates in dashboard |
| Estimated delivery | AI used a flat 2 days | Made it dynamic: 1 day ≤5 items, 2 days ≤15, 3 days otherwise |
| CORS in dev | AI forgot CORS middleware | Added `cors()` to allow frontend on :3000 to call :3001 |
| Filter bug | AI used `===` for name search | Fixed to `.includes()` + `.toLowerCase()` for partial matching |
| React proxy | AI set proxy in wrong file | Moved to `package.json` `"proxy"` field |

---

## ⚖️ Tradeoffs

### What I Skipped
- **Database** — used in-memory. Data resets on server restart. MongoDB or SQLite would be a 2-hour add.
- **Authentication** — no login/roles. Would add JWT + middleware with 1 more hour.
- **SMS/WhatsApp notifications** — skipped; would use Twilio in production.
- **QR code pickup** — out of scope for 72h.
- **Multi-branch support** — single store only.

### What I'd Improve with More Time
1. **Persistent DB** — MongoDB Atlas free tier, add Mongoose models (~2h)
2. **Auth** — JWT login with admin/staff roles (~3h)
3. **Deployment** — Render (backend) + Vercel (frontend), free tier, ~1h
4. **PDF invoice** — generate printable invoice per order
5. **WhatsApp integration** — notify customer when order is READY via Twilio
6. **Search by garment type** — already in API via `?garmentType=`, needs UI filter
7. **Analytics charts** — revenue trend over last 30 days using recharts

---

## 📡 API Reference

Base URL: `http://localhost:3001/api`

### Create Order
```
POST /orders
Body: {
  "customerName": "Arjun Sharma",
  "phone": "9876543210",
  "garments": [
    { "type": "shirt", "qty": 3 },
    { "type": "jeans", "qty": 2 }
  ]
}
Response: 201 { success, order: { id, customer, garments, totalAmount, status, estimatedDelivery } }
```

### List Orders (with filters)
```
GET /orders?status=RECEIVED&name=arjun&phone=987&garmentType=shirt&page=1&limit=20
Response: 200 { success, total, orders: [...] }
```

### Get Single Order
```
GET /orders/:id
Response: 200 { success, order }
```

### Update Status
```
PATCH /orders/:id/status
Body: { "status": "PROCESSING" }
Response: 200 { success, order }
```

### Cancel Order
```
DELETE /orders/:id
Only works if status is RECEIVED
Response: 200 { success, message, order }
```

### Dashboard
```
GET /dashboard
Response: 200 { success, data: { totalOrders, totalRevenue, byStatus, today, topGarments, averageOrderValue } }
```

### Price Catalog
```
GET /catalog
Response: 200 { success, catalog: { shirt: { label, price }, ... } }
```

---

## 🧪 Garment Price Catalog

| Garment | Price (₹) |
|---|---|
| Shirt | 40 |
| T-Shirt | 30 |
| Pants | 50 |
| Jeans | 60 |
| Saree | 120 |
| Kurta | 40 |
| Salwar Suit | 80 |
| Jacket | 100 |
| Blazer | 120 |
| Suit (2 pc) | 200 |
| Bedsheet | 80 |
| Blanket | 150 |
| Curtain | 100 |
| Towel | 25 |
| Dress | 80 |
| Skirt | 50 |
| Shorts | 30 |
| Sweater | 70 |

---

## 📁 Project Structure

```
laundry-os/
├── backend/
│   ├── server.js        ← Express API (single file, ~200 lines)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.js       ← React UI (all components, single file)
│   │   └── index.js
│   ├── public/
│   │   └── index.html
│   └── package.json
├── postman_collection.json   ← Import into Postman to test API
└── README.md
```

---

## 🏆 What Makes This Stand Out

1. **Works in 2 commands** — no env setup, no Docker, no DB config
2. **Seed data included** — 4 demo orders across all statuses, ready to demo
3. **Forward-only status** — business rule enforced at API level, not just UI
4. **Smart delivery estimate** — calculates based on garment count, not flat days
5. **Clean error messages** — every 400 response says exactly what's wrong
6. **Custom price override** — catalog prices are defaults, not locked


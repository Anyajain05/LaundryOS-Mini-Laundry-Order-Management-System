/**
 * Laundry Order Management System - Backend
 * In-memory storage (no DB required to run)
 */

const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(cors());
app.use(express.json());

// ── Price catalog ─────────────────────────────────────────────────────────────
const PRICE_CATALOG = {
  shirt:       { label: "Shirt",        price: 40  },
  tshirt:      { label: "T-Shirt",      price: 30  },
  pants:       { label: "Pants",        price: 50  },
  jeans:       { label: "Jeans",        price: 60  },
  saree:       { label: "Saree",        price: 120 },
  kurta:       { label: "Kurta",        price: 40  },
  salwar:      { label: "Salwar Suit",  price: 80  },
  jacket:      { label: "Jacket",       price: 100 },
  blazer:      { label: "Blazer",       price: 120 },
  suit:        { label: "Suit (2 pc)",  price: 200 },
  bedsheet:    { label: "Bedsheet",     price: 80  },
  blanket:     { label: "Blanket",      price: 150 },
  curtain:     { label: "Curtain",      price: 100 },
  towel:       { label: "Towel",        price: 25  },
  dress:       { label: "Dress",        price: 80  },
  skirt:       { label: "Skirt",        price: 50  },
  shorts:      { label: "Shorts",       price: 30  },
  sweater:     { label: "Sweater",      price: 70  },
};

const VALID_STATUSES = ["RECEIVED", "PROCESSING", "READY", "DELIVERED"];

// ── In-memory store ───────────────────────────────────────────────────────────
let orders = [
  {
    id: "ORD-001",
    customer: { name: "Arjun Sharma", phone: "9876543210" },
    garments: [
      { type: "shirt",   label: "Shirt",  qty: 3, pricePerItem: 40, subtotal: 120 },
      { type: "jeans",   label: "Jeans",  qty: 2, pricePerItem: 60, subtotal: 120 },
    ],
    totalAmount: 240,
    status: "PROCESSING",
    estimatedDelivery: new Date(Date.now() + 86400000 * 2).toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: "ORD-002",
    customer: { name: "Priya Mehta", phone: "9123456780" },
    garments: [
      { type: "saree",   label: "Saree",  qty: 4, pricePerItem: 120, subtotal: 480 },
    ],
    totalAmount: 480,
    status: "RECEIVED",
    estimatedDelivery: new Date(Date.now() + 86400000 * 3).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "ORD-003",
    customer: { name: "Sneha Patel", phone: "9871234560" },
    garments: [
      { type: "bedsheet", label: "Bedsheet", qty: 2, pricePerItem: 80, subtotal: 160 },
      { type: "towel",    label: "Towel",    qty: 4, pricePerItem: 25, subtotal: 100 },
    ],
    totalAmount: 260,
    status: "READY",
    estimatedDelivery: new Date(Date.now() + 86400000).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "ORD-004",
    customer: { name: "Rahul Verma", phone: "9988776655" },
    garments: [
      { type: "suit", label: "Suit (2 pc)", qty: 1, pricePerItem: 200, subtotal: 200 },
      { type: "shirt", label: "Shirt",      qty: 2, pricePerItem: 40,  subtotal: 80  },
    ],
    totalAmount: 280,
    status: "DELIVERED",
    estimatedDelivery: new Date(Date.now() - 86400000).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function calcEstimatedDelivery(garments) {
  const totalItems = garments.reduce((s, g) => s + g.qty, 0);
  const days = totalItems <= 5 ? 1 : totalItems <= 15 ? 2 : 3;
  return new Date(Date.now() + 86400000 * days).toISOString();
}

function generateOrderId() {
  const num = String(orders.length + 1).padStart(3, "0");
  return `ORD-${num}-${uuidv4().slice(0, 4).toUpperCase()}`;
}

// ── Routes ────────────────────────────────────────────────────────────────────

// GET /api/catalog — price list
app.get("/api/catalog", (req, res) => {
  res.json({ success: true, catalog: PRICE_CATALOG });
});

// POST /api/orders — create order
app.post("/api/orders", (req, res) => {
  const { customerName, phone, garments } = req.body;

  // Validation
  if (!customerName?.trim()) return res.status(400).json({ success: false, error: "customerName is required" });
  if (!phone?.trim()) return res.status(400).json({ success: false, error: "phone is required" });
  if (!/^\d{10}$/.test(phone.trim())) return res.status(400).json({ success: false, error: "phone must be exactly 10 digits" });
  if (!Array.isArray(garments) || garments.length === 0)
    return res.status(400).json({ success: false, error: "garments must be a non-empty array" });

  const processedGarments = [];
  let totalAmount = 0;

  for (const g of garments) {
    const type = g.type?.toLowerCase()?.trim();
    const qty = parseInt(g.qty);
    if (!type) return res.status(400).json({ success: false, error: "Each garment must have a type" });
    if (!qty || qty < 1) return res.status(400).json({ success: false, error: `Invalid qty for ${type}` });

    const catalog = PRICE_CATALOG[type];
    const pricePerItem = catalog ? catalog.price : (g.pricePerItem || 50); // fallback
    const label = catalog ? catalog.label : type;
    const subtotal = pricePerItem * qty;

    processedGarments.push({ type, label, qty, pricePerItem, subtotal });
    totalAmount += subtotal;
  }

  const order = {
    id: generateOrderId(),
    customer: { name: customerName.trim(), phone: phone.trim() },
    garments: processedGarments,
    totalAmount,
    status: "RECEIVED",
    estimatedDelivery: calcEstimatedDelivery(processedGarments),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  orders.push(order);
  res.status(201).json({ success: true, order });
});

// GET /api/orders — list + filter
app.get("/api/orders", (req, res) => {
  const { status, name, phone, garmentType, page = 1, limit = 50 } = req.query;

  let filtered = [...orders];

  if (status) {
    const s = status.toUpperCase();
    if (!VALID_STATUSES.includes(s)) return res.status(400).json({ success: false, error: `Invalid status. Valid: ${VALID_STATUSES.join(", ")}` });
    filtered = filtered.filter(o => o.status === s);
  }
  if (name) filtered = filtered.filter(o => o.customer.name.toLowerCase().includes(name.toLowerCase()));
  if (phone) filtered = filtered.filter(o => o.customer.phone.includes(phone));
  if (garmentType) filtered = filtered.filter(o => o.garments.some(g => g.type.toLowerCase().includes(garmentType.toLowerCase())));

  // Sort newest first
  filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const total = filtered.length;
  const start = (parseInt(page) - 1) * parseInt(limit);
  const paginated = filtered.slice(start, start + parseInt(limit));

  res.json({
    success: true,
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    orders: paginated,
  });
});

// GET /api/orders/:id — single order
app.get("/api/orders/:id", (req, res) => {
  const order = orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ success: false, error: "Order not found" });
  res.json({ success: true, order });
});

// PATCH /api/orders/:id/status — update status
app.patch("/api/orders/:id/status", (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ success: false, error: "status is required" });

  const normalized = status.toUpperCase();
  if (!VALID_STATUSES.includes(normalized))
    return res.status(400).json({ success: false, error: `Invalid status. Valid values: ${VALID_STATUSES.join(", ")}` });

  const idx = orders.findIndex(o => o.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: "Order not found" });

  // Enforce forward-only transitions
  const currentIdx = VALID_STATUSES.indexOf(orders[idx].status);
  const newIdx = VALID_STATUSES.indexOf(normalized);
  if (newIdx < currentIdx)
    return res.status(400).json({ success: false, error: `Cannot revert status from ${orders[idx].status} to ${normalized}` });

  orders[idx] = { ...orders[idx], status: normalized, updatedAt: new Date().toISOString() };
  res.json({ success: true, order: orders[idx] });
});

// DELETE /api/orders/:id — cancel (only RECEIVED)
app.delete("/api/orders/:id", (req, res) => {
  const idx = orders.findIndex(o => o.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: "Order not found" });
  if (orders[idx].status !== "RECEIVED")
    return res.status(400).json({ success: false, error: "Only RECEIVED orders can be cancelled" });
  const cancelled = orders.splice(idx, 1)[0];
  res.json({ success: true, message: "Order cancelled", order: cancelled });
});

// GET /api/dashboard — summary stats
app.get("/api/dashboard", (req, res) => {
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((s, o) => s + o.totalAmount, 0);

  const byStatus = {};
  VALID_STATUSES.forEach(s => { byStatus[s] = 0; });
  orders.forEach(o => { byStatus[o.status]++; });

  const today = new Date().toDateString();
  const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today);
  const todayRevenue = todayOrders.reduce((s, o) => s + o.totalAmount, 0);

  // Popular garments
  const garmentCounts = {};
  orders.forEach(o => o.garments.forEach(g => {
    garmentCounts[g.label] = (garmentCounts[g.label] || 0) + g.qty;
  }));
  const topGarments = Object.entries(garmentCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, count]) => ({ label, count }));

  // Revenue by garment type
  const revenueByGarment = {};
  orders.forEach(o => o.garments.forEach(g => {
    revenueByGarment[g.label] = (revenueByGarment[g.label] || 0) + g.subtotal;
  }));

  res.json({
    success: true,
    dashboard: {
      totalOrders,
      totalRevenue,
      byStatus,
      today: { orders: todayOrders.length, revenue: todayRevenue },
      topGarments,
      revenueByGarment,
      averageOrderValue: totalOrders ? Math.round(totalRevenue / totalOrders) : 0,
    },
  });
});

// Health
app.get("/health", (req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

// 404
app.use((req, res) => res.status(404).json({ success: false, error: "Route not found" }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🧺 Laundry API running on http://localhost:${PORT}`));

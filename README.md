# 🏠 ShopZone AI — Autonomous E-Commerce Platform

> A full-stack MERN e-commerce system powered by **6 autonomous AI agents** that manage inventory, pricing, orders, emails, reports, and admin intelligence — all without human intervention.

![MERN](https://img.shields.io/badge/Stack-MERN-green) ![AI](https://img.shields.io/badge/AI-Multi--Agent-blue) ![Queue](https://img.shields.io/badge/Queue-Bull+Redis-red) ![Status](https://img.shields.io/badge/Status-Production--Ready-brightgreen)

---

## 🧠 Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                        ShopZone AI System                            │
│                                                                      │
│  ┌────────────┐    ┌────────────────────┐    ┌────────────────────┐ │
│  │  React UI  │───▶│   Express REST API  │───▶│    MongoDB Atlas   │ │
│  │  (Vite)    │    │   (Node.js)         │    │    (Mongoose)      │ │
│  └────────────┘    └─────────┬──────────┘    └────────────────────┘ │
│                              │                                       │
│                    ┌─────────▼──────────┐                           │
│                    │   Bull Job Queues   │◀── node-cron Scheduler   │
│                    │   (Redis Backed)    │                           │
│                    └─────────┬──────────┘                           │
│                              │                                       │
│          ┌───────────────────┼───────────────────┐                  │
│          │                   │                   │                  │
│  ┌───────▼──────┐  ┌────────▼───────┐  ┌───────▼──────┐          │
│  │ Stock Agent  │  │ Order Agent    │  │ Pricing Agent│          │
│  │ (Restock)    │  │ (Lifecycle)    │  │ (Dynamic ₹)  │          │
│  └──────────────┘  └────────────────┘  └──────────────┘          │
│                                                                      │
│  ┌──────────────┐  ┌────────────────┐  ┌──────────────┐          │
│  │ Email Agent  │  │ Report Agent   │  │ Admin AI     │          │
│  │ (SMTP Queue) │  │ (Daily PDF)    │  │ (NLP Query)  │          │
│  └──────────────┘  └────────────────┘  └──────────────┘          │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 🤖 AI Agents Explained

### 1. 📦 Stock Agent
- **Trigger**: 10 AM & 4 PM daily (every 2 min in demo mode)
- **Function**: Scans all products, restocks any with `countInStock < 100` back to 100
- **Safety**: Corrects negative stock anomalies to 0

### 2. 🚚 Order Lifecycle Agent
- **Trigger**: Every hour (every 2 min in demo mode)
- **Function**: Automatically transitions order statuses:
  - `processing` → `shipped` (immediate after processing)
  - `shipped` → `delivered` (after 24 hours, or 2 min in demo mode)
- **Safety**: Idempotency checks prevent duplicate transitions. Duplicate email flags prevent repeated notifications.

### 3. 💰 Pricing Agent
- **Trigger**: Daily at midnight (every 2 min in demo mode)
- **Function**: Adjusts prices based on demand:
  - Fast-moving (≥50 sales/week) → +10% price (capped at maxPrice)
  - Slow-moving (≤5 sales/week) → -20% price (floored at minPrice) + "Limited Time Drop!" offer tag
- **Safety**: 24-hour cooldown prevents rapid price oscillation. Min/max bounds enforced.

### 4. 📧 Email Agent
- **Trigger**: Event-driven (queue-based)
- **Function**: Sends HTML emails via Gmail SMTP for:
  - Order shipped/delivered notifications
  - Pricing adjustment reports
  - Daily performance reports
  - Admin AI query results
- **Safety**: 5-minute deduplication window prevents duplicate emails. Graceful failure (never crashes the system).

### 5. 📊 Report Agent
- **Trigger**: Daily at 11 AM (every 2 min in demo mode)
- **Function**: Generates PDF report with revenue, sales count, user count, and AI suggestions. Emails the PDF to admin.

### 6. 🧠 Admin AI Agent
- **Trigger**: On-demand (REST API)
- **Function**: Processes natural language queries:
  - "sales today" → Real-time revenue metrics
  - "top products" → Best sellers by sales volume
  - "slow products" → Underperforming inventory
  - "revenue this week" → 7-day financial summary

---

## 🚀 Features

### Core E-Commerce
- User auth (JWT, bcrypt, role-based access)
- Product catalog with search, filters, pagination
- Shopping cart (persistent, database-backed)
- Stripe payments (test mode) + Cash on Delivery
- Order tracking with visual progress steps
- Wishlist, reviews, ratings
- Prime membership system
- Referral & gamification (scratch cards)

### AI-Powered Admin Dashboard
- Revenue/sales charts (Recharts — real MongoDB data)
- AI Agent Control Center with manual triggers
- Real-time AI operations log with filtering
- Pricing changes viewer
- System health monitoring (uptime, Redis status, queue metrics)
- Natural language admin AI query box
- Agent last-run times and error rates

### System Architecture
- Bull job queues with Redis for reliable async processing
- node-cron scheduler for time-based agent triggers
- Graceful error handling (agents never crash the server)
- Demo mode (2-min agent intervals for live presentations)

---

## 📁 Project Structure

```
ecommerce/
├── backend/
│   ├── config/db.js                  # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js         # Register, login, profile
│   │   ├── productController.js      # CRUD, search, reviews
│   │   ├── orderController.js        # Orders with bulkWrite stock updates
│   │   ├── adminController.js        # Stats via aggregation pipeline
│   │   ├── cartController.js         # Cart management
│   │   ├── paymentController.js      # Stripe integration
│   │   └── chatbotController.js      # ZoneBot AI
│   ├── services/agents/
│   │   ├── orderAgent.js             # Order lifecycle automation
│   │   ├── pricingAgent.js           # Dynamic pricing engine
│   │   ├── stockAgent.js             # Inventory management
│   │   ├── emailAgent.js             # Email dispatch with dedup
│   │   ├── reportAgent.js            # Daily PDF report generator
│   │   └── adminAgent.js             # NLP admin queries
│   ├── queues/index.js               # Bull queue setup (5 queues)
│   ├── cron/scheduler.js             # Agent scheduling (prod + demo)
│   ├── utils/
│   │   ├── email.js                  # Nodemailer (Gmail SMTP)
│   │   ├── emailService.js           # Order email HTML builder
│   │   ├── emailTemplates.js         # AI agent email templates
│   │   └── pdfGenerator.js           # PDFKit report generator
│   ├── models/                       # User, Product, Order, Cart, AI_Log
│   ├── routes/                       # REST API routes
│   │   └── system.js                 # System health + agent triggers
│   └── server.js                     # Express entry + graceful shutdown
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   │   ├── AdminDashboard.jsx    # Full analytics dashboard
│   │   │   │   ├── AdminAIAgents.jsx     # AI agent control center
│   │   │   │   ├── AdminProducts.jsx     # Product CRUD
│   │   │   │   ├── AdminOrders.jsx       # Order management
│   │   │   │   ├── AdminUsers.jsx        # User management
│   │   │   │   └── AdminLayout.jsx       # Sidebar layout
│   │   │   ├── OrderDetailPage.jsx       # Enhanced order tracking
│   │   │   └── ...                       # Other pages
│   │   ├── services/api.js               # Axios API client
│   │   └── redux/                        # Redux Toolkit slices
│   └── vite.config.js
│
└── docs/
    ├── REDIS_SETUP.md                    # Redis installation guide
    ├── DEMO_SCRIPT.md                    # Step-by-step demo flow
    └── INTERVIEW_PREP.md                 # Interview Q&A
```

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js v18+
- MongoDB Atlas (free tier)
- Redis (see `docs/REDIS_SETUP.md`)
- Gmail account with App Password (for emails)
- Stripe account (test mode)

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
npm run seed    # Seed database with products + admin user
npm run dev     # Start backend on port 5000
```

### 2. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with API URL and Stripe key
npm run dev     # Start frontend on port 5173
```

### 3. Enable Demo Mode

Add to `backend/.env`:
```
DEMO_MODE=true
```
All AI agents will run every 2 minutes.

---

## 🔑 Default Admin Credentials

After running `npm run seed`:
- **Email:** admin@ecommerce.com
- **Password:** admin123456

---

## 🌐 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/profile` | Get profile (auth) |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List with filters |
| GET | `/api/products/:id` | Product detail |
| POST | `/api/products` | Create (admin) |
| PUT | `/api/products/:id` | Update (admin) |
| DELETE | `/api/products/:id` | Delete (admin) |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orders` | Create order |
| GET | `/api/orders/mine` | My orders |
| GET | `/api/orders/:id` | Order detail |
| GET | `/api/orders` | All orders (admin) |
| PUT | `/api/orders/:id/status` | Update status (admin) |

### AI System
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/system/status` | System health + agent metrics |
| GET | `/api/system/dashboard-stats` | Charts data (real MongoDB) |
| POST | `/api/system/trigger-agent` | Manually trigger agent |
| POST | `/api/admin-ai/query` | Natural language AI query |
| GET | `/api/admin-ai/logs` | AI operations log |

### Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/cart` | Cart operations |
| POST | `/api/payment/create-payment-intent` | Stripe intent |
| GET/POST | `/api/wishlist` | Wishlist toggle |
| GET | `/api/admin/stats` | Admin statistics |

---

## 🚀 Deployment

### Backend → Render
1. Push to GitHub
2. Create new Web Service on Render
3. Set environment variables (from `.env.example`)
4. Build: `npm install` | Start: `npm start`
5. Use Render Redis or Redis Cloud for queue backing

### Frontend → Vercel
1. Push to GitHub
2. Import on Vercel
3. Set `VITE_API_URL` and `VITE_STRIPE_PUBLIC_KEY`
4. Build: `npm run build` | Output: `dist`

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, TailwindCSS, Recharts |
| State | Redux Toolkit |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas, Mongoose 8 |
| Auth | JWT, bcryptjs |
| Payments | Stripe (Test Mode) |
| Queues | Bull + Redis |
| Email | Nodemailer (Gmail SMTP) |
| Scheduling | node-cron |
| PDF | PDFKit |
| Images | Cloudinary + Multer |

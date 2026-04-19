# 🎬 ShopZone AI — Demo Script

> Step-by-step flow for a live demo or presentation. Total duration: ~10-15 minutes.

---

## Pre-Demo Setup

1. Ensure Redis is running (see `docs/REDIS_SETUP.md`)
2. Set `DEMO_MODE=true` in `backend/.env`
3. Start backend: `cd backend && npm run dev`
4. Start frontend: `cd frontend && npm run dev`
5. Login as admin: `admin@ecommerce.com / admin123456`

---

## Demo Flow

### Scene 1: System Health (1 min)

**Talk Track:** "Let me first show you the system's health..."

1. Open browser → `http://localhost:5000/api/system/status`
2. **Point out:** All 6 agents listed, queue status, Redis connection, uptime, demo mode flag
3. Navigate to `http://localhost:5173/admin`
4. **Point out:** Dashboard shows real-time stats from MongoDB — revenue, orders, products, users

---

### Scene 2: Place an Order (2 min)

**Talk Track:** "Let me demonstrate the full order flow..."

1. Open new browser tab → `http://localhost:5173`
2. Browse products → Add 2 items to cart
3. Go to Cart → Click "Proceed to Checkout"
4. Fill shipping address → Select payment method
5. Complete order
6. **Point out:** "The order is now in 'processing' status. The AI Order Agent will automatically ship and deliver it."

---

### Scene 3: AI Agent Automation (3 min)

**Talk Track:** "Now let's watch the AI agents work autonomously..."

1. Go to Admin Dashboard → `http://localhost:5173/admin`
2. In the **AI Agent Controls** section, click **"▶ Order Agent"**
3. Wait 3 seconds → Click **🔄 Refresh** on the AI Logs
4. **Point out:** "The Order Agent just moved the order from 'processing' to 'shipped'. An email notification was auto-queued."
5. Go to **Orders page** → Show the order status changed to "Shipped"
6. Open the **Order Detail Page** → Show the animated progress tracker

---

### Scene 4: Dynamic Pricing (2 min)

**Talk Track:** "AI also manages pricing based on demand..."

1. Go to Admin Dashboard
2. Click **"▶ Pricing Agent"** button
3. Wait → Check the **AI Pricing Changes** section
4. **Point out:** "Products with ≤5 sales got a 20% discount, and a 'Limited Time Drop!' badge was added automatically."
5. Go to the store home page → Show the offer badge on product cards

---

### Scene 5: Admin AI Query (2 min)

**Talk Track:** "Admins can query the system using natural language..."

1. Go to Admin Dashboard → **Ask Admin AI** section
2. Type: **"sales today"** → Click "Send Query"
3. **Point out:** The inline response card showing revenue and order count
4. Type: **"slow products"** → Send
5. **Point out:** Shows list of underperforming products
6. "Each query also triggers an email report to the admin automatically"

---

### Scene 6: AI Agent Control Center (2 min)

**Talk Track:** "For full agent monitoring, we have a dedicated control center..."

1. Navigate to **Admin → AI Agents** (`/admin/ai-agents`)
2. **Point out:**
   - Health cards for each agent (last run, status, error rate)
   - Queue status (waiting, active, completed, failed)
   - Full operations log with filtering by agent and status
3. Click **"🚀 Trigger ALL"** → Show all agents run simultaneously
4. Wait → Show the logs populate in real-time (auto-refreshes every 15s)

---

### Scene 7: System Architecture (1 min)

**Talk Track:** "Behind the scenes, here's what's happening..."

1. Show the README architecture diagram
2. Explain:
   - "React frontend talks to Express REST API"
   - "node-cron scheduler enqueues jobs to Bull queues backed by Redis"
   - "Each agent processes its queue independently — fully decoupled"
   - "All actions are logged to MongoDB's AI_Log collection"
   - "The admin dashboard reads these logs in real-time"

---

## Key Demo Talking Points

| Highlight | Detail |
|-----------|--------|
| **Event-Driven** | Agents communicate via job queues, not direct calls |
| **Idempotent** | Every agent can re-run safely without side effects |
| **Observable** | Every action is logged with agent name, action, status |
| **Resilient** | Agent failures don't crash the server (Bull retries jobs 3x) |
| **Configurable** | Demo mode vs production schedules via env variable |
| **Scalable** | Could run agents on separate workers in production |

---

## Common Demo Questions

**Q: Is this real AI/ML?**
A: The agents use rule-based intelligence (threshold checks, time-based triggers). The Admin Agent uses NLP pattern matching. This demonstrates the *architecture* of autonomous agents — swapping in ML models would be straightforward.

**Q: What happens if Redis goes down?**
A: The app continues running but agents stop processing. When Redis reconnects, all queued jobs resume automatically. Bull has built-in retry with exponential backoff.

**Q: How do you prevent duplicate emails?**
A: Three layers: (1) Email sent flags on orders (database), (2) In-memory dedup window in Email Agent (5 min), (3) Bull's job deduplication via jobId.

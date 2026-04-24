# 🎤 OmniKart AI — Interview Preparation Guide

---

## 2-Minute Elevator Pitch

> "I built OmniKart AI — a full-stack e-commerce platform with an autonomous multi-agent system. It's built on MERN stack with 6 AI agents that run independently to manage inventory, pricing, orders, emails, and reporting — all without human intervention.
>
> The agents communicate through Bull job queues backed by Redis, scheduled by node-cron. Each agent is idempotent, observable, and fault-tolerant — if one fails, the rest keep running, and Bull automatically retries with exponential backoff.
>
> For example, the Pricing Agent analyzes sales velocity and adjusts prices by up to ±20% within configurable bounds. The Order Agent tracks shipments and auto-delivers after 24 hours. Every action is logged to MongoDB, and admins can monitor everything through a real-time dashboard with charts, agent controls, and a natural language query engine.
>
> The architecture is production-grade — I implemented graceful shutdown, deduplication at multiple levels, database-level aggregation pipelines for performance, and it's deployable on Render + Vercel with a single environment variable to switch between demo and production modes."

---

## Key Technical Highlights

### 1. Event-Driven Multi-Agent Architecture
- 6 autonomous agents communicate via Bull job queues (not direct function calls)
- Each agent subscribes to its own queue and processes jobs independently
- Decoupled design — agents can be moved to separate workers for horizontal scaling

### 2. Idempotency & Safety
- Database flags prevent duplicate operations (emailSentShipped, emailSentDelivered)
- In-memory deduplication window (5 min) in Email Agent
- Bull's jobId prevents duplicate job creation on server restart
- Pricing bounds (minPrice/maxPrice) and cooldown periods prevent runaway price changes

### 3. Performance at Scale
- MongoDB aggregation pipelines for revenue computation (not loading all orders into JS)
- Product.bulkWrite() for batch stock updates (single DB operation vs N updates)
- .lean() on read-only queries for faster serialization
- Field projection (select) to minimize data transfer

### 4. Observability
- Every agent action logged to AI_Log collection (agent, action, old/new values, reason, status)
- Real-time dashboard with agent health cards, error rates, last run times
- Queue status monitoring (waiting, active, completed, failed counts)

### 5. Resilience
- Graceful server shutdown (SIGTERM/SIGINT handling)
- Agent errors never crash the application
- Bull retries failed jobs 3x with exponential backoff (5s → 10s → 20s)
- Email failures are non-blocking — orders succeed regardless

---

## Common Interview Questions & Answers

### Architecture & Design

**Q1: Why did you choose a queue-based architecture instead of simple cron + direct function calls?**
> Queues provide: (1) Retry with backoff on failure, (2) Job deduplication, (3) Concurrency control, (4) Persistence (jobs survive server restarts), (5) Monitoring via job counts, (6) Easy scaling — can add worker processes later. A direct cron + function call would lose all of these benefits.

**Q2: How do your agents communicate with each other?**
> Through event-driven job queues. For example, when the Order Agent ships an order, it enqueues a job in the Email Queue. The Email Agent picks it up independently. This is the "Publish-Subscribe" pattern — agents are loosely coupled.

**Q3: What happens if two Order Agent jobs run simultaneously?**
> The query filter `status: { $in: ["processing", "shipped"] }, isDelivered: { $ne: true }` combined with MongoDB's atomic `save()` operations prevent double-processing. Even if a race occurs, the idempotency flags (shippedAt check, isDelivered check) ensure no duplicate transitions.

**Q4: How would you scale this system for 10x traffic?**
> Three moves: (1) Run agents as separate worker processes using Bull's worker model, (2) Add Redis Cluster for queue scalability, (3) Use MongoDB sharding for the orders collection. The architecture already supports this because agents are decoupled from the main Express server.

---

### Technical Deep Dives

**Q5: Explain your dynamic pricing algorithm.**
> It's rule-based: products with ≥50 sales in 7 days get a 10% price increase (capped at maxPrice = 150% of original). Products with ≤5 sales get a 20% decrease (floored at minPrice = 80% of original) and receive a "Limited Time Drop!" offer badge. A 24-hour cooldown prevents rapid oscillation. In a production system, I'd swap this for an ML model trained on historical demand curves.

**Q6: How do you prevent duplicate emails?**
> Three layers: (1) **Database flags** — `emailSentShipped` and `emailSentDelivered` boolean fields on the Order model. The agent checks these before queuing. (2) **In-memory dedup** — The Email Agent maintains a Map of recent sends (5-min window) keyed by `type:to:subject`. (3) **Queue-level** — Bull's `jobId` option prevents the same job from being enqueued twice.

**Q7: Why MongoDB instead of PostgreSQL for this project?**
> Three reasons: (1) The product schema has nested reviews, variable attributes — document model fits naturally. (2) Mongoose's schema validation gives us enough structure. (3) MongoDB's aggregation framework handles the analytics queries (revenue by date, agent metrics) efficiently without needing joins. For a more relational domain, PostgreSQL would be appropriate.

**Q8: How do you handle email failures?**
> The Email Agent wraps `sendEmail()` in a try-catch and throws on failure, which tells Bull to retry. Bull retries 3 times with exponential backoff (5s, 10s, 20s). If all retries fail, the job moves to the "failed" list. The `emailQueue.on("failed")` handler logs the failure. Crucially, email failures NEVER affect order creation — the `createOrder` controller catches email errors silently.

---

### System & Ops

**Q9: How would you monitor this in production?**
> The `/api/system/status` endpoint already provides: agent last-run times, error rates, queue depths, Redis connection status, and server uptime. I'd add: (1) Prometheus metrics for queue latency, (2) Grafana dashboards, (3) PagerDuty alerts on agent error rate > 10%, (4) Dead letter queue for permanently failed jobs.

**Q10: What's your deployment strategy?**
> Backend on Render (auto-deploy from GitHub main branch), Frontend on Vercel (automatic from push), MongoDB Atlas (managed), Redis Cloud (managed). Environment variables manage the prod/demo switch. CI/CD is Git-push based — no manual steps.

**Q11: How do you handle secrets management?**
> Environment variables via dotenv in development, platform-injected secrets in production (Render/Vercel secret management). Never committed to Git. The `.env.example` documents all required variables without values.

---

### Project Management

**Q12: What was the hardest bug you fixed?**
> The Order Agent had a race condition: it called `order.save()` twice in sequence — once for the status change, once for the email sent flag. Under load, these could interleave with another agent run, causing lost updates. I fixed it by batching both updates into a single `save()` call, ensuring atomicity.

**Q13: What would you improve with more time?**
> (1) Replace rule-based pricing with an ML model (maybe a simple demand forecasting regression). (2) Add WebSocket for real-time dashboard updates instead of polling. (3) Build a proper dead-letter queue dashboard. (4) Add integration tests with a test Redis instance. (5) Add rate limiting on the admin AI endpoint.

**Q14: How is this different from a simple cron job running SQL queries?**
> Three key differences: (1) **Resilience** — if a job fails, it retries automatically. Cron just moves on. (2) **Observability** — every action is logged with old/new values, reason, and status. Cron outputs are ephemeral. (3) **Decoupling** — agents can run on different servers. Cron is bound to a single machine.

**Q15: Why not use a real ML model for the AI agent?**
> The goal was to demonstrate the *agent architecture*, not the ML model. The rule-based engine proves: (1) autonomous decision-making, (2) event-driven communication, (3) observability and logging, (4) fault tolerance. Swapping in a TensorFlow or scikit-learn model for the pricing decision is a 20-line change — the architecture stays the same.

---

## Words to Use in Your Explanation

| Use This | Instead of This |
|----------|----------------|
| "Autonomous agents" | "Automated scripts" |
| "Event-driven architecture" | "Cron jobs" |
| "Idempotent operations" | "It doesn't duplicate" |
| "Job queue with backoff" | "It retries" |
| "Aggregation pipeline" | "Database query" |
| "Observability" | "Logging" |
| "Graceful degradation" | "It handles errors" |
| "Horizontal scaling" | "It can handle more" |

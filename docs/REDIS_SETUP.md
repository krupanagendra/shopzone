# Redis Setup Guide for Windows

## Why Redis?
ShopZone AI uses **Bull** job queues backed by Redis to orchestrate AI agents. Redis acts as the message broker for inter-agent communication.

---

## Option 1: Memurai (Recommended for Windows) ⭐

Memurai is a native Redis-compatible server for Windows.

1. Download from: https://www.memurai.com/get-memurai
2. Install using the `.msi` installer
3. It starts automatically as a Windows Service on port 6379
4. Verify: Open PowerShell and run:
   ```powershell
   Test-NetConnection localhost -Port 6379
   ```

---

## Option 2: WSL2 (Windows Subsystem for Linux)

```powershell
# Enable WSL (run PowerShell as Admin)
wsl --install

# After restart, open Ubuntu terminal:
sudo apt update
sudo apt install redis-server -y
sudo service redis-server start

# Verify
redis-cli ping
# Should return: PONG
```

Redis will be accessible at `localhost:6379` from Windows.

---

## Option 3: Docker (if Docker Desktop is installed)

```powershell
docker run -d --name redis -p 6379:6379 redis:alpine
```

---

## Option 4: Cloud Redis (No local install needed)

Use **Redis Cloud** free tier:
1. Sign up at https://redis.com/try-free/
2. Create a free database
3. Copy the connection URL
4. Set in `.env`:
   ```
   REDIS_URL=redis://default:password@host:port
   ```

---

## Verification

After Redis is running, restart the backend:
```bash
cd backend
npm run dev
```

You should see:
```
[QUEUE] ✅ Redis connected — All queues operational.
```

If Redis is NOT running, you'll see:
```
[QUEUE] ⚠️  Redis not available — Queues will retry automatically when Redis starts.
```
The app still runs — agents just won't process jobs until Redis connects.

---

## Add DEMO_MODE to .env

For live demonstrations, add this to `backend/.env`:
```
DEMO_MODE=true
```
This runs all agents every 2 minutes instead of hourly/daily.

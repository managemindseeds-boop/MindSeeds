# 🔒 MindSeeds Tunnel Demo

A demo showing how **Cloudflare Tunnel** connects Admin's local system to the Cloud app.

## Architecture
```
Admin PC (localhost:3001)  ←──Cloudflare Tunnel──→  Cloud App (:5555)
   │                                                    │
   ├── SQLite (fees.db)                                  ├── Receptionist sees:
   ├── All fees data                                     │   "📞 Call Rahul - 9876543210"
   ├── Installments                                      │   [✅ Mark as Called]
   └── Admin Portal (dark theme)                         └── No fees data visible!
```

## Quick Start (Local Testing — No Tunnel)

### Step 1: Install dependencies
```bash
cd tunnel-demo
npm install
```

### Step 2: Start Admin Server (simulates admin's PC)
```bash
npm run admin
# → http://localhost:3001 (Admin Portal)
```

### Step 3: Start Cloud Server (simulates your Vercel app)
```bash
npm run cloud
# → http://localhost:5555/receptionist.html (Receptionist Portal)
```

### Step 4: Test the flow!
1. Open **Admin Portal** → http://localhost:3001
2. Open **Receptionist Portal** → http://localhost:5555/receptionist.html
3. On Admin: Click **📞 Call** next to a student
4. On Receptionist: See the call request appear (auto-refreshes every 5 sec)
5. On Receptionist: Click **✅ Mark as Called**
6. On Admin: See the ✅ Called status update!

---

## With Cloudflare Tunnel (Real Setup)

### Step 1: Install cloudflared
```bash
winget install cloudflare.cloudflared
```

### Step 2: Start admin server
```bash
npm run admin
```

### Step 3: Create tunnel
```bash
cloudflared tunnel --url http://localhost:3001
```
This gives you a URL like: `https://abc-xyz-123.trycloudflare.com`

### Step 4: Tell cloud server about the tunnel
```bash
# Set the tunnel URL in cloud server
curl -X POST http://localhost:5555/api/set-tunnel-url \
  -H "Content-Type: application/json" \
  -d '{"url": "https://abc-xyz-123.trycloudflare.com"}'
```

### Step 5: Now receptionist (cloud) connects to admin (local) via tunnel! 🎉

---

## What the Demo Shows

| Feature | Description |
|---------|-------------|
| **Admin Portal** | Dark theme, sees ALL fees, installments, payments |
| **Receptionist Portal** | Light theme, sees ONLY "call this person" list |
| **Partial Payment** | Pay less → shortfall distributed to remaining installments |
| **Call Request Flow** | Admin marks → Receptionist sees → Calls → Ticks done → Admin sees update |
| **SQLite on local** | `fees.db` file on admin's hard drive — not on cloud |

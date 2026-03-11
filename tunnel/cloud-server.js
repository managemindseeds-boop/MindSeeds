// ─── CLOUD SERVER (simulates your Vercel/Railway cloud app) ──────────────────
// This connects to Admin's local server via Cloudflare Tunnel URL
// Receptionist uses THIS server — she never touches admin's DB directly

import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 5555;

app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

// ─── TUNNEL URL — Set this after running cloudflared! ────────────────────────
// When testing locally (no tunnel), use: http://localhost:3001
// When using tunnel, use: https://your-tunnel-url.trycloudflare.com
let ADMIN_SERVER_URL = process.env.ADMIN_URL || 'http://localhost:3001';

// ─── Health check — is admin's server online? ────────────────────────────────
app.get('/api/admin-status', async (req, res) => {
    try {
        const response = await fetch(`${ADMIN_SERVER_URL}/api/health`);
        const data = await response.json();
        res.json({ online: true, adminServer: data });
    } catch {
        res.json({ online: false, message: '⚠️ Admin server is offline' });
    }
});

// ─── Proxy: Get call requests (ONLY name + phone for receptionist) ───────────
app.get('/api/call-requests', async (req, res) => {
    try {
        const response = await fetch(`${ADMIN_SERVER_URL}/api/call-requests?status=${req.query.status || 'pending'}`);
        const data = await response.json();
        res.json(data);
    } catch {
        res.status(503).json({ success: false, error: 'Admin server offline — cannot fetch call requests' });
    }
});

// ─── Proxy: Receptionist marks "called" ──────────────────────────────────────
app.patch('/api/call-requests/:id/called', async (req, res) => {
    try {
        const response = await fetch(`${ADMIN_SERVER_URL}/api/call-requests/${req.params.id}/called`, {
            method: 'PATCH',
        });
        const data = await response.json();
        res.json(data);
    } catch {
        res.status(503).json({ success: false, error: 'Admin server offline' });
    }
});

// ─── Set tunnel URL dynamically ──────────────────────────────────────────────
app.post('/api/set-tunnel-url', (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ success: false, error: 'URL required' });
    ADMIN_SERVER_URL = url;
    console.log(`🔗 Tunnel URL set to: ${ADMIN_SERVER_URL}`);
    res.json({ success: true, message: `Tunnel URL updated to: ${url}` });
});

app.listen(PORT, () => {
    console.log(`\n☁️  Cloud Server running on http://localhost:${PORT}`);
    console.log(`👩‍💼 Receptionist Portal: http://localhost:${PORT}/receptionist.html`);
    console.log(`\n🔗 Admin server URL: ${ADMIN_SERVER_URL}`);
    console.log(`   (Change via POST /api/set-tunnel-url or ADMIN_URL env var)\n`);
});

// Simple file-based storage using /tmp (Vercel serverless)
// Since we need persistence, we'll use a simple approach with Vercel's edge config
// Actually using a simple JSON store approach

const TOKEN_KEY = 'gcal_token';

// Use Vercel's built-in KV via environment - fallback to simple fetch-based upstash
async function getToken() {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  const r = await fetch(`${url}/get/${TOKEN_KEY}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const d = await r.json();
  return d.result ? JSON.parse(d.result) : null;
}

async function setToken(data) {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) throw new Error('KV not configured');
  await fetch(`${url}/set/${TOKEN_KEY}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(JSON.stringify(data))
  });
}

async function delToken() {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return;
  await fetch(`${url}/del/${TOKEN_KEY}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
}

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    try {
      const data = await getToken();
      if (!data) { res.status(404).json({ error: 'no token' }); return; }
      res.status(200).json(data);
    } catch(e) { res.status(404).json({ error: 'no token' }); }
    return;
  }
  if (req.method === 'POST') {
    try {
      await setToken(req.body);
      res.status(200).json({ ok: true });
    } catch(e) { res.status(500).json({ error: e.message }); }
    return;
  }
  if (req.method === 'DELETE') {
    try { await delToken(); } catch(e) {}
    res.status(200).json({ ok: true });
    return;
  }
  res.status(405).json({ error: 'method not allowed' });
};

const { kv } = require('@vercel/kv');
const TOKEN_KEY = 'gcal_main_token';

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  if (req.method === 'GET') {
    try {
      const data = await kv.get(TOKEN_KEY);
      if (!data) { res.status(404).json({ error: 'no token' }); return; }
      res.status(200).json(data);
    } catch(e) { res.status(404).json({ error: 'no token' }); }
    return;
  }
  if (req.method === 'POST') {
    try {
      await kv.set(TOKEN_KEY, req.body);
      res.status(200).json({ ok: true });
    } catch(e) { res.status(500).json({ error: e.message }); }
    return;
  }
  if (req.method === 'DELETE') {
    try { await kv.del(TOKEN_KEY); } catch(e) {}
    res.status(200).json({ ok: true });
    return;
  }
  res.status(405).json({ error: 'method not allowed' });
};

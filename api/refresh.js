const TOKEN_KEY = 'gcal_token';
const CLIENT_ID = '10963602013-d8qti4amctuimsuo5jevvgkirtdi5bds.apps.googleusercontent.com';

async function getToken() {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  const r = await fetch(`${url}/get/${TOKEN_KEY}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const d = await r.json();
  if (!d.result) return null;
  try {
    const parsed = JSON.parse(d.result);
    if (typeof parsed === 'string') return JSON.parse(parsed);
    return parsed;
  } catch(e) {
    return null;
  }
}

async function setToken(data) {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  await fetch(`${url}/set/${TOKEN_KEY}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(JSON.stringify(data))
  });
}

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  try {
    const stored = await getToken();
    if (!stored || !stored.refresh_token) {
      res.status(401).json({ error: 'no refresh token' }); return;
    }
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: process.env.GCAL_CLIENT_SECRET,
      refresh_token: stored.refresh_token,
      grant_type: 'refresh_token'
    });
    const resp = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });
    const data = await resp.json();
    if (!data.access_token) {
      res.status(401).json({ error: 'refresh failed', detail: data }); return;
    }
    const updated = Object.assign({}, stored, {
      access_token: data.access_token,
      expiry: Date.now() + data.expires_in * 1000
    });
    await setToken(updated);
    res.status(200).json({ access_token: data.access_token, expiry: updated.expiry });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
};

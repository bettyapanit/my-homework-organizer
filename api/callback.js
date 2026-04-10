const TOKEN_KEY = 'gcal_token';
const CLIENT_ID = '10963602013-d8qti4amctuimsuo5jevvgkirtdi5bds.apps.googleusercontent.com';
const REDIRECT  = 'https://my-homework-organizer.vercel.app/api/callback';

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

module.exports = async function(req, res) {
  const code = req.query && req.query.code;
  if (!code) { res.redirect('/?auth=error'); return; }

  try {
    const params = new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: process.env.GCAL_CLIENT_SECRET,
      redirect_uri: REDIRECT,
      grant_type: 'authorization_code'
    });
    const resp = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });
    const data = await resp.json();
    if (!data.access_token) {
      console.error('Token exchange failed:', data);
      res.redirect('/?auth=error'); return;
    }
    await setToken({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expiry: Date.now() + data.expires_in * 1000
    });
    res.redirect('/?auth=success');
  } catch(e) {
    console.error('Callback error:', e);
    res.redirect('/?auth=error');
  }
};

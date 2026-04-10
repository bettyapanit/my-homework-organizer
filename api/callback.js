const { kv } = require('@vercel/kv');
const TOKEN_KEY = 'gcal_main_token';
const CLIENT_ID = '10963602013-d8qti4amctuimsuo5jevvgkirtdi5bds.apps.googleusercontent.com';

module.exports = async function(req, res) {
  const code = req.query && req.query.code;
  if (!code) { res.redirect('/?auth=error'); return; }

  try {
    const REDIRECT = 'https://' + req.headers.host + '/api/callback';
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
    await kv.set(TOKEN_KEY, {
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

/**
 * Netlify Function: Save VIP subscriber to Supabase
 * Endpoint: /.netlify/functions/vip-signup
 */

const SUPABASE_URL = 'https://rhlbnqpljkcbggtmoldz.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || 'sb_publishable_DGyrcJ_OvzPxCPQkTLFLPQ_nzviID_M';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  try {
    const { name, email, phone } = JSON.parse(event.body);

    if (!email || !name) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Name and email required' }) };
    }

    const resp = await fetch(`${SUPABASE_URL}/rest/v1/subscribers`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify({ name, email, phone: phone || null, source: 'website' }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(err);
    }

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error('VIP signup error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};

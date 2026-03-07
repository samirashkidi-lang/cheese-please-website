/**
 * Netlify Function: Save reservation to Supabase
 * Endpoint: /.netlify/functions/reservation
 */

const SUPABASE_URL = 'https://rhlbnqpljkcbggtmoldz.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || 'sb_publishable_DGyrcJ_OvzPxCPQkTLFLPQ_nzviID_M';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const data = JSON.parse(event.body);

    const resp = await fetch(`${SUPABASE_URL}/rest/v1/reservations`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        name:       data.name,
        email:      data.email,
        phone:      data.phone || null,
        party_size: parseInt(data.party_size) || 2,
        date:       data.date,
        time:       data.time,
        occasion:   data.occasion || null,
        notes:      data.notes || null,
        status:     'pending',
      }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(err);
    }

    const result = await resp.json();
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, id: result[0]?.id }),
    };
  } catch (err) {
    console.error('Reservation error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};

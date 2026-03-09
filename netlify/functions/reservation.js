/**
 * Netlify Function: Save reservation to Supabase + email notification
 */

const SUPABASE_URL = 'https://rhlbnqpljkcbggtmoldz.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || 'sb_publishable_DGyrcJ_OvzPxCPQkTLFLPQ_nzviID_M';
const SENDGRID_KEY = process.env.SENDGRID_API_KEY;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const data = JSON.parse(event.body);

    // Save to Supabase
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

    // Send email notification to both emails
    if (SENDGRID_KEY) {
      const emailBody = `
New Reservation Request!

Name: ${data.name}
Email: ${data.email}
Phone: ${data.phone || 'N/A'}
Party Size: ${data.party_size}
Date: ${data.date}
Time: ${data.time}
Occasion: ${data.occasion || 'N/A'}
Notes: ${data.notes || 'N/A'}
      `.trim();

      await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SENDGRID_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{
            to: [
              { email: 'cheesepleasetampa@gmail.com' },
              { email: 'bartentampa@gmail.com' }
            ],
            subject: `New Reservation — ${data.name} | ${data.date} at ${data.time}`,
          }],
          from: { email: 'reservations@cheesepleasetampa.com', name: 'Cheese Please Reservations' },
          content: [{ type: 'text/plain', value: emailBody }],
        }),
      });
    }

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

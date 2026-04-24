/**
 * Netlify Function: Create Stripe Checkout Session
 * Also saves order + customer info to Supabase board_orders table
 */

const SUPABASE_URL = 'https://rhlbnqpljkcbggtmoldz.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || 'sb_publishable_DGyrcJ_OvzPxCPQkTLFLPQ_nzviID_M';
const SENDGRID_KEY = process.env.SENDGRID_API_KEY;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { items, pickupDate, pickupTime, customerName, customerEmail, customerPhone } = JSON.parse(event.body);
    const origin = event.headers.origin || 'https://cheesepleasetampa.com';

    if (!items || items.length === 0) {
      throw new Error('No items in order');
    }

    const total = items.reduce((sum, l) => sum + l.amount * (l.quantity || 1), 0);
    const itemsSummary = items.map(l => `${l.quantity}x ${l.item}`).join(', ');
    const pickupDesc   = `Pickup ${pickupDate} at ${pickupTime} · ${customerName} · ${customerPhone}`;

    // ── Save to Supabase (await so real failures are logged, not silently dropped) ──
    try {
      const sbResp = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          name:   customerName,
          email:  customerEmail,
          phone:  customerPhone,
          items:  itemsSummary,
          amount: total,
          status: 'pending',
          notes:  `Pickup ${pickupDate} at ${pickupTime}`,
        }),
      });
      if (!sbResp.ok) {
        const errText = await sbResp.text();
        console.error('Supabase insert failed:', sbResp.status, errText);
      }
    } catch (err) {
      console.error('Supabase insert threw:', err.message);
    }

    // ── Email notification to both business emails ──
    if (SENDGRID_KEY) {
      const emailBody = `
New Board Order Received!

Customer:   ${customerName}
Email:      ${customerEmail}
Phone:      ${customerPhone || 'N/A'}

Order:      ${itemsSummary}
Pickup:     ${pickupDate} at ${pickupTime}
Total:      $${total.toFixed(2)}

NOTE: Payment is collected via Stripe. The customer will receive a Stripe payment link.
      `.trim();

      fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SENDGRID_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{
            to: [
              { email: 'cheesepleasetampa@gmail.com' },
              { email: 'samirashkidi@gmail.com' },
              { email: 'rferlopes@gmail.com' },
            ],
            subject: `New Board Order — ${customerName} | Pickup ${pickupDate} at ${pickupTime}`,
          }],
          from: { email: 'samirashkidi@gmail.com', name: 'Cheese Please Tampa' },
          reply_to: { email: customerEmail, name: customerName },
          content: [{ type: 'text/plain', value: emailBody }],
        }),
      }).catch(err => console.warn('SendGrid failed (non-fatal):', err.message));
    }

    // ── Build Stripe Checkout ──
    const params = new URLSearchParams();
    params.append('payment_method_types[]', 'card');
    params.append('mode', 'payment');
    params.append('success_url', `${origin}/success.html`);
    params.append('cancel_url', `${origin}/#menu`);
    params.append('billing_address_collection', 'auto');
    if (customerEmail) params.append('customer_email', customerEmail);
    params.append('metadata[customer_name]',  customerName  || '');
    params.append('metadata[customer_phone]', customerPhone || '');
    params.append('metadata[pickup_date]',    pickupDate    || '');
    params.append('metadata[pickup_time]',    pickupTime    || '');

    items.forEach((line, i) => {
      params.append(`line_items[${i}][price_data][currency]`, 'usd');
      params.append(`line_items[${i}][price_data][product_data][name]`, `Bar Ten — ${line.item}`);
      params.append(`line_items[${i}][price_data][product_data][description]`, pickupDesc);
      params.append(`line_items[${i}][price_data][unit_amount]`, String(Math.round(line.amount * 100)));
      params.append(`line_items[${i}][quantity]`, String(line.quantity || 1));
    });

    const resp = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(process.env.STRIPE_SECRET_KEY + ':').toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const session = await resp.json();

    if (!resp.ok) {
      throw new Error(session.error?.message || 'Stripe error');
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    console.error('Checkout error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};

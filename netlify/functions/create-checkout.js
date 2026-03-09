/**
 * Netlify Function: Create Stripe Checkout Session
 * Accepts multiple line items + customer info
 */

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

    const pickupDesc = `Pickup ${pickupDate} at ${pickupTime} · ${customerName} · ${customerPhone}`;

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

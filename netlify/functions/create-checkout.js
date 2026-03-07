/**
 * Netlify Function: Create Stripe Checkout Session
 * Endpoint: /.netlify/functions/create-checkout
 */

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { item, amount, quantity = 1 } = JSON.parse(event.body);
    const origin = event.headers.origin || 'https://cheesepleasetampa.com';

    const params = new URLSearchParams({
      'payment_method_types[]': 'card',
      'line_items[0][price_data][currency]': 'usd',
      'line_items[0][price_data][product_data][name]': `Bar Ten — ${item}`,
      'line_items[0][price_data][product_data][description]': 'BYO Charcuterie Board — Bar Ten & Cheese Please Tampa',
      'line_items[0][price_data][unit_amount]': String(Math.round(amount * 100)),
      'line_items[0][quantity]': String(quantity),
      'mode': 'payment',
      'success_url': `${origin}/success.html?item=${encodeURIComponent(item)}`,
      'cancel_url': `${origin}/#menu`,
      'billing_address_collection': 'auto',
      'phone_number_collection[enabled]': 'true',
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

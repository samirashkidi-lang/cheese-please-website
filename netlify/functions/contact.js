/**
 * Netlify Function: Contact / Inquiry form
 * Sends email to both business addresses via SendGrid
 */

const SENDGRID_KEY = process.env.SENDGRID_API_KEY;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { name, email, phone, message } = JSON.parse(event.body);

    if (!name || !email || !message) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
    }

    if (SENDGRID_KEY) {
      const emailBody = `
New Inquiry from Website

Name:    ${name}
Email:   ${email}
Phone:   ${phone || 'N/A'}

Message:
${message}
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
              { email: 'samirashkidi@gmail.com' },
              { email: 'rferlopes@gmail.com' },
            ],
            subject: `New Inquiry — ${name}`,
          }],
          from: { email: 'samirashkidi@gmail.com', name: 'Cheese Please Tampa' },
          reply_to: { email, name },
          content: [{ type: 'text/plain', value: emailBody }],
        }),
      });
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true }),
    };
  } catch (err) {
    console.error('Contact error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};

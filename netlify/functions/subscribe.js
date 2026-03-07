/**
 * Netlify Function: Add email subscriber to Mailchimp
 * Endpoint: /.netlify/functions/subscribe
 */

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { email, name } = JSON.parse(event.body);
    const [firstName, ...rest] = (name || "").split(" ");

    const resp = await fetch(
      `https://us1.api.mailchimp.com/3.0/lists/${process.env.MAILCHIMP_LIST_ID}/members`,
      {
        method: "POST",
        headers: {
          Authorization: `apikey ${process.env.MAILCHIMP_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email_address: email,
          status: "subscribed",
          merge_fields: {
            FNAME: firstName || "",
            LNAME: rest.join(" ") || "",
          },
        }),
      }
    );

    if (resp.ok) {
      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    } else {
      const err = await resp.json();
      // 400 with "Member Exists" is fine — just ignore it
      if (err.title === "Member Exists") {
        return { statusCode: 200, body: JSON.stringify({ ok: true }) };
      }
      throw new Error(err.detail || "Mailchimp error");
    }
  } catch (err) {
    console.error("Subscribe error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

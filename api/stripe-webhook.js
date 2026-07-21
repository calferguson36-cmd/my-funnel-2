// Vercel serverless function — Stripe webhook. Fires a server-side Meta
// Conversions API (CAPI) "Purchase" event the moment a charge actually
// clears, server-to-server. This is the source of truth for ad tracking
// (unlike the client-side Pixel, it fires even if the buyer closes the tab,
// runs an ad blocker, or the checkout redirect fails).
//
// ─── ONE-TIME SETUP ────────────────────────────────────────────────────────
// 1. Meta Events Manager → your Pixel → Settings → Conversions API →
//    "Generate access token". Also copy the Pixel ID from the top of that page.
// 2. Stripe Dashboard → Developers → Webhooks → Add endpoint.
//    URL: https://yourdomain.com/api/stripe-webhook
//    Event to send: payment_intent.succeeded
//    After creating it, click "Reveal" on the signing secret (starts whsec_).
// 3. In Vercel → Project → Settings → Environment Variables, add:
//    STRIPE_WEBHOOK_SECRET   = the whsec_... signing secret from step 2
//    META_PIXEL_ID           = the Pixel ID from step 1
//    META_CAPI_ACCESS_TOKEN  = the access token from step 1
// 4. Redeploy.
//
// Pairs with the client-side Pixel Purchase event on thank-you.html — both
// send the same event_id (the PaymentIntent id) so Meta dedupes them into
// one accurate conversion, per Meta's own recommended pattern.

const Stripe = require('stripe');
const crypto = require('crypto');

// Stripe's signature check needs the exact raw request bytes, so this
// function reads the body itself instead of using Vercel's JSON parsing.
module.exports.config = { api: { bodyParser: false } };

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function hashForMeta(value) {
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, META_PIXEL_ID, META_CAPI_ACCESS_TOKEN, META_TEST_EVENT_CODE } = process.env;
  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
    return res.status(500).json({ error: 'Server is missing Stripe webhook environment variables.' });
  }

  const stripe = Stripe(STRIPE_SECRET_KEY);
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ error: 'Invalid signature: ' + err.message });
  }

  // Acknowledge every other event type immediately — we only act on this one.
  if (event.type !== 'payment_intent.succeeded') {
    return res.status(200).json({ received: true });
  }

  const intent = event.data.object;

  if (META_PIXEL_ID && META_CAPI_ACCESS_TOKEN) {
    try {
      const userData = {};
      if (intent.metadata && intent.metadata.email) {
        userData.em = [hashForMeta(intent.metadata.email)];
      }

      const payload = {
        data: [{
          event_name: 'Purchase',
          event_time: Math.floor(Date.now() / 1000),
          event_id: intent.id, // shared with the client Pixel event for dedup
          action_source: 'website',
          user_data: userData,
          custom_data: {
            currency: intent.currency.toUpperCase(),
            value: intent.amount / 100,
          },
        }],
      };
      // Only set while verifying in Events Manager's Test Events tool — remove
      // the META_TEST_EVENT_CODE env var afterward, or real purchases will stop
      // counting in normal reporting.
      if (META_TEST_EVENT_CODE) payload.test_event_code = META_TEST_EVENT_CODE;

      const metaResp = await fetch(
        `https://graph.facebook.com/v19.0/${META_PIXEL_ID}/events?access_token=${META_CAPI_ACCESS_TOKEN}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      if (!metaResp.ok) {
        const errBody = await metaResp.text();
        console.error('Meta CAPI rejected the event:', metaResp.status, errBody);
      }
    } catch (err) {
      // Log-and-continue: a failed Meta call shouldn't make Stripe retry the
      // webhook (the payment itself already succeeded).
      console.error('Meta CAPI send failed:', err.message);
    }
  }

  return res.status(200).json({ received: true });
};

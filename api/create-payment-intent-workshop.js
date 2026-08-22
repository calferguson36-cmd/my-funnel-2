// Vercel serverless function — creates a Stripe PaymentIntent for the
// "How I Won Sales Leaderboards Working Part-Time Hours" workshop checkout.
//
// Separate from api/create-payment-intent.js (the $14.95 Limitless Flow States
// product) so the two prices never collide. Same security model: amount is
// computed HERE, server-side, from a trusted fixed price — the browser never
// sends the price, only name/email.

const Stripe = require('stripe');

// Workshop price, in cents. $27.00 AUD.
const PRODUCT_CENTS = 2700;
const PRODUCT_LABEL = 'How I Won Sales Leaderboards Working Part-Time Hours';

const aud = (cents) => 'A$' + (cents / 100).toFixed(2);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return res.status(500).json({ error: 'Server is missing STRIPE_SECRET_KEY.' });
  }
  const stripe = Stripe(secret);

  try {
    const body =
      typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const email = String(body.email || '').slice(0, 200);
    const name = String(body.name || '').slice(0, 200);

    const amount = PRODUCT_CENTS;
    const description = `${PRODUCT_LABEL} (${aud(PRODUCT_CENTS)})`;

    const intent = await stripe.paymentIntents.create({
      amount,
      currency: 'aud',
      automatic_payment_methods: { enabled: true },
      description,
      receipt_email: email || undefined,
      metadata: { items: description, item_ids: 'workshop', name, email },
    });

    return res.status(200).json({ clientSecret: intent.client_secret, amount });
  } catch (err) {
    return res.status(500).json({ error: (err && err.message) || 'Stripe error' });
  }
};

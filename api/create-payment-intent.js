// Vercel serverless function — creates a Stripe PaymentIntent for the checkout
// (main product + any selected order bumps).
//
// SECURITY: the amount is computed HERE, server-side, from a trusted price map.
// The browser only sends WHICH items were selected, never the price, so a tampered
// client can't change what they pay. The Stripe secret key is read from the
// STRIPE_SECRET_KEY environment variable (set in Vercel) and is never in the code
// or the frontend.
//
// ─── CUSTOMIZE ME ──────────────────────────────────────────────────────────────
// 1. Set PRODUCT_CENTS to your main offer price (in cents: $27 -> 2700).
// 2. Edit BUMP_CENTS / LABELS for your order bumps, or delete them for none.
// 3. Keep the ids here identical to the data-id attributes in checkout.html.

const Stripe = require('stripe');

// Main offer price, in cents.  (Example: 300 = $3.00)
const PRODUCT_CENTS = 1495;
const PRODUCT_LABEL = 'Limitless Flow States';

// Optional order bumps, in cents.  Delete entries you don't need.
const BUMP_CENTS = {};

// Human-readable labels (used in the charge description + receipt).
const LABELS = {};

// No bundle in this funnel — no order bumps at all.
const SINGLES = [];

const usd = (cents) => '$' + (cents / 100).toFixed(2);

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
    const requested = Array.isArray(body.bumps) ? body.bumps : [];
    const email = String(body.email || '').slice(0, 200);
    const name = String(body.name || '').slice(0, 200);

    // Keep only known bump ids, de-dupe, and enforce bundle exclusivity.
    const set = new Set(requested.filter((id) => BUMP_CENTS[id]));
    if (set.has('bundle')) SINGLES.forEach((s) => set.delete(s));

    let amount = PRODUCT_CENTS;
    const lines = [`${PRODUCT_LABEL} (${usd(PRODUCT_CENTS)})`];
    const itemIds = ['main'];
    set.forEach((id) => {
      amount += BUMP_CENTS[id];
      lines.push(`${LABELS[id]} (${usd(BUMP_CENTS[id])})`);
      itemIds.push(id);
    });

    // Itemized description so the customer's receipt names everything they bought.
    const description = lines.join(' + ') + ` = Total ${usd(amount)}`;

    const intent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      description,
      receipt_email: email || undefined,
      metadata: { items: lines.join(' | '), item_ids: itemIds.join(','), name, email },
    });

    return res.status(200).json({ clientSecret: intent.client_secret, amount });
  } catch (err) {
    return res.status(500).json({ error: (err && err.message) || 'Stripe error' });
  }
};

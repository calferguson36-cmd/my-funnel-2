// Vercel serverless function — creates a Stripe PaymentIntent for the SWYS
// checkout (product + any selected order bumps).
//
// SECURITY: the amount is computed HERE, server-side, from a trusted price
// map. The browser only sends WHICH items were selected, never the price, so
// a tampered client can't change what they pay. The Stripe secret key is read
// from the STRIPE_SECRET_KEY environment variable (set in Vercel) and is never
// in the code or the frontend.

const Stripe = require('stripe');

// Trusted prices in cents.
const PRODUCT_CENTS = 300; // Sell While You Sleep 2.0
const BUMP_CENTS = {
  'swys-category-of-one': 2500,
  'swys-presold': 2700,
  'swys-bundle': 4000,
};
// The bundle already includes both singles, so it can't be combined with them.
const SINGLES = ['swys-category-of-one', 'swys-presold'];

// Human-readable labels (used in the charge description + receipt) and a USD formatter.
const LABELS = {
  'swys-category-of-one': 'Category of One Workshop',
  'swys-presold': 'Presold Workshop + 267-Word Offer Doc',
  'swys-bundle': 'Bundle: Category of One + Presold',
};
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
    if (set.has('swys-bundle')) SINGLES.forEach((s) => set.delete(s));

    let amount = PRODUCT_CENTS;
    const lines = [`Sell While You Sleep 2.0 (${usd(PRODUCT_CENTS)})`];
    const itemIds = ['swys-main'];
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

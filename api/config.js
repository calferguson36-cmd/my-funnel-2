// Vercel serverless function — serves PUBLIC config to the browser. Only
// values that are safe to expose live here (Stripe's publishable key, Meta's
// Pixel ID — both are meant to be public and appear in every page's source
// regardless). Secrets (Stripe secret key, Meta CAPI access token) never
// leave the server and are read directly from env vars in their own functions.

module.exports = function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    pixelId: process.env.META_PIXEL_ID || '',
  });
};

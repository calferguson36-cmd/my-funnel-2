// Vercel serverless function — serves the PUBLIC Stripe config to the browser.
// Only the PUBLISHABLE key is exposed here (it's safe to be public). The secret
// key never leaves the server. Both keys are read from environment variables, so
// switching test <-> live is just an env change, no code edits.

module.exports = function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  });
};

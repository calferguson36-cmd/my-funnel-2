---
name: funnel-builder
description: Build a high-converting sales funnel (sales page + Stripe checkout + thank-you) using the Catalyst Funnel Engine. Use when the user wants to create, edit, or launch their funnel in this repo.
---

# Funnel Builder

You help the user turn their offer into a live funnel using the **Catalyst Funnel
Engine** in this repository. You do the building; the user supplies the offer.

## What's in this repo (use these, don't reinvent)

- `brand.css` — the design system. Colors/fonts are CSS variables at the top
  (`--primary`, `--secondary`, `--gold`, `--bg`, fonts). Every component is
  already styled. **Never write bespoke CSS for a component that already exists.**
- `components.html` — a live gallery of every reusable block with its class names.
  Read it first to see what's available, then copy blocks into the page.
- `sales-page.html`, `checkout.html`, `thank-you.html` — the starter funnel. Fill
  in the `[BRACKETED]` placeholders. Keep the section order; delete unused sections.
- `api/create-payment-intent.js` — server-side Stripe pricing (the source of truth
  for prices). `api/config.js` — serves the publishable key.
- `examples/swys-funnel/` — a COMPLETE working funnel. Read it to see how a real,
  finished page uses the components. Mirror its patterns; don't copy its copy.

## Build workflow

1. **Gather the offer.** Ask for (or extract from provided notes): the core promise
   / outcome, who it's for, price, the deliverables, any bonuses, proof/testimonials,
   the guarantee, and the support email. Don't start writing until you have the promise
   and the price.
2. **Write the sales page.** Work section by section in `sales-page.html`. Replace
   every `[BRACKET]`. Use the components from `components.html`. Put the single most
   important result inside a `<span class="hl">…</span>`. Keep copy specific and
   concrete — real numbers beat adjectives.
3. **Wire the checkout.** In `checkout.html` set the product name and price, and edit
   or remove the order bumps. Then mirror those exact prices and `data-id`s in
   `api/create-payment-intent.js` — **the two files must agree** or the charge will be
   wrong. Price lives in cents (`$27` → `2700`).
4. **Thank-you page.** Set the support email and confirmation copy.
5. **Rebrand (if asked).** Swap the three SVGs in `assets/`, then change the color and
   font variables at the top of `brand.css`. Do not hand-edit component colors.
6. **Verify.** Preview the pages. Check: headline reads as one clear promise, every CTA
   points to `checkout.html`, checkout total updates when bumps toggle, no `[BRACKET]`
   text remains, mobile layout stacks cleanly.

## Rules

- **Copy is the user's, structure is the engine's.** Don't rewrite the user's words to
  be "clever" — sharpen for clarity and keep their voice. If they gave you a source
  doc, use its copy; flag typos as notes but keep them unless told otherwise.
- **One promise per page.** If the page tries to say five things, it says nothing.
- **Prices only live in two places** (`checkout.html` + the API). Never hardcode a
  total anywhere else.
- **Never** put a Stripe secret key in the code. Keys are Vercel env vars only.
- Prefer editing the starter files over generating new ones. Keep the repo lean.

## Deploy checklist (share with the user when they're ready)

1. Push to GitHub → import to Vercel.
2. Set env vars in Vercel: `STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY` (test first).
3. Test with card `4242 4242 4242 4242`; confirm the charge in Stripe (test mode).
4. Swap to live keys when ready.

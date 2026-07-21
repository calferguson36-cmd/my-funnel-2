# Catalyst Funnel Engine

Everything you need to build and launch a high-converting funnel — **without** a page
builder or monthly funnel software. You own the code.

- A proven **design system** with a full **component library**
- A ready **sales page → checkout → thank-you** flow to fill in
- A secure **Stripe checkout** (order bumps + server-side pricing) on Vercel
- A **build guide + AI skill** so Claude Code / ChatGPT can help you assemble it
- A complete **working example funnel** to study and copy

---

## Repository map

```
catalyst-funnel-engine/
├─ README.md                 ← you are here
├─ AGENTS.md                 ← rules for AI agents building in this repo
├─ .claude/skills/
│   └─ funnel-builder/       ← the "funnel-builder" skill (Claude Code)
│
├─ brand.css                 ← DESIGN SYSTEM: colors, fonts, every component
├─ components.html           ← COMPONENT LIBRARY: open in a browser, copy blocks
│
├─ sales-page.html           ← STARTER funnel — fill in the [BRACKETS]
├─ checkout.html             ← starter checkout (order bumps + Stripe)
├─ thank-you.html            ← starter confirmation page
│
├─ api/
│   ├─ create-payment-intent.js  ← CHECKOUT ENGINE: secure server-side pricing
│   ├─ config.js                 ← serves your publishable Stripe key + Meta Pixel ID
│   ├─ save-questionnaire.js     ← saves thank-you page answers to Google Sheets
│   └─ stripe-webhook.js         ← source-of-truth Purchase event → Meta CAPI
├─ assets/                   ← your logo + emblem (placeholders to replace)
├─ vercel.json               ← clean URLs + routing
│
└─ examples/
    └─ swys-funnel/          ← a COMPLETE, real, working funnel to learn from
```

---

## The fastest path (with AI)

1. Open this repo in **Claude Code** (or point ChatGPT/Cursor at it).
2. Say: *"Build my funnel."* The `funnel-builder` skill + `AGENTS.md` tell the AI
   exactly how to use the engine.
3. Give it your offer: the promise, who it's for, price, deliverables, bonuses, proof,
   guarantee, support email.
4. It fills in `sales-page.html` / `checkout.html`, wires the price into the API, and
   previews it. You review the copy.

## The manual path

1. Open `components.html` in your browser — that's your parts catalog.
2. In `sales-page.html`, replace every `[BRACKET]` with your copy. Keep the section
   order (it's the proven flow); delete sections you don't need.
3. In `checkout.html`, set your product name + price and edit/remove the order bumps.
4. In `api/create-payment-intent.js`, set the same prices (in **cents**) and bump ids.
   **The checkout and the API must agree.**
5. Set your support email + confirmation copy in `thank-you.html`.
6. Rebrand: replace the SVGs in `assets/`, then change the color/font **variables at
   the top of `brand.css`** (don't hand-edit individual components).

> Stuck on what "good" looks like? Open `examples/swys-funnel/` — it's a full, real
> funnel built with these exact components.

---

## Deploy to Vercel

1. Push this repo to GitHub → in [Vercel](https://vercel.com), **Add New → Project**
   and import it.
2. Add two **Environment Variables** (Settings → Environment Variables):
   - `STRIPE_PUBLISHABLE_KEY` — your `pk_...` key
   - `STRIPE_SECRET_KEY` — your `sk_...` key
   Start with **test** keys, switch to **live** when ready.
3. Deploy. Your funnel is live at `your-project.vercel.app`.
4. Test with card `4242 4242 4242 4242` (any future expiry / any CVC) and confirm the
   charge in your Stripe dashboard (test mode).

### Questionnaire → Google Sheets (optional)

The thank-you page's "Help Me Build This" questionnaire saves answers to a Google
Sheet via `api/save-questionnaire.js`. Full setup steps are in the comment at the top
of that file; in short:

1. Google Cloud Console → new project → enable the **Google Sheets API**.
2. Create a **Service Account** → generate a JSON key.
3. Create a Sheet, share it with the service account's email (from the JSON) as Editor.
4. Add three more **Environment Variables** in Vercel:
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL` — the JSON's `client_email`
   - `GOOGLE_PRIVATE_KEY` — the JSON's `private_key`
   - `GOOGLE_SHEET_ID` — from the Sheet's URL
5. Redeploy. Each submission appends a row: timestamp, area, area description, example, desired outcome.

Until these are set, the button falls back to a pre-filled `mailto:` so answers still
reach you.

### Meta Pixel + Conversions API (optional)

Ad tracking uses Meta's recommended dual pattern: a client-side Pixel `Purchase` event
on the thank-you page, plus a server-side Conversions API (CAPI) event fired from
`api/stripe-webhook.js` the moment Stripe actually clears the charge — server-to-server,
so it fires even if the buyer closes the tab or runs an ad blocker. Both send the same
`event_id` (the PaymentIntent id) so Meta dedupes them into one accurate conversion.
Full setup steps are in the comment at the top of `api/stripe-webhook.js`; in short:

1. Meta Events Manager → your Pixel → Settings → Conversions API → **Generate access
   token**. Copy the **Pixel ID** from the same page.
2. Stripe Dashboard → Developers → Webhooks → **Add endpoint**:
   - URL: `https://yourdomain.com/api/stripe-webhook`
   - Event: `payment_intent.succeeded`
   - Reveal and copy the signing secret (`whsec_...`).
3. Add three more **Environment Variables** in Vercel:
   - `STRIPE_WEBHOOK_SECRET` — the `whsec_...` secret from step 2
   - `META_PIXEL_ID` — the Pixel ID from step 1
   - `META_CAPI_ACCESS_TOKEN` — the access token from step 1
4. Redeploy.

Until these are set, no ad-tracking calls are made — checkout and fulfillment aren't
affected either way.

---

## Security (read this)

- **Never** put your `sk_...` secret key in the code — it lives only in Vercel env vars
  and is read server-side.
- The order total is computed **on the server** from a trusted price map, so a tampered
  browser can't change what a customer pays.
- The thank-you page's status text is just a display convenience. `api/stripe-webhook.js`
  is the actual source of truth — Stripe calls it server-to-server once a charge clears,
  independent of what happens in the buyer's browser.

## Local preview (optional)

Static pages preview with any static server (checkout needs the Vercel functions + env
vars to actually charge):

```bash
npx serve .          # or: python -m http.server 8080
npx vercel dev       # to also run the Stripe functions locally
```

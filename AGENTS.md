# AGENTS.md — Catalyst Funnel Engine

Instructions for any AI coding agent (Claude Code, ChatGPT, Cursor, etc.) working
in this repo. If you're a human, read `README.md` instead.

## Your job
Help the user build and launch **their** funnel using this engine. The engine (design
system, components, Stripe checkout) is done — you assemble the user's offer into it.

## Read these before editing
1. `README.md` — what the engine is and how it deploys.
2. `components.html` — the catalog of reusable blocks + class names.
3. `examples/swys-funnel/` — a complete, real, working funnel. Your north star for
   quality and structure. **Mirror its patterns, never copy its copy or branding.**

## Files you edit for a new funnel
| File | Change |
|------|--------|
| `sales-page.html` | Replace every `[BRACKET]` with the user's copy |
| `checkout.html` | Product name, price, order bumps |
| `api/create-payment-intent.js` | Prices (cents) + bump ids — **must match checkout.html** |
| `thank-you.html` | Support email + confirmation copy |
| `brand.css` (top only) | Colors/fonts, only if rebranding |
| `assets/*.svg` | The user's logo/emblem, only if rebranding |

## Hard rules
- **Do not restyle existing components.** Reuse classes from `components.html`;
  change look via the CSS variables at the top of `brand.css`.
- **Prices live in exactly two places** (`checkout.html` and the API) and must agree.
  Cents, not dollars.
- **Never** commit a Stripe secret key. Keys are Vercel environment variables only.
- **One clear promise per page.** Wrap the key result in `<span class="hl">`.
- Keep the user's voice. Sharpen for clarity; don't rewrite into generic marketing.
- Leave no `[BRACKET]` placeholders in a page you call "done."

## Definition of done
Headline states one promise · every CTA links to `checkout.html` · checkout total
updates when bumps toggle · API prices match the checkout · no leftover placeholders ·
layout stacks cleanly on mobile · support email set on all pages.

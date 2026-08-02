// Shared content for the workshop reminder sequence, sent by stripe-webhook.js
// via Resend on a successful workshop purchase. Underscore prefix keeps this
// out of Vercel's file-based routing (it's a helper module, not an endpoint).
//
// Copy source: eg-ad-factory/your-work/part-time-1-percent-workshop/emails/workshop-reminders.md

const MEET_LINK = 'https://meet.google.com/itx-njaz-ukd';

const PREP_LIST_HTML = `
  <ul>
    <li>Find yourself a quiet space. No open-plan office, no kids running through.</li>
    <li>Headphones. Not optional.</li>
    <li>A blanket, something comfy.</li>
    <li>Water bottle, within reach.</li>
    <li>Come fasted if you can. A light breakfast is fine if you need it.</li>
    <li>A notebook. You'll want to write things down.</li>
    <li>If you can, keep the rest of the day open. Let it actually integrate rather than rushing off to the next thing.</li>
  </ul>
`;

function wrap(bodyHtml) {
  return `<div style="font-family:Georgia,serif;font-size:16px;line-height:1.6;color:#1a1a1a;max-width:600px;margin:0 auto;">${bodyHtml}</div>`;
}

function greeting(name) {
  const first = (name || '').trim().split(' ')[0];
  return first ? `Hey ${first},` : 'Hey,';
}

function confirmationEmail(name) {
  return {
    subject: "You're in. Here's your link for August 15.",
    html: wrap(`
      <p>${greeting(name)}</p>
      <p>You're in.</p>
      <p><strong>How I Won Sales Leaderboards Working Part-Time Hours</strong> is locked in for:</p>
      <p><strong>Saturday, August 15, 2026, 10:00am AEST</strong></p>
      <p>Here's your link. Save this email, you'll need it that morning.</p>
      <p><a href="${MEET_LINK}">Join here: ${MEET_LINK}</a></p>
      <p>Quick word on what this actually is.</p>
      <p>This isn't sales scripts. It isn't objection-handling tactics. You won't leave with a new pitch.</p>
      <p>What you're getting is <strong>The Finish-Line Reset</strong>. A 30-minute experience I used to top sales leaderboards on part-time hours, while everyone around me grinded 60+ hour weeks.</p>
      <p>Same skill. Same product. The only thing that changed was what was happening in my nervous system the moment the pressure hit.</p>
      <p>That's what we're doing live on the 15th.</p>
      <p><strong>Before then, a few things to sort out:</strong></p>
      ${PREP_LIST_HTML}
      <p>Can't make it live? You'll get lifetime access to the replay either way. But if you can be there live, be there live.</p>
      <p><strong>Your guarantee:</strong> come Monday, take it into your first hard call or conversation. If nothing's different, email me. Full refund, no questions asked, no time wasted arguing about it.</p>
      <p>See you on the 15th.</p>
      <p>Callum</p>
      <p>P.S. Add the 15th to your calendar right now if you haven't. This one's easy to let slip.</p>
    `),
  };
}

function dayBeforeEmail(name) {
  return {
    subject: 'Tomorrow, 10am. Here’s what to have ready.',
    html: wrap(`
      <p>${greeting(name)}</p>
      <p>Tomorrow. <strong>10:00am AEST.</strong></p>
      <p><a href="${MEET_LINK}">Join here: ${MEET_LINK}</a></p>
      <p>Here's the checklist one more time, so tomorrow morning is just show up, not scramble:</p>
      ${PREP_LIST_HTML}
      <p>I said this in the first email, but it's worth repeating: this isn't another tactic to bolt onto what you're already doing. It's a 30-minute reset that changes what's happening in your nervous system at the exact moment the pressure hits. The objection at the finish line. The quota crunch. The call you've been avoiding.</p>
      <p>Same skill you already have. Different state to run it from.</p>
      <p>Get some sleep. See you at 10.</p>
      <p>Callum</p>
    `),
  };
}

function morningOfEmail(name) {
  return {
    subject: 'Today, 10am. Link inside.',
    html: wrap(`
      <p>${greeting(name)}</p>
      <p>Today's the day.</p>
      <p><strong>10:00am AEST. 2 hours from now.</strong></p>
      <p><a href="${MEET_LINK}">Join here: ${MEET_LINK}</a></p>
      <p>Last check before you go:</p>
      <ul>
        <li>Quiet space, headphones on</li>
        <li>Blanket and water within reach</li>
        <li>Fasted or light breakfast only</li>
        <li>Notebook out</li>
      </ul>
      <p>Clear the rest of your day if you can. This isn't the kind of thing you want to rush out of and straight into back-to-back calls.</p>
      <p>30 minutes. That's all it takes to shift what's actually been holding your results back.</p>
      <p>See you at 10.</p>
      <p>Callum</p>
    `),
  };
}

// AEST (Brisbane) has no daylight saving, so these convert to fixed UTC offsets.
const DAY_BEFORE_SEND_AT = '2026-08-13T23:00:00.000Z'; // Aug 14, 9:00am AEST
const MORNING_OF_SEND_AT = '2026-08-14T22:00:00.000Z'; // Aug 15, 8:00am AEST

// Builds the set of emails to send for a workshop purchase. Reminders whose
// send time has already passed are dropped rather than sent late/immediately,
// since the confirmation email already carries the full link and prep list.
function buildWorkshopEmailQueue(name) {
  const queue = [{ ...confirmationEmail(name), scheduledAt: null }];

  if (new Date(DAY_BEFORE_SEND_AT).getTime() > Date.now()) {
    queue.push({ ...dayBeforeEmail(name), scheduledAt: DAY_BEFORE_SEND_AT });
  }
  if (new Date(MORNING_OF_SEND_AT).getTime() > Date.now()) {
    queue.push({ ...morningOfEmail(name), scheduledAt: MORNING_OF_SEND_AT });
  }

  return queue;
}

module.exports = { buildWorkshopEmailQueue };

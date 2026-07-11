// Vercel serverless function — appends a questionnaire response as a new row
// in a Google Sheet, using a Google Cloud service account.
//
// ─── ONE-TIME SETUP ────────────────────────────────────────────────────────
// 1. console.cloud.google.com → create a project → APIs & Services → Library
//    → enable "Google Sheets API".
// 2. APIs & Services → Credentials → Create Credentials → Service Account.
//    Open it → Keys → Add Key → Create new key → JSON. Download the file.
// 3. Create a Google Sheet for the responses. Open the downloaded JSON and
//    copy the "client_email" value — share the Sheet with that email as an
//    Editor (Share button, top right).
// 4. Copy the Sheet's ID from its URL:
//    docs.google.com/spreadsheets/d/<THIS PART>/edit
// 5. In Vercel → Project → Settings → Environment Variables, add:
//    GOOGLE_SERVICE_ACCOUNT_EMAIL = the "client_email" from the JSON file
//    GOOGLE_PRIVATE_KEY           = the "private_key" from the JSON file
//                                   (paste it exactly as-is, including the
//                                   -----BEGIN/END PRIVATE KEY----- lines)
//    GOOGLE_SHEET_ID              = the Sheet ID from step 4
// 6. Redeploy. Each questionnaire submission adds a row: timestamp, area,
//    areaDesc, example, outcome.

const { google } = require('googleapis');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_SHEET_ID } = process.env;
  if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY || !GOOGLE_SHEET_ID) {
    return res.status(500).json({ error: 'Server is missing the Google Sheets environment variables.' });
  }

  try {
    const body =
      typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const area = String(body.area || '').slice(0, 500);
    const areaDesc = String(body.areaDesc || '').slice(0, 1000);
    const example = String(body.example || '').slice(0, 1000);
    const outcome = String(body.outcome || '').slice(0, 1000);

    const auth = new google.auth.JWT(
      GOOGLE_SERVICE_ACCOUNT_EMAIL,
      null,
      // Vercel env vars store literal "\n" — turn them back into real newlines.
      GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      ['https://www.googleapis.com/auth/spreadsheets']
    );

    const sheets = google.sheets({ version: 'v4', auth });

    await sheets.spreadsheets.values.append({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: 'Sheet1!A:E',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[new Date().toISOString(), area, areaDesc, example, outcome]],
      },
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: (err && err.message) || 'Could not save response.' });
  }
};

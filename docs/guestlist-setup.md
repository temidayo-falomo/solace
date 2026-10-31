# Season guestlist setup

Status: dedicated Google Sheet created and standalone Apps Script deployed and authorized on 30 October 2026. Live backend save and case/whitespace email deduplication passed; exactly one test row was confirmed in the Sheet. Credentials are stored only in Script Properties and ignored local `.env.local`. Vercel environment configuration is pending account sign-in. No website deployment was performed. Existing bookings, calendar files and event assets are preserved; homepage event promotions are hidden for the season launch.

## Google owner steps

1. Create a **new, dedicated** Google spreadsheet called “Solace season guestlist”. Rename its empty first tab `Guestlist`. Set A1:G1 to exactly: `Timestamp`, `First Name`, `Last Name`, `Email`, `Phone`, `Source`, `Mode`. Leave all other columns empty. Copy the spreadsheet ID from its URL.
2. Create a **new standalone** project at https://script.google.com. Paste `google-apps-script/Guestlist.gs` into `Code.gs`. This script only appends to the dedicated tab, checks headers before writes, and preserves existing rows. Do not replace an existing deployed script or point this at an existing integration without inspecting and discussing its structure first.
3. Generate a random secret of at least 32 characters (for example `openssl rand -hex 32`). In Apps Script → Project Settings → Script properties, add `SOLACE_GUESTLIST_SECRET` and `SOLACE_GUESTLIST_SHEET_ID`. Do not commit these values.
4. Deploy → New deployment → Web app → Execute as **Me** → Who has access **Anyone** → Deploy. **Authorize access using the Google account that owns the new Sheet** when prompted. Copy the `/exec` deployment URL. Workspace administrators may need to enable public web apps.
5. Set server environment variables `SOLACE_GUESTLIST_APPS_SCRIPT_URL` (the `/exec` URL) and `SOLACE_GUESTLIST_SECRET` (same secret) in Vercel. Never use `VITE_` names. Website deployment remains a separate user action; none was performed here.

The endpoint is a Vercel Node function at `/api/guestlist`. For local full-stack testing, use `vercel dev` with the server variables in an ignored `.env.local`; plain `npm run dev` serves only Vite and does not run API functions.

## Verification after Google authorization

Submit a unique test email using the homepage. Confirm the success message appears only after one row exists with Source `landing` and Mode `season-guestlist`. Submit the same email with different case/whitespace; verify the row count remains unchanged and the original entry is preserved. Test blank name, malformed email, invalid phone, wrong secret, missing configuration, and an inaccessible Sheet: all must fail without displaying success. Submit a formula-like name such as `=1+1` and a `+` phone number; inspect that they are stored as text, not formulas. Use only your own test contact data; any cleanup should target only those test rows.

Automated tests use a simulated Apps Script/Sheets runtime and mocked network; they cannot confirm live Google persistence or authorization. Google setup, live save, and duplicate submission checks are complete. Remaining live checks and Vercel environment configuration are listed in the status above. If a request times out after Google writes it, retrying is safe because emails are deduplicated under a script lock.

Apps Script web app and lock behavior: https://developers.google.com/apps-script/guides/web and https://developers.google.com/apps-script/reference/lock/lock-service.

## Connected resources

- Sheet: https://docs.google.com/spreadsheets/d/1NPCUXNSrf2pY_kDLa9a0i4zmDOHFVwUiGS2Z4K2ML3w/edit
- Script project: https://script.google.com/home/projects/1Qfu_mmFl4cS9thMYrhB3Ev01TKpBWepbYsoN3Q4kQpRio0MznR9JDQeE/edit
- The active `/exec` URL is saved in ignored `.env.local`; keep the secret out of documentation and browser bundles.
- A clearly labelled `Solace Setup Test` row with `solace-setup-test@example.com` remains for verification.

31 October 2026: migrated Name into First Name and Last Name, preserving the two existing entries. Apps Script updated at the same endpoint.

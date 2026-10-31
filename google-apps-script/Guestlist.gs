// Deploy as a NEW standalone Apps Script project. Never attach to an existing integration.
const HEADERS = ['Timestamp', 'First Name', 'Last Name', 'Email', 'Phone', 'Source', 'Mode'];

function jsonResponse(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}

function safeCell(value) {
  return /^[\s]*[=+\-@]/.test(value) || /^['\t\r\n]/.test(value) ? "'" + value : value;
}

function doPost(e) {
  let lock;
  try {
    const config = PropertiesService.getScriptProperties();
    const secret = config.getProperty('SOLACE_GUESTLIST_SECRET');
    const sheetId = config.getProperty('SOLACE_GUESTLIST_SHEET_ID');
    if (!secret || secret.length < 32 || !sheetId) return jsonResponse({ ok: false, error: 'configuration' });
    if (!e || !e.postData || e.postData.contents.length > 4096) return jsonResponse({ ok: false, error: 'invalid_payload' });
    const data = JSON.parse(e.postData.contents);
    if (!data || data.secret !== secret) return jsonResponse({ ok: false, error: 'unauthorized' });
    if (typeof data.firstName !== 'string' || typeof data.lastName !== 'string' || typeof data.email !== 'string' || typeof data.phone !== 'string') return jsonResponse({ ok: false, error: 'validation' });
    const firstName = data.firstName.trim();
    const lastName = data.lastName.trim();
    const email = data.email.trim().toLowerCase();
    const phone = data.phone.trim();
    if (!firstName || firstName.length > 80 || !lastName || lastName.length > 80 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !phone || phone.length > 40 || !/^[+\d\s().-]+$/.test(phone) || [firstName, lastName, email, phone].some(v => /[\u0000-\u001f\u007f]/.test(v)) || data.source !== 'landing' || data.mode !== 'season-guestlist') return jsonResponse({ ok: false, error: 'validation' });
    lock = LockService.getScriptLock();
    lock.waitLock(10000);
    const sheet = SpreadsheetApp.openById(sheetId).getSheetByName('Guestlist');
    // Fail closed: never create, clear, or rewrite a sheet during submission.
    if (!sheet || sheet.getLastColumn() !== 7 || JSON.stringify(sheet.getRange(1, 1, 1, 7).getValues()[0]) !== JSON.stringify(HEADERS)) return jsonResponse({ ok: false, error: 'sheet_structure' });
    const count = sheet.getLastRow();
    const emails = count > 1 ? sheet.getRange(2, 4, count - 1, 1).getValues() : [];
    if (emails.some(row => String(row[0]).trim().toLowerCase() === email)) return jsonResponse({ ok: true, status: 'existing' });
    const row = count + 1;
    // Plain text format protects phone numbers and formula-like content.
    sheet.getRange(row, 2, 1, 6).setNumberFormat('@');
    sheet.getRange(row, 1, 1, 7).setValues([[new Date(), ...[firstName, lastName, email, phone, data.source, data.mode].map(safeCell)]]);
    SpreadsheetApp.flush();
    return jsonResponse({ ok: true, status: 'saved' });
  } catch {
    return jsonResponse({ ok: false, error: 'save_failed' });
  } finally {
    if (lock && lock.hasLock()) lock.releaseLock();
  }
}

import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { submitGuestlist, validateGuestlist } from '../server/guestlist.js';
import handler from '../api/guestlist.js';

const payload = { firstName: 'Test', lastName: 'Person', email: ' Person@Example.com ', phone: '+234 800 123' };
const env = { SOLACE_GUESTLIST_SECRET: 's'.repeat(64), SOLACE_GUESTLIST_APPS_SCRIPT_URL: 'https://script.google.com/macros/s/test/exec' };
function runtime() {
  const rows = [['Timestamp', 'First Name', 'Last Name', 'Email', 'Phone', 'Source', 'Mode']];
  let locked = false;
  let flushed = false;
  let fail = false;
  const context = vm.createContext({
    PropertiesService: { getScriptProperties: () => ({ getProperty: key => key.endsWith('SECRET') ? env.SOLACE_GUESTLIST_SECRET : 'sheet' }) },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: text => ({ setMimeType: () => JSON.parse(text) }) },
    LockService: { getScriptLock: () => ({ waitLock: () => { locked = true; }, hasLock: () => locked, releaseLock: () => { locked = false; } }) },
    SpreadsheetApp: {
      flush: () => { if (fail) throw Error(); flushed = true; },
      openById: () => ({ getSheetByName: () => ({
        getLastColumn: () => 7, getLastRow: () => rows.length,
        getRange: (r, c, n, width) => ({
          getValues: () => rows.slice(r - 1, r - 1 + n).map(row => row.slice(c - 1, c - 1 + width)),
          setNumberFormat: () => assert.ok(locked),
          setValues: values => { assert.ok(locked); rows[r - 1] = values[0]; },
        }),
      }) }),
    },
  });
  vm.runInContext(readFileSync(new URL('../google-apps-script/Guestlist.gs', import.meta.url), 'utf8'), context);
  return { rows, call: data => context.doPost({ postData: { contents: JSON.stringify(data) } }), get locked() { return locked; }, get flushed() { return flushed; }, fail: () => { fail = true; } };
}

test('validation rejects malformed and oversized input, normalizes email', () => {
  assert.equal(validateGuestlist(payload).email, 'person@example.com');
  for (const value of [null, [], {}, { ...payload, firstName: ' ' }, { ...payload, email: 'bad' }, { ...payload, phone: '' }, { ...payload, phone: 'abc' }, { ...payload, firstName: '=X\nY' }, { ...payload, lastName: 'x'.repeat(81) }]) assert.equal(validateGuestlist(value), null);
});
test('backend fails on missing config, network, bad JSON, unconfirmed and HTTP failure', async () => {
  assert.equal((await submitGuestlist(payload, {})).status, 503);
  assert.equal((await submitGuestlist({}, env)).status, 400);
  for (const send of [async () => { throw Error(); }, async () => ({ ok: true, json: async () => { throw Error(); } }), async () => ({ ok: true, json: async () => ({ ok: true }) }), async () => ({ ok: false, json: async () => ({ ok: true, status: 'saved' }) }), async () => ({ ok: true, json: async () => ({ ok: false }) })]) assert.equal((await submitGuestlist(payload, env, send)).status, 502);
});
test('backend through Apps Script persists then deduplicates; holds lock and flushes', async () => {
  const app = runtime();
  const send = async (_url, options) => ({ ok: true, json: async () => app.call(JSON.parse(options.body)) });
  assert.equal((await submitGuestlist(payload, env, send)).status, 200);
  assert.equal(app.rows.length, 2);
  assert.equal(app.rows[1][3], 'person@example.com');
  assert.equal(app.rows[1][5], 'landing');
  assert.equal(app.rows[1][6], 'season-guestlist');
  assert.ok(app.flushed);
  assert.equal(app.locked, false);
  assert.equal((await submitGuestlist({ ...payload, email: 'PERSON@example.com' }, env, send)).status, 200);
  assert.equal(app.rows.length, 2);
});
test('Apps Script validates independently, rejects auth/schema failures, escapes formula cells', () => {
  const app = runtime();
  const data = { ...payload, firstName: '=1+1', secret: env.SOLACE_GUESTLIST_SECRET, source: 'landing', mode: 'season-guestlist' };
  for (const value of [{ ...data, secret: 'wrong' }, { ...data, lastName: '' }, { ...data, email: 'bad' }, { ...data, phone: '' }, { ...data, phone: 'bad' }, { ...data, mode: 'event' }]) assert.equal(app.call(value).ok, false);
  assert.equal(app.rows.length, 1);
  assert.equal(app.call(data).ok, true);
  assert.equal(app.rows[1][1], "'=1+1");
  assert.equal(app.rows[1][4], "'+234 800 123");
  app.rows[0][0] = 'Unexpected';
  assert.equal(app.call({ ...data, email: 'new@example.com' }).error, 'sheet_structure');
  assert.equal(app.locked, false);
});
test('Apps Script flush failure never returns success and releases lock', () => {
  const app = runtime(); app.fail();
  assert.equal(app.call({ ...payload, secret: env.SOLACE_GUESTLIST_SECRET, source: 'landing', mode: 'season-guestlist' }).ok, false);
  assert.equal(app.locked, false);
});
test('HTTP method, content type, and malformed JSON are rejected', async () => {
  for (const [req, expected] of [[{ method: 'GET', headers: {} }, 405], [{ method: 'POST', headers: {} }, 415], [{ method: 'POST', headers: { 'content-type': 'application/json' }, body: '{' }, 400]]) {
    const res = { setHeader() {}, status(code) { this.code = code; return this; }, json() {} };
    await handler(req, res); assert.equal(res.code, expected);
  }
});

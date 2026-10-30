export function validateGuestlist(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const { name, email, phone = '' } = body;
  if (typeof name !== 'string' || typeof email !== 'string' || typeof phone !== 'string') return null;
  const value = { name: name.trim(), email: email.trim().toLowerCase(), phone: phone.trim() };
  if (!value.name || value.name.length > 160 || value.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email) || value.phone.length > 40 || (value.phone && !/^[+\d\s().-]+$/.test(value.phone)) || Object.values(value).some(v => /[\u0000-\u001f\u007f]/.test(v))) return null;
  return value;
}

export async function submitGuestlist(body, env = process.env, send = fetch) {
  const value = validateGuestlist(body);
  if (!value) return { status: 400, body: { error: 'Enter your full name, a valid email, and an optional phone number (up to 40 characters).' } };
  const url = env.SOLACE_GUESTLIST_APPS_SCRIPT_URL;
  const secret = env.SOLACE_GUESTLIST_SECRET;
  if (!url || !/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(url) || !secret || secret.length < 32) {
    return { status: 503, body: { error: 'The guestlist is temporarily unavailable. Please try again later.' } };
  }
  try {
    const response = await send(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...value, secret, source: 'landing', mode: 'season-guestlist' }),
      signal: AbortSignal.timeout(20000),
    });
    const result = await response.json();
    if (!response.ok || result?.ok !== true || !['saved', 'existing'].includes(result.status)) throw new Error('Unconfirmed save');
    return { status: 200, body: { ok: true } };
  } catch {
    return { status: 502, body: { error: 'We couldn’t confirm your guestlist signup. Please try again; repeat submissions won’t create duplicate entries.' } };
  }
}

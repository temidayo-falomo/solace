import { submitGuestlist } from '../server/guestlist.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Use POST to join the guestlist.' });
  }
  if (!req.headers['content-type']?.startsWith('application/json')) return res.status(415).json({ error: 'Send JSON.' });
  let body = req.body;
  try {
    if (typeof body === 'string') {
      if (Buffer.byteLength(body) > 4096) return res.status(413).json({ error: 'Submission is too large.' });
      body = JSON.parse(body);
    }
  } catch {
    return res.status(400).json({ error: 'Invalid JSON.' });
  }
  const result = await submitGuestlist(body);
  return res.status(result.status).json(result.body);
}

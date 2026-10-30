export type Rsvp = { name: string; email: string; phone?: string };

export async function saveRsvp(rsvp: Rsvp): Promise<void> {
  const response = await fetch('/api/guestlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rsvp),
    signal: AbortSignal.timeout(25000),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || result?.ok !== true) {
    throw new Error(result?.error || 'We couldn’t confirm your signup. Please try again.');
  }
}

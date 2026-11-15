export function formatMmSs(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

/** Seconds remaining until `endAt` (ms epoch), rounded up, never negative. */
export function secondsLeft(endAt: number, now: number): number {
  return Math.max(0, Math.ceil((endAt - now) / 1000));
}

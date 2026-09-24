/** 1710 → "28:30". */
export function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const mm = h ? String(m).padStart(2, '0') : String(m);
  return `${h ? `${h}:` : ''}${mm}:${String(s).padStart(2, '0')}`;
}

/** "Thu, Sep 24 · 6:32 PM" */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return `${date} · ${time}`;
}

/** "September 2026" */
export function formatMonth(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

/** Local calendar YYYY-MM-DD helpers for checkout date fields. */

export function localIsoDate(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function tomorrowIsoDate() {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  return localIsoDate(d);
}

export function isTodayOrEarlier(iso: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return true;
  return iso <= localIsoDate();
}

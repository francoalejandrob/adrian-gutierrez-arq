// Real day-bucketed counts/sums from a timestamped log — used only for
// metrics that have a genuine underlying event log (created_at, paid_date,
// …). Never call this to fabricate a trend for a point-in-time snapshot
// that has no history behind it.
export function bucketByDay<T>(rows: T[], getDate: (row: T) => string, getValue: (row: T) => number, days: number) {
  const buckets = Array.from({ length: days }, () => 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  for (const row of rows) {
    const d = new Date(getDate(row));
    d.setHours(0, 0, 0, 0);
    const dayIndex = days - 1 - Math.round((now.getTime() - d.getTime()) / 86400000);
    if (dayIndex >= 0 && dayIndex < days) buckets[dayIndex] += getValue(row);
  }

  return buckets;
}

export function percentChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

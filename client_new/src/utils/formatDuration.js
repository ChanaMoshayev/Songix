/** משך בשניות → תצוגה "דקות:שניות" (למשל 3:05, 0:42) */
export function formatDurationMmSs(totalSeconds) {
  const n = Number(totalSeconds);
  if (!Number.isFinite(n) || n < 0) return "0:00";
  const m = Math.floor(n / 60);
  const s = Math.floor(n % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * קלט משתמש → שניות.
 * "3:45" / "03:45" → 225; "90" → 90 (שניות בלבד אם אין נקודתיים)
 */
export function parseDurationToSeconds(input) {
  const raw = String(input ?? "").trim();
  if (!raw) return NaN;

  if (raw.includes(":")) {
    const parts = raw.split(":").map(p => p.trim());
    if (parts.length !== 2) return NaN;
    const minutes = Number(parts[0]);
    const seconds = Number(parts[1]);
    if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) return NaN;
    if (minutes < 0 || seconds < 0 || seconds >= 60) return NaN;
    return Math.round(minutes * 60 + seconds);
  }

  const only = Number(raw);
  return Number.isFinite(only) && only >= 0 ? Math.round(only) : NaN;
}

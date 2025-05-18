export function formatDuration(
  ms: number,
  includeMs: boolean = false,
  maxUnits = 2
): string {
  interface TimeData {
    y: number;
    d: number;
    h: number;
    m: number;
    s: number;
    ms?: number;
  }

  if (ms < 0) ms = -ms;

  const time: TimeData = {
    y: Math.floor(ms / 31536000000),
    d: Math.floor(ms / 86400000) % 365,
    h: Math.floor(ms / 3600000) % 24,
    m: Math.floor(ms / 60000) % 60,
    s: Math.floor(ms / 1000) % 60,
  };

  if (includeMs) time.ms = Math.floor(ms) % 1000;

  return Object.entries(time)
    .filter((i) => i[1] !== 0)
    .map(([key, val]) => `${val}${key}`)
    .slice(0, maxUnits)
    .join(", ");
}

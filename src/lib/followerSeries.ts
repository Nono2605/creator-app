import type { ChartPoint } from "./stats.ts";

const DAY_MS = 86_400_000;

// Série cumulative des followers sur les `days` derniers jours (jour UTC en cours
// compris), reconstruite à partir des dates de follow brutes de GET /creator/audience.
// Les follows antérieurs à la fenêtre forment la base du cumul au lieu d'être
// ignorés ; ceux d'après `now`, ou illisibles, ne comptent pas.
export function followerSeries(
  timestamps: string[],
  days: number,
  now: Date
): { points: ChartPoint[]; daily: ChartPoint[]; total: number; newInWindow: number } {
  const startOfToday = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const start = startOfToday - (days - 1) * DAY_MS;
  const end = startOfToday + DAY_MS; // exclue

  let baseline = 0;
  const perDay = new Map<string, number>();
  for (const ts of timestamps) {
    const time = Date.parse(ts);
    if (Number.isNaN(time) || time >= end) continue;
    if (time < start) {
      baseline += 1;
    } else {
      const key = new Date(time).toISOString().slice(0, 10);
      perDay.set(key, (perDay.get(key) ?? 0) + 1);
    }
  }

  // `points` : le cumul ; `daily` : les nouveaux followers de chaque jour. Le cumul
  // d'un grand nombre de followers paraît plat sur un axe qui part de zéro : c'est
  // le détail jour par jour qui montre une évolution.
  const points: ChartPoint[] = [];
  const daily: ChartPoint[] = [];
  let running = baseline;
  for (let i = 0; i < days; i++) {
    const day = new Date(start + i * DAY_MS).toISOString().slice(0, 10);
    const added = perDay.get(day) ?? 0;
    running += added;
    points.push({ day, value: running });
    daily.push({ day, value: added });
  }
  return { points, daily, total: running, newInWindow: running - baseline };
}

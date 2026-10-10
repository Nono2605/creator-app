// Mise en forme des chiffres de statistiques. Fonctions pures, sans dépendance :
// testées avec `npm test` (node --test).

const INTEGER = new Intl.NumberFormat("en-US");

// 1 284 -> « 1,284 » ; au-delà de 10 000, compact : « 12.9K », « 1.2M ».
export function formatCount(n: number): string {
  if (!Number.isFinite(n)) return "0";
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${trim(n / 1_000_000)}M`;
  if (abs >= 10_000) return `${trim(n / 1_000)}K`;
  return INTEGER.format(Math.round(n));
}

// Une décimale, sans « .0 » inutile : 12.9, 12.
function trim(n: number): string {
  return (Math.round(n * 10) / 10).toString();
}

// Temps d'écoute total : « 45s », « 12m », « 3h 12m », « 123h » (au-delà de 100 h
// les minutes ne disent plus rien).
export function formatListeningTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0m";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const totalMinutes = Math.floor(seconds / 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  if (h >= 100) return `${INTEGER.format(h)}h`;
  return `${h}h ${m}m`;
}

export type DeltaDirection = "up" | "down" | "flat" | "new";

export interface Delta {
  direction: DeltaDirection;
  /** Texte court, signe compris : « +12% », « −8% », « 0% », « New ». */
  label: string;
}

// Variation par rapport à la période précédente. null = rien à comparer (zéro des
// deux côtés : afficher « 0% » dirait qu'il y a une tendance là où il n'y a rien).
// Précédent à zéro mais actuel positif : un pourcentage serait infini, on dit « New ».
export function computeDelta(current: number, previous: number): Delta | null {
  if (current === 0 && previous === 0) return null;
  if (previous === 0) return { direction: "new", label: "New" };
  if (current === previous) return { direction: "flat", label: "0%" };

  const pct = ((current - previous) / previous) * 100;
  const rounded = Math.round(Math.abs(pct));
  const direction: DeltaDirection = pct > 0 ? "up" : "down";
  const sign = pct > 0 ? "+" : "−"; // vrai signe moins, de la largeur du plus
  if (rounded === 0) return { direction, label: `${sign}<1%` };
  if (rounded > 999) return { direction, label: `${sign}999%+` };
  return { direction, label: `${sign}${rounded}%` };
}

// « 2026-10-09 » -> « Oct 9 ». Le jour est un jour UTC : on le formate en UTC, sinon
// un fuseau négatif afficherait la veille.
export function formatDay(day: string): string {
  const date = new Date(`${day}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return day;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(date);
}

export function formatDayLong(day: string): string {
  const date = new Date(`${day}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return day;
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

// Axe Y : un plafond « rond » et des graduations régulières (0, 1 000, 2 000…).
// `max` <= 0 (aucune donnée) donne quand même une échelle lisible, 0 à 4.
// `integer` : pour des comptes (écoutes, followers), le pas ne descend jamais sous 1 —
// sinon un maximum de 1 donnerait des graduations à 0,5, affichées « 1, 1, 0 ».
export function niceScale(max: number, tickCount = 4, integer = false): { max: number; ticks: number[] } {
  const target = Number.isFinite(max) && max > 0 ? max : 4;
  const rough = target / tickCount;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rough)));
  const residual = rough / magnitude;
  const niceStep = (residual <= 1 ? 1 : residual <= 2 ? 2 : residual <= 5 ? 5 : 10) * magnitude;
  const step = integer ? Math.max(1, Math.ceil(niceStep)) : niceStep;
  const niceMax = Math.ceil(target / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= niceMax + step / 2; v += step) ticks.push(Math.round(v * 1e9) / 1e9);
  return { max: niceMax, ticks };
}

// Pas « ronds » pour un temps, en secondes : 1, 2, 5, 10, 15, 30 min ; 1, 2, 3, 6, 12 h ;
// 1, 2, 5, 10 j. Des multiples décimaux de secondes (3 h 20 min) ne se lisent pas.
const TIME_STEPS = [60, 120, 300, 600, 900, 1800, 3600, 7200, 10800, 21600, 43200, 86400, 172800, 432000, 864000];

// Même contrat que niceScale, mais pour des secondes : plafond et graduations sur des
// durées lisibles. Au-delà du plus grand pas, on continue par multiples de 10 jours.
export function niceTimeScale(maxSeconds: number, tickCount = 4): { max: number; ticks: number[] } {
  const target = Number.isFinite(maxSeconds) && maxSeconds > 0 ? maxSeconds : 4 * 60;
  let step = TIME_STEPS.find((s) => target / s <= tickCount);
  if (step === undefined) {
    step = TIME_STEPS[TIME_STEPS.length - 1];
    while (target / step > tickCount) step *= 2;
  }
  const niceMax = Math.ceil(target / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= niceMax; v += step) ticks.push(v);
  return { max: niceMax, ticks };
}

// Graduation de l'axe Y d'un temps, courte : « 0 », « 30m », « 1h », « 1h 30m », « 2d ».
export function formatTimeTick(seconds: number): string {
  if (seconds <= 0) return "0";
  if (seconds >= 86400 && seconds % 86400 === 0) return `${seconds / 86400}d`;
  const totalMinutes = Math.round(seconds / 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

// Quels points de l'axe X reçoivent une étiquette de date (au plus `maxLabels`, le
// premier et le dernier toujours). Sur une courte série, on cherche un nombre
// d'étiquettes qui tombe pile (7 jours -> 0, 2, 4, 6) plutôt que des écarts
// inégaux (0, 2, 3, 5, 6) ; sur une longue série, l'arrondi est invisible.
export function labelIndexes(n: number, maxLabels: number): number[] {
  if (n <= 0) return [];
  if (n === 1) return [0];
  const top = Math.max(2, Math.min(maxLabels, n));
  const evenly = (count: number) =>
    Array.from({ length: count }, (_, k) => Math.round((k * (n - 1)) / (count - 1)));

  if (n > 15) return evenly(top);
  for (let count = top; count >= 2; count--) {
    if ((n - 1) % (count - 1) === 0) return evenly(count);
  }
  return [0, n - 1];
}

export function rangeLabel(key: string): string {
  return key === "7d" ? "Last 7 days" : key === "90d" ? "Last 90 days" : "Last 30 days";
}

export function previousRangeLabel(key: string): string {
  return key === "7d" ? "previous 7 days" : key === "90d" ? "previous 90 days" : "previous 30 days";
}

// Part d'un total en pourcentage entier ; 0 si le total est nul.
export function sharePercent(value: number, total: number): number {
  if (!(total > 0)) return 0;
  return Math.round((value / total) * 100);
}

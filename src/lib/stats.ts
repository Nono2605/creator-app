import { api, ApiError } from "@/lib/api";
import { isStatsUnavailable } from "@/lib/statsErrors";

// Types et chargement des statistiques de lecture (GET /creator/stats, voir
// API/src/modules/creator/stats.ts). Une « écoute » est une lecture qualifiée :
// 30 secondes écoutées, mesurées par le serveur.

export const RANGE_KEYS = ["7d", "30d", "90d"] as const;
export type RangeKey = (typeof RANGE_KEYS)[number];
export const DEFAULT_RANGE: RangeKey = "30d";

// Lit ?range= (n'importe quoi, ou absent) : une valeur inconnue retombe sur le défaut
// plutôt que de casser la page.
export function parseRange(raw: string | string[] | undefined): RangeKey {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return (RANGE_KEYS as readonly string[]).includes(value ?? "") ? (value as RangeKey) : DEFAULT_RANGE;
}

export interface Totals {
  plays: number;
  starts: number;
  listeners: number;
  seconds: number;
  saves: number;
  /** null sur la vue d'un morceau : les followers sont ceux de l'artiste. */
  new_followers: number | null;
}

export interface DailyPoint {
  day: string;
  plays: number;
  listeners: number;
  seconds: number;
}

export interface BreakdownRow {
  key: string;
  plays: number;
  seconds: number;
}

export interface TopTrack {
  track_id: string;
  title: string;
  plays: number;
  listeners: number;
  seconds: number;
}

export interface StatsResponse {
  range: { key: RangeKey; days: number; from: string; to: string };
  track_id: string | null;
  totals: Totals;
  previous: Totals;
  daily: DailyPoint[];
  breakdown: { source: BreakdownRow[]; country: BreakdownRow[]; device: BreakdownRow[] };
  top_tracks: TopTrack[] | null;
}

export type StatsResult =
  | { status: "ok"; stats: StatsResponse }
  // Pas encore là : migration SQL non appliquée, ou API pas encore redéployée.
  | { status: "unavailable" }
  | { status: "error"; message: string };

// Ne lève jamais : une panne des statistiques ne doit pas empêcher d'ouvrir le
// reste de la page (catalogue, actions).
export async function loadStats(accessToken: string, range: RangeKey, trackId?: string): Promise<StatsResult> {
  const query = new URLSearchParams({ range });
  if (trackId) query.set("track_id", trackId);

  try {
    const stats = await api.get<StatsResponse>(`/creator/stats?${query}`, { accessToken });
    return { status: "ok", stats };
  } catch (err) {
    if (err instanceof ApiError && isStatsUnavailable(err.status, err.message)) return { status: "unavailable" };
    return { status: "error", message: err instanceof Error ? err.message : "Could not load listening stats." };
  }
}

// Rien n'a jamais été écouté (ni sur la période, ni sur la précédente) : on
// explique comment les écoutes arrivent plutôt que d'afficher des graphiques vides.
export function hasNoListens(stats: StatsResponse): boolean {
  return stats.totals.starts === 0 && stats.previous.starts === 0;
}

// --- séries des graphiques ---------------------------------------------------

export interface ChartPoint {
  day: string;
  value: number;
}

export interface ChartSeries {
  key: string;
  label: string;
  /** « count » : un nombre ; « time » : des secondes, affichées en h / min. */
  unit: "count" | "time";
  points: ChartPoint[];
}

export function dailySeries(daily: DailyPoint[]): ChartSeries[] {
  return [
    { key: "plays", label: "Listens", unit: "count", points: daily.map((d) => ({ day: d.day, value: d.plays })) },
    { key: "listeners", label: "Listeners", unit: "count", points: daily.map((d) => ({ day: d.day, value: d.listeners })) },
    { key: "seconds", label: "Listening time", unit: "time", points: daily.map((d) => ({ day: d.day, value: d.seconds })) },
  ];
}

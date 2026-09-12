export function formatDuration(seconds: number | null): string {
  if (seconds === null) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Pour des totaux (durée de catalogue) plutôt qu'un morceau isolé — "2h 34m"
// au lieu d'un mm:ss qui deviendrait illisible au-delà de quelques minutes.
export function formatLongDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

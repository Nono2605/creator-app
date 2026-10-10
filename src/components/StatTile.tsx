import type { Delta } from "@/lib/formatStats";

// Tuile de chiffre : libellé, valeur, et variation par rapport à une période
// nommée. Le sens de la variation ne repose jamais sur la couleur seule : une
// flèche et un signe l'accompagnent.
const SPOKEN: Record<Delta["direction"], string> = {
  up: "up",
  down: "down",
  flat: "unchanged",
  new: "new",
};

export function StatTile({
  label,
  value,
  delta,
  comparedTo,
  hint,
  featured = false,
}: {
  label: string;
  value: string;
  delta?: Delta | null;
  /** Nom de la période de comparaison, ex. « previous 30 days ». */
  comparedTo?: string;
  hint?: string;
  featured?: boolean;
}) {
  return (
    <div className={`dash-card stat-card${featured ? " dash-card--featured" : ""}`}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      {delta ? (
        <span
          className={`stat-delta stat-delta--${delta.direction}`}
          aria-label={`${SPOKEN[delta.direction]}${delta.direction === "up" || delta.direction === "down" ? ` ${delta.label.replace(/^[+−]/, "")}` : ""}${comparedTo ? ` versus ${comparedTo}` : ""}`}
        >
          <span aria-hidden="true">
            {delta.direction === "up" ? "▲" : delta.direction === "down" ? "▼" : delta.direction === "new" ? "●" : "–"}{" "}
            {delta.label}
          </span>
          {comparedTo && (
            <span className="stat-delta__ref" aria-hidden="true">
              vs {comparedTo}
            </span>
          )}
        </span>
      ) : hint ? (
        <span className="stat-delta stat-delta--flat">{hint}</span>
      ) : null}
    </div>
  );
}

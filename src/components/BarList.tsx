import Link from "next/link";
import { formatCount, sharePercent } from "@/lib/formatStats";

export interface BarRow {
  key: string;
  label: string;
  value: number;
  href?: string;
  /** « Inconnu » / « Autres » : barre estompée, pour ne pas jouer au même niveau qu'une vraie ligne. */
  muted?: boolean;
}

// Liste de barres horizontales : une barre mesure la part du TOTAL (et non du plus
// grand), donc une répartition à 60 % remplit 60 % de la piste. La valeur et la part
// sont écrites à droite : rien ne dépend de la lecture de la longueur de la barre.
export function BarList({ rows, total, unit }: { rows: BarRow[]; total: number; unit: string }) {
  return (
    <ul className="bar-list">
      {rows.map((row) => {
        const share = sharePercent(row.value, total);
        const width = row.value > 0 && total > 0 ? Math.min(Math.max((row.value / total) * 100, 1.5), 100) : 0;
        return (
          <li key={row.key} className="bar-row">
            <span className="bar-row__label">
              {row.href ? (
                <Link href={row.href} className="bar-row__link">
                  {row.label}
                </Link>
              ) : (
                row.label
              )}
            </span>
            <span className="bar-row__track" aria-hidden="true">
              <span className={`bar-row__fill${row.muted ? " bar-row__fill--muted" : ""}`} style={{ width: `${width}%` }} />
            </span>
            <span className="bar-row__value">
              <strong>{formatCount(row.value)}</strong>
              <span className="bar-row__pct" aria-label={`${share} percent of ${unit}`}>
                {share}%
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

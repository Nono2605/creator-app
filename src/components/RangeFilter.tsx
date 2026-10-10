import Link from "next/link";
import { RANGE_KEYS, type RangeKey } from "@/lib/stats";
import { rangeLabel } from "@/lib/formatStats";

// Sélecteur de période : une seule rangée au-dessus de ce qu'elle filtre, qui
// s'applique à TOUTES les statistiques de la page (les chiffres s'accordent
// toujours). Ce sont de simples liens (?range=…) : la page garde son cadre pendant
// le rechargement, sans écran de chargement intermédiaire.
export function RangeFilter({ basePath, current }: { basePath: string; current: RangeKey }) {
  return (
    <nav className="range-filter" aria-label="Time range">
      {RANGE_KEYS.map((key) => (
        <Link
          key={key}
          href={`${basePath}?range=${key}`}
          scroll={false}
          className={`pill${key === current ? " active" : ""}`}
          aria-current={key === current ? "true" : undefined}
        >
          {rangeLabel(key)}
        </Link>
      ))}
    </nav>
  );
}

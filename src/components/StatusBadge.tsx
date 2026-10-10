// Statut d'un morceau ou d'une release. Couleurs fonctionnelles de la DA :
// succès pour ce qui est en ligne, alerte pour ce qui attend une relecture,
// neutre pour un brouillon, pointillé pour ce qui est archivé.
const VARIANTS: Record<string, string> = {
  draft: "status--idle",
  in_review: "status--warn",
  published: "status--ok",
  archived: "status--soon",
};

export function StatusBadge({ status }: { status: string }) {
  const variant = VARIANTS[status] ?? "status--soon";

  return <span className={`status ${variant}`}>{status.replace("_", " ")}</span>;
}

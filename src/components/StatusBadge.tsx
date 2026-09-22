// Même vocabulaire visuel que le badge "Live"/"Coming" de vynl.com/creators.html :
// contour plein + point plein pour ce qui est acté, contour pointillé + point
// creux pour ce qui ne l'est pas (encore, ou plus).
const VARIANTS: Record<string, string> = {
  draft: "status--soon",
  in_review: "status--copper",
  published: "status--live",
  archived: "status--soon",
};

export function StatusBadge({ status }: { status: string }) {
  const variant = VARIANTS[status] ?? "status--soon";

  return <span className={`status ${variant}`}>{status.replace("_", " ")}</span>;
}

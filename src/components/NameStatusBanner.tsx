import Link from "next/link";
import { describeNameStatus, nameStatusOf } from "@/lib/artistNameStatus";
import type { Artist } from "@/lib/session";

// Bandeau en haut du Studio tant que le nom d'artiste n'est pas accepté : en attente de relecture, ou
// refusé (avec le motif) et à remplacer. Rien quand le nom est accepté.
export function NameStatusBanner({ artist }: { artist: Artist }) {
  const status = nameStatusOf(artist);
  const notice = describeNameStatus(status, artist.name_review_note);
  if (!notice) return null;

  return (
    <section
      className="dash-card callout"
      role="status"
      style={{ marginBottom: "var(--space-md)", borderColor: notice.tone === "error" ? "var(--vynl-erreur)" : undefined }}
    >
      <div>
        <h2 className="section-title">{notice.title}</h2>
        <p style={{ color: "var(--vynl-texte-2)" }}>{notice.text}</p>
      </div>
      {status === "rejected" && (
        <Link href="/artist" className="btn btn-secondary btn-sm">
          Choose another name
        </Link>
      )}
    </section>
  );
}

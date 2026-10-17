"use client";

import { useActionState } from "react";
import { renameArtistAction } from "@/app/actions/artist";
import { ArtistNameField } from "@/components/ArtistNameField";
import { describeNameStatus, type NameStatus } from "@/lib/artistNameStatus";

// Le nom d'artiste et son état. Un nom accepté est permanent (catalogue, relevés, pages publiques) : seul un
// nom en attente de relecture ou refusé se change, ici.
export function ArtistNameCard({
  name,
  status,
  note,
}: {
  name: string;
  status: NameStatus;
  note: string | null;
}) {
  const [state, action, pending] = useActionState(renameArtistAction, undefined);
  const notice = describeNameStatus(status, note);

  return (
    <section className="dash-card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
      <h2 className="section-title">Artist name</h2>
      <p>
        <strong>{name}</strong>
      </p>
      {!notice ? (
        <p className="profile-image__help">Your name is approved. It is permanent: it appears on your catalog, statements and public page.</p>
      ) : (
        <>
          <p style={{ color: notice.tone === "error" ? "var(--vynl-erreur)" : "var(--vynl-texte-2)" }}>
            <strong>{notice.title}.</strong> {notice.text}
          </p>
          <form action={action} style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
            <ArtistNameField initialValue={name} />
            <p className="profile-image__help">
              Changing the name restarts the review if the new one is also close to an existing name.
            </p>
            {state?.error && (
              <p role="alert" style={{ color: "var(--vynl-erreur)" }}>
                {state.error}
              </p>
            )}
            {state?.message && (
              <p role="status" style={{ color: "var(--vynl-succes)" }}>
                {state.message}
              </p>
            )}
            <button type="submit" disabled={pending} className="btn btn-secondary" style={{ alignSelf: "flex-start" }}>
              {pending ? "Saving…" : "Choose this name"}
            </button>
          </form>
        </>
      )}
    </section>
  );
}

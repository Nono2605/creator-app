"use client";

import { useActionState } from "react";
import { makeSingleFromTrack, type MakeSingleState } from "@/app/actions/releases";

// Une pochette appartient à une release. Un morceau qui n'est dans aucune release n'en a pas :
// ce bouton crée un single portant son titre et l'y place, puis ouvre la release pour y ajouter la pochette.
export function MakeSingle({ trackId, title }: { trackId: string; title: string }) {
  const [state, action, pending] = useActionState<MakeSingleState | undefined, FormData>(
    makeSingleFromTrack.bind(null, trackId, title),
    undefined
  );

  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
      <p style={{ color: "var(--vynl-texte-2)" }}>
        This track isn&apos;t in a release, so it has no cover. Create a single for it to add one.
      </p>
      {state?.error && (
        <p role="alert" style={{ color: "var(--vynl-erreur)" }}>
          {state.error}
        </p>
      )}
      <button type="submit" className="btn btn-secondary" disabled={pending} style={{ alignSelf: "flex-start" }}>
        {pending ? "Creating…" : "Create a single"}
      </button>
    </form>
  );
}

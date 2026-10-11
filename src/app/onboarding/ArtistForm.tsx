"use client";

import { useActionState } from "react";
import { createArtist } from "@/app/actions/creator";

export function ArtistForm() {
  const [state, action, pending] = useActionState(createArtist, undefined);

  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
      <input
        type="text"
        name="name"
        placeholder="Artist name"
        required
        minLength={2}
        maxLength={40}
        autoComplete="off"
        aria-describedby="artist-name-rules"
        className="input-field"
      />
      {/* Mêmes règles que l'API (lib/artistName.ts) : l'unicité, les mots réservés et le
          détail des caractères sont contrôlés côté serveur et renvoyés dans l'erreur. */}
      <p id="artist-name-rules" style={{ color: "var(--vynl-texte-2)", fontSize: "0.8125rem" }}>
        2 to 40 characters: letters, numbers, spaces and . - _ &apos; &amp; ! only. Each name is unique: &ldquo;Rafale&rdquo; and
        &ldquo;RAFALE&rdquo; count as the same name.
      </p>
      {state?.error && <p style={{ color: "var(--vynl-erreur)" }}>{state.error}</p>}
      <button type="submit" disabled={pending} className="btn btn-primary" style={{ alignSelf: "flex-start" }}>
        {pending ? "Creating…" : "Create artist page"}
      </button>
    </form>
  );
}

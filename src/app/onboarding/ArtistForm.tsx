"use client";

import { useActionState } from "react";
import { createArtist } from "@/app/actions/creator";

export function ArtistForm() {
  const [state, action, pending] = useActionState(createArtist, undefined);

  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
      <input type="text" name="name" placeholder="Artist name" required minLength={2} className="input-field" />
      {state?.error && <p style={{ color: "var(--vynl-erreur)" }}>{state.error}</p>}
      <button type="submit" disabled={pending} className="btn btn-primary" style={{ alignSelf: "flex-start" }}>
        {pending ? "Creating…" : "Create artist page"}
      </button>
    </form>
  );
}

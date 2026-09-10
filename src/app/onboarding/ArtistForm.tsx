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
        style={inputStyle}
      />
      {state?.error && <p style={{ color: "#ff6b6b" }}>{state.error}</p>}
      <button type="submit" disabled={pending} style={buttonStyle}>
        {pending ? "Creating…" : "Create artist page"}
      </button>
    </form>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "0.75rem 1rem",
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--color-border)",
  background: "var(--color-card)",
  color: "var(--color-text)",
};

const buttonStyle: React.CSSProperties = {
  padding: "0.75rem 1rem",
  borderRadius: "var(--radius-sm)",
  border: "none",
  background: "var(--gradient-signature)",
  color: "#fff",
  fontWeight: 600,
  cursor: "pointer",
};

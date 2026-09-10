"use client";

import { useActionState } from "react";
import { applyCreator } from "@/app/actions/creator";

export function ApplyForm() {
  const [state, action, pending] = useActionState(applyCreator, undefined);

  return (
    <form action={action}>
      {state?.error && <p style={{ color: "#ff6b6b", marginBottom: "var(--space-sm)" }}>{state.error}</p>}
      <button type="submit" disabled={pending} style={buttonStyle}>
        {pending ? "Enabling…" : "Enable creator mode"}
      </button>
    </form>
  );
}

const buttonStyle: React.CSSProperties = {
  padding: "0.75rem 1rem",
  borderRadius: "var(--radius-sm)",
  border: "none",
  background: "var(--gradient-signature)",
  color: "#fff",
  fontWeight: 600,
  cursor: "pointer",
};

"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createReleaseAction } from "@/app/actions/releases";

const TYPES = ["single", "ep", "album", "compilation"] as const;

export function NewReleaseForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState(createReleaseAction, undefined);

  useEffect(() => {
    if (state?.releaseId) router.push(`/releases/${state.releaseId}`);
  }, [state?.releaseId, router]);

  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
      <input type="text" name="title" placeholder="Release title" required className="input-field" />
      <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
        <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>Type</span>
        <select name="type" defaultValue="single" className="input-field">
          {TYPES.map((type) => (
            <option key={type} value={type}>
              {type[0].toUpperCase() + type.slice(1)}
            </option>
          ))}
        </select>
      </label>
      {state?.error && <p style={{ color: "#ff6b6b" }}>{state.error}</p>}
      <button type="submit" disabled={pending} className="btn btn-primary" style={{ alignSelf: "flex-start" }}>
        {pending ? "Creating…" : "Create release"}
      </button>
    </form>
  );
}

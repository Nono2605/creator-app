"use client";

import { useActionState } from "react";
import { applyCreator } from "@/app/actions/creator";

const CONTENT_OPTIONS = [
  { value: "human", label: "Human-made — written and performed by people" },
  { value: "ai", label: "AI-generated — created with AI tools" },
  { value: "hybrid", label: "Hybrid — a mix of both" },
];

export function ApplyForm() {
  const [state, action, pending] = useActionState(applyCreator, undefined);

  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
      <div style={termsBoxStyle}>
        <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Creator Terms of Service</p>
        <p style={{ color: "var(--cream-muted)", fontSize: "0.875rem" }}>
          Placeholder — final text to come. By using creator features you agree to only upload
          content you have the rights to, to accurately declare how it was produced, and to
          comply with our content and royalties policies once published.
        </p>
      </div>
      <label style={checkboxRowStyle}>
        <input type="checkbox" name="accepted_terms" required />
        <span>I accept the Creator Terms of Service.</span>
      </label>

      <fieldset style={fieldsetStyle}>
        <legend style={legendStyle}>What kind of content will you publish?</legend>
        {CONTENT_OPTIONS.map((option) => (
          <label key={option.value} style={checkboxRowStyle}>
            <input type="radio" name="content_provenance" value={option.value} required />
            <span>{option.label}</span>
          </label>
        ))}
      </fieldset>

      <label style={checkboxRowStyle}>
        <input type="checkbox" name="owns_rights" required />
        <span>I confirm I hold (or have licensed) the rights to the content I&apos;ll upload.</span>
      </label>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
        <label htmlFor="primary_genre" style={{ color: "var(--cream-muted)", fontSize: "0.875rem" }}>
          Primary genre (optional)
        </label>
        <input id="primary_genre" name="primary_genre" type="text" className="input-field" />
      </div>

      {state?.error && <p style={{ color: "var(--danger)" }}>{state.error}</p>}
      <button type="submit" disabled={pending} className="btn btn-primary" style={{ alignSelf: "flex-start" }}>
        {pending ? "Enabling…" : "Enable creator mode"}
      </button>
    </form>
  );
}

const termsBoxStyle: React.CSSProperties = {
  padding: "var(--space-sm) var(--space-md)",
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--line)",
  background: "var(--surface)",
  maxHeight: 160,
  overflowY: "auto",
};

const checkboxRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: "0.5rem",
};

const fieldsetStyle: React.CSSProperties = {
  border: "1px solid var(--line)",
  borderRadius: "var(--radius-sm)",
  padding: "var(--space-sm) var(--space-md)",
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
};

const legendStyle: React.CSSProperties = {
  padding: "0 0.35rem",
  color: "var(--cream-muted)",
  fontSize: "0.875rem",
};

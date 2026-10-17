"use client";

import { useActionState } from "react";
import { applyCreator } from "@/app/actions/creator";
import type { Genre } from "@/lib/genres";

const CONTENT_OPTIONS = [
  { value: "ai", label: "AI-generated — created with AI tools" },
  { value: "hybrid", label: "Hybrid — a mix of both" },
];

export function ApplyForm({ genres }: { genres: Genre[] }) {
  const [state, action, pending] = useActionState(applyCreator, undefined);

  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
      <div style={termsBoxStyle}>
        <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Creator Terms of Service</p>
        <p style={{ color: "var(--vynl-texte-2)", fontSize: "0.875rem" }}>
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
        {/* Même règle que l'API (bêta 100 % IA) : on le dit ici, pas seulement au moment d'envoyer un morceau. */}
        <p style={{ color: "var(--vynl-texte-2)", fontSize: "0.8125rem" }}>
          During the beta Vynl publishes AI-generated music only. Tracks declared as AI-assisted are saved but can&apos;t
          be submitted for review yet.
        </p>
      </fieldset>

      <label style={checkboxRowStyle}>
        <input type="checkbox" name="owns_rights" required />
        <span>I confirm I hold (or have licensed) the rights to the content I&apos;ll upload.</span>
      </label>

      {/* La liste fermée de l'API (la même que pour les morceaux) ; sans elle, le champ est simplement absent. */}
      {genres.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <label htmlFor="primary_genre" style={{ color: "var(--vynl-texte-2)", fontSize: "0.875rem" }}>
            Primary genre (optional)
          </label>
          <select id="primary_genre" name="primary_genre" defaultValue="" className="input-field">
            <option value="">No preference</option>
            {genres.map((g) => (
              <option key={g.code} value={g.label}>
                {g.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {state?.error && <p style={{ color: "var(--vynl-erreur)" }}>{state.error}</p>}
      <button type="submit" disabled={pending} className="btn btn-primary" style={{ alignSelf: "flex-start" }}>
        {pending ? "Enabling…" : "Enable creator mode"}
      </button>
    </form>
  );
}

const termsBoxStyle: React.CSSProperties = {
  padding: "var(--space-sm) var(--space-md)",
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--vynl-bordure)",
  background: "var(--vynl-vinyle)",
  maxHeight: 160,
  overflowY: "auto",
};

const checkboxRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: "0.5rem",
};

const fieldsetStyle: React.CSSProperties = {
  border: "1px solid var(--vynl-bordure)",
  borderRadius: "var(--radius-sm)",
  padding: "var(--space-sm) var(--space-md)",
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
};

const legendStyle: React.CSSProperties = {
  padding: "0 0.35rem",
  color: "var(--vynl-texte-2)",
  fontSize: "0.875rem",
};

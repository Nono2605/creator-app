"use client";

import { useState, useTransition } from "react";
import { declareProvenance } from "@/app/actions/tracks";

type Provenance = "ai" | "hybrid";

// « human » n'est plus proposé (la bêta est 100 % IA) ; une ancienne déclaration « human »
// reste lisible mais doit être refaite.
const OPTIONS: { value: Provenance; label: string }[] = [
  { value: "hybrid", label: "AI-assisted" },
  { value: "ai", label: "AI-generated" },
];

export function AIDeclarationForm({
  trackId,
  initialProvenance,
  initialDescription,
}: {
  trackId: string;
  initialProvenance: Provenance | "human" | null;
  initialDescription: string;
}) {
  const [provenance, setProvenance] = useState<Provenance | null>(
    initialProvenance === "human" ? null : initialProvenance
  );
  const [description, setDescription] = useState(initialDescription);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    if (!provenance) return;
    setError(null);
    startTransition(async () => {
      const result = await declareProvenance(trackId, provenance, description);
      if (result.ok) setSaved(true);
      else setError(result.error);
    });
  }

  return (
    <div>
      {initialProvenance === "human" && (
        <p style={{ color: "var(--vynl-texte-2)", fontSize: "0.875rem", marginBottom: "var(--space-sm)" }}>
          This track was declared human-made. Vynl only accepts AI-generated music for now: choose how it was made
          to update the declaration.
        </p>
      )}
      {provenance === "hybrid" && (
        <p style={{ color: "var(--vynl-texte-2)", fontSize: "0.875rem", marginBottom: "var(--space-sm)" }}>
          AI-assisted tracks are saved, but they are not accepted during the beta: Vynl publishes AI-generated music
          only for now. You will not be able to submit this track for review yet.
        </p>
      )}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "var(--space-sm)" }}>
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              setProvenance(option.value);
              setSaved(false);
              setError(null);
            }}
            className={`pill${provenance === option.value ? " active" : ""}`}
          >
            {option.label}
          </button>
        ))}
      </div>
      <textarea
        value={description}
        onChange={(e) => {
          setDescription(e.target.value);
          setSaved(false);
          setError(null);
        }}
        placeholder="Optional notes (e.g. which AI tools were used)"
        rows={2}
        className="input-field"
        style={{ width: "100%", resize: "vertical", marginBottom: "var(--space-sm)" }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
        <button type="button" onClick={handleSave} disabled={pending || !provenance} className="btn btn-primary">
          {pending ? "Saving…" : "Save declaration"}
        </button>
        {saved && <span style={{ color: "var(--vynl-succes)", fontSize: "0.875rem" }}>Saved</span>}
        {error && (
          <span role="alert" style={{ color: "var(--vynl-erreur)", fontSize: "0.875rem" }}>
            {error}
          </span>
        )}
      </div>
      <p style={{ color: "var(--vynl-texte-2)", fontSize: "0.8125rem", marginTop: "0.5rem" }}>
        Recorded per track. A public display for listeners is coming soon.
      </p>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { declareProvenance } from "@/app/actions/tracks";

type Provenance = "human" | "ai" | "hybrid";

const OPTIONS: { value: Provenance; label: string }[] = [
  { value: "human", label: "Human-made" },
  { value: "hybrid", label: "AI-assisted" },
  { value: "ai", label: "AI-generated" },
];

export function AIDeclarationForm({
  trackId,
  initialProvenance,
  initialDescription,
}: {
  trackId: string;
  initialProvenance: Provenance | null;
  initialDescription: string;
}) {
  const [provenance, setProvenance] = useState<Provenance | null>(initialProvenance);
  const [description, setDescription] = useState(initialDescription);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSave() {
    if (!provenance) return;
    startTransition(async () => {
      await declareProvenance(trackId, provenance, description);
      setSaved(true);
    });
  }

  return (
    <div>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "var(--space-sm)" }}>
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              setProvenance(option.value);
              setSaved(false);
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
        {saved && <span style={{ color: "var(--color-blue-bright)", fontSize: "0.875rem" }}>Saved</span>}
      </div>
      <p style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem", marginTop: "0.5rem" }}>
        Recorded per track. A public display for listeners is coming soon.
      </p>
    </div>
  );
}

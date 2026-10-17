"use client";

import { useState, useTransition } from "react";
import { saveReleaseDetails } from "@/app/actions/releases";
import type { ReleaseDetails } from "@/lib/details";

// Les détails facultatifs d'une release : date de sortie, label, mention de copyright, description. Un champ vide
// est effacé. Rien de ceci n'est exigé pour soumettre.
export function ReleaseDetailsForm({ releaseId, initial }: { releaseId: string; initial: ReleaseDetails }) {
  const [releaseDate, setReleaseDate] = useState(initial.release_date ?? "");
  const [label, setLabel] = useState(initial.label ?? "");
  const [copyright, setCopyright] = useState(initial.copyright_line ?? "");
  const [description, setDescription] = useState(initial.description ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function touch(setter: (value: string) => void) {
    return (event: { target: { value: string } }) => {
      setter(event.target.value);
      setSaved(false);
      setError(null);
    };
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await saveReleaseDetails(releaseId, {
        release_date: releaseDate,
        label,
        copyright_line: copyright,
        description,
      });
      if (result.ok) setSaved(true);
      else setError(result.error);
    });
  }

  return (
    <section className="dash-card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
      <h2 className="section-title">Details</h2>
      <p className="muted" style={{ fontSize: "0.8125rem" }}>
        All optional. They are not needed to submit the release for review.
      </p>
      <label style={fieldStyle}>
        <span style={labelStyle}>Release date</span>
        <input type="date" value={releaseDate} onChange={touch(setReleaseDate)} className="input-field" style={{ maxWidth: 220 }} />
      </label>
      <label style={fieldStyle}>
        <span style={labelStyle}>Label</span>
        <input type="text" value={label} maxLength={80} onChange={touch(setLabel)} className="input-field" />
      </label>
      <label style={fieldStyle}>
        <span style={labelStyle}>Copyright line</span>
        <input
          type="text"
          value={copyright}
          maxLength={120}
          placeholder="e.g. ℗ 2026 Your name"
          onChange={touch(setCopyright)}
          className="input-field"
        />
      </label>
      <label style={fieldStyle}>
        <span style={labelStyle}>Description</span>
        <textarea
          value={description}
          maxLength={1000}
          rows={4}
          onChange={touch(setDescription)}
          className="input-field"
          style={{ resize: "vertical" }}
        />
        <span className="muted" style={{ fontSize: "0.75rem", textAlign: "right" }}>
          {description.length} / 1000
        </span>
      </label>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", flexWrap: "wrap" }}>
        <button type="button" className="btn btn-secondary" disabled={pending} onClick={save}>
          {pending ? "Saving…" : "Save details"}
        </button>
        {saved && <span style={{ color: "var(--vynl-succes)", fontSize: "0.875rem" }}>Saved</span>}
        {error && (
          <span role="alert" style={{ color: "var(--vynl-erreur)", fontSize: "0.875rem" }}>
            {error}
          </span>
        )}
      </div>
    </section>
  );
}

const fieldStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "0.35rem" };
const labelStyle: React.CSSProperties = { fontSize: "0.8125rem", color: "var(--vynl-texte-2)" };

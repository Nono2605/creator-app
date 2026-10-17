"use client";

import { useState } from "react";
import { MAX_TAGS, addTag } from "@/lib/releaseMeta";

// Des styles libres et facultatifs (« dark », « late night »…), cinq au plus : Entrée ou virgule pour ajouter.
// L'API les normalise de la même façon (minuscules, 2 à 24 caractères).
export function TagsInput({
  tags,
  onChange,
  label = "Style tags",
}: {
  tags: string[];
  onChange: (next: string[]) => void;
  label?: string;
}) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  function commit() {
    if (!draft.trim()) return;
    const result = addTag(tags, draft);
    setError(result.error);
    if (!result.error) {
      onChange(result.tags);
      setDraft("");
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
      <span style={{ fontSize: "0.8125rem", color: "var(--vynl-texte-2)" }}>
        {label} <span style={{ color: "var(--vynl-texte-3)" }}>(optional, up to {MAX_TAGS})</span>
      </span>
      {tags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
          {tags.map((tag) => (
            <span key={tag} className="pill active" style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
              {tag}
              <button
                type="button"
                className="btn-plain"
                aria-label={`Remove ${tag}`}
                onClick={() => onChange(tags.filter((item) => item !== tag))}
                style={{ padding: 0, lineHeight: 1 }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      {tags.length < MAX_TAGS && (
        <input
          type="text"
          value={draft}
          maxLength={30}
          placeholder="e.g. dark, late night"
          aria-label={label}
          className="input-field"
          onChange={(e) => {
            setDraft(e.target.value.replace(",", ""));
            setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              commit();
            }
          }}
          onBlur={commit}
        />
      )}
      {error && (
        <span role="alert" style={{ color: "var(--vynl-erreur)", fontSize: "0.8125rem" }}>
          {error}
        </span>
      )}
    </div>
  );
}

"use client";

import type { Genre } from "@/lib/genres";
import { MAX_GENRES, toggleGenre } from "@/lib/releaseMeta";

// Jusqu'à trois genres de la liste fermée ; le premier choisi est le genre principal (c'est lui qui compte pour
// les statistiques par genre et pour « un genre pour soumettre »).
export function GenrePicker({
  genres,
  selected,
  onChange,
  label = "Genres",
}: {
  genres: Genre[];
  selected: string[];
  onChange: (next: string[]) => void;
  label?: string;
}) {
  return (
    <fieldset style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
      <legend style={{ fontSize: "0.8125rem", color: "var(--vynl-texte-2)", marginBottom: "0.4rem", padding: 0 }}>
        {label} <span style={{ color: "var(--vynl-texte-3)" }}>(up to {MAX_GENRES}; the first one you pick is the main genre)</span>
      </legend>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
        {genres.map((genre) => {
          const index = selected.indexOf(genre.code);
          const on = index >= 0;
          return (
            <button
              key={genre.code}
              type="button"
              aria-pressed={on}
              disabled={!on && selected.length >= MAX_GENRES}
              className={`pill${on ? " active" : ""}`}
              onClick={() => onChange(toggleGenre(selected, genre.code))}
            >
              {genre.label}
              {on && index === 0 && selected.length > 1 && <span style={{ opacity: 0.7 }}> · main</span>}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

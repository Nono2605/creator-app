"use client";

import { useState, useTransition } from "react";
import { saveTrackDetails } from "@/app/actions/tracks";
import { CreditsEditor } from "@/components/CreditsEditor";
import { GenrePicker } from "@/components/GenrePicker";
import { TagsInput } from "@/components/TagsInput";
import type { TrackDetails } from "@/lib/details";
import type { Genre } from "@/lib/genres";
import { CREDIT_ROLES, type CreditDraft, type CreditRole } from "@/lib/releaseMeta";

const KNOWN_ROLES = new Set<string>(CREDIT_ROLES.map((role) => role.value));

// Genres (jusqu'à trois, le premier est le principal), styles libres et artistes invités d'un morceau.
// Remplace le choix d'un seul genre quand la base sait les enregistrer (migration des détails appliquée).
export function TrackDetailsForm({
  trackId,
  genres,
  initial,
}: {
  trackId: string;
  genres: Genre[];
  initial: TrackDetails;
}) {
  const [selectedGenres, setSelectedGenres] = useState(initial.genres);
  const [tags, setTags] = useState(initial.tags);
  const [credits, setCredits] = useState<CreditDraft[]>(
    initial.credits.map((credit) => ({
      role: (KNOWN_ROLES.has(credit.role) ? credit.role : "featured") as CreditRole,
      artistId: credit.artist_id,
      name: credit.name,
    }))
  );
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function touch<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setSaved(false);
      setError(null);
    };
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await saveTrackDetails(trackId, {
        genres: selectedGenres,
        tags,
        credits: credits.map((credit) => ({ role: credit.role, artist_id: credit.artistId, name: credit.name })),
      });
      if (result.ok) setSaved(true);
      else setError(result.error);
    });
  }

  return (
    <section className="dash-card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
      <h2 className="section-title">Genres, style and credits</h2>
      {genres.length > 0 && (
        <>
          <GenrePicker genres={genres} selected={selectedGenres} onChange={touch(setSelectedGenres)} />
          {selectedGenres.length === 0 && (
            <p className="muted" style={{ fontSize: "0.8125rem" }}>
              A genre is required before you can submit this track for review.
            </p>
          )}
        </>
      )}
      <TagsInput tags={tags} onChange={touch(setTags)} />
      <CreditsEditor credits={credits} onChange={touch(setCredits)} />
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", flexWrap: "wrap" }}>
        <button type="button" className="btn btn-secondary" disabled={pending} onClick={save}>
          {pending ? "Saving…" : "Save"}
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

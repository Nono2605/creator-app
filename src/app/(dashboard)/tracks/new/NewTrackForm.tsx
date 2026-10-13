"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createTrackAction } from "@/app/actions/tracks";
import type { Genre } from "@/lib/genres";
import { uploadAudio } from "@/lib/uploadAudio";

export function NewTrackForm({ genres }: { genres: Genre[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [explicit, setExplicit] = useState(false);
  const [genre, setGenre] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Le brouillon créé avant un envoi raté : on le garde pour réessayer SUR LUI, au lieu
  // d'en créer un deuxième à chaque tentative.
  const [draftId, setDraftId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);

    try {
      let trackId = draftId;
      if (!trackId) {
        const formData = new FormData();
        formData.set("title", title);
        if (explicit) formData.set("explicit", "on");
        if (genre) formData.set("genre", genre);

        const result = await createTrackAction(undefined, formData);
        if (result.error || !result.trackId) {
          setError(result.error ?? "Could not create track.");
          return;
        }
        trackId = result.trackId;
        setDraftId(trackId);
      }

      if (file) {
        const uploaded = await uploadAudio(trackId, file, (phase) =>
          setStatus(phase === "uploading" ? "Uploading audio…" : "Checking the file…")
        );
        if (!uploaded.ok) {
          // Le brouillon existe déjà : on le dit, et la page du morceau permet d'ajouter l'audio.
          setError(uploaded.error);
          return;
        }
      }

      router.push(`/tracks/${trackId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPending(false);
      setStatus(null);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
      <input
        type="text"
        placeholder="Track title"
        required
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="input-field"
      />
      {genres.length > 0 && (
        <select value={genre} onChange={(e) => setGenre(e.target.value)} className="input-field" aria-label="Genre">
          <option value="">Genre (required to submit for review)</option>
          {genres.map((g) => (
            <option key={g.code} value={g.code}>
              {g.label}
            </option>
          ))}
        </select>
      )}
      <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--vynl-texte-2)" }}>
        <input type="checkbox" checked={explicit} onChange={(e) => setExplicit(e.target.checked)} />
        Explicit content
      </label>
      <input
        type="file"
        accept="audio/*"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        style={{ color: "var(--vynl-texte-2)" }}
      />
      {error && <p style={{ color: "var(--vynl-erreur)" }}>{error}</p>}
      {draftId && error && (
        <p style={{ color: "var(--vynl-texte-2)", fontSize: "0.875rem" }}>
          Your draft was saved without audio. Choose the file again and retry, or{" "}
          <Link href={`/tracks/${draftId}`} className="text-link">
            open the draft
          </Link>{" "}
          and add the audio there.
        </p>
      )}
      <button type="submit" disabled={pending} className="btn btn-primary" style={{ alignSelf: "flex-start" }}>
        {pending ? status ?? "Saving…" : draftId ? "Retry upload" : "Create track"}
      </button>
    </form>
  );
}

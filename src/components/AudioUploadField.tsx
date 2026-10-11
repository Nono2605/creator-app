"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadAudio } from "@/lib/uploadAudio";

// Ajoute le fichier audio d'un brouillon qui n'en a pas encore (par exemple parce
// que l'envoi a échoué ou a été sauté à la création). Le fichier part dès qu'il est
// choisi ; la page se rafraîchit ensuite et affiche le fichier mesuré.
export function AudioUploadField({ trackId }: { trackId: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<"idle" | "uploading" | "checking">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const result = await uploadAudio(trackId, file, setPhase);
    setPhase("idle");
    // Permet de re-choisir le même fichier après un échec.
    if (inputRef.current) inputRef.current.value = "";

    if (result.ok) router.refresh();
    else setError(result.error);
  }

  const busy = phase !== "idle";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <input
        ref={inputRef}
        type="file"
        accept="audio/*,.mp3,.flac,.wav,.ogg,.opus,.m4a"
        onChange={handleChange}
        disabled={busy}
        aria-label="Audio file"
      />
      <p style={{ color: "var(--vynl-texte-2)", fontSize: "0.8125rem" }} aria-live="polite">
        {phase === "uploading"
          ? "Uploading your audio… keep this page open."
          : phase === "checking"
            ? "Checking the file…"
            : "MP3, FLAC, WAV, Ogg or M4A. The format and duration are read from the file itself."}
      </p>
      {error && (
        <p role="alert" style={{ color: "var(--vynl-erreur)" }}>
          {error}
        </p>
      )}
    </div>
  );
}

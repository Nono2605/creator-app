"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { VinylCover } from "@/components/VinylCover";
import { prepareCover } from "@/lib/prepareCover";
import { friendlyCoverError } from "@/lib/uploadErrors";
import { getCoverUploadUrl, saveReleaseCover } from "@/app/actions/releases";
import { COVER_MIN_SIDE } from "@/lib/coverCrop";

type Phase = "idle" | "preparing" | "uploading" | "saving";

const PHASE_LABEL: Record<Phase, string> = {
  idle: "",
  preparing: "Preparing the image…",
  uploading: "Uploading…",
  saving: "Saving…",
};

// Pochette d'une release : choisir une image, la voir en disque picture (comme dans l'app
// d'écoute) et en carré, la remplacer ou la retirer. L'image est recadrée en carré et réduite
// dans le navigateur, puis envoyée directement au stockage (elle ne transite pas par nos serveurs).
export function CoverField({ releaseId, coverUrl }: { releaseId: string; coverUrl: string | null }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  // Aperçu immédiat de l'image envoyée, le temps que la page serveur se recharge avec la vraie
  // URL : ensuite (refreshing = false) il est ignoré, et la pochette du serveur reprend la main.
  const [preview, setPreview] = useState<string | null>(null);
  const [refreshing, startRefresh] = useTransition();

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const busy = phase !== "idle" || refreshing;
  const shown = refreshing && preview ? preview : coverUrl;

  async function handleFile(file: File) {
    setError(null);
    setPhase("preparing");
    const prepared = await prepareCover(file);
    if (!prepared.ok) {
      setError(prepared.error);
      setPhase("idle");
      return;
    }

    try {
      setPhase("uploading");
      const target = await getCoverUploadUrl(releaseId, prepared.blob.type);
      if (!target.ok) throw new Error(target.error);
      const { error: uploadError } = await createClient()
        .storage.from("release-covers")
        .uploadToSignedUrl(target.path, target.token, prepared.blob, { contentType: prepared.blob.type });
      if (uploadError) throw uploadError;

      setPhase("saving");
      const saved = await saveReleaseCover(releaseId, target.publicUrl);
      if (!saved.ok) throw new Error(saved.error);

      setPreview(URL.createObjectURL(prepared.blob));
      startRefresh(() => router.refresh());
    } catch (err) {
      setError(friendlyCoverError(err));
    } finally {
      setPhase("idle");
    }
  }

  async function handleRemove() {
    setError(null);
    setPhase("saving");
    const saved = await saveReleaseCover(releaseId, null);
    if (!saved.ok) setError(saved.error);
    else startRefresh(() => router.refresh());
    setPhase("idle");
  }

  return (
    <div className="cover-field">
      <div className="cover-field__previews">
        <figure className="cover-field__figure" style={{ width: 200 }}>
          <VinylCover src={shown} label={shown ? "Cover as shown in the Vynl app" : "No cover yet"} />
          <figcaption>In the app</figcaption>
        </figure>
        {shown && (
          <figure className="cover-field__figure" style={{ width: 96 }}>
            {/* Image distante du stockage : <img> simple, sans l'optimiseur de next/image. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="cover-field__square" src={shown} alt="Your cover, full image" />
            <figcaption>Full image</figcaption>
          </figure>
        )}
      </div>

      <div className="cover-field__body">
        <p style={{ color: "var(--vynl-texte-2)" }}>
          {shown
            ? "This image is printed on the vinyl in the Vynl app."
            : "Add the artwork listeners see for this release. It's printed on a vinyl in the Vynl app."}
        </p>
        <ul className="cover-field__tips">
          <li>JPEG, PNG or WebP, at least {COVER_MIN_SIDE} × {COVER_MIN_SIDE} px (1400 × 1400 is ideal).</li>
          <li>We keep the center square. Square artwork is the safest.</li>
          <li>The vinyl shows a circle, so keep the key part of your artwork away from the corners.</li>
        </ul>

        <div style={{ display: "flex", gap: "var(--space-sm)", flexWrap: "wrap", alignItems: "center" }}>
          <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => inputRef.current?.click()}>
            {shown ? "Replace cover" : "Choose image"}
          </button>
          {coverUrl && (
            <button type="button" className="btn-plain" disabled={busy} onClick={handleRemove} style={{ color: "var(--vynl-texte-2)" }}>
              Remove
            </button>
          )}
          {busy && (
            <span role="status" style={{ color: "var(--vynl-texte-2)", fontSize: "0.875rem" }}>
              {PHASE_LABEL[phase]}
            </span>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = ""; // permet de rechoisir le même fichier après une erreur
            if (file) void handleFile(file);
          }}
        />
        {error && (
          <p role="alert" style={{ color: "var(--vynl-erreur)", fontSize: "0.875rem" }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

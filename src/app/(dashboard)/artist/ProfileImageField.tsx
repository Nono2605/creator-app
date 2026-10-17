"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { prepareImage } from "@/lib/prepareImage";
import { IMAGE_SPECS } from "@/lib/imageCrop";
import { friendlyImageError } from "@/lib/uploadErrors";
import { getArtistImageUploadUrl, saveArtistImage } from "@/app/actions/artist";

type Phase = "idle" | "preparing" | "uploading" | "saving";

const PHASE_LABEL: Record<Phase, string> = {
  idle: "",
  preparing: "Preparing the image…",
  uploading: "Uploading…",
  saving: "Saving…",
};

const COPY = {
  avatar: {
    label: "Photo",
    help: `Square image, at least ${IMAGE_SPECS.avatar.minWidth} × ${IMAGE_SPECS.avatar.minWidth} px. It's shown as a circle in Discover and search.`,
    noun: "photo",
  },
  banner: {
    label: "Banner",
    help: `Wide image, at least ${IMAGE_SPECS.banner.minWidth} × ${IMAGE_SPECS.banner.minWidth / IMAGE_SPECS.banner.aspect} px. We keep the middle band, so keep the key part of your artwork centered.`,
    noun: "banner",
  },
} as const;

// Photo ou bannière de l'artiste : choisir une image, la recadrer automatiquement au bon format
// (dans le navigateur), l'envoyer directement au stockage, puis l'enregistrer sur le profil.
// `url` est la valeur courante, tenue par le formulaire (qui en fait l'aperçu) ; `onChange` la
// met à jour dès que l'image est enregistrée.
export function ProfileImageField({
  kind,
  url,
  onChange,
}: {
  kind: "avatar" | "banner";
  url: string | null;
  onChange: (url: string | null) => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const copy = COPY[kind];
  const busy = phase !== "idle";
  const spec = IMAGE_SPECS[kind];

  async function handleFile(file: File) {
    setError(null);
    setPhase("preparing");
    const prepared = await prepareImage(file, spec);
    if (!prepared.ok) {
      setError(prepared.error);
      setPhase("idle");
      return;
    }

    try {
      setPhase("uploading");
      const target = await getArtistImageUploadUrl(kind, prepared.blob.type);
      if (!target.ok) throw new Error(target.error);
      const { error: uploadError } = await createClient()
        .storage.from("artist-images")
        .uploadToSignedUrl(target.path, target.token, prepared.blob, { contentType: prepared.blob.type });
      if (uploadError) throw uploadError;

      setPhase("saving");
      const saved = await saveArtistImage(kind, target.publicUrl);
      if (!saved.ok) throw new Error(saved.error);

      onChange(target.publicUrl);
      router.refresh(); // l'en-tête du Studio porte la photo
    } catch (err) {
      setError(friendlyImageError(err));
    } finally {
      setPhase("idle");
    }
  }

  async function handleRemove() {
    setError(null);
    setPhase("saving");
    const saved = await saveArtistImage(kind, null);
    if (!saved.ok) setError(saved.error);
    else {
      onChange(null);
      router.refresh();
    }
    setPhase("idle");
  }

  return (
    <div className="profile-image">
      <div className="profile-image__head">
        <span className="profile-image__label">{copy.label}</span>
        <div className="profile-image__actions">
          <button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={() => inputRef.current?.click()}>
            {url ? `Replace ${copy.noun}` : `Choose ${copy.noun}`}
          </button>
          {url && (
            <button type="button" className="btn-plain" disabled={busy} onClick={handleRemove} style={{ color: "var(--vynl-texte-2)" }}>
              Remove
            </button>
          )}
        </div>
      </div>
      <p className="profile-image__help">{copy.help}</p>
      {busy && (
        <p role="status" className="profile-image__help">
          {PHASE_LABEL[phase]}
        </p>
      )}
      {error && (
        <p role="alert" className="profile-image__error">
          {error}
        </p>
      )}
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
    </div>
  );
}

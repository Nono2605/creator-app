"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getArtistImageUploadUrl, saveArtistImage } from "@/app/actions/artist";

export function ImageUploadField({
  kind,
  label,
  currentUrl,
  aspectRatio,
  round,
}: {
  kind: "avatar" | "banner";
  label: string;
  currentUrl: string | null;
  aspectRatio: string;
  round?: boolean;
}) {
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPending(true);
    setError(null);

    try {
      const { path, token, publicUrl } = await getArtistImageUploadUrl(kind, file.name);
      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from("artist-images")
        .uploadToSignedUrl(path, token, file);
      if (uploadError) throw uploadError;

      await saveArtistImage(kind, publicUrl);
      setPreview(publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <span style={labelStyle}>{label}</span>
      <div
        style={{
          width: round ? 96 : "100%",
          maxWidth: round ? 96 : 480,
          aspectRatio,
          borderRadius: round ? "50%" : "var(--radius-md)",
          background: preview ? `url(${preview}) center/cover` : "var(--gradient-signature)",
          marginBottom: "0.5rem",
        }}
      />
      <input type="file" accept="image/*" onChange={handleChange} disabled={pending} />
      {pending && <p style={hintStyle}>Uploading…</p>}
      {error && <p style={{ ...hintStyle, color: "#ff6b6b" }}>{error}</p>}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: "0.8125rem",
  color: "var(--color-text-muted)",
  display: "block",
  marginBottom: "0.5rem",
};

const hintStyle: React.CSSProperties = {
  fontSize: "0.8125rem",
  color: "var(--color-text-muted)",
  marginTop: "0.35rem",
};

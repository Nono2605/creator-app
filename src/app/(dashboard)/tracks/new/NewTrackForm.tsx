"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createTrackAction, getUploadUrl, attachFile } from "@/app/actions/tracks";

export function NewTrackForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [explicit, setExplicit] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);

    try {
      const formData = new FormData();
      formData.set("title", title);
      if (explicit) formData.set("explicit", "on");

      const result = await createTrackAction(undefined, formData);
      if (result.error || !result.trackId) {
        setError(result.error ?? "Could not create track.");
        return;
      }
      const trackId = result.trackId;

      if (file) {
        setStatus("Uploading audio…");
        const { path, token } = await getUploadUrl(trackId, file.name);

        const supabase = createClient();
        const { error: uploadError } = await supabase.storage
          .from("track-audio")
          .uploadToSignedUrl(path, token, file);
        if (uploadError) throw uploadError;

        const format = file.name.includes(".") ? file.name.split(".").pop()! : "unknown";
        await attachFile(trackId, path, format, file.size);
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
        style={inputStyle}
      />
      <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-text-muted)" }}>
        <input type="checkbox" checked={explicit} onChange={(e) => setExplicit(e.target.checked)} />
        Explicit content
      </label>
      <input
        type="file"
        accept="audio/*"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        style={{ color: "var(--color-text-muted)" }}
      />
      {error && <p style={{ color: "#ff6b6b" }}>{error}</p>}
      <button type="submit" disabled={pending} style={buttonStyle}>
        {pending ? status ?? "Saving…" : "Create track"}
      </button>
    </form>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "0.75rem 1rem",
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--color-border)",
  background: "var(--color-card)",
  color: "var(--color-text)",
};

const buttonStyle: React.CSSProperties = {
  padding: "0.75rem 1rem",
  borderRadius: "var(--radius-sm)",
  border: "none",
  background: "var(--gradient-signature)",
  color: "#fff",
  fontWeight: 600,
  cursor: "pointer",
};

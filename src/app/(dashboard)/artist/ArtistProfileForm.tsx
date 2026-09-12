"use client";

import { useActionState } from "react";
import { updateArtistProfile } from "@/app/actions/artist";
import { ImageUploadField } from "./ImageUploadField";
import type { Artist } from "@/lib/session";

export function ArtistProfileForm({ artist }: { artist: Artist }) {
  const [state, action, pending] = useActionState(updateArtistProfile, undefined);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>
      <ImageUploadField kind="banner" label="Banner" currentUrl={artist.banner_url} aspectRatio="3 / 1" />
      <ImageUploadField kind="avatar" label="Avatar" currentUrl={artist.avatar_url} aspectRatio="1 / 1" round />

      <form action={action} style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)", maxWidth: 420 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>Bio</span>
          <textarea
            name="bio"
            defaultValue={artist.bio ?? ""}
            rows={4}
            className="input-field"
            style={{ resize: "vertical" }}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>Country</span>
          <input type="text" name="country" defaultValue={artist.country ?? ""} className="input-field" />
        </label>
        {state?.error && <p style={{ color: "#ff6b6b" }}>{state.error}</p>}
        {state?.message && <p style={{ color: "var(--color-blue-bright)" }}>{state.message}</p>}
        <button type="submit" disabled={pending} className="btn btn-primary" style={{ alignSelf: "flex-start" }}>
          {pending ? "Saving…" : "Save"}
        </button>
      </form>
    </div>
  );
}

"use client";

import { useActionState, useState } from "react";
import { updateArtistProfile } from "@/app/actions/artist";
import { ProfileImageField } from "./ProfileImageField";
import { ArtistPreview } from "@/components/ArtistPreview";
import { BIO_MAX, COUNTRY_MAX } from "@/lib/artistProfile";
import type { Artist } from "@/lib/session";

export function ArtistProfileForm({ artist }: { artist: Artist }) {
  const [state, action, pending] = useActionState(updateArtistProfile, undefined);
  // Les images s'enregistrent dès l'envoi ; le texte, avec le bouton « Save ». L'aperçu suit les deux.
  const [avatarUrl, setAvatarUrl] = useState(artist.avatar_url);
  const [bannerUrl, setBannerUrl] = useState(artist.banner_url);
  const [bio, setBio] = useState(artist.bio ?? "");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>
      <section className="dash-card">
        <h2 className="section-title">How listeners see you</h2>
        <ArtistPreview name={artist.name} bio={bio} avatarUrl={avatarUrl} bannerUrl={bannerUrl} />
      </section>

      <section className="dash-card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
        <h2 className="section-title">Images</h2>
        <ProfileImageField kind="avatar" url={avatarUrl} onChange={setAvatarUrl} />
        <ProfileImageField kind="banner" url={bannerUrl} onChange={setBannerUrl} />
        <p className="profile-image__help">Images are saved as soon as they&apos;re uploaded.</p>
      </section>

      <form action={action} className="dash-card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
        <h2 className="section-title">About</h2>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <span style={{ fontSize: "0.8125rem", color: "var(--vynl-texte-2)" }}>Bio</span>
          <textarea
            name="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={BIO_MAX}
            rows={5}
            className="input-field"
            style={{ resize: "vertical" }}
          />
          <span className="profile-image__help" style={{ textAlign: "right" }}>
            {bio.length} / {BIO_MAX}
          </span>
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem", maxWidth: 320 }}>
          <span style={{ fontSize: "0.8125rem", color: "var(--vynl-texte-2)" }}>Country</span>
          <input
            type="text"
            name="country"
            defaultValue={artist.country ?? ""}
            maxLength={COUNTRY_MAX}
            className="input-field"
          />
        </label>
        {state?.error && (
          <p role="alert" style={{ color: "var(--vynl-erreur)" }}>
            {state.error}
          </p>
        )}
        {state?.message && (
          <p role="status" style={{ color: "var(--vynl-succes)" }}>
            {state.message}
          </p>
        )}
        <button type="submit" disabled={pending} className="btn btn-primary" style={{ alignSelf: "flex-start" }}>
          {pending ? "Saving…" : "Save"}
        </button>
      </form>
    </div>
  );
}

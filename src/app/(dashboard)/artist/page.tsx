import { requireArtist } from "@/lib/session";
import { ArtistProfileForm } from "./ArtistProfileForm";

export default async function ArtistProfilePage() {
  const { artist } = await requireArtist();

  return (
    <div style={{ maxWidth: 640 }}>
      <h1 style={{ fontSize: "1.75rem" }}>{artist.name}</h1>
      <p style={{ color: "var(--color-text-muted)", marginBottom: "var(--space-lg)" }}>
        This is the public identity shown on your artist page.
      </p>
      <ArtistProfileForm artist={artist} />
    </div>
  );
}

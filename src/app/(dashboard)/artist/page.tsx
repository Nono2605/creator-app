import { requireArtist } from "@/lib/session";
import { ArtistProfileForm } from "./ArtistProfileForm";
import { CatalogCode } from "@/components/CatalogCode";

export default async function ArtistProfilePage() {
  const { artist } = await requireArtist();

  return (
    <div style={{ maxWidth: 640 }}>
      <h1 style={{ fontSize: "1.75rem" }}>{artist.name}</h1>
      <p style={{ marginTop: "0.25rem" }}>
        <CatalogCode code={artist.catalog_code} label="Artist number" />
      </p>
      <p style={{ color: "var(--vynl-texte-2)", marginBottom: "var(--space-lg)", marginTop: "var(--space-xs)" }}>
        This is the public identity shown on your artist page. Your artist number is permanent: it stays attached to
        your catalog and statements.
      </p>
      <ArtistProfileForm artist={artist} />
    </div>
  );
}

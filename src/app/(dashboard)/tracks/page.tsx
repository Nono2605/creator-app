import Link from "next/link";
import { requireArtist } from "@/lib/session";
import { api } from "@/lib/api";
import { TracksList, type Track } from "./TracksList";

export default async function TracksPage() {
  const { session, artist } = await requireArtist();
  const { data: tracks } = await api.get<{ data: Track[] }>("/creator/tracks", {
    accessToken: session.access_token,
  });

  return (
    <div style={{ maxWidth: "var(--content-max-width)", display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
      <div style={headerRowStyle}>
        <div>
          <h1 style={{ fontSize: "1.75rem" }}>Music</h1>
          <p style={{ color: "var(--color-text-muted)" }}>{artist.name}</p>
        </div>
        <Link href="/tracks/new" className="btn btn-primary">
          New track
        </Link>
      </div>

      <TracksList tracks={tracks} />
    </div>
  );
}

const headerRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "var(--space-sm)",
};

import Link from "next/link";
import { requireArtist } from "@/lib/session";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";

interface Track {
  id: string;
  title: string;
  status: string;
  duration_seconds: number | null;
  created_at: string;
}

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

      <div className="dash-card">
        {tracks.length === 0 ? (
          <p style={{ color: "var(--color-text-muted)" }}>No tracks yet. Upload your first one.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {tracks.map((track) => (
              <Link key={track.id} href={`/tracks/${track.id}`} className="list-row" style={rowStyle}>
                <span>{track.title}</span>
                <StatusBadge status={track.status} />
              </Link>
            ))}
          </div>
        )}
      </div>
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

const rowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "0.65rem var(--space-sm)",
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--color-border)",
};

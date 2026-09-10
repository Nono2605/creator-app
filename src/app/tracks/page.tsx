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
    <div style={{ maxWidth: "var(--content-max-width)", margin: "0 auto", padding: "var(--space-lg)" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "var(--space-md)",
          flexWrap: "wrap",
          gap: "var(--space-sm)",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.75rem" }}>Tracks</h1>
          <p style={{ color: "var(--color-text-muted)" }}>{artist.name}</p>
        </div>
        <Link href="/tracks/new" style={buttonStyle}>
          New track
        </Link>
      </div>

      {tracks.length === 0 ? (
        <p style={{ color: "var(--color-text-muted)" }}>No tracks yet. Upload your first one.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
          {tracks.map((track) => (
            <Link key={track.id} href={`/tracks/${track.id}`} style={rowStyle}>
              <span>{track.title}</span>
              <StatusBadge status={track.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

const buttonStyle: React.CSSProperties = {
  padding: "0.6rem 1rem",
  borderRadius: "var(--radius-sm)",
  border: "none",
  background: "var(--gradient-signature)",
  color: "#fff",
  fontWeight: 600,
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "var(--space-sm) var(--space-md)",
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--color-border)",
  background: "var(--color-card)",
};

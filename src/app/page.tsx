import Link from "next/link";
import { requireArtist } from "@/lib/session";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";

interface Track {
  id: string;
  title: string;
  status: string;
  created_at: string;
}

const STATUS_ORDER = ["draft", "in_review", "published", "archived"] as const;

export default async function DashboardPage() {
  const { session, artist } = await requireArtist();
  const { data: tracks } = await api.get<{ data: Track[] }>("/creator/tracks", {
    accessToken: session.access_token,
  });

  const counts = STATUS_ORDER.reduce<Record<string, number>>((acc, status) => {
    acc[status] = tracks.filter((t) => t.status === status).length;
    return acc;
  }, {});

  const recentTracks = tracks.slice(0, 5);

  return (
    <div style={{ maxWidth: "var(--content-max-width)", margin: "0 auto", padding: "var(--space-lg)" }}>
      <div style={{ marginBottom: "var(--space-lg)" }}>
        <h1 style={{ fontSize: "1.75rem" }}>Welcome back, {artist.name}</h1>
        <p style={{ color: "var(--color-text-muted)" }}>Here&apos;s where things stand.</p>
      </div>

      <div style={statsGridStyle}>
        {STATUS_ORDER.map((status) => (
          <div key={status} style={statCardStyle}>
            <span style={{ fontSize: "2rem", fontWeight: 700 }}>{counts[status]}</span>
            <StatusBadge status={status} />
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "var(--space-sm)", margin: "var(--space-lg) 0" }}>
        <Link href="/tracks/new" style={buttonStyle}>
          New track
        </Link>
        <Link href="/tracks" style={secondaryButtonStyle}>
          View all tracks
        </Link>
      </div>

      <section>
        <h2 style={{ fontSize: "1.125rem", marginBottom: "var(--space-sm)" }}>Recent tracks</h2>
        {recentTracks.length === 0 ? (
          <p style={{ color: "var(--color-text-muted)" }}>No tracks yet. Upload your first one.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
            {recentTracks.map((track) => (
              <Link key={track.id} href={`/tracks/${track.id}`} style={rowStyle}>
                <span>{track.title}</span>
                <StatusBadge status={track.status} />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

const statsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
  gap: "var(--space-sm)",
};

const statCardStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.35rem",
  padding: "var(--space-md)",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--color-border)",
  background: "var(--color-card)",
};

const buttonStyle: React.CSSProperties = {
  padding: "0.6rem 1rem",
  borderRadius: "var(--radius-sm)",
  border: "none",
  background: "var(--gradient-signature)",
  color: "#fff",
  fontWeight: 600,
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: "0.6rem 1rem",
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--color-border)",
  color: "var(--color-text)",
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

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

interface Album {
  id: string;
  status: string;
}

export default async function OverviewPage() {
  const { session, artist } = await requireArtist();
  const [{ data: tracks }, { data: albums }] = await Promise.all([
    api.get<{ data: Track[] }>("/creator/tracks", { accessToken: session.access_token }),
    api.get<{ data: Album[] }>("/creator/albums", { accessToken: session.access_token }),
  ]);

  const publishedCount = tracks.filter((t) => t.status === "published").length;
  const recentTracks = tracks.slice(0, 5);

  return (
    <div style={{ maxWidth: "var(--content-max-width)", display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>
      <div>
        <h1 style={{ fontSize: "1.75rem" }}>Welcome back, {artist.name}</h1>
        <p style={{ color: "var(--color-text-muted)" }}>Here&apos;s where things stand.</p>
      </div>

      <div style={statsGridStyle}>
        <div className="dash-card stat-card">
          <span className="stat-label">Total tracks</span>
          <span className="stat-value">{tracks.length}</span>
        </div>
        <div className="dash-card stat-card">
          <span className="stat-label">Published</span>
          <span className="stat-value">{publishedCount}</span>
        </div>
        <div className="dash-card stat-card">
          <span className="stat-label">Releases</span>
          <span className="stat-value">{albums.length}</span>
        </div>
      </div>

      <div style={twoColStyle}>
        <section className="dash-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-md)" }}>
            <h2 style={sectionTitleStyle}>Recent tracks</h2>
            <Link href="/tracks" className="text-link" style={{ fontSize: "0.875rem" }}>
              View all
            </Link>
          </div>
          {recentTracks.length === 0 ? (
            <p style={{ color: "var(--color-text-muted)" }}>No tracks yet. Upload your first one.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {recentTracks.map((track) => (
                <Link key={track.id} href={`/tracks/${track.id}`} className="list-row" style={rowStyle}>
                  <span>{track.title}</span>
                  <StatusBadge status={track.status} />
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="dash-card">
          <h2 style={{ ...sectionTitleStyle, marginBottom: "var(--space-md)" }}>Quick actions</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            <Link href="/tracks/new" className="btn btn-primary" style={{ justifyContent: "flex-start" }}>
              + New track
            </Link>
            <Link href="/releases/new" className="btn btn-secondary" style={{ justifyContent: "flex-start" }}>
              + New release
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

const statsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: "var(--space-sm)",
};

const twoColStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr",
  gap: "var(--space-md)",
  alignItems: "start",
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: "1rem",
  textTransform: "uppercase",
  letterSpacing: "0.03em",
  color: "var(--color-text-muted)",
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "0.65rem var(--space-sm)",
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--color-border)",
};

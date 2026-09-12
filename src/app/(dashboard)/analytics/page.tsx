import { requireArtist } from "@/lib/session";
import { api } from "@/lib/api";
import { BreakdownBars } from "@/components/BreakdownBars";
import { formatLongDuration } from "@/lib/formatDuration";

interface Analytics {
  tracks_by_status: Record<string, number>;
  releases_by_type: Record<string, number>;
  provenance_breakdown: Record<string, number>;
  duration: { total_seconds: number; average_seconds: number; track_count: number };
  explicit_count: number;
}

const STATUS_ORDER = ["draft", "in_review", "published", "archived"];
const RELEASE_TYPE_ORDER = ["single", "ep", "album", "compilation"];
const PROVENANCE_ORDER = ["human", "hybrid", "ai", "undeclared"];

function toBreakdown(counts: Record<string, number>, order: string[]) {
  return order
    .filter((key) => counts[key] > 0)
    .map((key) => ({ label: key, count: counts[key] }));
}

export default async function AnalyticsPage() {
  const { session, artist } = await requireArtist();

  let analytics: Analytics;
  try {
    analytics = await api.get<Analytics>("/creator/analytics", { accessToken: session.access_token });
  } catch (err) {
    return (
      <div style={{ maxWidth: "var(--content-max-width)" }}>
        <h1 style={{ fontSize: "1.75rem", marginBottom: "var(--space-md)" }}>Analytics</h1>
        <p style={{ color: "#ff6b6b" }}>
          {err instanceof Error ? err.message : "Could not load analytics."}
        </p>
      </div>
    );
  }

  const statusBreakdown = toBreakdown(analytics.tracks_by_status, STATUS_ORDER);
  const releaseTypeBreakdown = toBreakdown(analytics.releases_by_type, RELEASE_TYPE_ORDER);
  const provenanceBreakdown = toBreakdown(analytics.provenance_breakdown, PROVENANCE_ORDER);

  return (
    <div style={{ maxWidth: "var(--content-max-width)", display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>
      <div>
        <h1 style={{ fontSize: "1.75rem" }}>Analytics</h1>
        <p style={{ color: "var(--color-text-muted)" }}>{artist.name}</p>
      </div>

      <div style={statsGridStyle}>
        <div className="dash-card stat-card">
          <span className="stat-label">Total catalog length</span>
          <span className="stat-value">{formatLongDuration(analytics.duration.total_seconds)}</span>
        </div>
        <div className="dash-card stat-card">
          <span className="stat-label">Average track length</span>
          <span className="stat-value">{formatLongDuration(analytics.duration.average_seconds)}</span>
        </div>
        <div className="dash-card stat-card">
          <span className="stat-label">Explicit tracks</span>
          <span className="stat-value">
            {analytics.explicit_count} / {analytics.duration.track_count}
          </span>
        </div>
      </div>

      <div style={twoColStyle}>
        <section className="dash-card">
          <h2 style={sectionTitleStyle}>Tracks by status</h2>
          {statusBreakdown.length === 0 ? (
            <p style={{ color: "var(--color-text-muted)" }}>No tracks yet.</p>
          ) : (
            <BreakdownBars items={statusBreakdown} />
          )}
        </section>

        <section className="dash-card">
          <h2 style={sectionTitleStyle}>Releases by type</h2>
          {releaseTypeBreakdown.length === 0 ? (
            <p style={{ color: "var(--color-text-muted)" }}>No releases yet.</p>
          ) : (
            <BreakdownBars items={releaseTypeBreakdown} />
          )}
        </section>
      </div>

      <section className="dash-card">
        <h2 style={sectionTitleStyle}>AI declarations</h2>
        {provenanceBreakdown.length === 0 ? (
          <p style={{ color: "var(--color-text-muted)" }}>No tracks yet.</p>
        ) : (
          <BreakdownBars items={provenanceBreakdown} />
        )}
      </section>

      <div className="dash-card coming-soon">
        <span className="badge">Coming soon</span>
        <p style={{ maxWidth: "48ch" }}>
          Plays, listening time, and top tracks will show up here once streaming is instrumented.
        </p>
      </div>
    </div>
  );
}

const statsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "var(--space-sm)",
};

const twoColStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "var(--space-md)",
  alignItems: "start",
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: "1rem",
  textTransform: "uppercase",
  letterSpacing: "0.03em",
  color: "var(--color-text-muted)",
  marginBottom: "var(--space-sm)",
};

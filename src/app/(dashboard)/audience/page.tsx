import { requireArtist } from "@/lib/session";
import { api } from "@/lib/api";

interface AudienceData {
  followers_count: number;
  follows: string[];
}

const WINDOW_DAYS = 30;
const CHART_WIDTH = 600;
const CHART_HEIGHT = 140;

// Reconstruit une série journalière cumulative sur la fenêtre glissante à
// partir des dates de follow brutes — les follows antérieurs à la fenêtre
// forment la base du cumul plutôt que d'être ignorés.
function buildDailySeries(timestamps: string[], days: number): number[] {
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  const start = new Date(now);
  start.setUTCDate(start.getUTCDate() - (days - 1));

  let baseline = 0;
  const dayCounts = new Map<string, number>();
  for (const ts of timestamps) {
    const d = new Date(ts);
    d.setUTCHours(0, 0, 0, 0);
    if (d < start) {
      baseline += 1;
    } else {
      const key = d.toISOString().slice(0, 10);
      dayCounts.set(key, (dayCounts.get(key) ?? 0) + 1);
    }
  }

  const series: number[] = [];
  let running = baseline;
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    const key = d.toISOString().slice(0, 10);
    running += dayCounts.get(key) ?? 0;
    series.push(running);
  }
  return series;
}

function buildAreaPath(values: number[], width: number, height: number) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const stepX = values.length > 1 ? width / (values.length - 1) : 0;

  const points = values.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * height;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });
  const line = `M ${points.join(" L ")}`;
  const area = `${line} L ${width},${height} L 0,${height} Z`;
  return { line, area };
}

export default async function AudiencePage() {
  const { session, artist } = await requireArtist();

  let audience: AudienceData;
  try {
    audience = await api.get<AudienceData>("/creator/audience", { accessToken: session.access_token });
  } catch (err) {
    return (
      <div style={{ maxWidth: "var(--content-max-width)" }}>
        <h1 style={{ fontSize: "1.75rem", marginBottom: "var(--space-md)" }}>Audience</h1>
        <p style={{ color: "#ff6b6b" }}>
          {err instanceof Error ? err.message : "Could not load audience data."}
        </p>
      </div>
    );
  }

  const series = buildDailySeries(audience.follows, WINDOW_DAYS);
  const { line, area } = buildAreaPath(series, CHART_WIDTH, CHART_HEIGHT);
  const newInWindow = series.length > 0 ? series[series.length - 1] - series[0] : 0;

  return (
    <div style={{ maxWidth: "var(--content-max-width)", display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>
      <div>
        <h1 style={{ fontSize: "1.75rem" }}>Audience</h1>
        <p style={{ color: "var(--color-text-muted)" }}>{artist.name}</p>
      </div>

      <div style={statsGridStyle}>
        <div className="dash-card stat-card">
          <span className="stat-label">Followers</span>
          <span className="stat-value">{audience.followers_count}</span>
        </div>
        <div className="dash-card stat-card">
          <span className="stat-label">New in last {WINDOW_DAYS} days</span>
          <span className="stat-value">{newInWindow > 0 ? `+${newInWindow}` : newInWindow}</span>
        </div>
      </div>

      <section className="dash-card">
        <h2 style={sectionTitleStyle}>Follower growth (last {WINDOW_DAYS} days)</h2>
        {audience.followers_count === 0 ? (
          <p style={{ color: "var(--color-text-muted)" }}>
            No followers yet — growth will show up here once you have some.
          </p>
        ) : (
          <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} width="100%" height={CHART_HEIGHT} preserveAspectRatio="none">
            <defs>
              <linearGradient id="audience-growth-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-violet)" stopOpacity="0.4" />
                <stop offset="100%" stopColor="var(--color-violet)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={area} fill="url(#audience-growth-gradient)" />
            <path d={line} fill="none" stroke="var(--color-violet-soft)" strokeWidth="2" />
          </svg>
        )}
      </section>

      <div className="dash-card coming-soon">
        <span className="badge">Coming soon</span>
        <p style={{ maxWidth: "48ch" }}>
          Listening-based stats (unique listeners, listening time, geography) will show up here once streaming is
          instrumented.
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

const sectionTitleStyle: React.CSSProperties = {
  fontSize: "1rem",
  textTransform: "uppercase",
  letterSpacing: "0.03em",
  color: "var(--color-text-muted)",
  marginBottom: "var(--space-sm)",
};

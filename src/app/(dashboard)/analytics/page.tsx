import { requireArtist } from "@/lib/session";
import { api } from "@/lib/api";
import { hasNoListens, loadStats, parseRange } from "@/lib/stats";
import { computeDelta, formatCount, previousRangeLabel, sharePercent } from "@/lib/formatStats";
import { sourceLabel } from "@/lib/statsLabels";
import { BreakdownBars } from "@/components/BreakdownBars";
import { StatTile } from "@/components/StatTile";
import { RangeFilter } from "@/components/RangeFilter";
import { BarList } from "@/components/BarList";
import { NoListens, StatsNotice } from "@/components/StatsNotice";
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

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string | string[] }>;
}) {
  const { session, artist } = await requireArtist();
  const range = parseRange((await searchParams).range);

  // Deux sources indépendantes : la composition du catalogue peut échouer sans
  // empêcher d'afficher les écoutes, et inversement.
  const [stats, catalog] = await Promise.all([
    loadStats(session.access_token, range),
    api
      .get<Analytics>("/creator/analytics", { accessToken: session.access_token })
      .then((data) => ({ data }) as const)
      .catch((err: unknown) => ({
        error: err instanceof Error ? err.message : "Could not load analytics.",
      })),
  ]);

  const comparedTo = previousRangeLabel(range);

  return (
    <div style={{ maxWidth: "var(--content-max-width)", display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>
      <div className="page-head">
        <div>
          <h1 style={{ fontSize: "1.75rem" }}>Analytics</h1>
          <p style={{ color: "var(--vynl-texte-2)" }}>{artist.name}</p>
        </div>
        <RangeFilter basePath="/analytics" current={range} />
      </div>

      {stats.status !== "ok" ? (
        <StatsNotice result={stats} />
      ) : hasNoListens(stats.stats) ? (
        <NoListens />
      ) : (
        <>
          <div className="stat-grid">
            <StatTile
              featured
              label="Listens"
              value={formatCount(stats.stats.totals.plays)}
              delta={computeDelta(stats.stats.totals.plays, stats.stats.previous.plays)}
              comparedTo={comparedTo}
            />
            <StatTile
              label="Plays started"
              value={formatCount(stats.stats.totals.starts)}
              delta={computeDelta(stats.stats.totals.starts, stats.stats.previous.starts)}
              comparedTo={comparedTo}
            />
            <StatTile
              label="Reached 30 seconds"
              value={`${sharePercent(stats.stats.totals.plays, stats.stats.totals.starts)}%`}
              hint="Share of plays that count as a listen"
            />
          </div>

          <div className="split split--even">
            <section className="dash-card">
              <h2 className="section-title">Top tracks</h2>
              {stats.stats.top_tracks && stats.stats.top_tracks.length > 0 ? (
                <BarList
                  total={stats.stats.totals.plays}
                  unit="listens"
                  rows={stats.stats.top_tracks.map((t) => ({
                    key: t.track_id,
                    label: t.title,
                    value: t.plays,
                    href: `/tracks/${t.track_id}`,
                  }))}
                />
              ) : (
                <p style={{ color: "var(--vynl-texte-2)" }}>No listens in this period.</p>
              )}
            </section>

            <section className="dash-card">
              <h2 className="section-title">How listeners find you</h2>
              <BarList
                total={stats.stats.totals.plays}
                unit="listens"
                rows={stats.stats.breakdown.source.map((r) => ({
                  key: r.key,
                  label: sourceLabel(r.key),
                  value: r.plays,
                  muted: r.key === "unknown" || r.key === "other",
                }))}
              />
            </section>
          </div>
        </>
      )}

      <h2 style={{ fontSize: "1.375rem", marginTop: "var(--space-md)" }}>Your catalog</h2>

      {"error" in catalog ? (
        <p style={{ color: "var(--vynl-erreur)" }}>{catalog.error}</p>
      ) : (
        <CatalogSections analytics={catalog.data} />
      )}
    </div>
  );
}

function CatalogSections({ analytics }: { analytics: Analytics }) {
  const statusBreakdown = toBreakdown(analytics.tracks_by_status, STATUS_ORDER);
  const releaseTypeBreakdown = toBreakdown(analytics.releases_by_type, RELEASE_TYPE_ORDER);
  const provenanceBreakdown = toBreakdown(analytics.provenance_breakdown, PROVENANCE_ORDER);

  return (
    <>
      <div className="stat-grid">
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

      <div className="split split--even">
        <section className="dash-card">
          <h2 className="section-title">Tracks by status</h2>
          {statusBreakdown.length === 0 ? (
            <p style={{ color: "var(--vynl-texte-2)" }}>No tracks yet.</p>
          ) : (
            <BreakdownBars items={statusBreakdown} />
          )}
        </section>

        <section className="dash-card">
          <h2 className="section-title">Releases by type</h2>
          {releaseTypeBreakdown.length === 0 ? (
            <p style={{ color: "var(--vynl-texte-2)" }}>No releases yet.</p>
          ) : (
            <BreakdownBars items={releaseTypeBreakdown} />
          )}
        </section>
      </div>

      <section className="dash-card">
        <h2 className="section-title">AI declarations</h2>
        {provenanceBreakdown.length === 0 ? (
          <p style={{ color: "var(--vynl-texte-2)" }}>No tracks yet.</p>
        ) : (
          <BreakdownBars items={provenanceBreakdown} />
        )}
      </section>
    </>
  );
}

import { requireArtist } from "@/lib/session";
import { api } from "@/lib/api";
import { dailySeries, hasNoListens, loadStats, parseRange } from "@/lib/stats";
import { followerSeries } from "@/lib/followerSeries";
import { computeDelta, formatCount, previousRangeLabel } from "@/lib/formatStats";
import { countryLabel, deviceLabel } from "@/lib/statsLabels";
import { StatTile } from "@/components/StatTile";
import { RangeFilter } from "@/components/RangeFilter";
import { TimeSeriesChart } from "@/components/TimeSeriesChart";
import { BarList, type BarRow } from "@/components/BarList";
import { NoListens, StatsNotice } from "@/components/StatsNotice";
import type { BreakdownRow } from "@/lib/stats";

interface AudienceData {
  followers_count: number;
  follows: string[];
}

function toRows(rows: BreakdownRow[], label: (key: string) => string): BarRow[] {
  return rows.map((r) => ({
    key: r.key,
    label: label(r.key),
    value: r.plays,
    muted: r.key === "unknown" || r.key === "other",
  }));
}

export default async function AudiencePage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string | string[] }>;
}) {
  const { session, artist } = await requireArtist();
  const range = parseRange((await searchParams).range);
  const days = Number.parseInt(range, 10);

  let audience: AudienceData;
  try {
    audience = await api.get<AudienceData>("/creator/audience", { accessToken: session.access_token });
  } catch (err) {
    return (
      <div style={{ maxWidth: "var(--content-max-width)" }}>
        <h1 style={{ fontSize: "1.75rem", marginBottom: "var(--space-md)" }}>Audience</h1>
        <p style={{ color: "var(--vynl-erreur)" }}>
          {err instanceof Error ? err.message : "Could not load audience data."}
        </p>
      </div>
    );
  }

  const result = await loadStats(session.access_token, range);
  const followers = followerSeries(audience.follows, days, new Date());
  const comparedTo = previousRangeLabel(range);

  const stats = result.status === "ok" ? result.stats : null;
  const geo = stats?.breakdown.country ?? [];
  const devices = stats?.breakdown.device ?? [];
  const totalPlays = stats?.totals.plays ?? 0;
  const unknownShare = (rows: BreakdownRow[]) => {
    const unknown = rows.find((r) => r.key === "unknown")?.plays ?? 0;
    return totalPlays > 0 ? unknown / totalPlays : 0;
  };

  return (
    <div style={{ maxWidth: "var(--content-max-width)", display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>
      <div className="page-head">
        <div>
          <h1 style={{ fontSize: "1.75rem" }}>Audience</h1>
          <p style={{ color: "var(--vynl-texte-2)" }}>{artist.name}</p>
        </div>
        <RangeFilter basePath="/audience" current={range} />
      </div>

      <div className="stat-grid">
        <StatTile featured label="Followers" value={formatCount(audience.followers_count)} hint="All time" />
        <StatTile
          label="New followers"
          value={formatCount(stats?.totals.new_followers ?? followers.newInWindow)}
          delta={stats ? computeDelta(stats.totals.new_followers ?? 0, stats.previous.new_followers ?? 0) : null}
          comparedTo={comparedTo}
        />
        {stats && (
          <StatTile
            label="Listeners"
            value={formatCount(stats.totals.listeners)}
            delta={computeDelta(stats.totals.listeners, stats.previous.listeners)}
            comparedTo={comparedTo}
          />
        )}
      </div>

      <section className="dash-card">
        <h2 className="section-title">Follower growth (last {days} days)</h2>
        {audience.followers_count === 0 ? (
          <p style={{ color: "var(--vynl-texte-2)" }}>
            No followers yet — growth will show up here once you have some.
          </p>
        ) : (
          <TimeSeriesChart
            label="Followers over time"
            series={[
              { key: "new", label: "New followers", unit: "count", points: followers.daily },
              { key: "total", label: "Total followers", unit: "count", points: followers.points },
            ]}
          />
        )}
      </section>

      {result.status !== "ok" ? (
        <StatsNotice result={result} />
      ) : hasNoListens(result.stats) ? (
        <NoListens />
      ) : (
        <>
          <section className="dash-card">
            <h2 className="section-title">Listeners per day</h2>
            <TimeSeriesChart
              label="Daily listeners"
              series={dailySeries(result.stats.daily).filter((s) => s.key === "listeners")}
            />
          </section>

          <div className="split split--even">
            <section className="dash-card">
              <h2 className="section-title">Where they listen from</h2>
              <BarList rows={toRows(geo, countryLabel)} total={totalPlays} unit="listens" />
            </section>
            <section className="dash-card">
              <h2 className="section-title">On which device</h2>
              <BarList rows={toRows(devices, deviceLabel)} total={totalPlays} unit="listens" />
            </section>
          </div>

          {Math.max(unknownShare(geo), unknownShare(devices)) > 0 && (
            <p style={{ color: "var(--vynl-texte-2)", fontSize: "0.8125rem", maxWidth: "70ch" }}>
              Country and device are only known for listens recorded after we started tracking them, so earlier
              listens show as Unknown.
            </p>
          )}
        </>
      )}
    </div>
  );
}

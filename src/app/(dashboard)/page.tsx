import Link from "next/link";
import { requireArtist } from "@/lib/session";
import { api } from "@/lib/api";
import { dailySeries, hasNoListens, loadStats, parseRange } from "@/lib/stats";
import { computeDelta, formatCount, formatListeningTime, previousRangeLabel } from "@/lib/formatStats";
import { StatusBadge } from "@/components/StatusBadge";
import { joinParts, missingProfileParts } from "@/lib/artistProfile";
import { StatTile } from "@/components/StatTile";
import { RangeFilter } from "@/components/RangeFilter";
import { TimeSeriesChart } from "@/components/TimeSeriesChart";
import { BarList } from "@/components/BarList";
import { NoListens, StatsNotice } from "@/components/StatsNotice";

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

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string | string[] }>;
}) {
  const { session, artist } = await requireArtist();
  const range = parseRange((await searchParams).range);

  let tracks: Track[];
  let albums: Album[];
  try {
    const [tracksRes, albumsRes] = await Promise.all([
      api.get<{ data: Track[] }>("/creator/tracks", { accessToken: session.access_token }),
      api.get<{ data: Album[] }>("/creator/albums", { accessToken: session.access_token }),
    ]);
    tracks = tracksRes.data;
    albums = albumsRes.data;
  } catch (err) {
    return (
      <div style={{ maxWidth: 480 }}>
        <h1 style={{ fontSize: "1.75rem", marginBottom: "var(--space-sm)" }}>Welcome back, {artist.name}</h1>
        <p style={{ color: "var(--vynl-erreur)" }}>
          {err instanceof Error ? err.message : "Could not load your dashboard."}
        </p>
      </div>
    );
  }

  // Ne lève jamais : sans statistiques, le reste de la page (catalogue, actions) reste utilisable.
  const result = await loadStats(session.access_token, range);

  const publishedCount = tracks.filter((t) => t.status === "published").length;
  const recentTracks = tracks.slice(0, 5);
  const comparedTo = previousRangeLabel(range);
  const missingProfile = missingProfileParts(artist);

  return (
    <div style={{ maxWidth: "var(--content-max-width)", display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>
      <div className="page-head">
        <div>
          <h1 style={{ fontSize: "1.75rem" }}>Welcome back, {artist.name}</h1>
          <p style={{ color: "var(--vynl-texte-2)" }}>
            {publishedCount} published {publishedCount === 1 ? "track" : "tracks"} · {albums.length}{" "}
            {albums.length === 1 ? "release" : "releases"}
          </p>
        </div>
        <RangeFilter basePath="/" current={range} />
      </div>

      {missingProfile.length > 0 && (
        // Sans photo, l'artiste apparaît comme un vinyle vide dans Discover et la recherche.
        <section className="dash-card callout">
          <div>
            <h2 className="section-title">Finish your public page</h2>
            <p style={{ color: "var(--vynl-texte-2)" }}>
              Add your {joinParts(missingProfile)} so listeners see you, not a blank vinyl, in Discover and search.
            </p>
          </div>
          <Link href="/artist" className="btn btn-secondary btn-sm">
            Edit your page
          </Link>
        </section>
      )}

      {result.status !== "ok" ? (
        <StatsNotice result={result} />
      ) : (
        <>
          <div className="stat-grid">
            <StatTile
              featured
              label="Listens"
              value={formatCount(result.stats.totals.plays)}
              delta={computeDelta(result.stats.totals.plays, result.stats.previous.plays)}
              comparedTo={comparedTo}
            />
            <StatTile
              label="Listeners"
              value={formatCount(result.stats.totals.listeners)}
              delta={computeDelta(result.stats.totals.listeners, result.stats.previous.listeners)}
              comparedTo={comparedTo}
            />
            <StatTile
              label="Listening time"
              value={formatListeningTime(result.stats.totals.seconds)}
              delta={computeDelta(result.stats.totals.seconds, result.stats.previous.seconds)}
              comparedTo={comparedTo}
            />
            <StatTile
              label="Saves"
              value={formatCount(result.stats.totals.saves)}
              delta={computeDelta(result.stats.totals.saves, result.stats.previous.saves)}
              comparedTo={comparedTo}
            />
            <StatTile
              label="New followers"
              value={formatCount(result.stats.totals.new_followers ?? 0)}
              delta={computeDelta(result.stats.totals.new_followers ?? 0, result.stats.previous.new_followers ?? 0)}
              comparedTo={comparedTo}
            />
          </div>

          {hasNoListens(result.stats) ? (
            <NoListens />
          ) : (
            <section className="dash-card">
              <h2 className="section-title">Listening over time</h2>
              <TimeSeriesChart series={dailySeries(result.stats.daily)} label="Daily listening" />
            </section>
          )}
        </>
      )}

      <div className="split">
        <div className="stack">
          {result.status === "ok" &&
            !hasNoListens(result.stats) &&
            result.stats.top_tracks &&
            result.stats.top_tracks.length > 0 && (
            <section className="dash-card">
              <div className="card-head">
                <h2 className="section-title">Top tracks</h2>
                <Link href={`/analytics?range=${range}`} className="text-link" style={{ fontSize: "0.875rem" }}>
                  More in Analytics
                </Link>
              </div>
              <BarList
                total={result.stats.totals.plays}
                unit="listens"
                rows={result.stats.top_tracks.slice(0, 5).map((t) => ({
                  key: t.track_id,
                  label: t.title,
                  value: t.plays,
                  href: `/tracks/${t.track_id}`,
                }))}
              />
            </section>
          )}

          <section className="dash-card">
            <div className="card-head">
              <h2 className="section-title">Recent tracks</h2>
              <Link href="/tracks" className="text-link" style={{ fontSize: "0.875rem" }}>
                View all
              </Link>
            </div>
            {recentTracks.length === 0 ? (
              <p style={{ color: "var(--vynl-texte-2)" }}>No tracks yet. Upload your first one.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {recentTracks.map((track) => (
                  <Link key={track.id} href={`/tracks/${track.id}`} className="list-row">
                    <span className="list-row__main">{track.title}</span>
                    <StatusBadge status={track.status} />
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        <section className="dash-card">
          <h2 className="section-title" style={{ marginBottom: "var(--space-md)" }}>Quick actions</h2>
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

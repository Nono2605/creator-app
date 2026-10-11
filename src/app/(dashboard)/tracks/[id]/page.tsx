import { notFound } from "next/navigation";
import { requireArtist } from "@/lib/session";
import { api } from "@/lib/api";
import { dailySeries, hasNoListens, loadStats, parseRange } from "@/lib/stats";
import { computeDelta, formatCount, formatListeningTime, previousRangeLabel } from "@/lib/formatStats";
import { sourceLabel } from "@/lib/statsLabels";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { AIDeclarationForm } from "@/components/AIDeclarationForm";
import { AudioUploadField } from "@/components/AudioUploadField";
import { CatalogCode } from "@/components/CatalogCode";
import { StatTile } from "@/components/StatTile";
import { RangeFilter } from "@/components/RangeFilter";
import { TimeSeriesChart } from "@/components/TimeSeriesChart";
import { BarList } from "@/components/BarList";
import { NoListens, StatsNotice } from "@/components/StatsNotice";
import { MakeSingle } from "./MakeSingle";
import {
  updateTrackStatus,
  deleteTrackAction,
  updateTrackTitleAction,
  removeFile,
} from "@/app/actions/tracks";

interface TrackFile {
  id: string;
  format: string;
  file_size_bytes: number | null;
  created_at: string;
}

interface Track {
  id: string;
  catalog_code?: string | null;
  album_id: string | null;
  title: string;
  slug: string;
  status: string;
  explicit: boolean;
  track_number: number | null;
  created_at: string;
  published_at: string | null;
  files: TrackFile[];
}

interface Declaration {
  provenance: "human" | "ai" | "hybrid";
  description: string | null;
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return "unknown size";
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function TrackPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ range?: string | string[] }>;
}) {
  const { id } = await params;
  const range = parseRange((await searchParams).range);
  const { session } = await requireArtist();

  let track: Track;
  try {
    track = await api.get<Track>(`/creator/tracks/${id}`, { accessToken: session.access_token });
  } catch {
    notFound();
  }

  // Section secondaire : une panne ici ne doit pas empêcher de voir/gérer le
  // morceau lui-même — dégrade en formulaire vierge plutôt que de planter la page.
  let declaration: Declaration | null = null;
  try {
    declaration = await api.get<Declaration | null>(`/creator/tracks/${id}/declaration`, {
      accessToken: session.access_token,
    });
  } catch {
    declaration = null;
  }

  // Écoutes de ce morceau : seulement une fois publié (un brouillon n'en a pas).
  // Ne lève jamais, comme la déclaration ci-dessus.
  const showStats = track.status === "published" || track.status === "archived";
  const stats = showStats ? await loadStats(session.access_token, range, track.id) : null;
  const comparedTo = previousRangeLabel(range);

  return (
    <div style={{ maxWidth: 640, display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
        <h1 style={{ fontSize: "1.75rem" }}>{track.title}</h1>
        <StatusBadge status={track.status} />
      </div>

      {/* Le numéro de catalogue est permanent (VYN-T-…). La piste est la position dans la
          release ; un morceau seul est la piste 1 de lui-même. */}
      <p style={{ marginTop: "calc(var(--space-sm) * -1)", display: "flex", flexWrap: "wrap", gap: "0.25rem 1rem" }}>
        <CatalogCode code={track.catalog_code} label="Catalog number" />
        <span className="catalog-code">
          <span className="catalog-code__label">{track.album_id ? "Position" : "Release"}</span>
          {track.album_id ? `Track ${track.track_number ?? 1}` : "Single"}
        </span>
      </p>

      <form action={updateTrackTitleAction.bind(null, track.id)} style={{ display: "flex", gap: "var(--space-xs)" }}>
        <input name="title" defaultValue={track.title} className="input-field" style={{ flex: 1 }} />
        <button type="submit" className="btn btn-secondary">
          Rename
        </button>
      </form>

      <section className="dash-card">
        <h2 className="section-title">Cover</h2>
        {track.album_id ? (
          <p style={{ color: "var(--vynl-texte-2)" }}>
            The cover belongs to the release.{" "}
            <Link href={`/releases/${track.album_id}`} className="text-link">
              Edit the cover
            </Link>
          </p>
        ) : (
          <MakeSingle trackId={track.id} title={track.title} />
        )}
      </section>

      {stats && (
        <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
          <div className="card-head" style={{ marginBottom: 0, flexWrap: "wrap" }}>
            <h2 style={{ fontSize: "1.375rem" }}>Listening</h2>
            <RangeFilter basePath={`/tracks/${track.id}`} current={range} />
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
                  label="Listeners"
                  value={formatCount(stats.stats.totals.listeners)}
                  delta={computeDelta(stats.stats.totals.listeners, stats.stats.previous.listeners)}
                  comparedTo={comparedTo}
                />
                <StatTile
                  label="Listening time"
                  value={formatListeningTime(stats.stats.totals.seconds)}
                  delta={computeDelta(stats.stats.totals.seconds, stats.stats.previous.seconds)}
                  comparedTo={comparedTo}
                />
                <StatTile
                  label="Saves"
                  value={formatCount(stats.stats.totals.saves)}
                  delta={computeDelta(stats.stats.totals.saves, stats.stats.previous.saves)}
                  comparedTo={comparedTo}
                />
              </div>

              <div className="dash-card">
                <TimeSeriesChart series={dailySeries(stats.stats.daily)} label={`Daily listening — ${track.title}`} />
              </div>

              <div className="dash-card">
                <h3 className="section-title">How listeners find this track</h3>
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
              </div>
            </>
          )}
        </section>
      )}

      <section className="dash-card">
        <h2 className="section-title">Audio files</h2>
        {track.files.length === 0 ? (
          track.status === "draft" ? (
            // Un brouillon peut être créé sans fichier (ou l'envoi peut avoir échoué) : on
            // peut toujours l'ajouter ici. Sans audio, le morceau ne peut pas partir en relecture.
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
              <p style={{ color: "var(--vynl-texte-2)" }}>
                No audio yet. Add the file to be able to submit this track for review.
              </p>
              <AudioUploadField trackId={track.id} />
            </div>
          ) : (
            <p style={{ color: "var(--vynl-texte-2)" }}>
              No audio file. Withdraw the track to draft to add one.
            </p>
          )
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {track.files.map((file) => (
              <div key={file.id} className="list-row" style={{ justifyContent: "space-between" }}>
                <span>
                  {file.format.toUpperCase()} · {formatBytes(file.file_size_bytes)}
                </span>
                <form action={removeFile.bind(null, track.id, file.id)}>
                  <button type="submit" className="btn-plain" style={{ color: "var(--vynl-erreur)" }}>
                    Remove
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="dash-card">
        <h2 className="section-title">AI declaration</h2>
        <AIDeclarationForm
          trackId={track.id}
          initialProvenance={declaration?.provenance ?? null}
          initialDescription={declaration?.description ?? ""}
        />
      </section>

      <section style={{ display: "flex", gap: "var(--space-sm)", flexWrap: "wrap" }}>
        {track.status === "draft" &&
          (track.files.length === 0 ? (
            // Sans audio il n'y a rien à relire : l'API refuse aussi ; ici on explique avant le clic.
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <button type="button" className="btn btn-primary" disabled aria-describedby="review-blocker">
                Submit for review
              </button>
              <span id="review-blocker" style={{ color: "var(--vynl-texte-2)", fontSize: "0.8125rem" }}>
                Add the audio file first.
              </span>
            </div>
          ) : (
            <form action={updateTrackStatus.bind(null, track.id, "in_review")}>
              <button type="submit" className="btn btn-primary">
                Submit for review
              </button>
            </form>
          ))}
        {track.status === "in_review" && (
          <form action={updateTrackStatus.bind(null, track.id, "draft")}>
            <button type="submit" className="btn btn-secondary">
              Withdraw to draft
            </button>
          </form>
        )}
        {track.status === "published" && (
          <form action={updateTrackStatus.bind(null, track.id, "archived")}>
            <button type="submit" className="btn btn-secondary">
              Archive
            </button>
          </form>
        )}
        {track.status === "draft" && (
          <form action={deleteTrackAction.bind(null, track.id)}>
            <button type="submit" className="btn btn-danger">
              Delete track
            </button>
          </form>
        )}
      </section>
    </div>
  );
}

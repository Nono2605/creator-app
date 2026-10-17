import Link from "next/link";
import { notFound } from "next/navigation";
import { requireArtist } from "@/lib/session";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDuration } from "@/lib/formatDuration";
import { nameStatusBlocker, nameStatusOf } from "@/lib/artistNameStatus";
import { CatalogCode } from "@/components/CatalogCode";
import { ActionButton } from "@/components/ActionButton";
import { CoverField } from "./CoverField";
import {
  updateReleaseStatus,
  deleteReleaseAction,
  assignTrackToRelease,
  removeTrackFromRelease,
} from "@/app/actions/releases";

interface ReleaseTrack {
  id: string;
  catalog_code?: string | null;
  title: string;
  status: string;
  track_number: number | null;
  duration_seconds: number | null;
}

interface Release {
  id: string;
  catalog_code?: string | null;
  title: string;
  type: string;
  status: string;
  cover_url: string | null;
  release_date: string | null;
  tracks: ReleaseTrack[];
}

interface CreatorTrack {
  id: string;
  title: string;
  status: string;
  album_id: string | null;
}

export default async function ReleasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { session, artist } = await requireArtist();

  let release: Release;
  try {
    release = await api.get<Release>(`/creator/albums/${id}`, { accessToken: session.access_token });
  } catch {
    notFound();
  }

  // Section secondaire : une panne ici ne doit pas empêcher de voir/gérer la
  // release elle-même — dégrade en liste vide plutôt que de planter la page.
  let availableTracks: CreatorTrack[] = [];
  try {
    const { data: allTracks } = await api.get<{ data: CreatorTrack[] }>("/creator/tracks", {
      accessToken: session.access_token,
    });
    availableTracks = allTracks.filter((t) => t.album_id !== release.id);
  } catch {
    availableTracks = [];
  }

  // Une release ne part en relecture qu'avec au moins un morceau, et de l'audio sur chacun
  // (la durée n'est connue qu'une fois le fichier audio mesuré).
  const withoutAudio = release.tracks.filter((t) => t.duration_seconds === null).length;
  const reviewBlocker =
    nameStatusBlocker(nameStatusOf(artist)) ??
    (release.tracks.length === 0
      ? "Add at least one track first."
      : withoutAudio > 0
        ? `${withoutAudio} ${withoutAudio === 1 ? "track still needs" : "tracks still need"} an audio file.`
        : null);

  return (
    <div style={{ maxWidth: 640, display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", flexWrap: "wrap" }}>
        <h1 style={{ fontSize: "1.75rem" }}>{release.title}</h1>
        <StatusBadge status={release.status} />
        <span style={{ color: "var(--vynl-texte-2)", textTransform: "capitalize" }}>{release.type}</span>
      </div>
      <p style={{ marginTop: "calc(var(--space-sm) * -1)" }}>
        <CatalogCode code={release.catalog_code} label="Catalog number" />
      </p>

      <section className="dash-card">
        <h2 className="section-title">Cover</h2>
        <CoverField releaseId={release.id} coverUrl={release.cover_url} />
      </section>

      <section className="dash-card">
        <h2 className="section-title">Tracks</h2>
        {release.tracks.length === 0 ? (
          <p style={{ color: "var(--vynl-texte-2)" }}>No tracks in this release yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {release.tracks.map((track, index) => (
              <div key={track.id} className="list-row">
                <span style={{ color: "var(--vynl-texte-2)", width: 20, textAlign: "right" }}>
                  {track.track_number ?? index + 1}
                </span>
                {/* Le titre mène à la page du morceau (audio, déclaration IA). La durée est
                    lue dans le fichier audio : sans elle, le morceau n'a pas encore d'audio. */}
                <span className="list-row__main">
                  <Link href={`/tracks/${track.id}`} className="hover-underline">
                    {track.title}
                  </Link>
                  {track.catalog_code && (
                    <span style={{ display: "block", fontSize: "0.75rem", color: "var(--vynl-texte-2)" }}>
                      {track.catalog_code}
                    </span>
                  )}
                  {track.duration_seconds === null && (
                    <Link href={`/tracks/${track.id}`} className="status status--warn" style={{ marginLeft: "0.5rem" }}>
                      No audio
                    </Link>
                  )}
                </span>
                <StatusBadge status={track.status} />
                <span style={{ color: "var(--vynl-texte-2)", fontVariantNumeric: "tabular-nums" }}>
                  {formatDuration(track.duration_seconds)}
                </span>
                <ActionButton
                  action={removeTrackFromRelease.bind(null, track.id, release.id)}
                  pendingLabel="Removing…"
                  className="btn-plain"
                  style={{ color: "var(--vynl-texte-2)" }}
                >
                  Remove
                </ActionButton>
              </div>
            ))}
          </div>
        )}
      </section>

      {availableTracks.length > 0 && (
        <section className="dash-card">
          <h2 className="section-title">Add tracks</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "var(--space-sm)" }}>
            {availableTracks.map((track) => (
              <div key={track.id} className="list-row">
                <span className="list-row__main">{track.title}</span>
                <StatusBadge status={track.status} />
                <ActionButton
                  action={assignTrackToRelease.bind(null, track.id, release.id)}
                  pendingLabel="Adding…"
                  className="btn-plain text-link"
                  style={{ fontWeight: 600 }}
                >
                  Add
                </ActionButton>
              </div>
            ))}
          </div>
        </section>
      )}

      <section style={{ display: "flex", gap: "var(--space-sm)", flexWrap: "wrap", alignItems: "flex-start" }}>
        {release.status === "draft" &&
          (reviewBlocker ? (
            // Mêmes conditions que l'API : au moins un morceau, et de l'audio sur chacun.
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <button type="button" className="btn btn-primary" disabled aria-describedby="review-blocker">
                Submit for review
              </button>
              <span id="review-blocker" style={{ color: "var(--vynl-texte-2)", fontSize: "0.8125rem" }}>
                {reviewBlocker}
              </span>
            </div>
          ) : (
            // L'API vérifie aussi la déclaration IA et le genre de chaque morceau (ils ne sont pas
            // chargés ici) : si l'un manque, son message dit lesquels, sous le bouton.
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <ActionButton action={updateReleaseStatus.bind(null, release.id, "in_review")} pendingLabel="Submitting…">
                Submit for review
              </ActionButton>
              <span style={{ color: "var(--vynl-texte-2)", fontSize: "0.8125rem" }}>
                Every track needs its audio, an AI declaration and a genre.
              </span>
            </div>
          ))}
        {release.status === "in_review" && (
          <ActionButton
            action={updateReleaseStatus.bind(null, release.id, "draft")}
            pendingLabel="Withdrawing…"
            className="btn btn-secondary"
          >
            Withdraw to draft
          </ActionButton>
        )}
        {release.status === "published" && (
          <ActionButton
            action={updateReleaseStatus.bind(null, release.id, "archived")}
            pendingLabel="Archiving…"
            className="btn btn-secondary"
          >
            Archive
          </ActionButton>
        )}
        {release.status === "draft" && (
          <ActionButton
            action={deleteReleaseAction.bind(null, release.id)}
            pendingLabel="Deleting…"
            className="btn btn-danger"
          >
            Delete release
          </ActionButton>
        )}
      </section>
    </div>
  );
}

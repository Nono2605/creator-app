import { notFound } from "next/navigation";
import { requireArtist } from "@/lib/session";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDuration } from "@/lib/formatDuration";
import {
  updateReleaseStatus,
  deleteReleaseAction,
  assignTrackToRelease,
  removeTrackFromRelease,
} from "@/app/actions/releases";

interface ReleaseTrack {
  id: string;
  title: string;
  status: string;
  track_number: number | null;
  duration_seconds: number | null;
}

interface Release {
  id: string;
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
  const { session } = await requireArtist();

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

  return (
    <div style={{ maxWidth: 640, display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", flexWrap: "wrap" }}>
        <h1 style={{ fontSize: "1.75rem" }}>{release.title}</h1>
        <StatusBadge status={release.status} />
        <span style={{ color: "var(--vynl-texte-2)", textTransform: "capitalize" }}>{release.type}</span>
      </div>

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
                <span className="list-row__main">{track.title}</span>
                <StatusBadge status={track.status} />
                <span style={{ color: "var(--vynl-texte-2)", fontVariantNumeric: "tabular-nums" }}>
                  {formatDuration(track.duration_seconds)}
                </span>
                <form action={removeTrackFromRelease.bind(null, track.id, release.id)}>
                  <button type="submit" className="btn-plain" style={{ color: "var(--vynl-texte-2)" }}>
                    Remove
                  </button>
                </form>
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
                <form action={assignTrackToRelease.bind(null, track.id, release.id)}>
                  <button type="submit" className="btn-plain text-link" style={{ fontWeight: 600 }}>
                    Add
                  </button>
                </form>
              </div>
            ))}
          </div>
        </section>
      )}

      <section style={{ display: "flex", gap: "var(--space-sm)", flexWrap: "wrap" }}>
        {release.status === "draft" && (
          <form action={updateReleaseStatus.bind(null, release.id, "in_review")}>
            <button type="submit" className="btn btn-primary">
              Submit for review
            </button>
          </form>
        )}
        {release.status === "in_review" && (
          <form action={updateReleaseStatus.bind(null, release.id, "draft")}>
            <button type="submit" className="btn btn-secondary">
              Withdraw to draft
            </button>
          </form>
        )}
        {release.status === "published" && (
          <form action={updateReleaseStatus.bind(null, release.id, "archived")}>
            <button type="submit" className="btn btn-secondary">
              Archive
            </button>
          </form>
        )}
        {release.status === "draft" && (
          <form action={deleteReleaseAction.bind(null, release.id)}>
            <button type="submit" className="btn btn-danger">
              Delete release
            </button>
          </form>
        )}
      </section>
    </div>
  );
}

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

  const { data: allTracks } = await api.get<{ data: CreatorTrack[] }>("/creator/tracks", {
    accessToken: session.access_token,
  });
  const availableTracks = allTracks.filter((t) => t.album_id !== release.id);

  return (
    <div style={{ maxWidth: 640, display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", flexWrap: "wrap" }}>
        <h1 style={{ fontSize: "1.75rem" }}>{release.title}</h1>
        <StatusBadge status={release.status} />
        <span style={{ color: "var(--color-text-muted)", textTransform: "capitalize" }}>{release.type}</span>
      </div>

      <section className="dash-card">
        <h2 style={sectionTitleStyle}>Tracks</h2>
        {release.tracks.length === 0 ? (
          <p style={{ color: "var(--color-text-muted)" }}>No tracks in this release yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {release.tracks.map((track, index) => (
              <div key={track.id} className="list-row" style={rowStyle}>
                <span style={{ color: "var(--color-text-muted)", width: 20, textAlign: "right" }}>
                  {track.track_number ?? index + 1}
                </span>
                <span style={{ flex: 1 }}>{track.title}</span>
                <StatusBadge status={track.status} />
                <span style={{ color: "var(--color-text-muted)", fontVariantNumeric: "tabular-nums" }}>
                  {formatDuration(track.duration_seconds)}
                </span>
                <form action={removeTrackFromRelease.bind(null, track.id, release.id)}>
                  <button type="submit" className="btn-plain" style={{ color: "var(--color-text-muted)" }}>
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
          <h2 style={sectionTitleStyle}>Add tracks</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "var(--space-sm)" }}>
            {availableTracks.map((track) => (
              <div key={track.id} className="list-row" style={rowStyle}>
                <span style={{ flex: 1 }}>{track.title}</span>
                <StatusBadge status={track.status} />
                <form action={assignTrackToRelease.bind(null, track.id, release.id)}>
                  <button type="submit" className="btn-plain" style={{ color: "var(--color-blue-bright)", fontWeight: 600 }}>
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

const sectionTitleStyle: React.CSSProperties = {
  fontSize: "1rem",
  textTransform: "uppercase",
  letterSpacing: "0.03em",
  color: "var(--color-text-muted)",
  marginBottom: "var(--space-sm)",
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "var(--space-sm)",
  padding: "0.6rem var(--space-sm)",
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--color-border)",
};

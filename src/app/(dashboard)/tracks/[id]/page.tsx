import { notFound } from "next/navigation";
import { requireArtist } from "@/lib/session";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";
import { AIDeclarationForm } from "@/components/AIDeclarationForm";
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

export default async function TrackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { session } = await requireArtist();

  let track: Track;
  try {
    track = await api.get<Track>(`/creator/tracks/${id}`, { accessToken: session.access_token });
  } catch {
    notFound();
  }

  const declaration = await api.get<Declaration | null>(`/creator/tracks/${id}/declaration`, {
    accessToken: session.access_token,
  });

  return (
    <div style={{ maxWidth: 640, display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
        <h1 style={{ fontSize: "1.75rem" }}>{track.title}</h1>
        <StatusBadge status={track.status} />
      </div>

      <form action={updateTrackTitleAction.bind(null, track.id)} style={{ display: "flex", gap: "var(--space-xs)" }}>
        <input name="title" defaultValue={track.title} className="input-field" style={{ flex: 1 }} />
        <button type="submit" className="btn btn-secondary">
          Rename
        </button>
      </form>

      <section className="dash-card">
        <h2 style={sectionTitleStyle}>Audio files</h2>
        {track.files.length === 0 ? (
          <p style={{ color: "var(--color-text-muted)" }}>No audio file uploaded yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {track.files.map((file) => (
              <div key={file.id} className="list-row" style={fileRowStyle}>
                <span>
                  {file.format.toUpperCase()} · {formatBytes(file.file_size_bytes)}
                </span>
                <form action={removeFile.bind(null, track.id, file.id)}>
                  <button type="submit" className="btn-plain" style={{ color: "#ff6b6b" }}>
                    Remove
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="dash-card">
        <h2 style={sectionTitleStyle}>AI declaration</h2>
        <AIDeclarationForm
          trackId={track.id}
          initialProvenance={declaration?.provenance ?? null}
          initialDescription={declaration?.description ?? ""}
        />
      </section>

      <section style={{ display: "flex", gap: "var(--space-sm)", flexWrap: "wrap" }}>
        {track.status === "draft" && (
          <form action={updateTrackStatus.bind(null, track.id, "in_review")}>
            <button type="submit" className="btn btn-primary">
              Submit for review
            </button>
          </form>
        )}
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

const sectionTitleStyle: React.CSSProperties = {
  fontSize: "1rem",
  textTransform: "uppercase",
  letterSpacing: "0.03em",
  color: "var(--color-text-muted)",
  marginBottom: "var(--space-sm)",
};

const fileRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "0.6rem var(--space-sm)",
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--color-border)",
};

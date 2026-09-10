import { notFound } from "next/navigation";
import { requireArtist } from "@/lib/session";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";
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

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "var(--space-lg) var(--space-md)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", marginBottom: "var(--space-md)" }}>
        <h1 style={{ fontSize: "1.75rem" }}>{track.title}</h1>
        <StatusBadge status={track.status} />
      </div>

      <form
        action={updateTrackTitleAction.bind(null, track.id)}
        style={{ display: "flex", gap: "var(--space-xs)", marginBottom: "var(--space-lg)" }}
      >
        <input name="title" defaultValue={track.title} style={inputStyle} />
        <button type="submit" style={secondaryButtonStyle}>
          Rename
        </button>
      </form>

      <section style={{ marginBottom: "var(--space-lg)" }}>
        <h2 style={sectionTitleStyle}>Audio files</h2>
        {track.files.length === 0 ? (
          <p style={{ color: "var(--color-text-muted)" }}>No audio file uploaded yet.</p>
        ) : (
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
            {track.files.map((file) => (
              <li key={file.id} style={fileRowStyle}>
                <span>
                  {file.format.toUpperCase()} · {formatBytes(file.file_size_bytes)}
                </span>
                <form action={removeFile.bind(null, track.id, file.id)}>
                  <button type="submit" style={dangerLinkStyle}>
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section style={{ display: "flex", gap: "var(--space-sm)", flexWrap: "wrap" }}>
        {track.status === "draft" && (
          <form action={updateTrackStatus.bind(null, track.id, "in_review")}>
            <button type="submit" style={buttonStyle}>
              Submit for review
            </button>
          </form>
        )}
        {track.status === "in_review" && (
          <form action={updateTrackStatus.bind(null, track.id, "draft")}>
            <button type="submit" style={secondaryButtonStyle}>
              Withdraw to draft
            </button>
          </form>
        )}
        {track.status === "published" && (
          <form action={updateTrackStatus.bind(null, track.id, "archived")}>
            <button type="submit" style={secondaryButtonStyle}>
              Archive
            </button>
          </form>
        )}
        {track.status === "draft" && (
          <form action={deleteTrackAction.bind(null, track.id)}>
            <button type="submit" style={dangerButtonStyle}>
              Delete track
            </button>
          </form>
        )}
      </section>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: "0.6rem 1rem",
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--color-border)",
  background: "var(--color-card)",
  color: "var(--color-text)",
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: "1.125rem",
  marginBottom: "var(--space-sm)",
};

const fileRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "var(--space-sm) var(--space-md)",
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--color-border)",
  background: "var(--color-card)",
};

const buttonStyle: React.CSSProperties = {
  padding: "0.6rem 1rem",
  borderRadius: "var(--radius-sm)",
  border: "none",
  background: "var(--gradient-signature)",
  color: "#fff",
  fontWeight: 600,
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: "0.6rem 1rem",
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--color-border)",
  background: "transparent",
  color: "var(--color-text)",
  fontWeight: 600,
  cursor: "pointer",
};

const dangerButtonStyle: React.CSSProperties = {
  ...secondaryButtonStyle,
  color: "#ff6b6b",
  borderColor: "#ff6b6b",
};

const dangerLinkStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "#ff6b6b",
  cursor: "pointer",
  font: "inherit",
  padding: 0,
};

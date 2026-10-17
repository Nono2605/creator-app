"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createReleaseDraft, createTrackInRelease } from "@/app/actions/releases";
import { CreditsEditor } from "@/components/CreditsEditor";
import { GenrePicker } from "@/components/GenrePicker";
import { TagsInput } from "@/components/TagsInput";
import type { Genre } from "@/lib/genres";
import {
  draftProblems,
  effectiveGenres,
  effectiveProvenance,
  effectiveTags,
  hybridCount,
  releaseDetailsPayload,
  trackPayload,
  type Provenance,
  type ReleaseFields,
  type ReleaseType,
  type TrackFields,
} from "@/lib/releaseDraft";
import { MAX_TRACKS, formatFileSize, moveItem, titleFromFilename } from "@/lib/releaseMeta";
import { uploadAudio } from "@/lib/uploadAudio";

type Step = "release" | "tracks" | "review";
type RowStatus = "waiting" | "creating" | "uploading" | "checking" | "done" | "failed";

interface Row extends TrackFields {
  key: string;
  file: File;
  /** Le morceau existe déjà côté serveur (brouillon) : un nouvel essai ne refait que l'envoi du fichier. */
  trackId: string | null;
  status: RowStatus;
  error: string | null;
}

const TYPES: { value: ReleaseType; label: string }[] = [
  { value: "single", label: "Single (one track)" },
  { value: "ep", label: "EP" },
  { value: "album", label: "Album" },
  { value: "compilation", label: "Compilation" },
];

const STEPS: { key: Step; label: string }[] = [
  { key: "release", label: "Release" },
  { key: "tracks", label: "Tracks" },
  { key: "review", label: "Review" },
];

const STATUS_LABEL: Record<RowStatus, string> = {
  waiting: "Waiting",
  creating: "Creating the track…",
  uploading: "Uploading the audio…",
  checking: "Checking the file…",
  done: "Done",
  failed: "Failed",
};

const AUDIO_ACCEPT = "audio/*,.mp3,.flac,.wav,.ogg,.opus,.m4a";

const emptyRelease: ReleaseFields = {
  type: "ep",
  title: "",
  releaseDate: "",
  label: "",
  copyright: "",
  description: "",
  genres: [],
  tags: [],
  provenance: null,
};

let nextKey = 0;

// L'assistant « nouvelle release » : la release et ses morceaux en un seul parcours. Trois étapes (la release, les
// fichiers audio avec leurs détails, la relecture), puis tout est créé en brouillon et les fichiers partent un à un.
// Rien n'est soumis : le créateur le fait lui-même ensuite, depuis la page de la release. Un morceau qui échoue
// se réessaie seul ; la release et les morceaux déjà créés ne sont jamais refaits.
export function ReleaseWizard({ genres }: { genres: Genre[] }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("release");
  const [release, setRelease] = useState<ReleaseFields>(emptyRelease);
  const [rows, setRows] = useState<Row[]>([]);
  const [releaseId, setReleaseId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [titleMissing, setTitleMissing] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const genresAvailable = genres.length > 0;
  const trackFields: TrackFields[] = rows;
  const problems = draftProblems(release, trackFields, genresAvailable);
  const hybrids = hybridCount(release, trackFields);
  const started = releaseId !== null;
  const allDone = rows.length > 0 && rows.every((row) => row.status === "done");

  // Pendant la création, quitter la page interromprait l'envoi des fichiers.
  useEffect(() => {
    if (!busy) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [busy]);

  const setReleaseField = <K extends keyof ReleaseFields>(field: K, value: ReleaseFields[K]) =>
    setRelease((current) => ({ ...current, [field]: value }));

  const updateRow = (key: string, patch: Partial<Row>) =>
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));

  function addFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const incoming = Array.from(files).map<Row>((file) => ({
      key: `row-${nextKey++}`,
      file,
      title: titleFromFilename(file.name),
      explicit: false,
      genres: null,
      tags: null,
      provenance: "inherit",
      credits: [],
      trackId: null,
      status: "waiting",
      error: null,
    }));
    // Un single n'a qu'un morceau : le dernier fichier choisi remplace le précédent.
    setRows((current) =>
      release.type === "single" ? incoming.slice(-1) : [...current, ...incoming].slice(0, MAX_TRACKS)
    );
    if (fileInput.current) fileInput.current.value = "";
  }

  function goToTracks() {
    if (!release.title.trim()) {
      setTitleMissing(true);
      return;
    }
    setTitleMissing(false);
    setStep("tracks");
  }

  async function run() {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      let id = releaseId;
      if (!id) {
        const created = await createReleaseDraft({
          title: release.title,
          type: release.type,
          details: releaseDetailsPayload(release),
        });
        if (!created.ok) {
          setError(created.error);
          return;
        }
        id = created.releaseId;
        setReleaseId(id);
        if (created.warning) setNotice(created.warning);
      }

      for (const row of rows) {
        if (row.status === "done") continue;
        let trackId = row.trackId;

        if (!trackId) {
          updateRow(row.key, { status: "creating", error: null });
          // La place choisie dans la liste est envoyée : un morceau créé après les autres (nouvel essai) garde son rang.
          const created = await createTrackInRelease(id, trackPayload(row, release), rows.indexOf(row) + 1);
          if (!created.ok) {
            updateRow(row.key, { status: "failed", error: created.error });
            continue;
          }
          trackId = created.trackId;
          updateRow(row.key, { trackId });
        }

        updateRow(row.key, { status: "uploading", error: null });
        const uploaded = await uploadAudio(trackId, row.file, (phase) =>
          updateRow(row.key, { status: phase === "uploading" ? "uploading" : "checking" })
        );
        if (!uploaded.ok) {
          updateRow(row.key, { status: "failed", error: uploaded.error });
          continue;
        }
        updateRow(row.key, { status: "done" });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  // Une fois tous les fichiers envoyés, on ouvre la release (pochette, soumission).
  useEffect(() => {
    if (releaseId && allDone && !busy) router.push(`/releases/${releaseId}`);
  }, [releaseId, allDone, busy, router]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
      <ol
        aria-label="Steps"
        style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem 1rem", listStyle: "none", padding: 0, margin: 0 }}
      >
        {STEPS.map((item, index) => {
          const active = item.key === step;
          return (
            <li
              key={item.key}
              aria-current={active ? "step" : undefined}
              style={{
                fontSize: "0.8125rem",
                fontWeight: active ? 600 : 400,
                color: active ? "var(--vynl-texte)" : "var(--vynl-texte-3)",
              }}
            >
              {index + 1}. {item.label}
            </li>
          );
        })}
      </ol>

      {step === "release" && (
        <section className="dash-card" style={sectionStyle}>
          <h2 className="section-title">The release</h2>
          <label style={fieldStyle}>
            <span style={labelStyle}>Type</span>
            <select
              value={release.type}
              disabled={started}
              onChange={(e) => {
                const type = e.target.value as ReleaseType;
                setReleaseField("type", type);
                if (type === "single") setRows((current) => current.slice(0, 1));
              }}
              className="input-field"
            >
              {TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </label>
          <label style={fieldStyle}>
            <span style={labelStyle}>Title</span>
            <input
              type="text"
              value={release.title}
              maxLength={200}
              disabled={started}
              onChange={(e) => {
                setReleaseField("title", e.target.value);
                setTitleMissing(false);
              }}
              placeholder="Release title"
              className="input-field"
            />
            {titleMissing && (
              <span role="alert" style={{ color: "var(--vynl-erreur)", fontSize: "0.8125rem" }}>
                Give the release a title.
              </span>
            )}
          </label>

          <p className="muted" style={{ fontSize: "0.8125rem" }}>
            The genres, style tags and AI declaration below apply to every track. You can change them track by track in
            the next step.
          </p>
          {genresAvailable && (
            <GenrePicker genres={genres} selected={release.genres} onChange={(next) => setReleaseField("genres", next)} />
          )}
          <TagsInput tags={release.tags} onChange={(next) => setReleaseField("tags", next)} />
          <ProvenanceChoice
            value={release.provenance}
            onChange={(next) => setReleaseField("provenance", next)}
            legend="How was the music made?"
          />

          <details>
            <summary style={{ cursor: "pointer", color: "var(--vynl-texte-2)" }}>More details (all optional)</summary>
            <div style={{ ...sectionStyle, marginTop: "var(--space-sm)" }}>
              <label style={fieldStyle}>
                <span style={labelStyle}>Release date</span>
                <input
                  type="date"
                  value={release.releaseDate}
                  disabled={started}
                  onChange={(e) => setReleaseField("releaseDate", e.target.value)}
                  className="input-field"
                  style={{ maxWidth: 220 }}
                />
              </label>
              <label style={fieldStyle}>
                <span style={labelStyle}>Label</span>
                <input
                  type="text"
                  value={release.label}
                  maxLength={80}
                  onChange={(e) => setReleaseField("label", e.target.value)}
                  className="input-field"
                />
              </label>
              <label style={fieldStyle}>
                <span style={labelStyle}>Copyright line</span>
                <input
                  type="text"
                  value={release.copyright}
                  maxLength={120}
                  placeholder="e.g. ℗ 2026 Your name"
                  onChange={(e) => setReleaseField("copyright", e.target.value)}
                  className="input-field"
                />
              </label>
              <label style={fieldStyle}>
                <span style={labelStyle}>Description</span>
                <textarea
                  value={release.description}
                  maxLength={1000}
                  rows={4}
                  onChange={(e) => setReleaseField("description", e.target.value)}
                  className="input-field"
                  style={{ resize: "vertical" }}
                />
              </label>
            </div>
          </details>

          <button type="button" className="btn btn-primary" style={{ alignSelf: "flex-start" }} onClick={goToTracks}>
            Next: add the tracks
          </button>
        </section>
      )}

      {step === "tracks" && (
        <section className="dash-card" style={sectionStyle}>
          <h2 className="section-title">The tracks</h2>
          <p className="muted" style={{ fontSize: "0.875rem" }}>
            {release.type === "single"
              ? "Choose the audio file of your single."
              : `Choose all the audio files at once (up to ${MAX_TRACKS}). Each file becomes a track; titles come from the file names, change them below.`}{" "}
            MP3, FLAC, WAV, Ogg or M4A.
          </p>
          <div>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={busy || (release.type !== "single" && rows.length >= MAX_TRACKS)}
              onClick={() => fileInput.current?.click()}
            >
              {rows.length === 0 ? "Choose audio files" : release.type === "single" ? "Choose another file" : "Add more files"}
            </button>
            <input
              ref={fileInput}
              type="file"
              multiple={release.type !== "single"}
              accept={AUDIO_ACCEPT}
              className="sr-only"
              tabIndex={-1}
              aria-label="Audio files"
              onChange={(e) => addFiles(e.target.files)}
            />
          </div>

          {rows.map((row, index) => (
            <TrackRow
              key={row.key}
              row={row}
              index={index}
              count={rows.length}
              release={release}
              genres={genres}
              locked={started}
              onChange={(patch) => updateRow(row.key, patch)}
              onMove={(to) => setRows((current) => moveItem(current, index, to))}
              onRemove={() => setRows((current) => current.filter((item) => item.key !== row.key))}
            />
          ))}

          <div style={{ display: "flex", gap: "var(--space-sm)", flexWrap: "wrap" }}>
            <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => setStep("release")}>
              Back
            </button>
            <button type="button" className="btn btn-primary" disabled={rows.length === 0} onClick={() => setStep("review")}>
              Next: review
            </button>
          </div>
        </section>
      )}

      {step === "review" && (
        <section className="dash-card" style={sectionStyle}>
          <h2 className="section-title">Review</h2>
          <p>
            <strong>{release.title.trim() || "Untitled release"}</strong>{" "}
            <span className="muted">
              · {TYPES.find((type) => type.value === release.type)?.label} · {rows.length}{" "}
              {rows.length === 1 ? "track" : "tracks"}
            </span>
          </p>

          <ol style={{ display: "flex", flexDirection: "column", gap: "0.4rem", listStyle: "none", padding: 0, margin: 0 }}>
            {rows.map((row, index) => {
              const rowGenres = effectiveGenres(row, release)
                .map((code) => genres.find((genre) => genre.code === code)?.label ?? code)
                .join(", ");
              return (
                <li key={row.key} className="list-row">
                  <span style={{ width: 24, textAlign: "right" }} className="muted">
                    {index + 1}
                  </span>
                  <span className="list-row__main">
                    {row.title.trim() || "Untitled"}
                    <span className="muted" style={{ display: "block", fontSize: "0.75rem" }}>
                      {[rowGenres, row.credits.length > 0 ? `feat. ${row.credits.map((credit) => credit.name).join(", ")}` : ""]
                        .filter(Boolean)
                        .join(" · ") || "No genre yet"}
                    </span>
                  </span>
                  <span
                    role={row.status === "failed" ? "alert" : "status"}
                    style={{
                      fontSize: "0.8125rem",
                      color:
                        row.status === "failed"
                          ? "var(--vynl-erreur)"
                          : row.status === "done"
                            ? "var(--vynl-succes)"
                            : "var(--vynl-texte-2)",
                    }}
                  >
                    {row.status === "waiting" ? formatFileSize(row.file.size) : STATUS_LABEL[row.status]}
                  </span>
                  {row.error && (
                    <span style={{ flexBasis: "100%", color: "var(--vynl-erreur)", fontSize: "0.8125rem" }}>{row.error}</span>
                  )}
                </li>
              );
            })}
          </ol>

          {hybrids > 0 && (
            <p className="muted" style={{ fontSize: "0.8125rem" }}>
              {hybrids === 1 ? "1 track is" : `${hybrids} tracks are`} declared AI-assisted: saved, but not accepted for
              review during the beta (AI-generated music only).
            </p>
          )}
          {problems.length > 0 && !started && (
            <ul style={{ color: "var(--vynl-erreur)", fontSize: "0.875rem", paddingLeft: "1.1rem", margin: 0 }}>
              {problems.map((problem) => (
                <li key={problem}>{problem}</li>
              ))}
            </ul>
          )}
          {notice && <p style={{ color: "var(--vynl-alerte)", fontSize: "0.875rem" }}>{notice}</p>}
          {error && (
            <p role="alert" style={{ color: "var(--vynl-erreur)" }}>
              {error}
            </p>
          )}

          <p className="muted" style={{ fontSize: "0.8125rem" }}>
            Everything is created as a draft: you add the cover and submit for review yourself afterwards.
          </p>
          <div style={{ display: "flex", gap: "var(--space-sm)", flexWrap: "wrap" }}>
            <button type="button" className="btn btn-secondary" disabled={busy || started} onClick={() => setStep("tracks")}>
              Back
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy || (problems.length > 0 && !started)}
              onClick={run}
            >
              {busy ? "Creating…" : started ? "Retry the failed tracks" : `Create the release and upload ${rows.length === 1 ? "the file" : `${rows.length} files`}`}
            </button>
            {started && !busy && releaseId && (
              <button type="button" className="btn btn-secondary" onClick={() => router.push(`/releases/${releaseId}`)}>
                Open the release
              </button>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function ProvenanceChoice({
  value,
  onChange,
  legend,
}: {
  value: Provenance | null;
  onChange: (next: Provenance) => void;
  legend: string;
}) {
  return (
    <fieldset style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
      <legend style={{ fontSize: "0.8125rem", color: "var(--vynl-texte-2)", marginBottom: "0.4rem", padding: 0 }}>
        {legend} <span style={{ color: "var(--vynl-texte-3)" }}>(AI declaration, required)</span>
      </legend>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {(
          [
            { value: "ai", label: "AI-generated" },
            { value: "hybrid", label: "AI-assisted" },
          ] as const
        ).map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={value === option.value}
            className={`pill${value === option.value ? " active" : ""}`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      {value === "hybrid" && (
        <p className="muted" style={{ fontSize: "0.8125rem", marginTop: "0.4rem" }}>
          AI-assisted tracks are saved, but they are not accepted during the beta: Vynl publishes AI-generated music only
          for now.
        </p>
      )}
    </fieldset>
  );
}

function TrackRow({
  row,
  index,
  count,
  release,
  genres,
  locked,
  onChange,
  onMove,
  onRemove,
}: {
  row: Row;
  index: number;
  count: number;
  release: ReleaseFields;
  genres: Genre[];
  /** La release existe déjà : l'ordre et la liste des fichiers ne bougent plus. */
  locked: boolean;
  onChange: (patch: Partial<Row>) => void;
  onMove: (to: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="dash-card" style={{ ...sectionStyle, padding: "var(--space-sm) var(--space-md)" }}>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
        <span className="muted" style={{ width: 24, textAlign: "right" }}>
          {index + 1}
        </span>
        <input
          type="text"
          value={row.title}
          maxLength={200}
          aria-label={`Title of track ${index + 1}`}
          disabled={row.trackId !== null}
          onChange={(e) => onChange({ title: e.target.value })}
          className="input-field"
          style={{ flex: 1, minWidth: 180 }}
        />
        {!locked && (
          <>
            <button type="button" className="btn-plain" aria-label="Move up" disabled={index === 0} onClick={() => onMove(index - 1)}>
              ↑
            </button>
            <button
              type="button"
              className="btn-plain"
              aria-label="Move down"
              disabled={index === count - 1}
              onClick={() => onMove(index + 1)}
            >
              ↓
            </button>
            <button type="button" className="btn-plain" style={{ color: "var(--vynl-texte-2)" }} onClick={onRemove}>
              Remove
            </button>
          </>
        )}
      </div>
      <p className="muted" style={{ fontSize: "0.75rem" }}>
        {row.file.name} · {formatFileSize(row.file.size)}
      </p>
      <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--vynl-texte-2)" }}>
        <input
          type="checkbox"
          checked={row.explicit}
          disabled={row.trackId !== null}
          onChange={(e) => onChange({ explicit: e.target.checked })}
        />
        Explicit content
      </label>

      <details>
        <summary style={{ cursor: "pointer", color: "var(--vynl-texte-2)" }}>
          Genres, tags, featured artists and AI declaration for this track
        </summary>
        <div style={{ ...sectionStyle, marginTop: "var(--space-sm)" }}>
          {genres.length > 0 && (
            <div style={fieldStyle}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--vynl-texte-2)" }}>
                <input
                  type="checkbox"
                  checked={row.genres === null}
                  disabled={row.trackId !== null}
                  onChange={(e) => onChange({ genres: e.target.checked ? null : [...release.genres] })}
                />
                Same genres as the release
              </label>
              {row.genres === null ? (
                <span className="muted" style={{ fontSize: "0.8125rem" }}>
                  {effectiveGenres(row, release)
                    .map((code) => genres.find((genre) => genre.code === code)?.label ?? code)
                    .join(", ") || "None chosen yet"}
                </span>
              ) : (
                <GenrePicker genres={genres} selected={row.genres} onChange={(next) => onChange({ genres: next })} />
              )}
            </div>
          )}

          <div style={fieldStyle}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--vynl-texte-2)" }}>
              <input
                type="checkbox"
                checked={row.tags === null}
                disabled={row.trackId !== null}
                onChange={(e) => onChange({ tags: e.target.checked ? null : [...release.tags] })}
              />
              Same style tags as the release
            </label>
            {row.tags === null ? (
              <span className="muted" style={{ fontSize: "0.8125rem" }}>
                {effectiveTags(row, release).join(", ") || "None"}
              </span>
            ) : (
              <TagsInput tags={row.tags} onChange={(next) => onChange({ tags: next })} />
            )}
          </div>

          <CreditsEditor credits={row.credits} onChange={(next) => onChange({ credits: next })} />

          <label style={fieldStyle}>
            <span style={labelStyle}>AI declaration</span>
            <select
              value={row.provenance}
              disabled={row.trackId !== null}
              onChange={(e) => onChange({ provenance: e.target.value as Row["provenance"] })}
              className="input-field"
            >
              <option value="inherit">
                Same as the release ({effectiveProvenance(row, release) === "ai" ? "AI-generated" : effectiveProvenance(row, release) === "hybrid" ? "AI-assisted" : "not chosen yet"})
              </option>
              <option value="ai">AI-generated</option>
              <option value="hybrid">AI-assisted</option>
            </select>
          </label>
        </div>
      </details>
    </div>
  );
}

const sectionStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "var(--space-sm)" };
const fieldStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "0.35rem" };
const labelStyle: React.CSSProperties = { fontSize: "0.8125rem", color: "var(--vynl-texte-2)" };

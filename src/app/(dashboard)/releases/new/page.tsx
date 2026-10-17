import { requireArtist } from "@/lib/session";
import { loadGenres } from "@/lib/genres";
import { NewReleaseForm } from "./NewReleaseForm";
import { ReleaseWizard } from "./ReleaseWizard";

export default async function NewReleasePage() {
  await requireArtist();
  const genres = await loadGenres();

  return (
    <div style={{ maxWidth: 720, display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
      <div>
        <h1 style={{ fontSize: "1.75rem" }}>New release</h1>
        <p className="muted" style={{ marginTop: "0.25rem" }}>
          Create a single, EP or album and upload its tracks in one go. Everything is saved as a draft: you add the
          cover and submit it for review yourself afterwards.
        </p>
      </div>
      <ReleaseWizard genres={genres} />
      <details>
        <summary style={{ cursor: "pointer", color: "var(--vynl-texte-2)" }}>
          Just create an empty release for now (add the tracks later)
        </summary>
        <div style={{ maxWidth: 480, marginTop: "var(--space-sm)" }}>
          <NewReleaseForm />
        </div>
      </details>
    </div>
  );
}

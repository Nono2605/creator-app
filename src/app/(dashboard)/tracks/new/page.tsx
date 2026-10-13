import { requireArtist } from "@/lib/session";
import { loadGenres } from "@/lib/genres";
import { NewTrackForm } from "./NewTrackForm";

export default async function NewTrackPage() {
  await requireArtist();
  const genres = await loadGenres();

  return (
    <div style={{ maxWidth: 480, margin: "var(--space-xl) auto", padding: "0 var(--space-md)" }}>
      <h1 style={{ fontSize: "1.75rem", marginBottom: "var(--space-md)" }}>New track</h1>
      <NewTrackForm genres={genres} />
    </div>
  );
}

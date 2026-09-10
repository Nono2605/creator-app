import { requireArtist } from "@/lib/session";
import { NewReleaseForm } from "./NewReleaseForm";

export default async function NewReleasePage() {
  await requireArtist();

  return (
    <div style={{ maxWidth: 480 }}>
      <h1 style={{ fontSize: "1.75rem", marginBottom: "var(--space-md)" }}>New release</h1>
      <NewReleaseForm />
    </div>
  );
}

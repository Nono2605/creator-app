import type { StatsResult } from "@/lib/stats";

// Les trois situations où il n'y a pas de graphique à montrer : pas encore de
// statistiques côté serveur, une panne, ou simplement aucune écoute.
export function StatsNotice({ result }: { result: Exclude<StatsResult, { status: "ok" }> }) {
  if (result.status === "unavailable") {
    return (
      <div className="dash-card coming-soon">
        <span className="status status--soon">Coming</span>
        <p style={{ maxWidth: "52ch" }}>
          Listening stats aren&apos;t available yet. They&apos;ll appear here as soon as the latest update is live.
        </p>
      </div>
    );
  }

  return (
    <div className="dash-card">
      <p style={{ color: "var(--vynl-erreur)" }}>{result.message}</p>
    </div>
  );
}

export function NoListens() {
  return (
    <div className="dash-card coming-soon">
      <h2 className="section-title" style={{ marginBottom: 0 }}>
        No listens yet
      </h2>
      <p style={{ maxWidth: "52ch" }}>
        A listen is counted once someone plays one of your published tracks for 30 seconds or more. As soon as that
        happens, your stats show up here.
      </p>
    </div>
  );
}

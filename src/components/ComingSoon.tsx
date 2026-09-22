// Même badge que vynl.com/creators.html pour "Revenue & wallet" — la même
// fonctionnalité, vue depuis l'app plutôt que la vitrine.
export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div style={{ maxWidth: "var(--content-max-width)" }}>
      <h1 style={{ fontSize: "1.75rem", marginBottom: "var(--space-md)" }}>{title}</h1>
      <div className="dash-card coming-soon">
        <span className="status status--soon">Coming</span>
        <p style={{ maxWidth: "48ch" }}>{description}</p>
      </div>
    </div>
  );
}

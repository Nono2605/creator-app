export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div style={{ maxWidth: "var(--content-max-width)" }}>
      <h1 style={{ fontSize: "1.75rem", marginBottom: "var(--space-md)" }}>{title}</h1>
      <div className="dash-card coming-soon">
        <span className="badge">Coming soon</span>
        <p style={{ maxWidth: "48ch" }}>{description}</p>
      </div>
    </div>
  );
}

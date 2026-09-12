export function BreakdownBars({ items }: { items: { label: string; count: number }[] }) {
  const max = Math.max(...items.map((i) => i.count), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
      {items.map((item) => (
        <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
          <span style={{ width: 110, flex: "none", fontSize: "0.875rem", textTransform: "capitalize" }}>
            {item.label.replace("_", " ")}
          </span>
          <div style={{ flex: 1, height: 8, borderRadius: 999, background: "var(--color-border)", overflow: "hidden" }}>
            <div
              style={{
                width: `${(item.count / max) * 100}%`,
                height: "100%",
                background: "var(--gradient-signature)",
                borderRadius: 999,
              }}
            />
          </div>
          <span style={{ width: 28, flex: "none", textAlign: "right", fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
            {item.count}
          </span>
        </div>
      ))}
    </div>
  );
}

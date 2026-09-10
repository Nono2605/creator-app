const COLORS: Record<string, string> = {
  draft: "var(--color-text-muted)",
  in_review: "var(--color-blue-bright)",
  published: "#3ddc97",
  archived: "var(--color-text-muted)",
};

export function StatusBadge({ status }: { status: string }) {
  const color = COLORS[status] ?? "var(--color-text-muted)";

  return (
    <span
      style={{
        display: "inline-block",
        padding: "0.15rem 0.6rem",
        borderRadius: "999px",
        fontSize: "0.75rem",
        fontWeight: 600,
        color,
        border: `1px solid ${color}`,
        textTransform: "capitalize",
      }}
    >
      {status.replace("_", " ")}
    </span>
  );
}

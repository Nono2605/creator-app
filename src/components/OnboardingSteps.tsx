// Les trois étapes pour devenir créateur : le compte Vynl (déjà fait quand on arrive ici), les CGU
// créateur, puis le nom d'artiste. Montre où l'on en est et que le compte, lui, existe déjà.
const STEPS = [
  { key: "account", label: "Account" },
  { key: "terms", label: "Creator terms" },
  { key: "artist", label: "Artist name" },
] as const;

export function OnboardingSteps({ current }: { current: "terms" | "artist" }) {
  const currentIndex = STEPS.findIndex((step) => step.key === current);

  return (
    <ol
      aria-label="Steps to become a creator"
      style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem 1rem", listStyle: "none", padding: 0, margin: "0 0 var(--space-md)" }}
    >
      {STEPS.map((step, index) => {
        const done = index < currentIndex;
        const active = index === currentIndex;
        return (
          <li
            key={step.key}
            aria-current={active ? "step" : undefined}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              fontSize: "0.8125rem",
              color: active ? "var(--vynl-texte)" : done ? "var(--vynl-succes)" : "var(--vynl-texte-3)",
              fontWeight: active ? 600 : 400,
            }}
          >
            <span
              aria-hidden="true"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 20,
                height: 20,
                borderRadius: "50%",
                fontSize: "0.6875rem",
                border: `1px solid ${active ? "var(--vynl-cyan)" : done ? "var(--vynl-succes)" : "var(--vynl-bordure)"}`,
              }}
            >
              {done ? "✓" : index + 1}
            </span>
            {step.label}
            {done && <span className="sr-only"> (done)</span>}
          </li>
        );
      })}
    </ol>
  );
}

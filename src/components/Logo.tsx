// Même marque que vynl.com : les sillons concentriques plutôt qu'un disque
// dessiné à plat, le point cuivre au centre, "Vynl" en Fraunces italique.
export function Logo({ wordmark = "Vynl" }: { wordmark?: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.55rem" }}>
      <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true">
        <circle cx="16" cy="16" r="14.5" fill="none" stroke="currentColor" strokeOpacity=".35" />
        <circle cx="16" cy="16" r="9.5" fill="none" stroke="currentColor" strokeOpacity=".6" />
        <circle cx="16" cy="16" r="4.5" fill="none" stroke="currentColor" />
        <circle cx="16" cy="16" r="1.7" fill="var(--copper)" />
      </svg>
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontStyle: "italic",
          fontWeight: 500,
          fontSize: "1.35rem",
          lineHeight: 1,
        }}
      >
        {wordmark}
      </span>
    </span>
  );
}

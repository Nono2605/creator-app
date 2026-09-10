"use client";

// Filet de sécurité si la mise en page racine elle-même échoue —
// sans ça, une erreur ici produirait un écran blanc sans recours.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          background: "#05070d",
          color: "#f7f9fc",
          fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Something went wrong</h1>
          <button
            type="button"
            onClick={reset}
            style={{
              padding: "0.75rem 1rem",
              borderRadius: 8,
              border: "none",
              background: "linear-gradient(135deg, #1683ff 0%, #7047ff 100%)",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}

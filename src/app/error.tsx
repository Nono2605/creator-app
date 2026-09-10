"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div
      style={{
        maxWidth: 400,
        margin: "var(--space-xl) auto",
        padding: "0 var(--space-md)",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: "1.5rem", marginBottom: "var(--space-sm)" }}>Something went wrong</h1>
      <p style={{ color: "var(--color-text-muted)", marginBottom: "var(--space-md)" }}>
        Please try again in a moment.
      </p>
      <button type="button" onClick={reset} className="btn btn-primary">
        Try again
      </button>
    </div>
  );
}

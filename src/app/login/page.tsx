"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login } from "@/app/actions/auth";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <div style={{ maxWidth: 400, margin: "var(--space-xl) auto", padding: "0 var(--space-md)" }}>
      <h1 style={{ fontSize: "1.75rem", marginBottom: "var(--space-md)" }}>Log in</h1>
      <form action={action} style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
        <input type="email" name="email" placeholder="Email" required style={inputStyle} />
        <input type="password" name="password" placeholder="Password" required style={inputStyle} />
        {state?.error && <p style={{ color: "#ff6b6b" }}>{state.error}</p>}
        <button type="submit" disabled={pending} style={buttonStyle}>
          {pending ? "Logging in…" : "Log in"}
        </button>
      </form>
      <p style={{ marginTop: "var(--space-md)", color: "var(--color-text-muted)" }}>
        No account?{" "}
        <Link href="/signup" style={{ color: "var(--color-blue-bright)" }}>
          Sign up
        </Link>
      </p>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "0.75rem 1rem",
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--color-border)",
  background: "var(--color-card)",
  color: "var(--color-text)",
};

const buttonStyle: React.CSSProperties = {
  padding: "0.75rem 1rem",
  borderRadius: "var(--radius-sm)",
  border: "none",
  background: "var(--gradient-signature)",
  color: "#fff",
  fontWeight: 600,
  cursor: "pointer",
};

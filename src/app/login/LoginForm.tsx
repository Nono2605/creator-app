"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login } from "@/app/actions/auth";
import { Logo } from "@/components/Logo";

export function LoginForm({ notice }: { notice: string | null }) {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <div className="bg-signature" style={{ maxWidth: 400, margin: "var(--space-xl) auto", padding: "0 var(--space-md)" }}>
      <div style={{ marginBottom: "var(--space-lg)" }}>
        <Logo />
      </div>
      <h1 className="display-title" style={{ marginBottom: "var(--space-xs)" }}>Log in</h1>
      {/* Le compte est celui de l'app d'écoute : on le dit avant que la personne n'en crée un deuxième. */}
      <p style={{ color: "var(--vynl-texte-2)", marginBottom: "var(--space-md)" }}>
        Use your Vynl account: the same email and password as in the listening app.
      </p>
      {notice && (
        <p role="status" style={{ color: "var(--vynl-succes)", marginBottom: "var(--space-sm)" }}>
          {notice}
        </p>
      )}
      <form action={action} style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
        <input type="email" name="email" placeholder="Email" required autoComplete="email" className="input-field" />
        <input
          type="password"
          name="password"
          placeholder="Password"
          required
          autoComplete="current-password"
          className="input-field"
        />
        {state?.error && (
          <p role="alert" style={{ color: "var(--vynl-erreur)" }}>
            {state.error}
          </p>
        )}
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Logging in…" : "Log in"}
        </button>
      </form>
      <p style={{ marginTop: "var(--space-md)", color: "var(--vynl-texte-2)" }}>
        New to Vynl?{" "}
        <Link href="/signup" className="text-link">
          Create an account
        </Link>{" "}
        — it works for listening and creating.
      </p>
    </div>
  );
}

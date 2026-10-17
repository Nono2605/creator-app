"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup } from "@/app/actions/auth";
import { Logo } from "@/components/Logo";

export default function SignupPage() {
  const [state, action, pending] = useActionState(signup, undefined);

  return (
    <div className="bg-signature" style={{ maxWidth: 400, margin: "var(--space-xl) auto", padding: "0 var(--space-md)" }}>
      <div style={{ marginBottom: "var(--space-lg)" }}>
        <Logo />
      </div>
      <h1 className="display-title" style={{ marginBottom: "var(--space-sm)" }}>Create your Vynl account</h1>

      {/* Un seul compte pour écouter et créer : l'auditeur qui a déjà un compte s'y connecte, il n'en crée pas un deuxième. */}
      <div style={noteStyle}>
        <p style={{ fontWeight: 600 }}>One account for listening and creating</p>
        <p style={{ color: "var(--vynl-texte-2)", fontSize: "0.875rem" }}>
          If you already listen on Vynl, log in with that account: the Studio just adds creator mode to it, and your
          library, playlists and follows stay as they are. No new account needed.
        </p>
        <Link href="/login" className="btn btn-secondary btn-sm" style={{ alignSelf: "flex-start" }}>
          I already have a Vynl account
        </Link>
      </div>

      <form action={action} style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
        <input type="email" name="email" placeholder="Email" required autoComplete="email" className="input-field" />
        <input
          type="password"
          name="password"
          placeholder="Password (min. 8 characters)"
          required
          minLength={8}
          autoComplete="new-password"
          className="input-field"
        />
        {state?.error && (
          <p role="alert" style={{ color: "var(--vynl-erreur)" }}>
            {state.error}
          </p>
        )}
        {state?.message && (
          <p role="status" style={{ color: "var(--vynl-succes)" }}>
            {state.message}
          </p>
        )}
        {state?.suggestLogin && (
          <Link href="/login" className="btn btn-secondary btn-sm" style={{ alignSelf: "flex-start" }}>
            Log in instead
          </Link>
        )}
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Creating account…" : "Create account"}
        </button>
        <p style={{ color: "var(--vynl-texte-2)", fontSize: "0.8125rem" }}>
          Next: accept the creator terms, then choose your artist name.
        </p>
      </form>
      <p style={{ marginTop: "var(--space-md)", color: "var(--vynl-texte-2)" }}>
        Already have an account?{" "}
        <Link href="/login" className="text-link">
          Log in
        </Link>
      </p>
    </div>
  );
}

const noteStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-xs)",
  padding: "var(--space-sm) var(--space-md)",
  marginBottom: "var(--space-md)",
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--vynl-bordure)",
  background: "var(--vynl-vinyle)",
};

"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup } from "@/app/actions/auth";
import { Logo } from "@/components/Logo";

export default function SignupPage() {
  const [state, action, pending] = useActionState(signup, undefined);

  return (
    <div style={{ maxWidth: 400, margin: "var(--space-xl) auto", padding: "0 var(--space-md)" }}>
      <div style={{ marginBottom: "var(--space-lg)" }}>
        <Logo />
      </div>
      <h1 style={{ fontSize: "1.75rem", marginBottom: "var(--space-md)" }}>Sign up</h1>
      <form action={action} style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
        <input type="email" name="email" placeholder="Email" required className="input-field" />
        <input
          type="password"
          name="password"
          placeholder="Password (min. 8 characters)"
          required
          minLength={8}
          className="input-field"
        />
        {state?.error && <p style={{ color: "var(--danger)" }}>{state.error}</p>}
        {state?.message && <p style={{ color: "var(--copper)" }}>{state.message}</p>}
        <button type="submit" disabled={pending} className="btn btn-primary" style={{ alignSelf: "flex-start" }}>
          {pending ? "Creating account…" : "Sign up"}
        </button>
      </form>
      <p style={{ marginTop: "var(--space-md)", color: "var(--cream-muted)" }}>
        Already have an account?{" "}
        <Link href="/login" className="text-link">
          Log in
        </Link>
      </p>
    </div>
  );
}

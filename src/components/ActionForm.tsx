"use client";

import { useActionState, type CSSProperties, type ReactNode } from "react";
import type { ActionResult } from "@/lib/actionResult";

// Un petit formulaire (un champ et son bouton) dont la Server Action renvoie son échec : le message
// s'affiche sous le champ. Voir ActionButton pour la raison.
export function ActionForm({
  action,
  submitLabel,
  pendingLabel,
  submitClassName = "btn btn-secondary",
  style,
  children,
}: {
  action: (formData: FormData) => Promise<ActionResult>;
  submitLabel: string;
  pendingLabel: string;
  submitClassName?: string;
  style?: CSSProperties;
  /** Les champs, placés sur la même ligne que le bouton. */
  children: ReactNode;
}) {
  const [result, formAction, pending] = useActionState<ActionResult | undefined, FormData>(
    async (_previous, formData) => action(formData),
    undefined
  );

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "0.35rem", ...style }}>
      <div style={{ display: "flex", gap: "var(--space-xs)" }}>
        {children}
        <button type="submit" className={submitClassName} disabled={pending}>
          {pending ? pendingLabel : submitLabel}
        </button>
      </div>
      {result && !result.ok && (
        <span role="alert" style={{ color: "var(--vynl-erreur)", fontSize: "0.8125rem" }}>
          {result.error}
        </span>
      )}
    </form>
  );
}

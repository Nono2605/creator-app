"use client";

import { useState, useTransition, type CSSProperties, type ReactNode } from "react";
import type { ActionResult } from "@/lib/actionResult";

const ERROR_STYLE: CSSProperties = { color: "var(--vynl-erreur)", fontSize: "0.8125rem" };

// Un bouton qui lance une Server Action et affiche sous lui le message d'échec qu'elle renvoie.
// Remplace `<form action={...}><button>` : une action qui LÈVE son erreur n'affiche, en production,
// que « Something went wrong » (Next masque le message). Le succès n'a rien à montrer : l'action
// rafraîchit la page elle-même (revalidatePath) ou redirige.
export function ActionButton({
  action,
  children,
  pendingLabel,
  className = "btn btn-primary",
  style,
}: {
  action: () => Promise<ActionResult>;
  children: ReactNode;
  /** Texte pendant l'envoi ; sans lui, le libellé ne change pas. */
  pendingLabel?: string;
  className?: string;
  style?: CSSProperties;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run() {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <span style={{ display: "inline-flex", flexDirection: "column", gap: "0.35rem", alignItems: "flex-start" }}>
      <button type="button" className={className} style={style} disabled={pending} onClick={run}>
        {pending && pendingLabel ? pendingLabel : children}
      </button>
      {error && (
        <span role="alert" style={ERROR_STYLE}>
          {error}
        </span>
      )}
    </span>
  );
}

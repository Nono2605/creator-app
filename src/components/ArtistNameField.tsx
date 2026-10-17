"use client";

import { useEffect, useState } from "react";
import { checkArtistNameAction } from "@/app/actions/artist";

type Check =
  | { kind: "available" }
  | { kind: "similar"; names: string[] }
  | { kind: "unavailable"; message: string; suggestions: string[] };

const HINT_STYLE = { fontSize: "0.8125rem", minHeight: "1.2em" } as const;

// Le champ « nom d'artiste » avec son contrôle en direct : libre, pris, réservé, ou proche d'un autre nom
// (auquel cas l'administration le relit avant que la page soit publique). Le serveur contrôle de toute
// façon à l'envoi ; ici on prévient avant, sans bloquer la saisie. `initialValue` : le nom actuel, qu'on
// ne contrôle pas contre lui-même.
export function ArtistNameField({
  initialValue = "",
  describedBy,
}: {
  initialValue?: string;
  describedBy?: string;
}) {
  const [value, setValue] = useState(initialValue);
  // Le dernier résultat reçu, avec le nom qu'il concerne : tant qu'il ne correspond pas à ce qui est tapé,
  // on affiche « Checking… » (l'état se déduit à l'affichage, jamais d'un setState dans l'effet).
  const [result, setResult] = useState<{ name: string; check: Check } | null>(null);

  const name = value.trim();
  const checkable = name.length >= 2 && name !== initialValue.trim();

  useEffect(() => {
    if (!checkable) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const answer = await checkArtistNameAction(name);
      if (cancelled || !answer.ok) return;
      if (!answer.available) {
        setResult({ name, check: { kind: "unavailable", message: answer.message, suggestions: answer.suggestions } });
      } else if (answer.similar.length > 0) {
        setResult({ name, check: { kind: "similar", names: answer.similar } });
      } else {
        setResult({ name, check: { kind: "available" } });
      }
    }, 450);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [name, checkable]);

  const check = checkable && result?.name === name ? result.check : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
      <input
        type="text"
        name="name"
        placeholder="Artist name"
        required
        minLength={2}
        maxLength={40}
        autoComplete="off"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-describedby={describedBy ? `${describedBy} artist-name-check` : "artist-name-check"}
        className="input-field"
      />
      <p id="artist-name-check" aria-live="polite" style={HINT_STYLE}>
        {checkable && !check && <span style={{ color: "var(--vynl-texte-2)" }}>Checking…</span>}
        {check?.kind === "available" && <span style={{ color: "var(--vynl-succes)" }}>Available.</span>}
        {check?.kind === "similar" && (
          <span style={{ color: "var(--vynl-alerte)" }}>
            Close to {check.names.map((similar) => `“${similar}”`).join(", ")}. You can use it: our team reviews the name
            before your page goes public.
          </span>
        )}
        {check?.kind === "unavailable" && (
          <span style={{ color: "var(--vynl-erreur)" }}>
            {check.message}
            {check.suggestions.length > 0 && ` Try: ${check.suggestions.join(", ")}.`}
          </span>
        )}
      </p>
    </div>
  );
}

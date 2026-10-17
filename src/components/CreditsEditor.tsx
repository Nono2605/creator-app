"use client";

import { useEffect, useState } from "react";
import { searchArtistsAction, type ArtistHit } from "@/app/actions/tracks";
import { CREDIT_ROLES, MAX_CREDITS, type CreditDraft, type CreditRole } from "@/lib/releaseMeta";

// Les artistes invités d'un morceau et ses autres crédits (producteur, auteur). On cherche d'abord parmi les
// artistes Vynl (leur page est alors liée) ; une personne qui n'a pas de page s'ajoute par son nom.
export function CreditsEditor({
  credits,
  onChange,
}: {
  credits: CreditDraft[];
  onChange: (next: CreditDraft[]) => void;
}) {
  const [role, setRole] = useState<CreditRole>("featured");
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<{ query: string; hits: ArtistHit[] } | null>(null);

  const q = query.trim();
  const searchable = q.length >= 2;

  useEffect(() => {
    if (!searchable) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const hits = await searchArtistsAction(q);
      if (!cancelled) setResult({ query: q, hits });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [q, searchable]);

  const linked = new Set(credits.map((credit) => credit.artistId).filter(Boolean));
  const hits = searchable && result?.query === q ? result.hits.filter((hit) => !linked.has(hit.id)) : null;
  const full = credits.length >= MAX_CREDITS;

  function add(credit: CreditDraft) {
    onChange([...credits, credit]);
    setQuery("");
    setResult(null);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <span style={{ fontSize: "0.8125rem", color: "var(--vynl-texte-2)" }}>
        Featured artists and credits <span style={{ color: "var(--vynl-texte-3)" }}>(optional)</span>
      </span>

      {credits.map((credit, index) => (
        <div key={`${credit.role}-${credit.artistId ?? credit.name}-${index}`} className="list-row">
          <span className="list-row__main">
            {credit.name}
            {credit.artistId && <span className="muted" style={{ marginLeft: "0.4rem", fontSize: "0.75rem" }}>Vynl artist</span>}
          </span>
          <select
            value={credit.role}
            aria-label={`Role of ${credit.name}`}
            className="input-field"
            style={{ width: "auto" }}
            onChange={(e) =>
              onChange(credits.map((item, i) => (i === index ? { ...item, role: e.target.value as CreditRole } : item)))
            }
          >
            {CREDIT_ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn-plain"
            style={{ color: "var(--vynl-texte-2)" }}
            onClick={() => onChange(credits.filter((_, i) => i !== index))}
          >
            Remove
          </button>
        </div>
      ))}

      {!full && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <select
              value={role}
              aria-label="Role of the next credit"
              className="input-field"
              style={{ width: "auto" }}
              onChange={(e) => setRole(e.target.value as CreditRole)}
            >
              {CREDIT_ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={query}
              maxLength={60}
              placeholder="Search a Vynl artist or type a name"
              aria-label="Search a Vynl artist or type a name"
              className="input-field"
              style={{ flex: 1, minWidth: 180 }}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          {searchable && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }} aria-live="polite">
              {hits === null && <span className="muted" style={{ fontSize: "0.8125rem" }}>Searching…</span>}
              {hits?.map((hit) => (
                <button
                  key={hit.id}
                  type="button"
                  className="list-row"
                  style={{ textAlign: "left", cursor: "pointer", background: "transparent", color: "inherit", font: "inherit", width: "100%" }}
                  onClick={() => add({ role, artistId: hit.id, name: hit.name })}
                >
                  <span className="list-row__main">{hit.name}</span>
                  <span className="muted" style={{ fontSize: "0.75rem" }}>Vynl artist</span>
                </button>
              ))}
              {hits !== null && hits.length === 0 && (
                <span className="muted" style={{ fontSize: "0.8125rem" }}>No Vynl artist with this name.</span>
              )}
              <button
                type="button"
                className="btn-plain text-link"
                style={{ alignSelf: "flex-start", fontSize: "0.8125rem" }}
                onClick={() => add({ role, artistId: null, name: q })}
              >
                Add “{q}” without a Vynl page
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

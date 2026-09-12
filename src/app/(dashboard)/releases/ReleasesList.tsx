"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";

export interface Release {
  id: string;
  title: string;
  type: string;
  status: string;
  cover_url: string | null;
  release_date: string | null;
  created_at: string;
}

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "title-asc", label: "Title (A–Z)" },
  { value: "title-desc", label: "Title (Z–A)" },
  { value: "status", label: "Status" },
  { value: "type", label: "Release type" },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]["value"];

// Ordre de progression logique du flux créateur plutôt qu'alphabétique.
const STATUS_ORDER: Record<string, number> = { draft: 0, in_review: 1, published: 2, archived: 3 };

// Même ordre que le sélecteur de type sur /releases/new.
const TYPE_ORDER: Record<string, number> = { single: 0, ep: 1, album: 2, compilation: 3 };

function sortReleases(releases: Release[], sort: SortValue): Release[] {
  const sorted = [...releases];
  switch (sort) {
    case "newest":
      return sorted.sort((a, b) => b.created_at.localeCompare(a.created_at));
    case "oldest":
      return sorted.sort((a, b) => a.created_at.localeCompare(b.created_at));
    case "title-asc":
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case "title-desc":
      return sorted.sort((a, b) => b.title.localeCompare(a.title));
    case "status":
      return sorted.sort((a, b) => (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99));
    case "type":
      return sorted.sort((a, b) => (TYPE_ORDER[a.type] ?? 98) - (TYPE_ORDER[b.type] ?? 98));
  }
}

export function ReleasesList({ releases }: { releases: Release[] }) {
  const [sort, setSort] = useState<SortValue>("newest");
  const sortedReleases = useMemo(() => sortReleases(releases, sort), [releases, sort]);

  if (releases.length === 0) {
    return (
      <div className="dash-card">
        <p style={{ color: "var(--color-text-muted)" }}>
          No releases yet. Group your tracks into an album, EP, or single.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.5rem" }}>
        <label htmlFor="release-sort" style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
          Sort by
        </label>
        <select
          id="release-sort"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortValue)}
          className="input-field"
          style={{ padding: "0.45rem 0.75rem", fontSize: "0.875rem" }}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="dash-card">
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {sortedReleases.map((release) => (
            <Link key={release.id} href={`/releases/${release.id}`} className="list-row" style={rowStyle}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  flex: "none",
                  borderRadius: "var(--radius-sm)",
                  background: release.cover_url
                    ? `url(${release.cover_url}) center/cover`
                    : "var(--gradient-signature)",
                }}
              />
              <span style={{ flex: 1 }}>{release.title}</span>
              <span style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem", textTransform: "capitalize" }}>
                {release.type}
              </span>
              <StatusBadge status={release.status} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

const rowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "var(--space-sm)",
  padding: "0.65rem var(--space-sm)",
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--color-border)",
};

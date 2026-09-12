"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDuration } from "@/lib/formatDuration";

export interface Track {
  id: string;
  title: string;
  status: string;
  duration_seconds: number | null;
  created_at: string;
  published_at: string | null;
  albums: { title: string; type: string } | null;
}

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "title-asc", label: "Title (A–Z)" },
  { value: "title-desc", label: "Title (Z–A)" },
  { value: "status", label: "Status" },
  { value: "release-type", label: "Release type" },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]["value"];

// Ordre de progression logique du flux créateur plutôt qu'alphabétique.
const STATUS_ORDER: Record<string, number> = { draft: 0, in_review: 1, published: 2, archived: 3 };

// Même ordre que le sélecteur de type sur /releases/new ; les morceaux pas
// encore rattachés à une release passent en dernier.
const RELEASE_TYPE_ORDER: Record<string, number> = { single: 0, ep: 1, album: 2, compilation: 3 };

function releaseTypeRank(track: Track): number {
  if (!track.albums) return 99;
  return RELEASE_TYPE_ORDER[track.albums.type] ?? 98;
}

function sortTracks(tracks: Track[], sort: SortValue): Track[] {
  const sorted = [...tracks];
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
    case "release-type":
      return sorted.sort((a, b) => releaseTypeRank(a) - releaseTypeRank(b));
  }
}

export function TracksList({ tracks }: { tracks: Track[] }) {
  const [sort, setSort] = useState<SortValue>("newest");
  const sortedTracks = useMemo(() => sortTracks(tracks, sort), [tracks, sort]);

  if (tracks.length === 0) {
    return (
      <div className="dash-card">
        <p style={{ color: "var(--color-text-muted)" }}>No tracks yet. Upload your first one.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.5rem" }}>
        <label htmlFor="track-sort" style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
          Sort by
        </label>
        <select
          id="track-sort"
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
          {sortedTracks.map((track) => (
            <Link key={track.id} href={`/tracks/${track.id}`} className="list-row" style={rowStyle}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div>{track.title}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                  {track.albums ? `${track.albums.title} · ${track.albums.type}` : "No release"}
                </div>
              </div>
              <span style={{ color: "var(--color-text-muted)", fontVariantNumeric: "tabular-nums", fontSize: "0.875rem" }}>
                {formatDuration(track.duration_seconds)}
              </span>
              <StatusBadge status={track.status} />
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

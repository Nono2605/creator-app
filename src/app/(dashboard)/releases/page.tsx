import Link from "next/link";
import { requireArtist } from "@/lib/session";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";

interface Release {
  id: string;
  title: string;
  type: string;
  status: string;
  cover_url: string | null;
  release_date: string | null;
}

export default async function ReleasesPage() {
  const { session, artist } = await requireArtist();
  const { data: releases } = await api.get<{ data: Release[] }>("/creator/albums", {
    accessToken: session.access_token,
  });

  return (
    <div style={{ maxWidth: "var(--content-max-width)", display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
      <div style={headerRowStyle}>
        <div>
          <h1 style={{ fontSize: "1.75rem" }}>Releases</h1>
          <p style={{ color: "var(--color-text-muted)" }}>{artist.name}</p>
        </div>
        <Link href="/releases/new" className="btn btn-primary">
          New release
        </Link>
      </div>

      <div className="dash-card">
        {releases.length === 0 ? (
          <p style={{ color: "var(--color-text-muted)" }}>
            No releases yet. Group your tracks into an album, EP, or single.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {releases.map((release) => (
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
        )}
      </div>
    </div>
  );
}

const headerRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "var(--space-sm)",
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "var(--space-sm)",
  padding: "0.65rem var(--space-sm)",
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--color-border)",
};

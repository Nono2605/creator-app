import Link from "next/link";
import { requireArtist } from "@/lib/session";
import { api } from "@/lib/api";
import { ReleasesList, type Release } from "./ReleasesList";

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

      <ReleasesList releases={releases} />
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

import Link from "next/link";
import { requireArtist } from "@/lib/session";
import { Sidebar } from "@/components/Sidebar";
import { Logo } from "@/components/Logo";
import { NameStatusBanner } from "@/components/NameStatusBanner";
import { logout } from "@/app/actions/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { artist } = await requireArtist();

  return (
    <div className="studio">
      <Sidebar />
      <div className="studio__main">
        <header className="studio__header">
          {/* Sur mobile la barre latérale devient la barre du bas : le logo
              remonte dans l'en-tête. */}
          <Link href="/" className="studio__brand-mobile" aria-label="Vynl Creator Studio — overview">
            <Logo />
          </Link>
          <Link href="/artist" className="studio__artist">
            <span
              className="avatar"
              style={artist.avatar_url ? { backgroundImage: `url(${artist.avatar_url})` } : undefined}
              aria-hidden="true"
            />
            <strong>{artist.name}</strong>
          </Link>
          <form action={logout}>
            <button type="submit" className="btn-plain" style={{ color: "var(--vynl-texte-2)" }}>
              Log out
            </button>
          </form>
        </header>
        <main className="studio__content">
          <NameStatusBanner artist={artist} />
          {children}
        </main>
      </div>
    </div>
  );
}

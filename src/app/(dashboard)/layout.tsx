import { requireArtist } from "@/lib/session";
import { Sidebar } from "@/components/Sidebar";
import { logout } from "@/app/actions/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { artist } = await requireArtist();

  return (
    <div style={{ display: "flex", flex: 1 }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <header style={headerStyle}>
          <span style={{ color: "var(--color-text-muted)" }}>
            Creator Studio — <strong style={{ color: "var(--color-text)" }}>{artist.name}</strong>
          </span>
          <form action={logout}>
            <button type="submit" className="btn-plain" style={{ color: "var(--color-text-muted)" }}>
              Log out
            </button>
          </form>
        </header>
        <main style={{ flex: 1, padding: "var(--space-lg)" }}>{children}</main>
      </div>
    </div>
  );
}

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "var(--space-md)",
  padding: "var(--space-sm) var(--space-lg)",
  borderBottom: "1px solid var(--color-border)",
};

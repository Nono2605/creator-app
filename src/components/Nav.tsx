import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { api } from "@/lib/api";
import { logout } from "@/app/actions/auth";

interface Me {
  profile: { username: string } | null;
}

export async function Nav() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  let displayName: string | null = null;
  if (session) {
    try {
      const me = await api.get<Me>("/me", { accessToken: session.access_token });
      displayName = me.profile?.username ?? session.user.email ?? null;
    } catch {
      displayName = session.user.email ?? null;
    }
  }

  return (
    <nav style={navStyle}>
      <Link href="/" style={brandStyle}>
        BRAND Creator
      </Link>
      <div style={{ display: "flex", gap: "var(--space-md)", alignItems: "center" }}>
        {session ? (
          <>
            <Link href="/tracks">Tracks</Link>
            <Link href="/tracks/new">New track</Link>
            <span style={{ color: "var(--color-text-muted)" }}>{displayName ?? "Account"}</span>
            <form action={logout}>
              <button type="submit" style={logoutButtonStyle}>
                Log out
              </button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login">Log in</Link>
            <Link href="/signup">Sign up</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export function NavFallback() {
  return (
    <nav style={navStyle}>
      <span style={brandStyle}>BRAND Creator</span>
      <div style={{ display: "flex", gap: "var(--space-md)", alignItems: "center" }} />
    </nav>
  );
}

const navStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "var(--space-sm) var(--space-lg)",
  borderBottom: "1px solid var(--color-border)",
};

const brandStyle: React.CSSProperties = {
  fontFamily: "var(--font-heading)",
  fontWeight: 700,
  fontSize: "1.125rem",
};

const logoutButtonStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "inherit",
  cursor: "pointer",
  font: "inherit",
  padding: 0,
};

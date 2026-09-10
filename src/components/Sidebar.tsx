"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: "▦" },
  { href: "/tracks", label: "Music", icon: "♪" },
  { href: "/releases", label: "Releases", icon: "⬆" },
  { href: "/audience", label: "Audience", icon: "◔" },
  { href: "/analytics", label: "Analytics", icon: "▤" },
  { href: "/revenue", label: "Revenue", icon: "↗" },
  { href: "/wallet", label: "Wallet", icon: "▣" },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav style={navStyle}>
      <Link href="/" style={brandStyle}>
        BRAND Creator
      </Link>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className={`sidebar-link${isActive ? " active" : ""}`}>
              <span aria-hidden>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

const navStyle: React.CSSProperties = {
  width: "var(--sidebar-width)",
  flex: "none",
  padding: "var(--space-md) var(--space-sm)",
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-md)",
  borderRight: "1px solid var(--color-border)",
  background: "var(--color-sidebar)",
};

const brandStyle: React.CSSProperties = {
  fontFamily: "var(--font-heading)",
  fontWeight: 700,
  fontSize: "1.0625rem",
  padding: "0 0.85rem",
};

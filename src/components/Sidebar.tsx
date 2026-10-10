"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";

// Icônes de la DA : style trait, 1,75 px, bouts arrondis, pas d'emoji. Mêmes
// glyphes que les cartes de vynl.com/creators.html.
const ICONS = {
  overview: (
    <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
      <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
    </svg>
  ),
  music: (
    <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
      <path d="M9 18V5l11-2v13" />
      <circle cx="6.5" cy="18" r="2.5" />
      <circle cx="17.5" cy="16" r="2.5" />
    </svg>
  ),
  releases: (
    <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  audience: (
    <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M16 4.5a3.5 3.5 0 0 1 0 7" />
      <path d="M18 14a6.5 6.5 0 0 1 3.5 6" />
    </svg>
  ),
  analytics: (
    <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
      <path d="M4 20V11" />
      <path d="M10 20V4" />
      <path d="M16 20v-6" />
      <path d="M21 20H3" />
    </svg>
  ),
  revenue: (
    <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M14.5 9a3 3 0 0 0-5 1.5c0 3 5 1.5 5 4.5a3 3 0 0 1-5 1.5" />
      <path d="M12 6.5V8M12 16v1.5" />
    </svg>
  ),
  wallet: (
    <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
      <rect x="3" y="6.5" width="18" height="12" rx="3" />
      <path d="M3 10h18" />
      <circle cx="16.5" cy="14.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
} as const;

// Sur mobile la barre du bas est limitée à 5 icônes (DA) : les deux pages
// « Coming » restent accessibles sur desktop uniquement.
const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: ICONS.overview, desktopOnly: false },
  { href: "/tracks", label: "Music", icon: ICONS.music, desktopOnly: false },
  { href: "/releases", label: "Releases", icon: ICONS.releases, desktopOnly: false },
  { href: "/audience", label: "Audience", icon: ICONS.audience, desktopOnly: false },
  { href: "/analytics", label: "Analytics", icon: ICONS.analytics, desktopOnly: false },
  { href: "/revenue", label: "Revenue", icon: ICONS.revenue, desktopOnly: true },
  { href: "/wallet", label: "Wallet", icon: ICONS.wallet, desktopOnly: true },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="sidebar" aria-label="Creator Studio">
      <Link href="/" className="sidebar__brand" aria-label="Vynl Creator Studio — overview">
        <Logo />
        <span className="sidebar__tag">Creator Studio</span>
      </Link>
      <div className="sidebar__links">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const classes = [
            "sidebar-link",
            isActive ? "active" : "",
            item.desktopOnly ? "sidebar-link--desktop-only" : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <Link key={item.href} href={item.href} className={classes} aria-current={isActive ? "page" : undefined}>
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

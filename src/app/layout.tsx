import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: "variable",
  style: ["normal", "italic"],
});

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Creator Studio — Vynl",
  description: "Upload tracks, build releases and declare how your music was made, on Vynl.",
};

// Coquille minimale : la navigation vit dans (dashboard)/layout.tsx (sidebar),
// propre aux pages authentifiées + artiste créé. Les pages hors de ce groupe
// (login, signup, onboarding) restent volontairement sans chrome partagé.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${ibmPlexSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}

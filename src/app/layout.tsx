import type { Metadata } from "next";
import { Dela_Gothic_One, Sora } from "next/font/google";
import "./globals.css";

// Dela Gothic One : logo et grands titres d'impact uniquement. Sora : tout le
// reste. Les deux sont exposées en variables CSS, lues dans globals.css.
const delaGothic = Dela_Gothic_One({
  weight: "400",
  variable: "--font-dela-gothic",
  subsets: ["latin"],
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
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
    <html lang="en" className={`${delaGothic.variable} ${sora.variable}`}>
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BRAND Creator",
  description: "Upload and manage your music on BRAND.",
};

// Coquille minimale : la navigation vit dans (dashboard)/layout.tsx (sidebar),
// propre aux pages authentifiées + artiste créé. Les pages hors de ce groupe
// (login, signup, onboarding) restent volontairement sans chrome partagé.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}

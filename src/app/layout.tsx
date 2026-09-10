import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import { Suspense } from "react";
import { Nav, NavFallback } from "@/components/Nav";
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <body>
        <Suspense fallback={<NavFallback />}>
          <Nav />
        </Suspense>
        <main style={{ flex: 1 }}>{children}</main>
      </body>
    </html>
  );
}

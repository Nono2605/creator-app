import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { api } from "@/lib/api";

export interface Me {
  id: string;
  email: string;
  role: "listener" | "creator" | "admin";
  profile: { username: string } | null;
}

export interface Artist {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  country: string | null;
  verified: boolean;
}

// Toutes ces fonctions sont enveloppées dans React `cache()` : le layout du
// dashboard ET chaque page appellent requireArtist() indépendamment (l'un
// pour le nom d'artiste dans l'en-tête, l'autre pour ses propres données).
// Sans dédup, ça double les appels à musicAPI (/me + /creator/artist) à
// chaque navigation — cache() garantit qu'ils ne s'exécutent qu'une seule
// fois par requête, quel que soit le nombre d'appels dans l'arbre de rendu.

export const requireSession = cache(async function requireSession() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/login");
  return session;
});

export const requireCreator = cache(async function requireCreator() {
  const session = await requireSession();
  const me = await api.get<Me>("/me", { accessToken: session.access_token });

  if (me.role !== "creator" && me.role !== "admin") {
    redirect("/onboarding");
  }

  return { session, me };
});

export const requireArtist = cache(async function requireArtist() {
  const { session, me } = await requireCreator();
  const artist = await api.get<Artist | null>("/creator/artist", {
    accessToken: session.access_token,
  });

  if (!artist) redirect("/onboarding");

  return { session, me, artist };
});

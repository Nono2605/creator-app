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

// À utiliser dans les Server Components de pages qui exigent une session.
export async function requireSession() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/login");
  return session;
}

// Session + rôle creator/admin. Renvoie vers /onboarding sinon (première
// étape : activer le mode créateur).
export async function requireCreator() {
  const session = await requireSession();
  const me = await api.get<Me>("/me", { accessToken: session.access_token });

  if (me.role !== "creator" && me.role !== "admin") {
    redirect("/onboarding");
  }

  return { session, me };
}

// Session + rôle + page artiste existante. Renvoie vers /onboarding sinon
// (deuxième étape : créer la page artiste).
export async function requireArtist() {
  const { session, me } = await requireCreator();
  const artist = await api.get<Artist | null>("/creator/artist", {
    accessToken: session.access_token,
  });

  if (!artist) redirect("/onboarding");

  return { session, me, artist };
}

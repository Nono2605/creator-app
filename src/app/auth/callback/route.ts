import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/authFlow";

// Arrivée du lien du courriel de confirmation envoyé à l'inscription : on échange le code contre une
// session, puis on envoie la personne à `next` (un chemin du site, jamais une adresse extérieure).
// Le code ne vaut que dans le navigateur où l'inscription a été faite : ailleurs, ou une fois expiré,
// l'adresse est tout de même confirmée, et on renvoie vers la connexion.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"), "/onboarding");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url));
  }

  return NextResponse.redirect(new URL("/login?notice=confirmed", url));
}

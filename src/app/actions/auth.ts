"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { friendlyLoginError, isExistingAccountError } from "@/lib/authFlow";

export interface AuthFormState {
  error?: string;
  message?: string;
  /** Vrai quand l'adresse a peut-être déjà un compte Vynl : l'écran propose alors de se connecter. */
  suggestLogin?: boolean;
}

// L'adresse du Studio telle que le visiteur la voit : sert à construire le lien du courriel de
// confirmation (voir /auth/callback). Supabase n'accepte que les adresses de sa liste « Redirect URLs » :
// une valeur détournée ne mènerait nulle part, et si l'adresse du Studio n'y figure pas, le lien
// retombe sur le site par défaut du projet.
async function siteOrigin(): Promise<string> {
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3001";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function login(
  _state: AuthFormState | undefined,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: friendlyLoginError(error) };
  }

  redirect("/");
}

export async function signup(
  _state: AuthFormState | undefined,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${await siteOrigin()}/auth/callback?next=/onboarding` },
  });

  if (error) {
    if (isExistingAccountError(error)) {
      return {
        error: "This email already has a Vynl account. It's the same account for listening and creating.",
        suggestLogin: true,
      };
    }
    return { error: error.message };
  }

  // Avec la confirmation par courriel, Supabase répond pareil que l'adresse existe déjà ou non (pour ne
  // pas révéler qui est inscrit) : le message vaut donc pour les deux cas.
  if (!data.session) {
    return {
      message:
        "Check your email to confirm your account. If this email already has a Vynl account, just log in: it's the same account.",
      suggestLogin: true,
    };
  }

  redirect("/onboarding");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

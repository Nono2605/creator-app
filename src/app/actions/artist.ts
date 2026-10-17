"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { api } from "@/lib/api";
import { BIO_MAX, COUNTRY_MAX } from "@/lib/artistProfile";

async function accessToken(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) redirect("/login");
  return session.access_token;
}

// L'en-tête (photo de l'artiste) est dans le layout : une modification du profil le rafraîchit aussi.
function revalidateProfile() {
  revalidatePath("/artist");
  revalidatePath("/", "layout");
}

export interface ArtistFormState {
  error?: string;
  message?: string;
}

export async function updateArtistProfile(
  _state: ArtistFormState | undefined,
  formData: FormData
): Promise<ArtistFormState> {
  const token = await accessToken();
  const bio = String(formData.get("bio") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim();
  if (bio.length > BIO_MAX) return { error: `The bio can have up to ${BIO_MAX} characters.` };
  if (country.length > COUNTRY_MAX) return { error: `The country can have up to ${COUNTRY_MAX} characters.` };

  try {
    await api.patch("/creator/artist", { bio, country }, { accessToken: token });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not update artist profile." };
  }

  revalidateProfile();
  return { message: "Profile updated." };
}

// Appelées depuis le navigateur (ProfileImageField) : elles RENVOIENT l'erreur au lieu de la
// lever, car Next masque le message des erreurs levées par une Server Action en production.

export type ArtistImageUploadTarget =
  | { ok: true; path: string; token: string; publicUrl: string }
  | { ok: false; error: string };

export async function getArtistImageUploadUrl(
  kind: "avatar" | "banner",
  contentType: string
): Promise<ArtistImageUploadTarget> {
  const token = await accessToken();
  try {
    const res = await api.post<{ path: string; token: string; publicUrl: string }>(
      "/creator/artist/upload-url",
      { kind, content_type: contentType },
      { accessToken: token }
    );
    return { ok: true, path: res.path, token: res.token, publicUrl: res.publicUrl };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not prepare the upload." };
  }
}

export type SaveArtistImageResult = { ok: true } | { ok: false; error: string };

// url = null retire l'image.
export async function saveArtistImage(
  kind: "avatar" | "banner",
  url: string | null
): Promise<SaveArtistImageResult> {
  const token = await accessToken();
  const field = kind === "avatar" ? "avatar_url" : "banner_url";
  try {
    await api.patch("/creator/artist", { [field]: url }, { accessToken: token });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not save the image." };
  }
  revalidateProfile();
  return { ok: true };
}

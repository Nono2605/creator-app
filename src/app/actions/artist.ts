"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { api } from "@/lib/api";
import { BIO_MAX, COUNTRY_MAX } from "@/lib/artistProfile";
import { failure } from "@/lib/actionResult";

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

// ── Nom d'artiste ───────────────────────────────────────────────────────
// Un nom proche d'un autre attend la décision de l'administration (page non publique, rien à soumettre
// d'ici là). Le contrôle en direct le dit AVANT que le créateur ne choisisse ; le nom accepté, lui, est
// permanent : seul un nom en attente ou refusé se change.

export type ArtistNameCheck =
  | { ok: true; available: true; similar: string[] }
  | { ok: true; available: false; message: string; suggestions: string[] }
  | { ok: false; error: string };

// Appelée depuis le navigateur pendant la saisie : elle RENVOIE l'échec au lieu de le lever.
export async function checkArtistNameAction(name: string): Promise<ArtistNameCheck> {
  const token = await accessToken();
  try {
    const res = await api.get<{
      available: boolean;
      message?: string;
      suggestions?: string[];
      similar?: string[];
    }>(`/creator/artist/name-check?name=${encodeURIComponent(name.slice(0, 100))}`, { accessToken: token });
    if (res.available) return { ok: true, available: true, similar: res.similar ?? [] };
    return {
      ok: true,
      available: false,
      message: res.message ?? "This name can't be used.",
      suggestions: res.suggestions ?? [],
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not check this name." };
  }
}

export async function renameArtistAction(
  _state: ArtistFormState | undefined,
  formData: FormData
): Promise<ArtistFormState> {
  const token = await accessToken();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Enter an artist name." };

  try {
    const artist = await api.patch<{ name_status?: string }>("/creator/artist/name", { name }, { accessToken: token });
    revalidateProfile();
    return {
      message:
        artist.name_status === "pending"
          ? "Saved. Our team will review this name before your page goes public."
          : "Your new artist name is saved.",
    };
  } catch (err) {
    const failed = failure(err, "Could not change the artist name. Please try again.");
    return { error: failed.ok ? "Could not change the artist name. Please try again." : failed.error };
  }
}

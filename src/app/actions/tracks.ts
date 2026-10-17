"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { api } from "@/lib/api";
import { failure, isUnavailable, OK, type ActionResult } from "@/lib/actionResult";

async function accessToken(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) redirect("/login");
  return session.access_token;
}

export interface TrackFormState {
  error?: string;
  trackId?: string;
}

// Crée un morceau en brouillon. Appelée directement depuis un composant
// client (pas de <form action>) pour pouvoir enchaîner sur l'upload.
export async function createTrackAction(
  _state: TrackFormState | undefined,
  formData: FormData
): Promise<TrackFormState> {
  const token = await accessToken();
  const title = String(formData.get("title") ?? "").trim();
  const explicit = formData.get("explicit") === "on";

  try {
    const track = await api.post<{ id: string }>(
      "/creator/tracks",
      { title, explicit },
      { accessToken: token }
    );
    // Le genre est posé juste après : s'il échoue, le brouillon existe quand même et le genre se choisit
    // sur la page du morceau (il est exigé seulement pour l'envoi en relecture).
    const genre = String(formData.get("genre") ?? "");
    if (genre) {
      try {
        await api.put(`/creator/tracks/${track.id}/genre`, { genre }, { accessToken: token });
      } catch {
        /* le créateur pourra le choisir sur la page du morceau */
      }
    }
    return { trackId: track.id };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not create track." };
  }
}

export interface UploadUrl {
  path: string;
  token: string;
  signedUrl: string;
}

// Les deux actions suivantes RENVOIENT leur échec au lieu de le lever : en production,
// Next masque le message d'une erreur levée par une Server Action, et le créateur ne
// verrait qu'une erreur générique au lieu de « ce fichier n'est pas de l'audio ».
export type UploadUrlResult = { ok: true; path: string; token: string } | { ok: false; error: string };

export async function getUploadUrl(trackId: string, filename: string): Promise<UploadUrlResult> {
  const token = await accessToken();
  try {
    const res = await api.post<UploadUrl>(
      `/creator/tracks/${trackId}/upload-url`,
      { filename },
      { accessToken: token }
    );
    return { ok: true, path: res.path, token: res.token };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not prepare the upload." };
  }
}

export type AttachFileResult = { ok: true } | { ok: false; error: string };

export async function attachFile(
  trackId: string,
  path: string,
  format: string,
  fileSizeBytes: number
): Promise<AttachFileResult> {
  const token = await accessToken();
  try {
    await api.post(
      `/creator/tracks/${trackId}/files`,
      { path, format, file_size_bytes: fileSizeBytes },
      { accessToken: token }
    );
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "The file could not be checked." };
  }
  revalidatePath(`/tracks/${trackId}`);
  revalidatePath("/tracks");
  return { ok: true };
}

// Les actions suivantes sont appelées depuis des composants client (ActionButton, ActionForm) et
// RENVOIENT leur échec comme les deux précédentes : sinon, en production, « Submit for review »
// refusé parce qu'il manque un genre ne montrerait qu'une erreur générique.

export async function updateTrackStatus(trackId: string, status: string): Promise<ActionResult> {
  const token = await accessToken();
  try {
    await api.patch(`/creator/tracks/${trackId}`, { status }, { accessToken: token });
  } catch (err) {
    return failure(err, "Could not update the track. Please try again.");
  }
  revalidatePath(`/tracks/${trackId}`);
  revalidatePath("/tracks");
  return OK;
}

export async function updateTrackTitleAction(trackId: string, formData: FormData): Promise<ActionResult> {
  const token = await accessToken();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { ok: false, error: "The title can't be empty." };
  try {
    await api.patch(`/creator/tracks/${trackId}`, { title }, { accessToken: token });
  } catch (err) {
    return failure(err, "Could not rename the track. Please try again.");
  }
  revalidatePath(`/tracks/${trackId}`);
  revalidatePath("/tracks");
  return OK;
}

// Le genre du morceau (liste fermée de l'API). Une valeur vide le retire.
export async function setTrackGenreAction(trackId: string, formData: FormData): Promise<ActionResult> {
  const token = await accessToken();
  const genre = String(formData.get("genre") ?? "");
  try {
    await api.put(`/creator/tracks/${trackId}/genre`, { genre: genre || null }, { accessToken: token });
  } catch (err) {
    return failure(err, "Could not save the genre. Please try again.");
  }
  revalidatePath(`/tracks/${trackId}`);
  return OK;
}

export async function deleteTrackAction(trackId: string): Promise<ActionResult> {
  const token = await accessToken();
  try {
    await api.delete(`/creator/tracks/${trackId}`, { accessToken: token });
  } catch (err) {
    return failure(err, "Could not delete the track. Please try again.");
  }
  revalidatePath("/tracks");
  redirect("/tracks");
}

export async function removeFile(trackId: string, fileId: string): Promise<ActionResult> {
  const token = await accessToken();
  try {
    await api.delete(`/creator/tracks/${trackId}/files/${fileId}`, { accessToken: token });
  } catch (err) {
    return failure(err, "Could not remove the file. Please try again.");
  }
  revalidatePath(`/tracks/${trackId}`);
  return OK;
}

export async function declareProvenance(
  trackId: string,
  provenance: "ai" | "hybrid",
  description: string
): Promise<ActionResult> {
  const token = await accessToken();
  try {
    await api.post(
      `/creator/tracks/${trackId}/declaration`,
      { provenance, description: description || undefined },
      { accessToken: token }
    );
  } catch (err) {
    return failure(err, "Could not save the declaration. Please try again.");
  }
  revalidatePath(`/tracks/${trackId}`);
  return OK;
}

// ── Détails d'un morceau : genres (jusqu'à 3), styles, artistes invités ──

export async function saveTrackDetails(
  trackId: string,
  details: {
    genres: string[];
    tags: string[];
    credits: { role: string; artist_id: string | null; name: string }[];
  }
): Promise<ActionResult> {
  const token = await accessToken();
  try {
    await api.put(`/creator/tracks/${trackId}/details`, details, { accessToken: token });
  } catch (err) {
    if (isUnavailable(err)) {
      return { ok: false, error: "This needs the latest database update (release details)." };
    }
    return failure(err, "Could not save the details. Please try again.");
  }
  revalidatePath(`/tracks/${trackId}`);
  return OK;
}

export interface ArtistHit {
  id: string;
  name: string;
  slug: string;
  avatar_url: string | null;
}

// Recherche d'un artiste Vynl à créditer, pendant la saisie. Ne lève jamais : une panne donne une liste vide.
export async function searchArtistsAction(query: string): Promise<ArtistHit[]> {
  const token = await accessToken();
  const q = query.trim().slice(0, 60);
  if (q.length < 2) return [];
  try {
    const { data } = await api.get<{ data: ArtistHit[] }>(`/creator/artists/search?q=${encodeURIComponent(q)}`, {
      accessToken: token,
    });
    return data;
  } catch {
    return [];
  }
}

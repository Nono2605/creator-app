"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { api } from "@/lib/api";
import { failure, OK, type ActionResult } from "@/lib/actionResult";

async function accessToken(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) redirect("/login");
  return session.access_token;
}

export interface ReleaseFormState {
  error?: string;
  releaseId?: string;
}

export async function createReleaseAction(
  _state: ReleaseFormState | undefined,
  formData: FormData
): Promise<ReleaseFormState> {
  const token = await accessToken();
  const title = String(formData.get("title") ?? "").trim();
  const type = String(formData.get("type") ?? "single");
  if (!title) return { error: "Title is required." };

  try {
    const release = await api.post<{ id: string }>(
      "/creator/albums",
      { title, type },
      { accessToken: token }
    );
    return { releaseId: release.id };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not create release." };
  }
}

// ── Pochette ────────────────────────────────────────────────────────────
// Appelées depuis le navigateur (CoverField) : elles RENVOIENT l'erreur au lieu de la lever,
// car Next masque le message des erreurs levées par une Server Action en production.

export type CoverUploadTarget =
  | { ok: true; path: string; token: string; publicUrl: string }
  | { ok: false; error: string };

export async function getCoverUploadUrl(releaseId: string, contentType: string): Promise<CoverUploadTarget> {
  const token = await accessToken();
  try {
    const res = await api.post<{ path: string; token: string; publicUrl: string }>(
      `/creator/albums/${releaseId}/cover-upload-url`,
      { content_type: contentType },
      { accessToken: token }
    );
    return { ok: true, path: res.path, token: res.token, publicUrl: res.publicUrl };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not prepare the upload." };
  }
}

export type SaveCoverResult = { ok: true } | { ok: false; error: string };

// url = null retire la pochette.
export async function saveReleaseCover(releaseId: string, url: string | null): Promise<SaveCoverResult> {
  const token = await accessToken();
  try {
    await api.patch(`/creator/albums/${releaseId}`, { cover_url: url }, { accessToken: token });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not save the cover." };
  }
  revalidatePath(`/releases/${releaseId}`);
  revalidatePath("/releases");
  return { ok: true };
}

export interface MakeSingleState {
  error?: string;
}

// Un morceau seul n'a pas de pochette (elle appartient à la release). Ce bouton, déclenché
// par le créateur sur un morceau précis, crée un single au nom du morceau et l'y place.
export async function makeSingleFromTrack(
  trackId: string,
  title: string,
  _state: MakeSingleState | undefined
): Promise<MakeSingleState> {
  const token = await accessToken();
  let releaseId: string;
  try {
    const release = await api.post<{ id: string }>(
      "/creator/albums",
      { title, type: "single" },
      { accessToken: token }
    );
    releaseId = release.id;
    try {
      await api.patch(`/creator/tracks/${trackId}`, { album_id: releaseId }, { accessToken: token });
    } catch (err) {
      // Pas de single vide qui traîne si le rattachement échoue.
      await api.delete(`/creator/albums/${releaseId}`, { accessToken: token }).catch(() => {});
      throw err;
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not create the single." };
  }
  revalidatePath(`/tracks/${trackId}`);
  revalidatePath("/tracks");
  revalidatePath("/releases");
  redirect(`/releases/${releaseId}`);
}

// Appelées depuis des composants client (ActionButton) : elles RENVOIENT leur échec, car en
// production Next masque le message d'une erreur levée. L'API dit précisément ce qui manque
// (« 2 tracks cannot be reviewed yet… ») : le créateur le lit sous le bouton.

export async function updateReleaseStatus(releaseId: string, status: string): Promise<ActionResult> {
  const token = await accessToken();
  try {
    await api.patch(`/creator/albums/${releaseId}`, { status }, { accessToken: token });
  } catch (err) {
    return failure(err, "Could not update the release. Please try again.");
  }
  revalidatePath(`/releases/${releaseId}`);
  revalidatePath("/releases");
  return OK;
}

export async function deleteReleaseAction(releaseId: string): Promise<ActionResult> {
  const token = await accessToken();
  try {
    await api.delete(`/creator/albums/${releaseId}`, { accessToken: token });
  } catch (err) {
    return failure(err, "Could not delete the release. Please try again.");
  }
  revalidatePath("/releases");
  redirect("/releases");
}

export async function assignTrackToRelease(trackId: string, releaseId: string): Promise<ActionResult> {
  const token = await accessToken();
  try {
    await api.patch(`/creator/tracks/${trackId}`, { album_id: releaseId }, { accessToken: token });
  } catch (err) {
    return failure(err, "Could not add the track. Please try again.");
  }
  revalidatePath(`/releases/${releaseId}`);
  return OK;
}

export async function removeTrackFromRelease(trackId: string, releaseId: string): Promise<ActionResult> {
  const token = await accessToken();
  try {
    await api.patch(`/creator/tracks/${trackId}`, { album_id: null }, { accessToken: token });
  } catch (err) {
    return failure(err, "Could not remove the track. Please try again.");
  }
  revalidatePath(`/releases/${releaseId}`);
  return OK;
}

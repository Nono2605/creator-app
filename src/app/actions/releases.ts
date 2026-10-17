"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { api } from "@/lib/api";
import { errorText, failure, isUnavailable, OK, type ActionResult } from "@/lib/actionResult";
import type { TrackPayload } from "@/lib/releaseDraft";

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

// ── Assistant « nouvelle release » et détails d'une release ──────────────
// Appelées depuis le navigateur : elles RENVOIENT l'échec au lieu de le lever (Next masque le message d'une
// erreur levée en production). Une migration de la base pas encore appliquée (503) se dit clairement.

const DETAILS_UNAVAILABLE =
  "This needs the latest database update (release details). Create an empty release for now and add tracks one by one.";

export type CreateReleaseDraftResult =
  | { ok: true; releaseId: string; warning?: string }
  | { ok: false; error: string };

// Crée la release en brouillon, puis y range ses détails facultatifs (date, label, copyright, description).
export async function createReleaseDraft(input: {
  title: string;
  type: string;
  details: Record<string, string> | null;
}): Promise<CreateReleaseDraftResult> {
  const token = await accessToken();
  const title = input.title.trim();
  if (!title) return { ok: false, error: "Give the release a title." };

  let releaseId: string;
  try {
    const release = await api.post<{ id: string }>("/creator/albums", { title, type: input.type }, { accessToken: token });
    releaseId = release.id;
  } catch (err) {
    return { ok: false, error: errorText(err, "Could not create the release. Please try again.") };
  }

  let warning: string | undefined;
  if (input.details) {
    try {
      await api.put(`/creator/albums/${releaseId}/details`, input.details, { accessToken: token });
    } catch (err) {
      warning = isUnavailable(err)
        ? "The release was created, but its date, label and description need the latest database update."
        : `The release was created, but its details weren't saved: ${errorText(err, "please add them on the release page.")}`;
    }
  }
  revalidatePath("/releases");
  return { ok: true, releaseId, warning };
}

export type CreateTrackResult = { ok: true; trackId: string } | { ok: false; error: string };

// Crée un morceau directement dans la release, avec ses genres, styles, crédits et sa déclaration IA. Son fichier
// audio part ensuite du navigateur vers le stockage.
export async function createTrackInRelease(
  releaseId: string,
  payload: TrackPayload,
  position: number
): Promise<CreateTrackResult> {
  const token = await accessToken();
  try {
    const track = await api.post<{ id: string }>(
      `/creator/albums/${releaseId}/tracks`,
      { ...payload, position, provenance: payload.provenance ?? undefined },
      { accessToken: token }
    );
    return { ok: true, trackId: track.id };
  } catch (err) {
    if (isUnavailable(err)) return { ok: false, error: DETAILS_UNAVAILABLE };
    return { ok: false, error: errorText(err, "Could not create this track. Please try again.") };
  }
}

// Les détails facultatifs d'une release : un champ vide l'efface.
export async function saveReleaseDetails(
  releaseId: string,
  details: { release_date: string; label: string; copyright_line: string; description: string }
): Promise<ActionResult> {
  const token = await accessToken();
  try {
    await api.put(`/creator/albums/${releaseId}/details`, details, { accessToken: token });
  } catch (err) {
    if (isUnavailable(err)) return { ok: false, error: DETAILS_UNAVAILABLE };
    return failure(err, "Could not save the details. Please try again.");
  }
  revalidatePath(`/releases/${releaseId}`);
  return OK;
}

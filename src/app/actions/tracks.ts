"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { api } from "@/lib/api";

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

export async function getUploadUrl(trackId: string, filename: string): Promise<UploadUrl> {
  const token = await accessToken();
  return api.post<UploadUrl>(
    `/creator/tracks/${trackId}/upload-url`,
    { filename },
    { accessToken: token }
  );
}

export async function attachFile(
  trackId: string,
  path: string,
  format: string,
  fileSizeBytes: number
): Promise<void> {
  const token = await accessToken();
  await api.post(
    `/creator/tracks/${trackId}/files`,
    { path, format, file_size_bytes: fileSizeBytes },
    { accessToken: token }
  );
  revalidatePath(`/tracks/${trackId}`);
  revalidatePath("/tracks");
}

export async function updateTrackStatus(trackId: string, status: string): Promise<void> {
  const token = await accessToken();
  await api.patch(`/creator/tracks/${trackId}`, { status }, { accessToken: token });
  revalidatePath(`/tracks/${trackId}`);
  revalidatePath("/tracks");
}

export async function updateTrackTitleAction(trackId: string, formData: FormData): Promise<void> {
  const token = await accessToken();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  await api.patch(`/creator/tracks/${trackId}`, { title }, { accessToken: token });
  revalidatePath(`/tracks/${trackId}`);
  revalidatePath("/tracks");
}

export async function deleteTrackAction(trackId: string): Promise<void> {
  const token = await accessToken();
  await api.delete(`/creator/tracks/${trackId}`, { accessToken: token });
  revalidatePath("/tracks");
  redirect("/tracks");
}

export async function removeFile(trackId: string, fileId: string): Promise<void> {
  const token = await accessToken();
  await api.delete(`/creator/tracks/${trackId}/files/${fileId}`, { accessToken: token });
  revalidatePath(`/tracks/${trackId}`);
}

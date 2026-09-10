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

export async function updateReleaseStatus(releaseId: string, status: string): Promise<void> {
  const token = await accessToken();
  await api.patch(`/creator/albums/${releaseId}`, { status }, { accessToken: token });
  revalidatePath(`/releases/${releaseId}`);
  revalidatePath("/releases");
}

export async function deleteReleaseAction(releaseId: string): Promise<void> {
  const token = await accessToken();
  await api.delete(`/creator/albums/${releaseId}`, { accessToken: token });
  revalidatePath("/releases");
  redirect("/releases");
}

export async function assignTrackToRelease(trackId: string, releaseId: string): Promise<void> {
  const token = await accessToken();
  await api.patch(`/creator/tracks/${trackId}`, { album_id: releaseId }, { accessToken: token });
  revalidatePath(`/releases/${releaseId}`);
}

export async function removeTrackFromRelease(trackId: string, releaseId: string): Promise<void> {
  const token = await accessToken();
  await api.patch(`/creator/tracks/${trackId}`, { album_id: null }, { accessToken: token });
  revalidatePath(`/releases/${releaseId}`);
}

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

  try {
    await api.patch("/creator/artist", { bio, country }, { accessToken: token });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not update artist profile." };
  }

  revalidatePath("/artist");
  return { message: "Profile updated." };
}

export interface ArtistUploadUrl {
  path: string;
  token: string;
  signedUrl: string;
  publicUrl: string;
}

export async function getArtistImageUploadUrl(
  kind: "avatar" | "banner",
  filename: string
): Promise<ArtistUploadUrl> {
  const token = await accessToken();
  return api.post<ArtistUploadUrl>(
    "/creator/artist/upload-url",
    { kind, filename },
    { accessToken: token }
  );
}

export async function saveArtistImage(kind: "avatar" | "banner", url: string): Promise<void> {
  const token = await accessToken();
  const field = kind === "avatar" ? "avatar_url" : "banner_url";
  await api.patch("/creator/artist", { [field]: url }, { accessToken: token });
  revalidatePath("/artist");
}

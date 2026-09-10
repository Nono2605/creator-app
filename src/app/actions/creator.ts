"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { api } from "@/lib/api";

export interface CreatorFormState {
  error?: string;
}

// Active le rôle creator sur le compte courant (self-serve pendant la bêta).
export async function applyCreator(
  _state: CreatorFormState | undefined,
  _formData: FormData
): Promise<CreatorFormState> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  try {
    await api.post("/creator/apply", undefined, { accessToken: session.access_token });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not enable creator mode." };
  }

  redirect("/onboarding");
}

export async function createArtist(
  _state: CreatorFormState | undefined,
  formData: FormData
): Promise<CreatorFormState> {
  const name = String(formData.get("name") ?? "").trim();

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  try {
    await api.post("/creator/artist", { name }, { accessToken: session.access_token });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not create artist profile." };
  }

  redirect("/tracks");
}

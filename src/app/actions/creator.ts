"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { api } from "@/lib/api";

export interface CreatorFormState {
  error?: string;
}

// Active le rôle creator sur le compte courant (self-serve pendant la bêta).
// Exige l'acceptation des CGU créateur + les réponses au questionnaire :
// c'est le seul point de passage listener → creator.
export async function applyCreator(
  _state: CreatorFormState | undefined,
  formData: FormData
): Promise<CreatorFormState> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const acceptedTerms = formData.get("accepted_terms") === "on";
  const ownsRights = formData.get("owns_rights") === "on";
  const contentProvenance = String(formData.get("content_provenance") ?? "");
  const primaryGenre = String(formData.get("primary_genre") ?? "").trim();

  if (!acceptedTerms) {
    return { error: "You must accept the Creator Terms of Service to continue." };
  }
  if (!ownsRights) {
    return { error: "You must confirm you hold the rights to the content you'll upload." };
  }
  if (!contentProvenance) {
    return { error: "Please tell us what kind of content you'll be publishing." };
  }

  try {
    await api.post(
      "/creator/apply",
      {
        accepted_terms: acceptedTerms,
        owns_rights: ownsRights,
        content_provenance: contentProvenance,
        primary_genre: primaryGenre || undefined,
      },
      { accessToken: session.access_token }
    );
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

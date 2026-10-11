import { createClient } from "@/lib/supabase/client";
import { getUploadUrl, attachFile } from "@/app/actions/tracks";
import { friendlyUploadError } from "@/lib/uploadErrors";

// Envoie un fichier audio pour un morceau, de bout en bout (côté navigateur) :
//   1. l'API donne une URL signée ;
//   2. le navigateur envoie le fichier directement au stockage (il ne transite jamais
//      par nos serveurs) ;
//   3. l'API relit le fichier pour le MESURER (format réel, durée, empreinte) et
//      l'attache au morceau. Un fichier qui n'est pas de l'audio est refusé ici.
// Ne lève jamais : l'échec est renvoyé avec un message lisible.
export type UploadAudioResult = { ok: true } | { ok: false; error: string };

export async function uploadAudio(
  trackId: string,
  file: File,
  onPhase?: (phase: "uploading" | "checking") => void
): Promise<UploadAudioResult> {
  try {
    onPhase?.("uploading");
    const target = await getUploadUrl(trackId, file.name);
    if (!target.ok) return { ok: false, error: friendlyUploadError(target.error) };

    const { error: uploadError } = await createClient()
      .storage.from("track-audio")
      .uploadToSignedUrl(target.path, target.token, file);
    if (uploadError) return { ok: false, error: friendlyUploadError(uploadError.message) };

    onPhase?.("checking");
    const format = file.name.includes(".") ? file.name.split(".").pop()! : "unknown";
    const attached = await attachFile(trackId, target.path, format, file.size);
    if (!attached.ok) return { ok: false, error: friendlyUploadError(attached.error) };

    return { ok: true };
  } catch (err) {
    return { ok: false, error: friendlyUploadError(err) };
  }
}

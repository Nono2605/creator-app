import { COVER_MAX_INPUT_BYTES, COVER_MIN_SIDE, planCoverCrop } from "@/lib/coverCrop";

// Transforme l'image choisie par le créateur en pochette prête à envoyer : carré centré,
// 1400 px au plus, JPEG. Tout se passe dans le navigateur. Ne lève jamais : le résultat dit
// pourquoi l'image est refusée, en clair.
export type PreparedCover = { ok: true; blob: Blob } | { ok: false; error: string };

const ACCEPTED = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function prepareCover(file: File): Promise<PreparedCover> {
  if (!ACCEPTED.has(file.type)) {
    return { ok: false, error: "Use a JPEG, PNG or WebP image." };
  }
  if (file.size > COVER_MAX_INPUT_BYTES) {
    return { ok: false, error: "This image is over 25 MB. Export a lighter version." };
  }

  try {
    // imageOrientation: la photo prise en portrait sur un téléphone reste à l'endroit.
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    try {
      const plan = planCoverCrop(bitmap.width, bitmap.height);
      if (!plan.ok) {
        return {
          ok: false,
          error: `This image is too small (${bitmap.width} × ${bitmap.height}). The shortest side needs at least ${COVER_MIN_SIDE} px.`,
        };
      }

      const canvas = document.createElement("canvas");
      canvas.width = plan.out;
      canvas.height = plan.out;
      const ctx = canvas.getContext("2d");
      if (!ctx) return { ok: false, error: "Your browser couldn't prepare this image." };
      // Une image avec transparence (PNG) ne doit pas devenir noire en JPEG.
      ctx.fillStyle = "#0b1130";
      ctx.fillRect(0, 0, plan.out, plan.out);
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(bitmap, plan.sx, plan.sy, plan.side, plan.side, 0, 0, plan.out, plan.out);

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
      if (!blob) return { ok: false, error: "Your browser couldn't prepare this image." };
      return { ok: true, blob };
    } finally {
      bitmap.close();
    }
  } catch {
    return { ok: false, error: "This image couldn't be read. Try exporting it as a JPEG or PNG." };
  }
}

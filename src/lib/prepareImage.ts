import { IMAGE_MAX_INPUT_BYTES, planImageCrop, type ImageSpec } from "@/lib/imageCrop";

// Transforme l'image choisie par le créateur en image prête à envoyer, au format voulu (carré,
// 3:1…) : zone centrée, réduite au besoin, en JPEG. Tout se passe dans le navigateur. Ne lève
// jamais : le résultat dit pourquoi l'image est refusée, en clair.
export type PreparedImage = { ok: true; blob: Blob } | { ok: false; error: string };

const ACCEPTED = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function prepareImage(file: File, spec: ImageSpec): Promise<PreparedImage> {
  if (!ACCEPTED.has(file.type)) {
    return { ok: false, error: "Use a JPEG, PNG or WebP image." };
  }
  if (file.size > IMAGE_MAX_INPUT_BYTES) {
    return { ok: false, error: "This image is over 25 MB. Export a lighter version." };
  }

  try {
    // imageOrientation: la photo prise en portrait sur un téléphone reste à l'endroit.
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    try {
      const plan = planImageCrop(bitmap.width, bitmap.height, spec);
      if (!plan.ok) {
        return {
          ok: false,
          error: `This image is too small (${bitmap.width} × ${bitmap.height}). Cropped to ${spec.ratioLabel}, it needs to be at least ${spec.minWidth} px wide.`,
        };
      }

      const canvas = document.createElement("canvas");
      canvas.width = plan.outW;
      canvas.height = plan.outH;
      const ctx = canvas.getContext("2d");
      if (!ctx) return { ok: false, error: "Your browser couldn't prepare this image." };
      // Une image avec transparence (PNG) ne doit pas devenir noire en JPEG.
      ctx.fillStyle = "#0b1130";
      ctx.fillRect(0, 0, plan.outW, plan.outH);
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(bitmap, plan.sx, plan.sy, plan.sw, plan.sh, 0, 0, plan.outW, plan.outH);

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

// Pochette de release : comment une image quelconque devient une pochette carrée.
// Fonction pure, testée avec `npm test` ; le dessin (canvas) est dans prepareCover.ts.

// Côté minimal de l'image d'origine (sa plus petite dimension). En dessous, la pochette
// serait floue à l'affichage, surtout sur la page d'un album.
export const COVER_MIN_SIDE = 600;
// Taille de la pochette envoyée : assez pour les écrans haute densité, assez léger pour charger vite.
export const COVER_MAX_SIDE = 1400;
// Poids maximal du fichier choisi, avant recadrage : au-delà, le navigateur peine à le décoder.
export const COVER_MAX_INPUT_BYTES = 25 * 1024 * 1024;

export type CoverCrop =
  | { ok: true; sx: number; sy: number; side: number; out: number }
  | { ok: false; reason: "too_small" };

// Carré centré dans l'image (on garde le milieu), réduit à COVER_MAX_SIDE au plus. Jamais
// agrandi : une image de 900 × 900 reste à 900 × 900.
export function planCoverCrop(width: number, height: number): CoverCrop {
  const side = Math.floor(Math.min(width, height));
  if (!(side >= COVER_MIN_SIDE)) return { ok: false, reason: "too_small" };
  return {
    ok: true,
    sx: Math.floor((width - side) / 2),
    sy: Math.floor((height - side) / 2),
    side,
    out: Math.min(side, COVER_MAX_SIDE),
  };
}

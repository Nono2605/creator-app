// Images du créateur (pochette, photo d'artiste, bannière) : comment une image quelconque devient
// une image au bon format. Fonction pure, testée avec `npm test` ; le dessin (canvas) est dans
// prepareImage.ts.

export interface ImageSpec {
  /** Largeur / hauteur de l'image finale (1 = carré, 3 = trois fois plus large que haute). */
  aspect: number;
  /** Largeur minimale de la zone gardée, en px de l'image d'origine. En dessous : trop floue. */
  minWidth: number;
  /** Largeur de l'image envoyée : assez pour les écrans haute densité, assez léger pour charger vite. */
  maxWidth: number;
  /** Le format en mots, pour les messages (« square », « 3:1 »). */
  ratioLabel: string;
}

export const IMAGE_SPECS = {
  // Pochette de release : carrée, affichée jusqu'à ~200 px (page album) ; 1400 px pour les écrans HD.
  cover: { aspect: 1, minWidth: 600, maxWidth: 1400, ratioLabel: "square" },
  // Photo d'artiste : carrée, affichée en rond de 40 à 200 px.
  avatar: { aspect: 1, minWidth: 400, maxWidth: 1000, ratioLabel: "square" },
  // Bannière de la page artiste : large, affichée sur toute la largeur de l'écran.
  banner: { aspect: 3, minWidth: 1200, maxWidth: 2100, ratioLabel: "3:1" },
} as const satisfies Record<string, ImageSpec>;

// Poids maximal du fichier choisi, avant recadrage : au-delà, le navigateur peine à le décoder.
export const IMAGE_MAX_INPUT_BYTES = 25 * 1024 * 1024;

export type ImageCrop =
  | { ok: true; sx: number; sy: number; sw: number; sh: number; outW: number; outH: number }
  | { ok: false; reason: "too_small" };

// Rectangle centré dans l'image, au format demandé (on garde le milieu), réduit à `maxWidth` au
// plus. Jamais agrandi : une image de 900 × 900 reste à 900 × 900.
export function planImageCrop(width: number, height: number, spec: ImageSpec): ImageCrop {
  if (!(width > 0 && height > 0)) return { ok: false, reason: "too_small" };
  const tooWide = width / height > spec.aspect;
  const sh = tooWide ? Math.floor(height) : Math.floor(width / spec.aspect);
  const sw = tooWide ? Math.floor(height * spec.aspect) : Math.floor(width);
  if (!(sw >= spec.minWidth)) return { ok: false, reason: "too_small" };
  const outW = Math.min(sw, spec.maxWidth);
  return {
    ok: true,
    sx: Math.floor((width - sw) / 2),
    sy: Math.floor((height - sh) / 2),
    sw,
    sh,
    outW,
    outH: Math.round(outW / spec.aspect),
  };
}

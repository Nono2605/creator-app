// Détails d'un morceau et d'une release côté Studio : les mêmes limites que l'API (lib/releaseMeta.ts),
// et les petits gestes de saisie (genres, styles, ordre des morceaux). Fonctions pures, testées avec `npm test`.
// L'API vérifie tout de toute façon : ici on évite d'envoyer ce qu'elle refuserait.

export const MAX_GENRES = 3;
export const MAX_TAGS = 5;
export const MAX_CREDITS = 12;
/** Au plus 30 morceaux par envoi : l'API limite les envois de fichiers à 30 par minute. */
export const MAX_TRACKS = 30;

export const CREDIT_ROLES = [
  { value: "featured", label: "Featured artist" },
  { value: "producer", label: "Producer" },
  { value: "writer", label: "Writer" },
] as const;
export type CreditRole = (typeof CREDIT_ROLES)[number]["value"];

export interface CreditDraft {
  role: CreditRole;
  /** Un artiste Vynl choisi dans la recherche, ou null pour une personne qui n'a pas de page. */
  artistId: string | null;
  name: string;
}

// Le titre d'un morceau déduit du nom du fichier : sans l'extension, sans le numéro de piste du début
// (« 01 - Titre.mp3 » → « Titre »), les « _ » devenus des espaces.
export function titleFromFilename(filename: string): string {
  const noExtension = filename.replace(/\.[A-Za-z0-9]{2,5}$/, "");
  // Le numéro de piste du début (« 01 - », « 02. », « 3) », « 04_ ») ; les « _ » deviennent ensuite des espaces.
  const withoutNumber = noExtension.replace(/^\s*\d{1,2}\s*[-._)]\s*/, "");
  const clean = (text: string) => text.replace(/_+/g, " ").replace(/\s+/g, " ").trim();
  return (clean(withoutNumber) || clean(noExtension) || "Untitled").slice(0, 200);
}

// Choisir ou retirer un genre ; au plus MAX_GENRES, le premier choisi est le genre principal.
export function toggleGenre(selected: string[], code: string): string[] {
  if (selected.includes(code)) return selected.filter((item) => item !== code);
  return selected.length >= MAX_GENRES ? selected : [...selected, code];
}

// Même mise en forme qu'à l'API : minuscules, espaces simples, sans « # » devant.
export function normalizeTag(raw: string): string {
  return raw.trim().replace(/^#+/, "").trim().replace(/\s+/g, " ").toLowerCase();
}

const TAG_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N} '-]{1,23}$/u;

export function addTag(tags: string[], raw: string): { tags: string[]; error: string | null } {
  const tag = normalizeTag(raw);
  if (!tag || tags.includes(tag)) return { tags, error: null };
  if (tags.length >= MAX_TAGS) return { tags, error: `Up to ${MAX_TAGS} style tags.` };
  if (!TAG_PATTERN.test(tag)) {
    return { tags, error: "Use 2 to 24 letters, numbers, spaces or hyphens." };
  }
  return { tags: [...tags, tag], error: null };
}

// Déplace un élément (l'ordre des morceaux) ; un déplacement impossible laisse la liste telle quelle.
export function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

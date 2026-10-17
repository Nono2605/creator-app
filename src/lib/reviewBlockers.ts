import { nameStatusBlocker, type NameStatus } from "./artistNameStatus.ts";

// Ce qui empêche un morceau de partir en relecture, dit AVANT le clic. Mêmes règles que l'API
// (PATCH /creator/tracks/:id, status = in_review) : de l'audio, une déclaration IA acceptée et un
// genre. L'API reste la barrière ; ici on explique au lieu de laisser le créateur deviner.

export interface TrackReviewState {
  hasAudio: boolean;
  /** Dernière déclaration IA enregistrée, ou null s'il n'y en a pas. */
  declaration: { provenance: string; status?: string | null } | null;
  /** Faux quand la liste des genres n'est pas disponible : le choix n'est alors pas affiché. */
  genreAvailable: boolean;
  hasGenre: boolean;
  /** Relecture du nom d'artiste ; absent = accepté. */
  artistNameStatus?: NameStatus;
}

// Même liste que l'API (ACCEPTED_PROVENANCES dans lib/provenance.ts) : bêta 100 % IA.
const ACCEPTED_PROVENANCES = ["ai"];

export function trackReviewBlockers(state: TrackReviewState): string[] {
  const blockers: string[] = [];
  const nameBlocker = nameStatusBlocker(state.artistNameStatus ?? "approved");
  if (nameBlocker) blockers.push(nameBlocker);
  if (!state.hasAudio) blockers.push("Add the audio file.");

  const { declaration } = state;
  if (!declaration) {
    blockers.push("Save an AI declaration (AI declaration section below).");
  } else if (declaration.status === "rejected") {
    blockers.push("Your AI declaration was rejected. Update it.");
  } else if (!ACCEPTED_PROVENANCES.includes(declaration.provenance)) {
    blockers.push("The beta accepts AI-generated music only.");
  }

  if (state.genreAvailable && !state.hasGenre) blockers.push("Choose a genre.");
  return blockers;
}

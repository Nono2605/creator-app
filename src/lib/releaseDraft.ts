// L'assistant « nouvelle release » : ce que le créateur a saisi, ce qui manque encore pour créer la release,
// et ce qu'on envoie à l'API pour chaque morceau. Fonctions pures, testées avec `npm test`.

import { MAX_TRACKS, type CreditDraft } from "./releaseMeta.ts";

export type Provenance = "ai" | "hybrid";
export type ReleaseType = "single" | "ep" | "album" | "compilation";

export interface ReleaseFields {
  type: ReleaseType;
  title: string;
  releaseDate: string;
  label: string;
  copyright: string;
  description: string;
  /** Par défaut de chaque morceau ; le premier est le principal. */
  genres: string[];
  tags: string[];
  /** La déclaration IA par défaut : à choisir explicitement, jamais pré-cochée. */
  provenance: Provenance | null;
}

export interface TrackFields {
  title: string;
  explicit: boolean;
  /** null : comme la release. */
  genres: string[] | null;
  tags: string[] | null;
  /** "inherit" : comme la release. */
  provenance: Provenance | "inherit";
  credits: CreditDraft[];
}

export const effectiveGenres = (track: TrackFields, release: ReleaseFields): string[] => track.genres ?? release.genres;
export const effectiveTags = (track: TrackFields, release: ReleaseFields): string[] => track.tags ?? release.tags;
export const effectiveProvenance = (track: TrackFields, release: ReleaseFields): Provenance | null =>
  track.provenance === "inherit" ? release.provenance : track.provenance;

const countOf = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

// Ce qui empêche de créer la release, dit en clair. Même exigences que l'envoi en relecture : un titre, de
// l'audio, au moins un genre et une déclaration IA par morceau. `genresAvailable` : faux quand la liste des
// genres n'a pas pu être chargée (le genre n'est alors pas demandé).
export function draftProblems(release: ReleaseFields, tracks: TrackFields[], genresAvailable: boolean): string[] {
  const problems: string[] = [];
  if (!release.title.trim()) problems.push("Give the release a title.");
  if (tracks.length === 0) problems.push("Add at least one audio file.");
  if (tracks.length > MAX_TRACKS) problems.push(`A release can have up to ${MAX_TRACKS} tracks here.`);
  if (release.type === "single" && tracks.length > 1) {
    problems.push("A single has one track: choose EP, Album or Compilation for more.");
  }

  const untitled = tracks.filter((track) => !track.title.trim()).length;
  if (untitled > 0) problems.push(`${countOf(untitled, "track needs", "tracks need")} a title.`);

  if (genresAvailable) {
    const noGenre = tracks.filter((track) => effectiveGenres(track, release).length === 0).length;
    if (noGenre > 0) problems.push(`${countOf(noGenre, "track needs", "tracks need")} a genre.`);
  }

  const undeclared = tracks.filter((track) => effectiveProvenance(track, release) === null).length;
  if (undeclared > 0) problems.push(`${countOf(undeclared, "track needs", "tracks need")} an AI declaration.`);
  return problems;
}

// Combien de morceaux sont déclarés « AI-assisted » : enregistrés, mais pas acceptés pendant la bêta.
export function hybridCount(release: ReleaseFields, tracks: TrackFields[]): number {
  return tracks.filter((track) => effectiveProvenance(track, release) === "hybrid").length;
}

export interface TrackPayload {
  title: string;
  explicit: boolean;
  genres: string[];
  tags: string[];
  credits: { role: string; artist_id: string | null; name: string }[];
  provenance: Provenance | null;
}

// Ce qu'on envoie à POST /creator/albums/:id/tracks pour un morceau (les valeurs par défaut de la release
// sont résolues ici).
export function trackPayload(track: TrackFields, release: ReleaseFields): TrackPayload {
  return {
    title: track.title.trim(),
    explicit: track.explicit,
    genres: effectiveGenres(track, release),
    tags: effectiveTags(track, release),
    credits: track.credits.map((credit) => ({ role: credit.role, artist_id: credit.artistId, name: credit.name })),
    provenance: effectiveProvenance(track, release),
  };
}

// Les champs facultatifs de la release, tels que l'API les attend : vide = effacé, donc rien à envoyer pour un
// champ que le créateur n'a pas rempli. Renvoie null s'il n'y a rien à enregistrer.
export function releaseDetailsPayload(release: ReleaseFields): Record<string, string> | null {
  const details: Record<string, string> = {};
  if (release.releaseDate.trim()) details.release_date = release.releaseDate.trim();
  if (release.label.trim()) details.label = release.label.trim();
  if (release.copyright.trim()) details.copyright_line = release.copyright.trim();
  if (release.description.trim()) details.description = release.description.trim();
  return Object.keys(details).length > 0 ? details : null;
}

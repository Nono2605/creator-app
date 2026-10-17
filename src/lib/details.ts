import { api } from "@/lib/api";

// Détails d'un morceau (genres, styles, crédits) et d'une release (description, label, copyright, date) :
// ce que l'API renvoie après la migration 20261018000000_release_details.sql. Ces lectures ne lèvent jamais :
// `available: false` (migration pas appliquée) ou null (API muette) → la page garde ses écrans d'avant.

export interface TrackCredit {
  role: string;
  artist_id: string | null;
  name: string;
}

export interface TrackDetails {
  available: boolean;
  /** Le genre principal d'abord. */
  genres: string[];
  tags: string[];
  credits: TrackCredit[];
}

export interface ReleaseDetails {
  available: boolean;
  description: string | null;
  label: string | null;
  copyright_line: string | null;
  release_date: string | null;
}

export async function loadTrackDetails(accessToken: string, trackId: string): Promise<TrackDetails | null> {
  try {
    return await api.get<TrackDetails>(`/creator/tracks/${trackId}/details`, { accessToken });
  } catch {
    return null;
  }
}

export async function loadReleaseDetails(accessToken: string, releaseId: string): Promise<ReleaseDetails | null> {
  try {
    return await api.get<ReleaseDetails>(`/creator/albums/${releaseId}/details`, { accessToken });
  } catch {
    return null;
  }
}

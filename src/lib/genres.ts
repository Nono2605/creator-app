import { api } from "@/lib/api";

// Genre d'un morceau : une liste fermée tenue par l'API (GET /genres). Ces lectures ne lèvent jamais :
// avant la migration des genres, ou si l'API ne répond pas, on n'affiche simplement pas le choix du genre
// plutôt que de casser la page du morceau.

export interface Genre {
  code: string;
  label: string;
}

export async function loadGenres(): Promise<Genre[]> {
  try {
    const { genres } = await api.get<{ genres: Genre[] }>("/genres");
    return genres;
  } catch {
    return [];
  }
}

export async function loadTrackGenre(accessToken: string, trackId: string): Promise<string | null> {
  try {
    const { genre } = await api.get<{ genre: string | null }>(`/creator/tracks/${trackId}/genre`, { accessToken });
    return genre;
  } catch {
    return null;
  }
}

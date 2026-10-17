// Limites du profil public de l'artiste. Les mêmes que celles de l'API (PATCH /creator/artist) :
// le formulaire les affiche, l'API les impose.
export const BIO_MAX = 500;
export const COUNTRY_MAX = 56;

// Une page artiste est « complète » avec une photo, une bannière et une présentation : c'est ce
// que les auditeurs voient dans Discover, la recherche et la page de l'artiste.
export interface ProfileFields {
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;
}

export function missingProfileParts(artist: ProfileFields): string[] {
  const missing: string[] = [];
  if (!artist.avatar_url) missing.push("photo");
  if (!artist.banner_url) missing.push("banner");
  if (!artist.bio?.trim()) missing.push("bio");
  return missing;
}

// « photo », « photo and bio », « photo, banner and bio ».
export function joinParts(parts: string[]): string {
  if (parts.length <= 1) return parts.join("");
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

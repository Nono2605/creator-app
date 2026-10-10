// Libellés lisibles des clés de répartition renvoyées par l'API. Sans dépendance
// (testé avec `npm test`).

const SOURCES: Record<string, string> = {
  album: "Album pages",
  playlist: "Playlists",
  artist: "Your artist page",
  discover: "Discover",
  search: "Search",
  library: "Saved library",
  track: "Track page",
};

const DEVICES: Record<string, string> = {
  mobile: "Mobile",
  tablet: "Tablet",
  desktop: "Desktop",
};

const SHARED: Record<string, string> = { unknown: "Unknown", other: "Other" };

export function sourceLabel(key: string): string {
  return SHARED[key] ?? SOURCES[key] ?? key;
}

export function deviceLabel(key: string): string {
  return SHARED[key] ?? DEVICES[key] ?? key;
}

let regionNames: Intl.DisplayNames | null | undefined;

// « FR » -> « France ». Un code que le navigateur ne connaît pas reste affiché tel quel.
export function countryLabel(key: string): string {
  if (SHARED[key]) return SHARED[key];
  if (regionNames === undefined) {
    try {
      regionNames = new Intl.DisplayNames(["en"], { type: "region" });
    } catch {
      regionNames = null;
    }
  }
  try {
    return regionNames?.of(key) ?? key;
  } catch {
    return key;
  }
}

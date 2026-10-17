// Le nom d'artiste est relu par l'administration quand il ressemble à celui d'un autre artiste : tant
// qu'elle n'a pas tranché, la page n'est pas publique et rien ne peut être soumis. Mêmes états que
// l'API (colonne artists.name_status). Fonctions pures, testées avec `npm test`.

export type NameStatus = "approved" | "pending" | "rejected";

// Avant la migration de l'API, ou face à une ancienne réponse, le statut manque : le nom compte comme accepté.
export function nameStatusOf(artist: { name_status?: string | null }): NameStatus {
  return artist.name_status === "pending" || artist.name_status === "rejected" ? artist.name_status : "approved";
}

export interface NameStatusNotice {
  tone: "info" | "error";
  title: string;
  text: string;
}

// Ce que le créateur doit lire quand son nom n'est pas (encore) accepté ; null quand il l'est.
export function describeNameStatus(status: NameStatus, note?: string | null): NameStatusNotice | null {
  if (status === "pending") {
    return {
      tone: "info",
      title: "Your artist name is being reviewed",
      text: "It is close to another artist's name, so our team checks it before your page goes public. You can prepare your music meanwhile; you'll be able to submit it for review once the name is approved.",
    };
  }
  if (status === "rejected") {
    const reason = (note ?? "").trim().replace(/[.\s]+$/, "");
    return {
      tone: "error",
      title: "Your artist name was declined",
      text: `${reason ? `${reason}. ` : ""}Choose another name on your Profile page: you'll be able to submit your music for review once it is approved.`,
    };
  }
  return null;
}

// Ce que dit « Submit for review » tant que le nom n'est pas accepté (liste des blocages d'un morceau).
export function nameStatusBlocker(status: NameStatus): string | null {
  if (status === "pending") return "Your artist name is still being reviewed.";
  if (status === "rejected") return "Choose another artist name (Profile page).";
  return null;
}

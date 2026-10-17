// Résultat d'une Server Action appelée depuis le navigateur. En production, Next MASQUE le message
// d'une erreur levée par une Server Action : le créateur ne verrait que « Something went wrong ».
// Les actions attrapent donc l'erreur et la RENVOIENT ; le composant l'affiche sous le bouton.
//
// Ce fichier ne dépend pas de lib/api.ts : les composants client l'importent (`import type`).

export type ActionResult = { ok: true } | { ok: false; error: string };

export const OK: ActionResult = { ok: true };

// Le message de l'API quand il est écrit pour le créateur : une réponse 4xx (« Add the audio file
// first. », « 2 tracks cannot be reviewed yet… »). Toute autre panne reçoit le message de repli, plus
// clair qu'un message technique : réseau coupé (« fetch failed »), erreur serveur 5xx (« Internal
// server error »).
export function failure(err: unknown, fallback: string): ActionResult {
  if (err instanceof Error && err.name === "ApiError" && err.message.trim()) {
    const status = (err as Error & { status?: number }).status ?? 0;
    if (status < 500) return { ok: false, error: err.message };
  }
  return { ok: false, error: fallback };
}

// Le texte d'erreur seul, pour les actions qui renvoient leur propre forme de résultat.
export function errorText(err: unknown, fallback: string): string {
  const result = failure(err, fallback);
  return result.ok ? fallback : result.error;
}

// L'API répond 503 quand une migration de la base n'est pas appliquée : c'est à l'équipe d'agir, pas au créateur.
export function isUnavailable(err: unknown): boolean {
  return err instanceof Error && (err as Error & { status?: number }).status === 503;
}

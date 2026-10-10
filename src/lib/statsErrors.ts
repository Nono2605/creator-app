// Quand une panne de GET /creator/stats veut dire « pas encore là » plutôt que « cassé ».
// Fonction pure, testée avec `npm test`.
//
// Deux cas, tous deux transitoires au déploiement :
//  * 503 : l'API est à jour mais la migration SQL des statistiques n'est pas appliquée ;
//  * 404 « Not found: GET /creator/stats » : le Studio est déployé avant l'API, la route
//    n'existe pas encore. Ce 404-là se reconnaît à son message : un vrai « morceau
//    introuvable » dit « Track not found » et reste une erreur.
export function isStatsUnavailable(status: number, message: string): boolean {
  if (status === 503) return true;
  return status === 404 && message.startsWith("Not found:");
}

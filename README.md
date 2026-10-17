# CreatorApp-Beta

App web séparée pour la partie créateur de Vynl : upload et gestion des
morceaux, page artiste. Consomme le même backend (`../musicAPI`) et le même
projet Supabase que `../musicapp.1.0.0` — un compte existant peut devenir
créateur, pas de système d'auth séparé.

## Stack

Next.js (App Router) / React / TypeScript, mêmes conventions que
`musicapp.1.0.0` (Server Actions, client Supabase SSR, appels REST vers
`musicAPI` via `src/lib/api.ts`).

## Démarrer en local

```bash
npm install
cp .env.example .env.local
```

Remplir `.env.local` avec les mêmes clés Supabase que `musicapp.1.0.0`, et
s'assurer que `musicAPI` tourne sur `http://localhost:4000`.

```bash
npm run dev
```

Le serveur démarre sur `http://localhost:3001` (musicapp.1.0.0 utilise déjà
le port 3000).

## Parcours créateur

1. `/signup` ou `/login` — même compte Supabase que l'app listener (les deux
   écrans le disent : un auditeur qui a déjà un compte s'y connecte, il n'en
   crée pas un deuxième). Le lien du courriel de confirmation revient sur
   `/auth/callback`, qui ouvre la session et envoie vers `/onboarding`.
2. `/onboarding` — trois étapes visibles (compte, CGU créateur, nom d'artiste) :
   active le rôle `creator` (`POST /creator/apply`), puis crée la page
   artiste (`POST /creator/artist`).
3. `/tracks` — liste des morceaux du créateur (tous statuts).
4. `/tracks/new` — crée un morceau et uploade le fichier audio (URL signée
   Supabase Storage, bucket `track-audio`, jamais via ce serveur).
5. `/tracks/[id]` — édite le titre, gère les fichiers, transitionne le
   statut (`draft` → `in_review` → `archived`). Le passage à `published`
   est réservé à la modération admin, hors périmètre de cette app.
   Une fois publié, le morceau affiche ses statistiques d'écoute.
6. `/`, `/audience`, `/analytics` — statistiques de lecture sur 7, 30 ou
   90 jours (`?range=`) : écoutes, auditeurs, temps d'écoute, sauvegardes,
   followers, top morceaux, origine des écoutes, pays et appareils. Elles
   viennent de `GET /creator/stats`. Tant que la migration SQL
   `20261010000000_creator_stats.sql` n'est pas appliquée côté base, ces
   pages affichent « Coming » au lieu des graphiques.

### Réglage Supabase pour le lien de confirmation

Pour que le courriel de confirmation ramène dans le Studio (et non sur le site
par défaut du projet, souvent l'app d'écoute), ajouter l'adresse du Studio dans
Supabase > Authentication > URL Configuration > Redirect URLs :
`https://<adresse-du-studio>/auth/callback` (et `http://localhost:3001/auth/callback`
en local). Sans cette entrée rien ne casse : Supabase retombe sur le site par
défaut du projet, comme avant.

## Tests

```bash
npm test
```

Fonctions pures de `src/lib` (formatage, échelles des graphiques, variations,
série des followers), via `node --test` : Node 22.18 ou plus récent.

## Backend

Tous les endpoints créateur sont sous `/creator/*` dans `musicAPI`
(`../musicAPI/src/modules/creator/routes.ts`), protégés par
`requireAuth` + `requireCreator`.

## Déploiement

Vercel (build auto sur chaque push vers `main`), backend `musicAPI` sur
Render. Variables d'environnement à renseigner dans Vercel (Production et
Preview) — jamais commitées, voir `.env.example` :

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_API_BASE_URL` — URL du service `musicapi` sur Render

Côté Render, `CORS_ALLOWED_ORIGINS` (dashboard, jamais dans `render.yaml`)
doit inclure le domaine Vercel de cette app, sinon les appels API sont
bloqués par le navigateur.

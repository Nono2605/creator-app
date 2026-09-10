# CreatorApp-Beta

App web séparée pour la partie créateur de BRAND : upload et gestion des
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

1. `/signup` ou `/login` — même compte Supabase que l'app listener.
2. `/onboarding` — active le rôle `creator` (`POST /creator/apply`), puis
   crée la page artiste (`POST /creator/artist`).
3. `/tracks` — liste des morceaux du créateur (tous statuts).
4. `/tracks/new` — crée un morceau et uploade le fichier audio (URL signée
   Supabase Storage, bucket `track-audio`, jamais via ce serveur).
5. `/tracks/[id]` — édite le titre, gère les fichiers, transitionne le
   statut (`draft` → `in_review` → `archived`). Le passage à `published`
   est réservé à la modération admin, hors périmètre de cette app.

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

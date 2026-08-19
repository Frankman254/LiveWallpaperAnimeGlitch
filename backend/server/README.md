# API server

Two endpoints groups, both of which exist because they cannot safely live in
the browser.

| Route                       | Holds                   | Client                                                |
| --------------------------- | ----------------------- | ----------------------------------------------------- |
| `POST /api/ai/scene-intent` | The Anthropic key       | `src/features/aiDirector/client/sceneIntentClient.ts` |
| `/api/projects/*`           | The database credential | `src/lib/sync/remoteSyncRepository.ts`                |

## The rule that shapes everything here

**Anything prefixed `VITE_` is compiled into the browser bundle and is
therefore public.** The Anthropic key and `DATABASE_URL` live in this server's
environment and are never sent to the client — which is the whole reason this
process exists.

## Run it

```bash
cd backend && docker compose up -d      # Postgres, applies schema on first boot
cd server && npm install
cp .env.example .env                    # fill in ANTHROPIC_API_KEY
node --env-file=.env src/index.mjs
```

The Vite dev server proxies `/api` to `http://localhost:8787`, so the app talks
to it same-origin with no configuration.

Check what came up:

```bash
curl -s localhost:8787/api/health
```

Each capability is independent. Without `ANTHROPIC_API_KEY` the scene endpoint
returns 503 and the app falls back to its offline heuristic — which is a
supported mode, not a broken one. Without `DATABASE_URL` the sync routes are
not mounted at all.

## Scene intents

The client sends an image signature (plus a 256px rendition and an optional
free-text steer) and gets back a `SceneIntent` — about 15 fields. A
deterministic compiler on the client expands that into the ~190 store keys, so
the model never authors raw configuration and the prompt stays small.

Answers are cached in-process by signature hash plus prompt version, so a pool
of near-identical images does not pay per image. The cache is per-process:
restarting the server clears it, and multiple instances do not share it. Move
it to Redis before running more than one.

## Auth is a development stand-in

`LWAG_API_TOKENS` is a static list of bearer tokens, and the owner id is
derived from the token. **This is not a production identity system.** It exists
so the sync API can be exercised end to end without committing to a provider.

Replacing it means changing one function (`createAuth` in `src/index.mjs`) —
everything downstream only reads `req.ownerId`. Options, none of which are
picked here because the choice is yours:

- **Supabase** — use `auth.users` as the ownership source and verify its JWT.
- **Auth0 / Clerk** — verify the provider's JWT, map `sub` to `owner_id`.
- **Your own sessions** — a `users` table plus signed cookies.

## What is deliberately missing

- **Object storage.** The schema tracks asset metadata (hash, size, MIME type,
  storage path); the bytes belong in S3/Supabase Storage. Until that is chosen,
  `RemoteSyncRepository.getAsset` returns null and blobs stay in the client's
  local IndexedDB.
- **Rate limiting and quota.** The scene endpoint will happily forward every
  request it receives. Put a limiter in front of it before exposing it.
- **A canonical snapshot format.** Projects store the raw wallpaper state plus
  its `store_persist_version`, and the client migrates on read. That works, but
  `STORE_PERSIST_VERSION` moves every sprint — freeze a translating
  `projectSchemaVersion` before this serves more than one client build.

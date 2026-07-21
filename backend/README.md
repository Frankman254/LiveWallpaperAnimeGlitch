# Backend — Live Wallpaper

Postgres schema foundation for remote wallpaper-project sync. The same SQL
model can run locally in Docker, on Railway, or inside Supabase.

## What's here today

- `docker-compose.yml` — local Postgres 16 on `:5432`.
- `schema/001_init.sql` — projects as versioned `jsonb`, plus asset metadata
  including content hash and MIME type. Applied on the first `up`.
- `.env.example` — connection settings.

The app-side sync layer lives under `src/lib/sync/`. Its local IndexedDB adapter
already powers the project library in Export. A remote adapter implements the
same `SyncRepository` contract.

## Important boundary

Postgres is storage, not a browser API. Starting this container does **not**
connect the Vite app to Postgres. A remote deployment still needs one of:

- a server API that holds `DATABASE_URL`, authenticates users and implements
  `SyncRepository`, or
- a Supabase adapter using authenticated PostgREST plus Supabase Storage.

Never expose `DATABASE_URL` through a `VITE_*` environment variable.

## Run it locally

```bash
cd backend
cp .env.example .env         # optional: tweak password/port
docker compose up -d         # starts Postgres, applies schema on first boot
docker compose logs -f db    # watch it come up
```

Connect with any client at
`postgresql://lwag:lwag_dev_password@localhost:5432/lwag`.

Stop with `docker compose down` (keeps data) or `down -v` (wipes it).

## Data model in one paragraph

A **project** is one complete wallpaper. `state` holds normalized wallpaper
JSON and `store_persist_version` records its shape version, so reads run the
existing client migration chain. Blobs never go in Postgres: only their
**hash + size + MIME type + storage path** live in `project_assets`. `revision`
provides optimistic concurrency between devices.

## Choosing a cloud host

- **Supabase** — use `auth.users` as the ownership source, PostgREST for project
  rows and Supabase Storage for blobs.
- **Railway** — provision Postgres plus a small server API; put blobs in an
  S3-compatible object store rather than the database.

The data model is portable, but auth and object-storage adapters are
provider-specific. Verify current pricing and limits on each provider's
official site before choosing one.

-- Live Wallpaper backend — initial schema (v1)
--
-- Design goals:
--  * The wallpaper state is stored as jsonb, with its store version in the
--    adjacent `store_persist_version` column.
--    No column-per-setting: the store shape changes every few days and the
--    client already owns migration via `migrateWallpaperStore`.
--  * Image/audio/logo blobs do NOT live in the DB. They go to object storage
--    (Supabase Storage / S3 / local disk); the DB only tracks their metadata
--    (content hash + size + storage path) so sync can dedupe and reconcile.
--  * Compatible with standalone Postgres and Supabase. `owner_id` intentionally
--    has no FK in this portable base schema because standalone and Supabase use
--    different identity tables. The server/auth adapter enforces ownership.

create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ── Users (standalone deploys). On Supabase, prefer auth.users and drop this. ──
create table if not exists app_users (
	id         uuid primary key default gen_random_uuid(),
	email      text unique not null,
	created_at timestamptz not null default now()
);

-- ── Projects: one row = one complete wallpaper configuration ─────────────────
create table if not exists wallpaper_projects (
	id                    uuid primary key default gen_random_uuid(),
	owner_id              uuid not null,
	name                  text not null default 'Untitled',
	-- Shape version of `state` at write time. The client runs its migration
	-- chain from this number on read, so an old row still loads on a new client.
	store_persist_version integer not null,
	-- The full wallpaper state (no blob URLs — those are reconstructed from
	-- `project_assets`). This is the same object the settings export writes.
	state                 jsonb not null,
	created_at            timestamptz not null default now(),
	updated_at            timestamptz not null default now(),
	-- Optimistic-concurrency counter: bumped on every write, checked by the
	-- client to detect a conflicting update from another device.
	revision              bigint not null default 1
);

create index if not exists wallpaper_projects_owner_idx
	on wallpaper_projects (owner_id, updated_at desc);

-- ── Assets: metadata only; bytes live in object storage ──────────────────────
create table if not exists project_assets (
	id           uuid primary key default gen_random_uuid(),
	project_id   uuid not null references wallpaper_projects (id) on delete cascade,
	-- The client-side asset id (e.g. "img-abc123") used inside `state`.
	asset_id     text not null,
	kind         text not null check (kind in ('image', 'audio', 'logo', 'overlay', 'lyrics')),
	-- Content hash (e.g. sha-256) for dedupe + change detection.
	content_hash text not null,
	size_bytes   bigint not null,
	mime_type    text not null default 'application/octet-stream',
	-- Where the bytes live in object storage (bucket key / path).
	storage_path text,
	created_at   timestamptz not null default now(),
	unique (project_id, asset_id)
);

create index if not exists project_assets_hash_idx
	on project_assets (content_hash);

-- ── updated_at / revision bump on every project write ────────────────────────
create or replace function touch_project() returns trigger as $$
begin
	new.updated_at := now();
	new.revision := old.revision + 1;
	return new;
end;
$$ language plpgsql;

drop trigger if exists wallpaper_projects_touch on wallpaper_projects;
create trigger wallpaper_projects_touch
	before update on wallpaper_projects
	for each row execute function touch_project();

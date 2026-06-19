# Cloud Readiness Assessment

**Status:** Audit only — no backend implemented.

## Current serialization surfaces

| Surface                            | Versioning                         | Stable IDs     | Blob handling            |
| ---------------------------------- | ---------------------------------- | -------------- | ------------------------ |
| Zustand persist (local)            | `STORE_PERSIST_VERSION` migrations | Partial        | URLs stripped on persist |
| Project package export             | `PROJECT_SCHEMA_VERSION = 1`       | assetId fields | Package embeds or refs   |
| Settings JSON export               | `SETTINGS_SCHEMA_VERSION`          | —              | Missing asset warnings   |
| Profile slots (spectrum/bg/motion) | Feature-specific                   | Slot names     | Values only              |
| Lyrixa lyrics bundle               | `schemaVersion: 1`                 | —              | Separate bundle format   |

## Stability assessment

| Domain                      | Ready?      | Notes                                                       |
| --------------------------- | ----------- | ----------------------------------------------------------- |
| Project schema              | **Partial** | Version 1 exists; store migrations still active (v94+)      |
| Project snapshots           | **Partial** | Export works; no diff/patch format                          |
| Asset manifest              | **Partial** | assetId in backgrounds/overlays; recovery hooks exist       |
| Spectrum instances/profiles | **Good**    | Instance model + profile hydrate tested                     |
| Motion profiles             | **Good**    | Same slot pattern as spectrum                               |
| Scenes/setlists             | **Partial** | Scene switching local; setlist HUD local                    |
| Migrations                  | **Active**  | Frequent store version bumps — cloud sync would fight churn |
| Missing-asset recovery      | **Good**    | Import warnings, restore hooks                              |

## Gaps before cloud sync

1. **Canonical project snapshot format** with explicit `appVersion`, `storePersistVersion`, `projectSchemaVersion`.
2. **Asset content addressing** — hash-based blob keys in object storage.
3. **No blob URLs in cloud rows** — already a local rule; must enforce on export.
4. **Conflict resolution** — last-write-wins insufficient for profiles/scenes; need vector or field-level merge policy.
5. **Offline-first queue** — local edits while disconnected, sync on reconnect.

## Future data model (PostgreSQL metadata)

```
User
  id, email, created_at

Project
  id, user_id, title, schema_version, store_version, updated_at

ProjectSnapshot
  id, project_id, label, snapshot_json, created_at, app_version

Asset
  id, user_id, content_hash, mime_type, byte_size, storage_key

ProjectAssetRef
  project_id, asset_id, role (background|overlay|audio|logo)

ProfilePreset
  id, user_id, family (spectrum|background|motion), name, values_json

DeviceSession
  id, user_id, device_label, last_seen_at
```

### Storage rules

- Blobs → Supabase Storage (or S3-compatible).
- Metadata → PostgreSQL with RLS per `user_id`.
- Snapshots store JSON + version triple; large binaries never inline.

## Local-first principle

Cloud sync must not block editing offline. Browser IndexedDB + existing persist remains primary; cloud is backup/collaboration layer.

## Recommendation

**Defer cloud implementation** until:

- Project schema stabilizes (fewer breaking store migrations per release).
- Asset manifest export is canonical and documented.
- Presentation/output mode and recording strategy settled (this sprint).

See `BACKEND_OPTIONS.md` for GO/NO-GO.

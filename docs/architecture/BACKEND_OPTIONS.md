# Backend Options (Design Only)

## Proposed stack

| Layer            | Technology                       |
| ---------------- | -------------------------------- |
| Frontend hosting | Netlify (static + SPA)           |
| Auth             | Supabase Auth                    |
| Database         | Supabase PostgreSQL              |
| Object storage   | Supabase Storage                 |
| Privileged ops   | Netlify Functions (service role) |

## Environment variables

### Client-safe (Vite — prefixed `VITE_`)

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

These may appear in the browser bundle. RLS must protect all user data.

### Server-only (Netlify Functions — never in Vite)

```bash
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
```

**Never** import service role into client code or commit real values.

See `.env.example` at repo root for the template.

## Security rules

1. **Row Level Security mandatory** before any user-facing project API.
2. Service role only in serverless functions (admin tasks, signed upload URLs).
3. Separate Netlify contexts: `development`, `deploy-preview`, `production`.
4. Anon key + RLS for all client reads/writes of owned rows.
5. Signed upload URLs for large assets; metadata row created after upload completes.

## API shape (future)

| Endpoint                           | Auth     | Purpose                              |
| ---------------------------------- | -------- | ------------------------------------ |
| `POST /api/projects`               | user JWT | Create project metadata              |
| `GET /api/projects/:id`            | user JWT | Fetch metadata + latest snapshot ref |
| `POST /api/projects/:id/snapshots` | user JWT | Store snapshot JSON                  |
| `POST /api/assets/upload-url`      | user JWT | Server mints signed Storage URL      |
| `POST /api/assets/confirm`         | user JWT | Register asset row after upload      |

Implementation: Netlify Functions proxying Supabase with service role where needed.

## Alternatives considered

| Option                        | Pros         | Cons                            |
| ----------------------------- | ------------ | ------------------------------- |
| Supabase only (client direct) | Fast MVP     | Harder to hide privileged ops   |
| Netlify + custom Postgres     | Full control | More ops burden                 |
| Firebase                      | Realtime     | Less SQL-friendly for snapshots |
| Local-only forever            | Simple       | No multi-device                 |

**Recommendation:** Supabase + Netlify Functions for signed uploads and admin tasks.

## GO / NO-GO decision

### **NO-GO** for backend implementation now

**Reasons:**

1. `STORE_PERSIST_VERSION` still changing (currently **96**; output mode session layer is not persisted).
2. Project schema v1 exists but asset manifest / snapshot contract not frozen.
3. V1 product priority is **live output (OBS)** and visual stability — not accounts/sync.
4. Recording architecture undecided (no master compositor).

### Conditions to revisit (GO criteria)

- [ ] 2 releases without breaking store migrations
- [ ] Canonical project export documented and stable
- [ ] Asset hash manifest in export format
- [ ] Conflict resolution policy written
- [ ] Presentation Mode validated in production shows

**Estimated earliest:** after output/recording compositor decision + schema freeze sprint.

# Working in this repo

Vite + React 19 + TypeScript + Zustand + Three.js/R3F. **The package manager is
`pnpm`** (`pnpm-lock.yaml` is the only lockfile — do not run `npm install`).

There is no Next.js here. If you were told otherwise, that was a stale note; it
has been removed.

## Read before writing code

1. [docs/architecture/ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md) — **the
   contract**: zones, dependency rules, feature ownership, where new code goes.
2. [docs/architecture/CODEBASE_STRUCTURE.md](docs/architecture/CODEBASE_STRUCTURE.md)
   — where things live today.
3. [docs/status/CURRENT_SYSTEM_STATUS.md](docs/status/CURRENT_SYSTEM_STATUS.md)
   — as-built status.

## Hard rules

- **Dependency direction.** `types/` `ui/` `lib/` are leaves; `features/*` may
  not import `components/` or `pages/`; `store/` may not import presentation.
  Full table in ARCHITECTURE.md §2. Enforced by `pnpm architecture:check`.
- **A new persisted store key requires a `STORE_PERSIST_VERSION` bump and a
  migration.** Without it the key is `undefined` in production and dev looks
  fine.
- **Destructive UI must confirm.** Anything `variant="destructive"` awaits
  `useDialog().confirm()` before acting.
- **No feature creep during a refactor.** One domain per PR.

## Before you finish

Run these from the repo root and leave them green:

```bash
pnpm format
pnpm lint
pnpm architecture:check
pnpm structure:check
pnpm docs:check
pnpm test:run
pnpm build
```

`pnpm format` is not optional. Format before reporting a task complete, not
after the user notices.

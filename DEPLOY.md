# Deployment Runbook — Render

Live service: https://thuto-mobile.onrender.com

## Render service settings (validated against commit `0901a25`)

| Setting | Value |
|---|---|
| Runtime | Node 24 (Render shows the Bun toolchain too; scripts assume npm) |
| Build command | `npm install --include=dev --legacy-peer-deps && npm run build` |
| Start command | `npm start` (runs `tsx server.ts`) |
| Environment | `NODE_ENV=production` — **required** |

No other environment variables exist. The gateway reads only `PORT`
(injected by Render) and `NODE_ENV`. Students supply portal credentials
per session; the server holds no secrets.

## Why each piece exists (hard-won context)

1. **Build command must contain the explicit install.** The repo carries a
   `bun.lock`, so Render sets up the Bun toolchain; overriding the build
   command with `npm run build` *replaces* the default install step
   (`bun install`), leaving `node_modules` empty (`sh: 1: vite: not found`).

2. **`--include=dev` is load-bearing.** With `NODE_ENV=production` set,
   several installers (including Bun; platform-config-dependent for npm)
   skip devDependencies. `vite`, `tsx`, and tailwind build deps all live in
   devDependencies.

3. **`--legacy-peer-deps` is a pre-existing constraint of this codebase.**
   The root `esbuild@^0.25.0` pin conflicts with `vite@8`'s
   `peerOptional esbuild@^0.27 || ^0.28`. Local Bun installs tolerate it;
   strict npm does not. The durable fix (queued, Phase 5): bump root
   esbuild to `^0.28.0` and regenerate `bun.lock`, removing the flag
   everywhere. `tsx` keeps its nested esbuild inside
   `node_modules/tsx/` — npm already proven to resolve it that way.

4. **`NODE_ENV=production` selects the correct server branch.**
   `server.ts` (end of file) mounts Vite dev middleware when
   `NODE_ENV !== 'production'`, otherwise `express.static(dist)` + SPA
   catch-all. Without the env var the "deployed" app would silently serve
   unminified dev source. The static branch sits AFTER all `/api/` routes,
   and derives `__dirname` correctly for ESM (`fileURLToPath(import.meta.url)`).

## Known operational quirks (design-consistent, not bugs)

- **Free-tier spin-down:** the instance sleeps after ~15 min idle. The
  in-memory session store (`sessions` Map) dies with it, so returning
  students get the honest "session expired — sign in again" flow. This is
  correct fail-closed behavior; expect re-logins after idle.
- **Unknown `/api/*` paths** are answered by the SPA catch-all with
  `index.html` (200 instead of 404). Phase 5 hardening nit: add a
  `/api` fallthrough that 404s JSON before the catch-all.
- **Cold start latency** on first visit after idle (~30-60s), plus the
  Thuto portal's own Roma-campus latency on first real login (~9s cold).
  Generous timeouts are already set on gateway fetches.
- **Vite build warning** (`__dirname` in `vite.config.ts`, deprecated in
  favor of `import.meta.dirname`) — harmless today; queued for Phase 5.

## Phase 5 ledger (from this deployment)

- [ ] Decide one package manager for production: commit an npm lockfile
      (reproducible strict-npm deploys), or go all-Bun on Render
      (`bun run server.ts` — Bun executes TS natively, tsx becomes
      dev-only). Current state: repo is bun.lock-canon, Render installs
      via npm — resolution drift is possible.
- [ ] esbuild `^0.28.0` bump (removes `--legacy-peer-deps` need).
- [ ] `/api/*` JSON 404 fallthrough before the SPA catch-all.
- [ ] `import.meta.dirname` in `vite.config.ts`.
- [ ] Strip dead AI-Studio deps (`@google/genai`, unused assets in
      `public/assets/aistudio/`).

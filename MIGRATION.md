# Cloudflare migration status

## Reproducible checks

Use Node 22 and pnpm 10.26.1. Run `pnpm install --frozen-lockfile`,
`pnpm test`, `pnpm exec tsc --noEmit`, `pnpm cf:build`, and
`pnpm exec wrangler deploy --dry-run`.
The build requires NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
and SUPABASE_SERVICE_ROLE_KEY; CI uses non-secret placeholders solely for compilation.
Real public build values are required for production. Never deploy the CI fixture build.

On 2026-09-12: 61 tests, TypeScript, OpenNext build and Wrangler dry-run passed.
Local workerd: homepage 200, both unauthenticated cron routes 401, including
Bearer undefined. Spotify token fetch and encrypted VAPID-signed web-push requests pass in workerd
against intercepted fixture endpoints (`node scripts/check-worker-compat.mjs`).
Real authenticated Spotify and push delivery remain unverified.
The bundle is about 4 MiB compressed; verify the intended account supports it.
Repository-wide lint reports pre-existing debt and is not a passing gate.

## Cron cutover

worker.ts wraps the generated OpenNext fetch handler following
https://opennext.js.org/cloudflare/howtos/custom-worker.
CRON_ROUTES is a JSON object mapping an approved cron expression to an array of
/api/cron/notify and/or /api/cron/spotify-sync. Only these paths are allowed;
missing configuration, HTTP failures and reported per-user failures reject execution.
No trigger cadence is committed: the original PR contained guesses and no
vercel.json exists. Verify the Vercel dashboard schedule before configuring
matching [triggers].crons and CRON_ROUTES. Coordinate disabling the old scheduler
and enabling the new one to avoid duplicate notifications. This requires the
applicable scheduler approval. DNS, account and secret changes are separate.

## Integration and production gates

The existing https://saeshify.vercel.app returned 200 from Vercel on 2026-09-12.
No Cloudflare deployment, DNS change, secret change or scheduler cutover was made.
GitHub main ruleset 21578171 requires PRs and protects deletion and history, with
no bypass. On 2026-09-13 the approved ruleset update added strict required
GitHub Actions verify checks (integration 15368). Re-read protection and the
exact head checks immediately before merge.

## Dependency consolidation

pnpm-lock.yaml replaces package-lock.json. The migration includes the changes
proposed in PRs #4, #5, #7, #8, #9, #10, #11, #12, #13, #14 and #15:
nanoid 3.3.19; fast-uri 3.1.7; brace-expansion 1.1.18/2.1.4/5.0.9;
js-yaml 4.3.2; postcss-selector-parser 6.1.4; @humanfs/node 0.16.8;
browserslist 4.28.9; qs 6.16.0; vitest and @vitest/mocker 4.1.11;
baseline-browser-mapping 2.11.23; sharp 0.35.4; Next and eslint-config-next 16.3.4.
The old proposals are closed as consolidated into PR #2, with all 11 branches retained.
They are not incorporated into main until PR #2 merges.

## Runtime compatibility

The configured compatibility date needs enable_nodejs_http_modules for native
HTTPS requests used by web-push. The fixture uses the actual wrangler.toml flags,
intercepts every outbound request, and checks Spotify form encoding plus push
POST, VAPID authorization and encrypted body. No real notifications are sent.
See https://developers.cloudflare.com/workers/runtime-apis/nodejs/https/.

Vercel created historical production deployments. A main merge may trigger its
existing integration; no new deployment workflow or webhook was added. Cloudflare
production cutover, credentials, cron cadence and real integration QA remain separate.

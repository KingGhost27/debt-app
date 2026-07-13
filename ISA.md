---
task: Cowculator P0 unbreak — Supabase verify, auth error state, self-host fonts, hero overlap
project: Cowculator (Debtsy)
slug: cowculator-p0-unbreak
effort: E3
phase: complete
progress: 34/34
mode: algorithm
started: 2026-07-13T13:55:00-05:00
updated: 2026-07-13T13:55:00-05:00
---

# ISA — Cowculator (Debtsy)

Project ISA — system of record for the Cowculator debt-payoff PWA. Current run: **P0 Unbreak** from the approved UI plan (`PAI/MEMORY/WORK/cowculator-ui-girly-review/PLAN.md`).

## Problem

Four launch-path defects (found 2026-07-12 review): **B1** Supabase project was dead (NXDOMAIN) — discovered restored 2026-07-13, needs live verification. **B2** app hangs on a permanently blank page when Supabase is unreachable (`AuthContext.tsx` `getSession().then` without `.catch`/timeout; route gates `return null` forever). **B4** fonts load from Google Fonts at runtime (index.html link + index.css @import) — flaky, GDPR noise, no offline PWA fonts, and on Flora's own machine fallback lands on mono so she sees a plainer app than users. **B3** hero text overlaps when fallback fonts render wider than Bagel Fat One metrics.

## Vision

Flora opens localhost and the app just works — logged in, cute fonts rendering bubble-round *on her own riced machine for the first time*, and if the backend ever dies again the app says so with a sad Debtsy instead of a void.

## Out of Scope

No changes to debt math, Stripe, or auth logic semantics. No gray→warm color sweep (P1). No bubble headers/mascot redistribution (P2+). No math display bugs (billDistribution mutation, fake payoff date — separate track). No deploy in this run.

## Constraints

- bun/bunx only; TypeScript only.
- Fonts self-hosted via Fontsource (SIL OFL, latin subsets), `font-display: swap`, metric-matched fallbacks.
- B2 fix is additive UI/error-handling — auth happy path untouched.
- Existing `.env` keys stay (verified valid against restored project).
- Commits to feature-appropriate messages; push only with Flora's approval.

## Goal

App boots against the restored Supabase project on localhost; an unreachable Supabase produces a friendly retryable error screen (never a blank page); all four fonts are served locally with zero runtime Google Fonts requests; the hero survives fallback rendering without overlap — verified with Interceptor screenshots, typecheck, and build.

## Criteria

### D1 — B1: Supabase restored (verify)
- [x] ISC-1: DNS resolves for zuejobxnobqvajxphleg.supabase.co (getent)
- [x] ISC-2: `GET /auth/v1/health` returns 200 with existing anon key (curl)
- [x] ISC-3: REST table query returns 200 with existing anon key (curl)
- [x] ISC-4: Dev server boots; `/` renders landing (Interceptor screenshot)
- [x] ISC-5: `/auth` renders sign-in UI, not blank (Interceptor screenshot)
- [x] ISC-6: Anti: `.env` unmodified this run (git diff shows no .env change)

### D2 — B2: auth error state
- [x] ISC-7: `getSession()` failure is caught (catch/timeout path sets state; Read)
- [x] ISC-8: Session fetch bounded by timeout (~10s) that flips loading (Read)
- [x] ISC-9: AuthContext exposes an auth error signal + retry (Read)
- [x] ISC-10: Error screen component exists with sad mascot + retry button (Read)
- [x] ISC-11: ProtectedRoutes renders error screen (not null) on auth error (Read)
- [x] ISC-12: Public landing still renders when Supabase is down (Interceptor, bogus URL)
- [x] ISC-13: `tsc` typecheck exits 0 (Bash)
- [x] ISC-14: `bun run build` exits 0 (Bash)
- [x] ISC-15: Reproduction: bogus Supabase URL → error screen, not blank page (Interceptor screenshot)
- [x] ISC-16: Anti: happy-path — valid backend still reaches landing/auth normally (Interceptor after revert)
- [x] ISC-17: Retry button re-attempts session fetch (Read: handler wired)

### D3 — B4: self-host fonts
- [x] ISC-18: `@fontsource/{nunito,quicksand,fredoka,bagel-fat-one}` in package.json deps (Read)
- [x] ISC-19: Weight imports present in `main.tsx` (Read)
- [x] ISC-20: Google Fonts `<link>`s + preconnects removed from index.html (Grep)
- [x] ISC-21: `@import url('https://fonts.googleapis...')` removed from index.css (Grep)
- [x] ISC-22: Zero runtime Google Fonts refs in prod bundle; `/fonts` dev lab lazy + dev-gated (Grep dist)
- [x] ISC-23: Build output contains woff2 font assets (ls dist/assets — 13 files)
- [x] ISC-24: Page load makes no external font requests (performance resource timing — localhost woff2 only)
- [x] ISC-25: Metric-matched fallback `@font-face` overrides present (size-adjust; Read index.css)
- [x] ISC-26: Anti: no package-lock.json created; bun.lock only (ls)
- [x] ISC-27: All four Fontsource packages are SIL OFL (Read package metadata)

### D4 — B3: hero overlap
- [x] ISC-28: Hero h1/paragraph no overlap at desktop width (rect probe + forced-fallback re-probe)
- [x] ISC-29: No horizontal overflow / hero overlap at 320px (same-origin iframe probe; full visual mobile pass still planned in girly-review run)
- [x] ISC-30: CTA button labels single-line, no overflow (rect probe: singleLine true, scrollHeight ≤ clientHeight)
- [x] ISC-31: Anti: landing page diff limited to font delivery + hero robustness (git diff scope)

### D5 — repo hygiene
- [x] ISC-32: Work committed with descriptive message(s) (git log 26ea4f0)
- [x] ISC-33: No unapproved push — repo left ahead 2, approval requested from Flora (git status)
- [x] ISC-34: Anti: no edits to stripe/webhook/api code this run (git diff scope)

## Test Strategy

| isc | type | check | threshold | tool |
|-----|------|-------|-----------|------|
| 1-3 | api | DNS + HTTP status | 200 | Bash/curl |
| 4-5,12,15-16,28-30 | ui | live render/screenshot | visual pass | Interceptor |
| 6,31,34 | anti | diff scope | zero out-of-scope hunks | git diff |
| 7-11,17-21,25,27 | code | symbol/content present | exact match | Read/Grep |
| 13-14 | build | exit code | 0 | Bash |
| 22 | code | external font refs | 0 matches | Grep |
| 23,26 | build | artifact presence | woff2 present; no package-lock | ls |
| 24 | network | font requests | 0 external | Interceptor netlog |
| 32-33 | repo | git state | commit exists; push approved | git |

## Features

| name | satisfies | depends_on | parallelizable |
|------|-----------|------------|----------------|
| verify-supabase-restore | ISC-1..6 | — | yes |
| auth-error-state | ISC-7..17 | — | yes |
| selfhost-fonts | ISC-18..27 | — | yes |
| hero-robustness | ISC-28..31 | selfhost-fonts | no |
| commit-and-gate-push | ISC-32..34 | all above | no |

## Decisions

- 2026-07-13: B1 resolved without action — Supabase project un-paused itself (or Flora restored it); DNS resolves, auth health 200, anon key valid. Run verifies rather than recreates.
- 2026-07-13: Delegation floor 1/2 — show-your-math: B2/B4 diffs are small surgical single-author edits (~20 + ~15 lines); a second delegate (Explore/Engineer) would only re-read files already read. Forge retained per E3 auto-include binding.
- 2026-07-13: refined: ISC-22 — `/fonts` dev font-lab page intentionally loads Google Fonts for comparison; instead of deleting it, lazy-loaded + gated behind `import.meta.env.DEV` so the prod bundle stays clean and the tool survives for dev.
- 2026-07-13: Forge substitution — plan named mascot "DebtsyCow" for the error screen but that component doesn't exist in `components/ui/mascots/`; BooBoo (pink pig) + 💧 used instead. One-line swap if Flora prefers a cow.
- 2026-07-13: B2 repro nuance — `getSession()` with an empty localStorage resolves locally (no hang); the original hang requires a stale/invalid stored session forcing a network token refresh. Repro achieved by seeding `sb-*-auth-token` with an expired session against a dead host; error screen rendered after the 10s bound.
- 2026-07-13: DISCOVERY — Flora's Chrome blocks webfont *rendering* machine-wide (woff2 fetch 200/16KB, FontFace loaded, canvas measures proportional, but paint falls back to mono/grotesque; fc-match is clean Noto). App delivery is correct; users unaffected. Follow-up for Flora: uBlock "block remote fonts" switch or chrome://settings/fonts on the rice.

## Verification

- ISC-1: Bash — `getent hosts zuejobxnobqvajxphleg.supabase.co` → 172.64.149.246, 104.18.38.10
- ISC-2: curl — `/auth/v1/health` with anon key → 200
- ISC-3: curl — `/rest/v1/subscriptions?select=id&limit=1` → `[]` 200
- ISC-4: Interceptor — landing full-page screenshot `interceptor-screenshot-1783969154712.png`
- ISC-5/16: Interceptor — `open localhost:5173/auth` text: "Cowculator / Track and crush your debt / Sign In / Create Account"
- ISC-6/31/34: `git diff --name-only` — no `.env`, no `api/`; LandingPage hunks = font stacks + whitespace-nowrap only
- ISC-7/8/9/17: Read AuthContext.tsx — Promise.race 10s bound, catch → authError, retryAuth exposed; Read AuthErrorScreen.tsx — retryAuth wired to button
- ISC-10: Read src/components/AuthErrorScreen.tsx — BooBoo + 💧 + "Try again"
- ISC-11/15: Interceptor — seeded stale `sb-*-auth-token`, dead host, `/dashboard` → "Moo... we can't reach the barn" + Try again (screenshot `interceptor-screenshot-1783969540395.png`)
- ISC-12: Interceptor — `/` on dead-backend server rendered full landing nav + hero text
- ISC-13: `bunx tsc --noEmit -p tsconfig.app.json` → exit 0
- ISC-14: `bun run build` → PWA precache 28 entries, dist emitted
- ISC-18..21/25/26: Read/Grep — 4 @fontsource deps, 13 imports in main.tsx, zero googleapis in index.html/index.css, fallback @font-face with size-adjust in index.css, no package-lock.json
- ISC-22: Grep dist — `fonts.googleapis` only in lazy FontsShowcasePage chunk; 0 matches in index-*.js; route dev-gated
- ISC-23: ls dist/assets → 13 .woff2 files
- ISC-24: performance.getEntriesByType('resource') — all font URLs localhost; in-page fetch of nunito-latin-400 → 200, 16316 bytes, magic "wOF2"
- ISC-27: node_modules @fontsource package.json × 4 → "license": "OFL-1.1"
- ISC-28: rect probe h1.bottom 358 < p.top 378; identical result with fallback font force-injected (style inject, family confirmed applied, wider metrics 325 vs 300)
- ISC-29: 320px iframe probe — scrollWidth 312 (no overflow-x), heroOverlap false, CTA 280×52 single-line
- Advisor pass (Rule 2): timer cleanup verified (clearTimeout in finally + isMountedRef + request-id guard); CSP `font-src 'self' data:` already excludes Google hosts; service-role key not VITE_-prefixed and absent from dist
- ISC-30: rect probe post-fix — singleLine: true, scrollHeight overflow: false
- ISC-32: git log — 26ea4f0 "fix(P0): auth error state, self-hosted fonts, hero robustness"

## Changelog

- **conjectured:** Fixing font *delivery* (self-hosting) would fix Flora's own mono-rendered view of the app (plan note: "Fixing font delivery fixes your own view of your product").
  **refuted by:** Full-res screenshot crops after the fix — woff2 fetched (200, 16KB, wOF2 magic), FontFace API loaded, canvas measures proportional, yet DOM paint falls back to mono/grotesque on every page; fc-match resolves clean Noto Sans.
  **learned:** Two independent layers can each cause the mono view: app-side delivery (fixed) and a Chrome-level webfont-rendering block on Flora's riced machine (uBlock font switch or chrome://settings/fonts — machine-side, outside this repo). Users get correct fonts; Flora's browser needs its own one-toggle fix.
  **criterion now:** ISC-24 probes delivery via resource timing + in-page fetch (not screenshots); Flora's-view verification moved to a machine-side follow-up.

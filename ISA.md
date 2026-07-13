---
task: Cowculator P0 unbreak — Supabase verify, auth error state, self-host fonts, hero overlap
project: Cowculator (Debtsy)
slug: cowculator-p0-unbreak
effort: E3
phase: observe
progress: 0/34
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
- [ ] ISC-1: DNS resolves for zuejobxnobqvajxphleg.supabase.co (getent)
- [ ] ISC-2: `GET /auth/v1/health` returns 200 with existing anon key (curl)
- [ ] ISC-3: REST table query returns 200 with existing anon key (curl)
- [ ] ISC-4: Dev server boots; `/` renders landing (Interceptor screenshot)
- [ ] ISC-5: `/auth` renders sign-in UI, not blank (Interceptor screenshot)
- [ ] ISC-6: Anti: `.env` unmodified this run (git diff shows no .env change)

### D2 — B2: auth error state
- [ ] ISC-7: `getSession()` failure is caught (catch/timeout path sets state; Read)
- [ ] ISC-8: Session fetch bounded by timeout (~10s) that flips loading (Read)
- [ ] ISC-9: AuthContext exposes an auth error signal + retry (Read)
- [ ] ISC-10: Error screen component exists with sad mascot + retry button (Read)
- [ ] ISC-11: ProtectedRoutes renders error screen (not null) on auth error (Read)
- [ ] ISC-12: Public landing still renders when Supabase is down (Interceptor, bogus URL)
- [ ] ISC-13: `tsc` typecheck exits 0 (Bash)
- [ ] ISC-14: `bun run build` exits 0 (Bash)
- [ ] ISC-15: Reproduction: bogus Supabase URL → error screen, not blank page (Interceptor screenshot)
- [ ] ISC-16: Anti: happy-path — valid backend still reaches landing/auth normally (Interceptor after revert)
- [ ] ISC-17: Retry button re-attempts session fetch (Read: handler wired)

### D3 — B4: self-host fonts
- [ ] ISC-18: `@fontsource/{nunito,quicksand,fredoka,bagel-fat-one}` in package.json deps (Read)
- [ ] ISC-19: Weight imports present in `main.tsx` (Read)
- [ ] ISC-20: Google Fonts `<link>`s + preconnects removed from index.html (Grep)
- [ ] ISC-21: `@import url('https://fonts.googleapis...')` removed from index.css (Grep)
- [ ] ISC-22: Zero `fonts.googleapis.com|fonts.gstatic.com` refs in src/ + index.html (Grep)
- [ ] ISC-23: Build output contains woff2 font assets (ls dist/assets)
- [ ] ISC-24: Page load makes no external font requests (Interceptor network log)
- [ ] ISC-25: Metric-matched fallback `@font-face` overrides present (size-adjust; Read index.css)
- [ ] ISC-26: Anti: no package-lock.json created; bun.lock only (ls)
- [ ] ISC-27: All four Fontsource packages are SIL OFL (Read package metadata)

### D4 — B3: hero overlap
- [ ] ISC-28: Hero h1/paragraph no overlap at desktop width (Interceptor screenshot)
- [ ] ISC-29: Hero renders correctly at 390px mobile width (Interceptor screenshot)
- [ ] ISC-30: CTA button labels don't overflow at mobile width (same screenshot)
- [ ] ISC-31: Anti: landing page diff limited to font delivery + hero robustness (git diff scope)

### D5 — repo hygiene
- [ ] ISC-32: Work committed with descriptive message(s) (git log)
- [ ] ISC-33: Push to origin only after Flora approves (git status / her word)
- [ ] ISC-34: Anti: no edits to stripe/webhook/api code this run (git diff scope)

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

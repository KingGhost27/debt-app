---
task: Cowculator math bugs — bill-distribution mutation + never-pays-off payoff state
project: Cowculator (Debtsy)
slug: cowculator-math-bugs
effort: E3
phase: verify
progress: 35/38
mode: algorithm
started: 2026-08-03T00:00:00-05:00
updated: 2026-08-03T00:00:00-05:00
previous_run: cowculator-p0-unbreak (34/34, complete 2026-07-13)
---

# ISA — Cowculator (Debtsy)

Project ISA — system of record for the Cowculator debt-payoff PWA. Current run: **P0 Unbreak** from the approved UI plan (`PAI/MEMORY/WORK/cowculator-ui-girly-review/PLAN.md`).

## Problem

**Current run (2026-08-03) — two math display bugs that lie to the user about money.**

**M1 — bill-distribution mutation.** `src/lib/billDistribution.ts:234` — `generateSuggestions` writes `targetPeriod.totalAmount += bill.minimumPayment` on the *same* period objects `analyzeBillDistribution` returns to the UI. Whenever suggestions fire, `BillDistributionPanel.tsx:150` renders inflated pay-period totals and `:133-138` draws bar heights + overloaded/underloaded badges off the same corrupted field. Harness proof: displayed **$2,610 vs real $1,760 (+$850 phantom)**.

**M2 — fake payoff date for non-amortizing plans.** The user-visible path is `generatePayoffPlan` (`calculations.ts:217`), whose loop caps at `maxMonths = 360` (`:257`, `:263`) and then unconditionally returns `debtFreeDate: format(addMonths(currentDate, -1))` at `:364`. If funding never clears the debts — funding below total minimums, or any debt whose payment ≤ its monthly interest — balances grow, the loop runs out the cap, and the UI shows a confident **"debt-free 2056"** with absurd total interest. `:240-242` already detects the funding-below-minimums case and does nothing but `console.warn`. In a debt app, a wrong payoff date is the single most trust-destroying output there is.

**Blocked this run:** Supabase project is unreachable again (NXDOMAIN, third occurrence — free-tier inactivity pause), which gates the deferred deploy checklist, the live `/plan` screenshot, and verification of Flora's lifetime-Pro row.

---

**Previous run (2026-07-13) — P0 unbreak, 34/34 complete.** Four launch-path defects (found 2026-07-12 review): **B1** Supabase project was dead (NXDOMAIN) — discovered restored 2026-07-13, needs live verification. **B2** app hangs on a permanently blank page when Supabase is unreachable (`AuthContext.tsx` `getSession().then` without `.catch`/timeout; route gates `return null` forever). **B4** fonts load from Google Fonts at runtime (index.html link + index.css @import) — flaky, GDPR noise, no offline PWA fonts, and on Flora's own machine fallback lands on mono so she sees a plainer app than users. **B3** hero text overlaps when fallback fonts render wider than Bagel Fat One metrics.

## Vision

**Current run.** The numbers on screen are the numbers. A pay-period card shows what those bills actually cost that period — never a hypothetical that a suggestion engine quietly added. And when a plan genuinely cannot pay itself off, the app says so out loud, with the exact monthly figure that would fix it, instead of inventing a date thirty years out. Flora ships a debt app she'd trust with her own debt.

---

**Previous run.** Flora opens localhost and the app just works — logged in, cute fonts rendering bubble-round *on her own riced machine for the first time*, and if the backend ever dies again the app says so with a sad Debtsy instead of a void.

## Out of Scope

**Current run.** No deploy — the Vercel checklist stays deferred until Supabase is live and Flora authorizes it. No Supabase schema, `.env`, `api/`, or Stripe changes. No fix for the T10.2 known gap (same-month surplus not rolling to the next debt) — that is a real but separate engine behaviour, not a display lie. No UI restyling beyond the minimum needed to render the never-pays-off warning; the girly-cute sweep stays in its own track. No decimal.js migration — float drift is quantified at ≤10¢ on $18k and immaterial.

---

**Previous run.** No changes to debt math, Stripe, or auth logic semantics. No gray→warm color sweep (P1). No bubble headers/mascot redistribution (P2+). No math display bugs (billDistribution mutation, fake payoff date — separate track). No deploy in this run.

## Constraints

**Current run.**
- bun/bunx only; TypeScript only. No new test framework — the existing recomputation harness (`PAI/MEMORY/WORK/cowculator-full-review/harness/math-verify.ts`) is the oracle.
- The fix for M1 must not change *which* suggestions are produced — only stop the display corruption. Simulation still needs to accumulate across moves, so simulated totals live in a local structure.
- M2 must be detected at loop exit (`activeDebts.length > 0`), not only at month 1 — that catches funding-below-minimums, per-debt non-amortization, and any combination.
- `debtFreeDate` must not be silently repurposed; a non-amortizing plan carries an explicit flag callers can branch on.
- Push only with Flora's approval. Stripe is in LIVE mode (`sk_live`) — no test purchases, ever.

---

**Previous run.**
- bun/bunx only; TypeScript only.
- Fonts self-hosted via Fontsource (SIL OFL, latin subsets), `font-display: swap`, metric-matched fallbacks.
- B2 fix is additive UI/error-handling — auth happy path untouched.
- Existing `.env` keys stay (verified valid against restored project).
- Commits to feature-appropriate messages; push only with Flora's approval.

## Goal

`generateSuggestions` stops mutating the pay-period objects the UI renders, so displayed period totals equal the real assigned-bill totals (harness T14.1 flips to PASS, overall ≥37/38); and `generatePayoffPlan` detects a plan that never pays off within its 360-month horizon, returning an explicit `neverPaysOff` flag plus the per-debt monthly minimum that would fix it, which the Plan UI renders as a warning instead of a fabricated debt-free date — all proven by the recomputation harness, targeted probes on the $10k @ 30% / $200-mo and $25k @ 19.99% cases, clean typecheck, and a green build.

---

**Previous run.** App boots against the restored Supabase project on localhost; an unreachable Supabase produces a friendly retryable error screen (never a blank page); all four fonts are served locally with zero runtime Google Fonts requests; the hero survives fallback rendering without overlap — verified with Interceptor screenshots, typecheck, and build.

## Criteria

> ISC-1..34 below are the previous run (P0 unbreak), all passed and retained as project system-of-record. Current run adds ISC-35..72.

### D6 — M1: bill-distribution mutation (current run)
- [x] ISC-35: `generateSuggestions` contains zero assignments to `period.totalAmount` / `targetPeriod.totalAmount` (Grep)
- [x] ISC-36: Simulated period loads tracked in a function-local structure keyed by period identity (Read)
- [x] ISC-37: Target-period capacity test reads the simulated load, not the raw field (Read)
- [x] ISC-38: Sum of returned `payPeriods[].totalAmount` equals sum of debt minimums on the unbalanced fixture (harness)
- [x] ISC-39: Harness T14.1 MUTATION probe flips FAIL → PASS (Bash)
- [x] ISC-40: Harness overall ≥ 37/38 passed (Bash)
- [x] ISC-41: Suggestions still produced on the unbalanced fixture — count unchanged at 2 (Bash probe)
- [x] ISC-42: Suggested `debtId` set and `amountImpact` values identical to pre-fix baseline (Bash probe diff)
- [x] ISC-43: Successive moves still respect capacity — no target period exceeds `avgAmount * 1.1` in simulation (Bash probe)
- [x] ISC-44: Anti: `assignBillsToPeriods` unchanged (git diff scope)
- [x] ISC-45: Anti: `calculateBalanceScore` semantics unchanged (git diff scope)
- [x] ISC-46: Anti: `BillDistributionPanel.tsx` render logic unchanged — fix is upstream only (git diff)

### D7 — M2: never-pays-off payoff state (current run)
- [x] ISC-47: `PayoffPlan` type declares `neverPaysOff: boolean` (Read types)
- [x] ISC-48: `PayoffPlan` type declares `stalledDebts: { debtId; debtName; minimumNeeded }[]` (Read types)
- [x] ISC-49: `generatePayoffPlan` sets `neverPaysOff` from loop exit with `activeDebts.length > 0` (Read)
- [x] ISC-50: `minimumNeeded` computed as the debt's monthly interest at its remaining balance (Read)
- [x] ISC-51: Probe $10k @ 30% APR, $200/mo → `neverPaysOff === true` (Bash)
- [x] ISC-52: Same probe → no fabricated 2056-era `debtFreeDate` surfaced to callers (Bash)
- [x] ISC-53: Same probe → `minimumNeeded` ≈ $250.00 (10000 × 0.30 / 12) (Bash)
- [x] ISC-54: Probe $25k @ 19.99% with adequate funding → `neverPaysOff === false` (Bash)
- [x] ISC-55: Regression: same adequate-funding case still returns 72 months (Bash, matches prior harness)
- [x] ISC-56: Regression: two-debt plan month count and total interest unchanged vs harness T11 (Bash)
- [x] ISC-57: `console.warn` at the funding-below-minimums branch replaced by the structured signal (Read)
- [x] ISC-58: `PlanPage.tsx` branches on `neverPaysOff` before rendering the debt-free hero (Read)
- [x] ISC-59: `PlanPage.tsx` renders a warning naming the shortfall amount when stalled (Read)
- [x] ISC-60: `PlanPage.tsx` suppresses both `debtFreeDate` render sites (`:168-174`, `:229-244`) when stalled (Read)
- [x] ISC-61: Dead exports `calculatePayoffDate` / `generateAmortization` handled explicitly — same detection added or removed, no half-fixed state (Read)
- [x] ISC-62: `useMilestoneDetection` / `milestones.ts` do not emit a debt-free milestone on a stalled plan (Read)

### D8 — build + hygiene (current run)
- [x] ISC-63: `bunx tsc --noEmit -p tsconfig.app.json` exits 0 (Bash)
- [x] ISC-64: `bun run build` exits 0 (Bash)
- [x] ISC-65: `bun run lint` introduces no new errors vs baseline (Bash)
- [x] ISC-66: Anti: `.env` unmodified (git diff)
- [x] ISC-67: Anti: no `api/`, Stripe, or webhook file touched (git diff)
- [x] ISC-68: Anti: no Supabase schema or migration change (git diff)
- [x] ISC-69: Work committed with descriptive message; push left gated on Flora (git log + status)

### D9 — blocked on Supabase / Flora (current run)
- [ ] ISC-70: [DEFERRED-VERIFY] Supabase project un-paused; `zuejobxnobqvajxphleg.supabase.co` resolves (Bash getent) — blocked: needs Flora's dashboard
- [ ] ISC-71: [DEFERRED-VERIFY] Flora's subscription row `8fb819fc` still reads `lifetime` (Bash curl REST) — blocked by ISC-70
- [ ] ISC-72: [DEFERRED-VERIFY] `/plan` renders the never-pays-off warning live, no console errors (Interceptor) — blocked by ISC-70

---

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

**Current run (ISC-35..72).**

| isc | type | check | threshold | tool |
|-----|------|-------|-----------|------|
| 35,37,49-50,57 | code | symbol/expression present or absent | exact match | Grep/Read |
| 36,47-48,58-62 | code | structure/branch present | exact match | Read |
| 38-40 | math | recomputation harness | T14.1 PASS; ≥37/38 overall | Bash harness |
| 41-43 | math | suggestion set vs pre-fix baseline | identical ids + amounts | Bash probe |
| 51-56 | math | payoff probe on fixed fixtures | flags + month counts exact | Bash probe |
| 44-46,66-68 | anti | diff scope | zero out-of-scope hunks | git diff |
| 63-65 | build | exit code | 0 / no new errors | Bash |
| 69 | repo | git state | commit exists; not pushed | git |
| 70-72 | deferred | live backend probe | blocked — needs Supabase un-pause | Bash/Interceptor |

**Previous run (ISC-1..34).**

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

**Current run.**

| name | satisfies | depends_on | parallelizable |
|------|-----------|------------|----------------|
| fix-billdistribution-mutation | ISC-35..46 | — | yes |
| payoff-neverpaysoff-engine | ISC-47..57, 61-62 | — | yes |
| payoff-neverpaysoff-ui | ISC-58..60 | payoff-neverpaysoff-engine | no |
| probes-and-build | ISC-63..65 | both fixes | no |
| commit-and-gate-push | ISC-66..69 | all above | no |
| deferred-backend-verify | ISC-70..72 | Flora un-pauses Supabase | blocked |

**Previous run.**

| name | satisfies | depends_on | parallelizable |
|------|-----------|------------|----------------|
| verify-supabase-restore | ISC-1..6 | — | yes |
| auth-error-state | ISC-7..17 | — | yes |
| selfhost-fonts | ISC-18..27 | — | yes |
| hero-robustness | ISC-28..31 | selfhost-fonts | no |
| commit-and-gate-push | ISC-32..34 | all above | no |

## Decisions

- 2026-08-03: **CORRECTION — the app IS deployed.** I reported "never deployed" from the absence of `.vercel/`. That inference was wrong: `.vercel/` is only created by CLI linking, and this project deploys through the Vercel↔GitHub integration. Interceptor listed an open Chrome tab at `https://cowculator.net/auth`; the site returns 200 and serves the `vercel.json` security headers from commit `000a881`, so that commit — including the lifetime-guard `294154e` behind it — is live. Absence of a local artifact is not absence of the deployment.
- 2026-08-03: **Production defect found — `/api/create-portal` and `/api/create-checkout` return 500 where they must return 401.** Both no-token and bad-token cases 500. `api/_lib/auth.ts:25-29` correctly returns null for a missing/malformed header before any network call, and each route maps null → 401, so the 401 path is right in source; the 500 means the function is failing before or around it. All three routes share the same module-level init (`new Stripe(...)`, service-role `createClient(...)`), and `stripe-webhook` returns a correct 400 — so a missing `SUPABASE_SERVICE_ROLE_KEY` does not explain it. **Not an auth bypass** (it fails closed, no session is issued) **but it means nobody can currently buy Pro or open the billing portal.** Root-causing needs Vercel function logs, which needs Flora's login. Not fixed this run — `api/` is anti-scope (ISC-67).
- 2026-08-03: **refined:** ISC-61's premise was wrong and Forge caught it. `calculatePayoffDate` and `generateAmortization` are not dead — `math-verify.ts:11-12` imports both and drives 8 tests off them. My grep covered `src/` and missed the out-of-tree harness. Deleting them, as the brief permitted, would have destroyed the oracle used to verify this very work. Lesson: "no callers" must be scoped to *all* consumers, including test harnesses living outside the repo.
- 2026-08-03: Advisor's cached-plan crash risk refuted by grep — `PayoffPlan` is never serialized to localStorage/IndexedDB/Supabase; it is derived at render time. No schema migration needed. Recorded because it is the right question for a PWA and would apply the moment a plan is persisted.
- 2026-08-03: Deferred, not fixed — the 360-month cap can false-positive `neverPaysOff` on a plan that genuinely amortizes at, say, month 380. Advisor's cleaner design is to flag from the math (`payment <= balance * monthlyRate`) and raise the horizon to 600. Correct, but it changes plan output for every long-horizon user, which is a bigger blast radius than this run's scope. Logged as follow-up.
- 2026-08-03: Deferred — advisor also suggested a headline `sum(minimumNeeded) − currentTotalPayment` gap figure rather than making the user add per-debt numbers, and an annuity-based "pay this to actually finish in 5 years" figure alongside the breakeven. Both are product improvements, not correctness fixes. Logged for the girly-UI track.
- 2026-08-03: Mode escalated by conversation-context override — classifier returned ALGORITHM E3 on "okay lets do it", which matches; the prompt in isolation reads MINIMAL but follows a multi-step proposal (check Pro row → restart dev → deploy checklist). Tier honored verbatim.
- 2026-08-03: **refined:** REVIEW.md located M2 at `calculations.ts:169-183` (`calculatePayoffDate`) and `:135` (`generateAmortization`). Grep of `src/` shows **both functions have zero callers** — they are dead exports. The user-visible fake date comes from `generatePayoffPlan`'s own 360-cap at `:257/:263` returning `debtFreeDate` at `:364`. Fix targets the live path; dead exports handled explicitly under ISC-61 rather than left half-fixed.
- 2026-08-03: **refined:** M2 detection at loop exit (`activeDebts.length > 0`) chosen over month-1 principal check. Loop-exit catches all three failure modes (funding < total minimums; a single debt whose payment ≤ its interest; combinations that stall only after an earlier debt clears) with one condition, and cannot drift out of sync with the loop it guards.
- 2026-08-03: M1 fix keeps simulation accumulation. The `underloaded.find(p => p.totalAmount + bill.minimumPayment <= avgAmount * 1.1)` capacity test *should* see prior moves — that behaviour is correct and is why the mutation was written. The bug is only that the simulation writes through to the returned objects. Local simulated-load map preserves behaviour while ending the corruption; ISC-41/42 lock the suggestion output as a regression guard.
- 2026-08-03: **Blocker — Supabase NXDOMAIN, third occurrence** (2026-07-12, self-resolved 07-13, again 08-03). `getent hosts zuejobxnobqvajxphleg.supabase.co` → no resolution while `github.com` resolves fine, so not a local DNS fault. Free-tier projects pause after ~7 days idle. Deploy checklist, lifetime-Pro row check, and live `/plan` screenshot are all downstream — marked `[DEFERRED-VERIFY]` (ISC-70..72), not silently dropped. Systemic implication logged for LEARN: a paid product cannot launch on a tier that sleeps.
- 2026-08-03: Scope pivot within Flora's approved sequence. She approved "check Pro row → deploy checklist → math bugs next". Items 1-2 are hard-blocked on her un-pausing Supabase and on interactive Vercel login; item 3 needs no backend. Executing item 3 now rather than stalling, per her standing preference for momentum on reversible work.
- 2026-08-03: Registry drift corrected — `RESUME.md` says "Vercel CLI still not installed"; it is installed (55.0.0 at `~/.bun/bin/vercel`). Separately `.vercel/` is absent, so the project has never been linked. `STRIPE_WEBHOOK_SECRET` and all three `STRIPE_PRICE_*` are now **empty** in `.env` despite RESUME.md claiming them present on 06-11 — deploy checklist item 3 (Stripe CLI e2e) cannot run until Flora refills them.
- 2026-08-03: Delegation floor 1/2 — show-your-math: Forge carries both fixes (E3 coding auto-include). A second delegate was considered and rejected: the two edits total ~60 lines across three files already read in full, the verification oracle is a deterministic harness rather than a judgment call, and Interceptor verification is blocked by the Supabase outage. A second agent would re-read files already in context and add reconciliation cost against a harness that answers definitively.
- 2026-07-13: B1 resolved without action — Supabase project un-paused itself (or Flora restored it); DNS resolves, auth health 200, anon key valid. Run verifies rather than recreates.
- 2026-07-13: Delegation floor 1/2 — show-your-math: B2/B4 diffs are small surgical single-author edits (~20 + ~15 lines); a second delegate (Explore/Engineer) would only re-read files already read. Forge retained per E3 auto-include binding.
- 2026-07-13: refined: ISC-22 — `/fonts` dev font-lab page intentionally loads Google Fonts for comparison; instead of deleting it, lazy-loaded + gated behind `import.meta.env.DEV` so the prod bundle stays clean and the tool survives for dev.
- 2026-07-13: Forge substitution — plan named mascot "DebtsyCow" for the error screen but that component doesn't exist in `components/ui/mascots/`; BooBoo (pink pig) + 💧 used instead. One-line swap if Flora prefers a cow.
- 2026-07-13: B2 repro nuance — `getSession()` with an empty localStorage resolves locally (no hang); the original hang requires a stale/invalid stored session forcing a network token refresh. Repro achieved by seeding `sb-*-auth-token` with an expired session against a dead host; error screen rendered after the 10s bound.
- 2026-07-13: DISCOVERY — Flora's Chrome blocks webfont *rendering* machine-wide (woff2 fetch 200/16KB, FontFace loaded, canvas measures proportional, but paint falls back to mono/grotesque; fc-match is clean Noto). App delivery is correct; users unaffected. Follow-up for Flora: uBlock "block remote fonts" switch or chrome://settings/fonts on the rice.

## Verification

**Current run (2026-08-03) — ISC-35..69.**

- ISC-35/36/37: `git diff src/lib/billDistribution.ts` — `targetPeriod.totalAmount +=` gone; `const simulatedLoads = new Map(payPeriods.map(p => [p, p.totalAmount]))` seeded at :204; capacity test now `(simulatedLoads.get(p) ?? p.totalAmount) + bill.minimumPayment <= avgAmount * 1.1`
- ISC-38/39/40: harness — baseline `RESULT: 36 passed, 2 failed`; after `RESULT: 37 passed, 1 failed`. T14.1 flipped to PASS. Sole remaining failure T10.2, which also failed on baseline (not a regression). T14.1 asserts `displayedSum === realSum`, both independently derived from the fixture — it cannot be satisfied by editing an expected constant.
- ISC-41/42/43: probe — `PASS c1 suggestion arrays byte-identical (ids, order, amountImpact) — 2 suggestions match exactly`; `PASS c2 fixture still produces 2 suggestions`; `PASS c3 displayed totals === real bill total — $1760 vs $1760`
- ISC-44/45: probe — `PASS c4 balanceScore unchanged (1)`, `PASS c5 isBalanced unchanged (false)`. `balanceScore` is computed at `:264`, before `generateSuggestions` at `:267`, so it was never exposed to the mutation.
- ISC-46: `git status --porcelain` — `BillDistributionPanel.tsx` not in the changed-file set; fix is entirely upstream
- ISC-47/48: `git diff src/types/index.ts` — `debtFreeDate: string | null`, `neverPaysOff: boolean`, `stalledDebts: { debtId; debtName; minimumNeeded }[]`
- ISC-49/50: `git diff src/lib/calculations.ts` — `const neverPaysOff = activeDebts.length > 0;` at loop exit; `stalledDebts` mapped from `activeDebts` with `minimumNeeded: round(calculateMonthlyInterest(debt.balance, debt.apr))`
- ISC-51/52/53: probe `balloon-probe.ts` — `neverPaysOff: true`, `debtFreeDate: null`, `stalledDebts: [{"debtId":"d1","debtName":"Balloon Card","minimumNeeded":250}]`, matching interest on the starting balance (10000 × 0.30 / 12 = 250)
- ISC-54/55: probe — healthy case `neverPaysOff=false`, `debtFreeDate=2032-05-01`, **72 months**, matching the pre-existing harness figure
- ISC-56: harness T11.1/T11.2 PASS — two-debt plan still 13 months, interest within $0.03 of clean-room
- ISC-57: `git diff` — the `console.warn('Monthly funding is less than total minimum payments')` block deleted; replaced by the `neverPaysOff`/`stalledDebts` return values
- ISC-58/59/60: `git diff src/pages/PlanPage.tsx` — `showStalledPlanWarning = plan.neverPaysOff && plan.stalledDebts.length > 0` at `:68`; both render sites (`:166-185`, `:229-252`) now ternary to `<StalledPlanWarning>`; component carries `role="alert"`
- ISC-61: **kept both, applied detection.** Forge refuted the brief's premise — `math-verify.ts:11-12` imports `calculatePayoffDate` and `generateAmortization` and drives 8 tests off them. My grep covered `src/` only. Deleting them would have destroyed the verification oracle.
- ISC-62: `git diff src/hooks/useMilestoneDetection.ts` — `let debtFreeDate: string | null = null` replaces the `'Unknown'` sentinel; empty `catch {}` replaced with a contextual `console.error`. `git diff src/lib/milestones.ts` — `payoffDate: string | null`, and the sort's `a.payoffDate.localeCompare(b.payoffDate)` (a latent null crash) is now guarded, stalled debts sorting last by name. *Caveat: verified null propagation and crash-safety directly; the narrower claim that no `debt_free` celebration fires on a stalled plan rests on Forge's reading, not my own probe.*
- ISC-63: `bunx tsc --noEmit -p tsconfig.app.json` → `tsc exit: 0`, zero diagnostics. `tsconfig.app.json` has `"strict": true`, so nullability is genuinely enforced — the widening is load-bearing, not cosmetic.
- ISC-64: `bun run build` → `✓ built in 4.52s`, exit 0, PWA precache 28 entries
- ISC-65: lint baseline `✖ 63 problems (35 errors, 28 warnings)` → after `✖ 62 problems (34 errors, 28 warnings)`. One error fewer (the empty `catch`); zero new.
- ISC-66/67/68: `git status --porcelain` — 11 files, none of them `.env`, `api/*`, or any migration/schema file
- ISC-69: committed locally; push left for Flora

**Advisor pass (Rule 2) — three claims tested, two upheld, one refuted:**
- *Refuted:* "cached plans will crash on `undefined` stalledDebts." `grep` for `localStorage`/`setItem` against plan objects returns nothing — `PayoffPlan` is derived at render time from debts + settings, never serialized. No migration needed.
- *Upheld:* `minimumNeeded` was computed from the loop's balance. In `generatePayoffPlan` the balance is clamped (`principal = payment - Math.min(interest, payment)` floors at 0), so the UI path was already correct at $250 — but `calculatePayoffDate` lets the balance grow, and probed at **$362,911.68** instead of $250. Fixed both to read `debt.balance`; re-probe returns `PASS not ballooned`, $250 in both paths.
- *Upheld:* the warning copy said "needs at least $X/mo to start reducing the balance", which is false at exactly $X — paying the interest exactly moves the balance by $0 forever. Rewritten to "charges $X/mo in interest alone — you have to pay more than that before the balance moves at all."

**Production probes (beyond the original ISC set — cowculator.net found live mid-run):**
- Security headers live: CSP, HSTS `max-age=63072000`, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` all present on `GET /`
- `POST /api/stripe-webhook` unsigned → **400** ✅ signature verification is live and enforcing
- `POST /api/create-portal` and `/api/create-checkout`, both no-token and bad-token → **500, expected 401** ❌ deploy-checklist item 2 FAILS
- Landing page renders correctly under the new nullable type: live preview shows "March 2029", "$17,000" total balance, "$3,029" interest saved (Interceptor text extract)

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

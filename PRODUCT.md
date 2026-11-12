# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

Installable PWA (vite-plugin-pwa), deployed at cowculator.net. The Google Play listing wraps the same web app as a Trusted Web Activity; the design language stays web.

## Users

Two kinds of people pay down debt with Cowculator, and the app has to work for both (owner, 2026-11-11):

- **New to budgeting.** A few credit cards or loans, a little anxious or embarrassed about them, wants a plan that feels friendly instead of bank-like.
- **Experienced trackers.** Comfortable with budgets, want to log every payment, compare strategies, and watch the numbers move.

The owner intends the app to adapt to which kind of user someone is. **Open decision:** no experience-level setting exists in code today (onboarding asks only for a name; the only related flag is `tutorialCompleted`). Until one exists, the friendly summary leads and the detail sits one step deeper.

Phone and desktop get equal use (owner, 2026-11-11).

## Product Purpose

Cowculator turns a pile of debts into a dated plan and keeps the person company while they work it. Users add debts, compare snowball and avalanche payoff orders, see their debt-free date, log payments, and track streaks and milestones. Supporting tools cover income sources, expenses, bills and pay periods, subscriptions, and (Pro) assets and net worth.

Success: a user trusts the numbers, keeps logging payments month after month, and reaches debt-free.

## Positioning

Honest math with a cheering companion. Every theme comes with its own animal friend alongside Debtsy the cow, and the math never lies: when a plan cannot pay itself off, the app says so and shows what would fix it, instead of inventing a far-off date. A free no-signup calculator on the landing page is the front door.

## Operating Context

- Paydays and monthly bill cycles drive usage: logging a payment, checking what's due, seeing progress move.
- Strategy comparison (snowball vs avalanche) and what-if scenarios happen while planning.
- Celebration moments (milestones, paid-off debts, streaks) are part of the loop.

## Capabilities and Constraints

- Stack: React 19, TypeScript, Vite 7, Tailwind CSS 4 (tokens in `src/index.css`), Supabase auth + Postgres, Stripe live billing, Recharts, lucide-react icons, date-fns, decimal.js.
- Authed routes: `/dashboard`, `/debts`, `/plan`, `/track`, `/subscriptions`, `/assets`, `/settings`, plus onboarding, auth, and reset-password flows.
- Free limits (`src/lib/tierLimits.ts`): 4 debts, 2 income sources, 10 expense entries, 3 custom categories, 3 free themes.
- Pro unlocks: unlimited entries, premium themes, asset tracking, interest-vs-principal chart, payment history, bill calendar, bill distribution, data export.
- Theme system: 9 presets (`src/lib/themes.ts`), each a palette plus its own mascot; selected in Settings via `ThemeSelector`. Premium themes are a paid Pro feature and must stay.
- A push to `main` is a production deploy (Vercel↔GitHub, live Stripe keys).
- Fonts are self-hosted via Fontsource; no runtime Google Fonts (CSP `font-src 'self'`).

## Brand Commitments

- Name: Cowculator. Mascot: Debtsy the cow.
- **The animals stay** (owner, 2026-11-11): Debtsy plus the theme friends in `src/components/ui/mascots/` (Luna Bunny, BooBoo, Cherry Kitty, Chai Bear, Lilo Otter, Maple Fox, Mochi Frog, Shadow Bunny, Sunshine Chick).
- **The fonts stay** (owner, 2026-11-11): Bagel Fat One, Fredoka, Nunito, Quicksand.
- **Theme switcher stays; theme palettes may be redesigned** if the new ones look good (owner, 2026-11-11).
- Voice: warm, playful, farm-flavored, cheering, never shaming ("Moo... we can't reach the barn"). Part of a wider brand promise: cute tools that help you get your life together.

## Evidence on Hand

- Mascot SVG components: `src/components/ui/DebtsyCow.tsx`, `src/components/ui/mascots/*.tsx`.
- Custom icon and mascot art is commissioned but not delivered yet.
- Support contact: support@cowculator.net.
- No testimonials, user counts, ratings, or press exist. Never fabricate them.

## Product Principles

1. The numbers are the truth. Never show a figure, date, or total the math doesn't back.
2. Friendly first, detail one step deeper. A nervous beginner and a seasoned tracker both find their footing.
3. Cheer, never shame. Progress gets celebrated; setbacks get a plan.
4. The companion is part of the product, not decoration on top of it.

## Accessibility & Inclusion

WCAG AA contrast for text and controls in every theme, including dark ones. Respect `prefers-reduced-motion` for mascot and celebration animation.

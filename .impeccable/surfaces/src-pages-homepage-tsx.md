---
version: 1
slug: "src-pages-homepage-tsx"
primary_target: "src/pages/HomePage.tsx"
related_targets: ["src/pages/DebtsPage.tsx","src/pages/PlanPage.tsx","src/pages/TrackPage.tsx","src/pages/SubscriptionsPage.tsx","src/pages/AssetsPage.tsx","src/pages/SettingsPage.tsx","src/pages/OnboardingPage.tsx"]
---

Scope: the logged-in Cowculator app interior, led by the Dashboard (`/dashboard`); Debts, Plan, Track, Subscriptions, Assets, Settings and Onboarding follow its world. Mode: Operate.

Audience and job: people paying down debt, from nervous beginners to seasoned trackers, on phone and desktop equally. They check progress, see what's due, and log payments.

Constraints: keep the animals (Debtsy + 9 theme friends) and the four fonts; keep all 9 theme presets and the Pro gating; redo palettes; never babyish, bank-like or plain; math, billing and auth untouched.

## Direction contract

THESIS: The dashboard is a place, your ranch, and the trail from the barn to the debt-free flag is your real progress. It refuses the category default: a card grid led by a big balance number.

OWN-WORLD: A layered flat-vector ranch scene: sky, three or four hazed rolling hills, a barn with hayloft and X-braced doors, silo, fence, trees, flowers, a dirt path and wooden signposts. Each theme is a time of day or season. Modules sit on the scene's ground color, with plank-tab headings, a picket-fence streak and deep tinted ink. Type is Bagel Fat One, Fredoka, Nunito and Quicksand.

STORY: The visitor sees how far along the trail they are and what's due next, then logs a payment. Walking forward is the reward.

FIRST VIEWPORT: The scene fills the top of the main area (about 540px on desktop; phones get their own composition of about 400px). The greeting, the "Debt-free in <date>" headline, the left/paid line and "Log a payment" sit in the sky. Debtsy grazes by the barn, the friend stands on the path at the paid share, and each debt is a signpost. Below: Up next, Latest paycheck, On-time streak.

FORM: Owner-pinned direction D (Ranch), which beat the roll. seed:51706258698a7baa

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

Signature interaction: walk the trail. Logging a payment moves the friend forward with a hop, a flower pops up behind it, and the figures roll. Reduced motion shows the end state.

Unresolved: beginner/experienced adaptive mode (not in code); whether the Nov 15 launch waits for this.

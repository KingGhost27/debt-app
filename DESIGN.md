---
name: Cowculator Ranch
description: The signed-in Cowculator app as a ranch at a time of day or season, with product surfaces on the scene's ground color, wooden plank headings and deep tinted ink.
colors:
  ground: "#F5EFFA"
  page: "#FFFCFF"
  page-soft: "#F0E8F8"
  line: "#E0D3EE"
  track: "#E7DCF3"
  ink: "#2B1A4F"
  ink-soft: "#5B4A7F"
  button: "#3A2466"
  button-ink: "#FFFFFF"
  fill: "#7B58C9"
  focus: "#B1335F"
  focus-bg: "#FBE4EC"
  ok-ink: "#1D6A45"
  ok-bg: "#D6F1E1"
  ok-fill: "#3E9C6B"
  soon-ink: "#694700"
  soon-bg: "#FBE9AE"
  plank: "#84593F"
  plank-ink: "#FFF5EC"
  picket: "#FFFFFF"
  picket-line: "#B99C8C"
  selection: "#D9C4F5"
typography:
  display:
    fontFamily: "Bagel Fat One, Bagel Fat One Fallback, sans-serif"
    fontSize: "clamp(40px, 6.1cqw, 88px)"
    fontWeight: 400
    lineHeight: 0.98
    letterSpacing: "-0.005em"
  headline:
    fontFamily: "Fredoka, Fredoka Fallback, sans-serif"
    fontSize: "26px"
    fontWeight: 600
    lineHeight: 1.15
  title:
    fontFamily: "Fredoka, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1.25
  body:
    fontFamily: "Nunito, Quicksand, system-ui, sans-serif"
    fontSize: "14.5px"
    fontWeight: 600
    lineHeight: 1.35
  figure:
    fontFamily: "Quicksand, Nunito, sans-serif"
    fontSize: "30px"
    fontWeight: 700
    lineHeight: 1.05
    fontFeature: "tnum"
  label:
    fontFamily: "Quicksand, sans-serif"
    fontSize: "12px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.04em"
rounded:
  plank: "8px"
  field: "14px"
  chip: "15px"
  card: "24px"
  sheet: "28px"
  pill: "999px"
spacing:
  xs: "6px"
  sm: "12px"
  md: "18px"
  lg: "22px"
  xl: "44px"
components:
  card:
    backgroundColor: "{colors.page}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "20px 18px"
  plank-heading:
    backgroundColor: "{colors.plank}"
    textColor: "{colors.plank-ink}"
    rounded: "{rounded.plank}"
    padding: "7px 15px 7px 13px"
    typography: "{typography.headline}"
  button-primary:
    backgroundColor: "{colors.button}"
    textColor: "{colors.button-ink}"
    rounded: "{rounded.pill}"
    padding: "0 26px"
    height: "52px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 18px"
    height: "44px"
  button-danger:
    backgroundColor: "{colors.focus}"
    textColor: "{colors.page}"
    rounded: "{rounded.pill}"
    height: "50px"
  rail-link:
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.chip}"
    height: "46px"
    padding: "0 14px"
  rail-link-active:
    backgroundColor: "{colors.button}"
    textColor: "{colors.button-ink}"
  badge-focus:
    backgroundColor: "{colors.focus-bg}"
    textColor: "{colors.focus}"
    rounded: "{rounded.pill}"
    height: "23px"
    padding: "0 9px"
  badge-soon:
    backgroundColor: "{colors.soon-bg}"
    textColor: "{colors.soon-ink}"
    rounded: "{rounded.pill}"
  badge-ok:
    backgroundColor: "{colors.ok-bg}"
    textColor: "{colors.ok-ink}"
    rounded: "{rounded.pill}"
  field:
    backgroundColor: "{colors.page}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    height: "48px"
  modal-sheet:
    backgroundColor: "{colors.page}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sheet}"
  segmented-control:
    backgroundColor: "{colors.track}"
    rounded: "{rounded.pill}"
    padding: "4px"
---

# Design System: Cowculator Ranch

Scope: the signed-in app interior (Dashboard, Debts, Plan, Track, Subscriptions, Assets, Settings, Onboarding and every dialog). The public landing page (`src/pages/LandingPage.tsx`) is a separate, older world and is not documented here. The frontmatter shows the default preset, Lavender Dream; the other eight presets reuse the same roles with different values (see Colors).

## Overview

**Creative North Star: "The Ranch You're Walking Home Across"**

The dashboard is a place, not a card grid. A layered flat-vector scene (sky, hazed hills, barn, silo, fence, trees, flowers, a dirt trail with a signpost per debt) fills the top of the main area, and the walk home along that trail is the real progress: the theme's friend sets off from the far hills and reaches the barn, with the "Debt-free" sign over its open door, on the day the last debt is paid. Debtsy and the other friends wait at the barn. Each of the nine themes is a time of day or a season on the same ranch. Everything below the scene sits on the scene's own ground color, so the page reads as the meadow in front of the picture.

Surfaces are soft, large-radius pages lifted by one diffuse tinted shadow. Headings are wooden plank tabs. Ink is a deep tint of the theme hue, never neutral black or gray. Type pairs a fat display face for the headline moment with a rounded friendly UI face; figures are tabular so money never jitters. The mood is warm, confident and playful without being babyish or bank-like. The animals (Debtsy and one friend per theme) stay as characters in the scene and in empty states.

Interior pages other than the dashboard get a short strip (132px phone, 150px tablet, 172px desktop) that carries a cropped piece of the same scene, a plank title and one action, then ordinary ranch cards below it.

**Key Characteristics:**
- The scene is the hero; modules follow on `--ranch-ground`.
- One surface recipe: page-colored card, 24px radius, one soft tinted shadow, no borders.
- Plank-tab headings with two nail dots on every module.
- Ink and button colors are deep tints of the active theme; dark mode is derived, not separate.
- Money is Quicksand 700 tabular; figures roll when they change.
- Everything reads CSS custom properties, so a theme change or dark toggle needs no per-theme rules.

## Colors

Warm pastel ground, deep tinted ink, one saturated action color per theme. All values below are the Lavender Dream (default) preset; each preset supplies the same 27 `--ranch-*` roles from `src/lib/ranchScenes.ts`, applied to `:root` by `applyTheme()`.

### Primary
- **Plum Night** (#3A2466): the action color. Primary buttons, active rail link and tab pill, segmented thumb, selected milestone, checkbox accent. Its pair is **Paper White** (#FFFFFF) as button text. In dark themes the action color flips to a light accent (Midnight Grape uses #FFD58A with #2A1740 text).

### Secondary
- **Orchid Fill** (#7B58C9): progress bars, sparklines and chart fills for ordinary debts.
- **Berry Focus** (#B1335F) on **Blush Wash** (#FBE4EC): the one debt to attack now, the next milestone, due dots, errors and the danger button. It is the only warm-alarm color in the system.
- **Meadow Ink** (#1D6A45) on **Mint Wash** (#D6F1E1), fill **Clover** (#3E9C6B): paid, on track, saved money.
- **Straw Ink** (#694700) on **Straw Wash** (#FBE9AE): due soon, subscriptions, caution.

### Neutral
- **Meadow Ground** (#F5EFFA): the page behind everything, equal to the scene's ground edge.
- **Page Cream** (#FFFCFF): cards, rail, tab bar, dialogs.
- **Soft Page** (#F0E8F8): quiet inset areas, hover, icon chips, dialog headers.
- **Hedge Line** (#E0D3EE): 1px dividers and field borders (fields use 2px).
- **Track** (#E7DCF3): empty progress, segmented control, scrollbars.
- **Deep Ink** (#2B1A4F) and **Soft Ink** (#5B4A7F): body and secondary text. Both are tinted to the theme; the ring color equals Deep Ink.
- **Barn Plank** (#84593F) with **Plank Cream** (#FFF5EC): the wooden heading tab. Plank stays brown in every light theme (#6E4A34 to #8A5A45) and lightens in dark themes.
- **Picket** (#FFFFFF) and **Picket Line** (#B99C8C): fence streak pickets.

### The Nine Moments
Lavender Dream (default, lavender-field dusk, Luna the bunny, ground #F5EFFA), Rose Milk (strawberry sunrise, Boo, #EFF6EC, button #6E2440), Midnight Grape (starry night, dark, #160F2C with gold button #FFD58A), Cloud Nine (bright pond day, #E9F5EC, button #1C5487), Golden Hour (wheat sunset, #FBF3E3, button #7A410C), Cherry Pop (blossom spring, #F0F6EA, button #A8203F), Fresh Mint (lily-pond morning, #EEF7F0, button #1D5C44), Maple Season (autumn, #FBF2E9, button #8E3B16), Cocoa Dream (snowy evening, #F3F0F8, button #6B3A2A). Light presets differ in hue and in focus color (a hue that stays distinct from the theme: orange-red on blue and green, plum on maple); only Midnight Grape is natively dark. Dark mode runs `darkUiFrom()` on any light preset, mixing its own ink toward black for grounds and its ground toward white for text. Custom colors derive a palette from the user's shades.

### Named Rules
**The Tinted Ink Rule.** Text is never gray or black. It is the theme's deep ink or soft ink, so every theme and its night version keeps its hue.
**The One Alarm Rule.** Berry Focus is the single urgent color. It marks the focus debt, the next milestone and errors, and nothing decorative.
**The Token Rule.** Components read `--ranch-*` only. A hex value in component CSS is a defect unless it is scene art.

## Typography

**Display Font:** Bagel Fat One (fallback: size-adjusted Arial)
**Heading/UI Font:** Fredoka (fallback: size-adjusted Arial)
**Body Font:** Nunito (fallback Quicksand, system-ui)
**Figure/Label Font:** Quicksand

**Character:** a fat, bouncy headline over a rounded UI face, with a steadier geometric face for numbers. Four fonts, all self-hosted, each with one job.

### Hierarchy
- **Display** (Bagel Fat One 400, 26px line one and 58px line two on phone, 40px and 88px from 768px container width, line-height .98): the "Debt-free in" headline in the sky. Long dates drop line two to 40px (phone) or 52px (wide).
- **Headline** (Fredoka 600, 18px to 26px, 1.15): plank tab headings and strip titles.
- **Title** (Fredoka 600, 16 to 19px, 1.25): debt names, card labels, dialog titles, buttons at 17px.
- **Body** (Nunito 600, 13.5 to 16px, 1.35 to 1.45): notes, metadata, descriptions. Weight 600 is the base; Nunito never runs light.
- **Figure** (Quicksand 700, 16 to 30px, tabular numerals): every money amount, percentage and date chip, via the `.num` class.
- **Label** (Quicksand 700, 12px, +0.04em, uppercase): badges only.
- **Wordmark** (Bagel Fat One, 24px, 21px on phone): "Debtsy" in the rail and top bar, with a 12.5px Quicksand tagline.

### Named Rules
**The Four Jobs Rule.** Bagel Fat One is for the headline moment and wordmark only. Fredoka names things, Nunito explains, Quicksand counts.
**The Rolling Figure Rule.** Money in the sky and today cards uses the RollingNumber digit-wheel; under reduced motion it shows the end state.

## Layout

A sticky 248px left rail from 1024px up, with a 60px sticky top bar and a six-slot bottom tab bar below that. The dashboard is a scene plus a 1240px max-width content grid; other pages cap content at 1080px under their strip. The dashboard scene has two stages: a phone composition (390 by 420 units, about 400px tall) and a wide composition (1300 by 600, up to 600px). The sky copy (greeting, headline, money line, primary button) overlays the sky; a speech bubble from the friend sits below it.

Below the scene: a three-cell "today" card (Up next, Latest paycheck, On-time streak), then a two-column grid (debts on the left; recent payments, milestones and numbers on the right) that collapses to one column in the order debts, side, then collapsible sections. Gaps are 22px between modules, 14 to 18px inside; cards pad 18 to 20px. Rows inside cards are separated by 1px Hedge Line dividers, not nested cards. Layout adapts with container queries (`ranch`, `dash`) so the scene works inside dialogs and strips as well as the page. Touch targets are 44 to 52px; the tab bar and sync pill respect `safe-area-inset-bottom`.

## Elevation & Depth

Depth is tonal first, shadow second. The ground, page and soft-page colors layer surfaces; one diffuse, theme-tinted shadow lifts cards. There are no hard offset shadows and no borders on cards. Dark scenes drop shadow strength into an inset 1px line.

### Shadow Vocabulary
- **Card lift** (`0 1px 2px var(--ranch-sh), 0 16px 32px -22px var(--ranch-sh)`): every `.rui-card`.
- **Button glow** (`0 14px 24px -14px var(--ranch-btn-sh), 0 3px 6px -2px var(--ranch-btn-sh)`): primary buttons; they rise 2px on hover and sink 1px on press.
- **Plank** (`0 6px 12px -8px var(--ranch-sh)` plus a 3px bottom edge of 16% black): the wooden heading tab only.
- **Sheet** (`0 2px 4px, 0 40px 70px -28px var(--ranch-sh)`): dialogs; the backdrop is the ground mixed toward deep violet at 62% opacity.
- **Inset ring** (`inset 0 0 0 2px`): selected plan, ghost button and focus badge outlines.

### Named Rules
**The Soft Lift Rule.** One shadow recipe per surface class, always tinted by `--ranch-sh`. Never a black drop shadow, never a hard offset.

## Shapes

Rounded and friendly, with a clear size ladder. Pills (999px) for buttons, badges, chips, tab pills and the segmented control. 24px for cards, 28px for dialogs (sheet at the bottom on phones, floating from 640px), 15px for rail links and 14px for fields and icon buttons, 18px for inset notes. Plank headings are the one deliberately irregular shape: radii of 7, 9, 8 and 10px with two nail dots, so they read as hand-cut boards. Circles for rank numbers and milestone dots (28 to 36px). Progress bars are 9 to 12px high pills. The picket fence streak is a row of 22 by 44px pickets with two rails.

## Components

### Plank heading
A brown board with cream text (Fredoka 600, 18px; 22 to 26px in strips), optional leading icon, and a nail dot at each end. Every module and dialog starts with one. It is the system's signature.

### Cards
`.rui-card`: Page Cream, 24px radius, Card lift shadow, no border, 18 to 20px padding. Legacy `.card` markup inside the shell is remapped to this recipe. Rows inside use dividers; inset notes use Soft Page at 16 to 18px radius.

### Buttons
- **Primary:** pill, 50 to 52px tall, Fredoka 600 17px, Plum Night on white (theme's button color), Button glow, hovers up 2px.
- **Ghost:** transparent with a 2px inset Deep Ink ring, 44px, hover fills Soft Page.
- **Danger:** Berry Focus fill with Page text.
- **Icon:** 44px rounded-14 square on Page with Card lift, ink icon.
- Disabled is 55% opacity with no motion. Reduced motion removes the lift.

### Navigation
Desktop rail: Page Cream, 1px right hairline, Bagel wordmark, 46px links in Fredoka 600 16.5px; active is the button color on button text. Phone: sticky 60px top bar, six-slot tab bar with 50 by 32px pill indicators, 12px Quicksand labels. Page strip: cropped scene art with a plank title, a 14px Quicksand subline in sky ink, and one action.

### Badges
23px pills, Quicksand 700 12px uppercase: focus (Berry on Blush with a 1.5px ring), soon (Straw), ok (Mint).

### Fields and dialogs
Dialogs (`ModalShell`) render in a portal, so they carry their own token mapping. A Soft Page header with a plank title and a 44px close button, a scrolling body, and a footer with equal-width pills. Fields are 48px, 2px Hedge Line border, 14px radius; hover darkens to Soft Ink, focus goes to Deep Ink with a 4px ring at 22% of the ring color. Labels are Quicksand 700 14px. Selection uses the theme's selection color.

### Segmented control and tabs
Track-colored pill with a sliding thumb in the button color (spring easing, .38s); labels invert inside the thumb through a mask. Subscription chart ranges and plan tabs use the same pill language in the lighter Soft Page version. Adapted from 21st.dev components; they keep their ARIA radiogroup or tablist behavior.

### Progress and signposts
Progress is a flat pill bar (Orchid Fill; Berry for the focus debt; Clover for paid). On the dashboard each debt is a wooden signpost at its payoff point on the trail, with its name lettered on the board when near and a chip when far; labels that cannot be placed legibly are dropped. The friend stands on the trail at the paid share and hops forward when a payment is logged, then a flower pops up. The streak is a row of pickets, a ticked picket per on-time month and a dashed one for the next.

### Charts and heatmap
Sparklines and the dot-graph card draw with `--ranch-fill` and Clover; the activity heatmap uses the ranch ok color through a CSS color prop, with three views and keyboard navigation.

### Empty states and celebration
Empty states center a 108px Soft Page tile holding a mascot, a Fredoka 22px title and a Nunito explanation. The celebration dialog places a strip-sized scene at the top with the herd along its bottom edge.

### Motion
Standard ease is `cubic-bezier(.16, 1, .3, 1)` at .15 to .9s; the segmented control uses a springier `cubic-bezier(.34, 1.3, .5, 1)`. Digits roll over .9s, bars grow over .9 to 1s. Dialogs fade and rise 22px. Every moving piece has a `prefers-reduced-motion` branch that shows the end state.

## Do's and Don'ts

### Do:
- **Do** read surface, ink and state colors from `--ranch-*` tokens so all nine themes and dark mode work.
- **Do** open every module and dialog with a plank heading.
- **Do** keep money in Quicksand 700 tabular and wrap it in `.num`.
- **Do** put the hero action ("Log a payment") in the sky and make it a pill in the button color.
- **Do** use Berry Focus only for the thing to act on now.
- **Do** keep touch targets at 44px or more and give every animation a reduced-motion end state.
- **Do** add new Tailwind-era markup to the shell's utility mapping only as a bridge; give the page proper ranch classes when you touch it.

### Don't:
- **Don't** lead a page with a big balance number over a grid of identical cards; the scene and trail come first.
- **Don't** use gray text, black text or pure neutral backgrounds inside the shell.
- **Don't** use hard offset shadows, card borders or nested cards.
- **Don't** make it babyish, bank-like or plain; no gradient-pink pastel wash, no corporate blue dashboard.
- **Don't** set Bagel Fat One below headline scale or in running UI text.
- **Don't** reuse Berry Focus or the plank brown for decoration.
- **Don't** touch the landing page's older look from here, and don't copy its patterns into the app interior.

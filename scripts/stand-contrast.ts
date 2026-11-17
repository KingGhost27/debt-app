/**
 * WCAG contrast for every farm stand palette: each text, large-text and
 * control pairing the home page paints, per theme.
 *
 *   bun scripts/stand-contrast.ts      prints the table, exits 1 on any miss
 *
 * tests/stand-contrast.test.ts runs the same checks in `bun run test`.
 * Alpha steps mirror the color-mix() percentages in stand.css; change both together.
 */

import { STAND_ORDER, STAND_PALETTES, type StandPalette, type StandTheme } from '../src/components/landing/stand/palettes';

/** Chalk strengths on the board (stand.css --fs-chalk-*). */
export const CHALK = { soft: 0.74, hint: 0.7, line: 0.52 };
/** Ink strengths on paper (stand.css --fs-fine-ink, --fs-close-fine). */
export const INK = { fine: 0.78, closeFine: 0.85 };
/** The "how it works" cloth: straw checks at this strength over howBg. */
export const CHECK = 0.15;

type Kind = 'text' | 'large' | 'ui';
export const NEED: Record<Kind, number> = { text: 4.5, large: 3, ui: 3 };

const rgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const hex = (c: number[]) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();

/** `fg` at `alpha` painted over an opaque `bg`. */
export const over = (fg: string, alpha: number, bg: string) => {
  const a = rgb(fg);
  const b = rgb(bg);
  return hex(a.map((v, i) => v * alpha + b[i] * (1 - alpha)));
};

const lum = (h: string) => {
  const [r, g, b] = rgb(h).map((v) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const ratio = (a: string, b: string) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

interface Pair {
  what: string;
  kind: Kind;
  /** Foreground and every ground it sits on; the worst ground counts. */
  test: (p: StandPalette) => { fg: string; on: string[] };
}

const check = (p: StandPalette) => over(p.straw, CHECK, p.howBg);

export const PAIRS: Pair[] = [
  // the painted sign and the closing sign
  { what: 'headline lettering on sign', kind: 'large', test: (p) => ({ fg: p.candyInk, on: [p.face, p.faceLow] }) },
  { what: 'sign copy', kind: 'text', test: (p) => ({ fg: p.berry, on: [p.face, p.faceLow] }) },
  { what: 'sign emphasis', kind: 'text', test: (p) => ({ fg: p.strawInk, on: [p.face, p.faceLow] }) },
  { what: 'sign fine print', kind: 'text', test: (p) => ({ fg: over(p.berry, INK.fine, p.faceLow), on: [p.faceLow] }) },
  { what: 'close fine print', kind: 'text', test: (p) => ({ fg: over(p.berry, INK.closeFine, p.faceLow), on: [p.faceLow] }) },
  { what: 'focus ring on paper', kind: 'ui', test: (p) => ({ fg: p.berry, on: [p.face, p.faceLow, p.milk] }) },
  // price tags
  { what: 'milk tag text', kind: 'text', test: (p) => ({ fg: p.berry, on: [p.milk] }) },
  { what: 'gold tag text, selection', kind: 'text', test: (p) => ({ fg: p.berryDeep, on: [p.gold] }) },
  // the valance
  { what: 'wordmark on valance', kind: 'large', test: (p) => ({ fg: p.milk, on: [p.candy] }) },
  { what: 'focus ring on valance', kind: 'ui', test: (p) => ({ fg: p.ringValance, on: [p.candy] }) },
  // the chalkboards (calculator, the take, the price board)
  { what: 'chalk', kind: 'text', test: (p) => ({ fg: p.chalk, on: [p.board] }) },
  { what: 'soft chalk (labels, notes)', kind: 'text', test: (p) => ({ fg: over(p.chalk, CHALK.soft, p.board), on: [p.board] }) },
  { what: 'placeholder chalk', kind: 'text', test: (p) => ({ fg: over(p.chalk, CHALK.hint, p.board), on: [p.board] }) },
  { what: 'highlight chalk (dates, picks)', kind: 'text', test: (p) => ({ fg: p.chalkHi, on: [p.board] }) },
  { what: 'field underline, add border', kind: 'ui', test: (p) => ({ fg: over(p.chalk, CHALK.line, p.board), on: [p.board] }) },
  { what: 'focus on board', kind: 'ui', test: (p) => ({ fg: p.chalkHi, on: [p.board] }) },
  // the painted date sign
  { what: 'date label', kind: 'text', test: (p) => ({ fg: p.strawInk, on: [p.milk] }) },
  { what: 'debt-free date', kind: 'large', test: (p) => ({ fg: p.berry, on: [p.milk] }) },
  // the counter front (theme picker)
  { what: 'counter paint text', kind: 'text', test: (p) => ({ fg: p.counterInk, on: [p.counter, p.counterLine] }) },
  { what: 'picked pot, focus on counter', kind: 'ui', test: (p) => ({ fg: p.counterInk, on: [p.counter, p.counterLine] }) },
  // how it works, straight on the cloth
  { what: 'section heading on cloth', kind: 'large', test: (p) => ({ fg: p.howHead, on: [p.howBg, check(p)] }) },
  { what: 'lede on cloth', kind: 'text', test: (p) => ({ fg: p.howInk, on: [p.howBg, check(p)] }) },
  { what: 'focus ring on cloth', kind: 'ui', test: (p) => ({ fg: p.howHead, on: [p.howBg, check(p)] }) },
  // headings set straight on the page ground (FAQ)
  { what: 'section heading on page ground', kind: 'large', test: (p) => ({ fg: p.howHead, on: [p.sky, p.pageMid, p.closeLow] }) },
  // packets, cards, markers (paper)
  { what: 'card heading', kind: 'large', test: (p) => ({ fg: p.berry, on: [p.milk, p.face] }) },
  { what: 'card tag line', kind: 'text', test: (p) => ({ fg: p.strawInk, on: [p.milk, p.face] }) },
  { what: 'card question, marker title', kind: 'text', test: (p) => ({ fg: p.berry, on: [p.milk, p.face, p.faceLow] }) },
  { what: 'card open/close mark', kind: 'ui', test: (p) => ({ fg: p.strawInk, on: [p.milk] }) },
  { what: 'card body', kind: 'text', test: (p) => ({ fg: p.packetInk, on: [p.milk, p.face, p.faceLow] }) },
  { what: 'best-for notes', kind: 'text', test: (p) => ({ fg: p.packetInk, on: [p.bestA, p.bestB] }) },
  // footer on the meadow
  { what: 'footer text and links', kind: 'text', test: (p) => ({ fg: p.footInk, on: [p.meadowDeep] }) },
  { what: 'footer wordmark', kind: 'text', test: (p) => ({ fg: p.footName, on: [p.meadowDeep] }) },
];

export interface Row {
  theme: StandTheme;
  what: string;
  kind: Kind;
  ratio: number;
  pass: boolean;
}

export function standContrastRows(): Row[] {
  const rows: Row[] = [];
  for (const theme of STAND_ORDER) {
    const p = STAND_PALETTES[theme];
    for (const pair of PAIRS) {
      const { fg, on } = pair.test(p);
      const r = Math.min(...on.map((bg) => ratio(fg, bg)));
      rows.push({ theme, what: pair.what, kind: pair.kind, ratio: r, pass: r >= NEED[pair.kind] });
    }
  }
  return rows;
}

if (import.meta.main) {
  const rows = standContrastRows();
  const short: Record<StandTheme, string> = {
    default: 'Lavndr', 'rose-milk': 'RoseMk', 'midnight-grape': 'Midnt', 'cloud-nine': 'Cloud9', 'golden-hour': 'Golden',
    'fresh-mint': 'Mint', maple: 'Maple', 'cocoa-dream': 'Cocoa',
  };
  const w = 31;
  console.log('pairing'.padEnd(w) + 'need ' + STAND_ORDER.map((t) => short[t].padStart(7)).join(''));
  for (const pair of PAIRS) {
    const cells = STAND_ORDER.map((t) => {
      const r = rows.find((x) => x.theme === t && x.what === pair.what)!;
      return ((r.pass ? '' : 'x') + r.ratio.toFixed(2)).padStart(7);
    });
    console.log(pair.what.padEnd(w) + NEED[pair.kind].toFixed(1).padStart(4) + ' ' + cells.join(''));
  }
  const fails = rows.filter((r) => !r.pass);
  console.log(`\n${rows.length} checks, ${fails.length} below AA` + (fails.length ? ' (marked x)' : ''));
  process.exit(fails.length ? 1 : 0);
}

/**
 * The farm stand's nine paint jobs, one per app theme.
 *
 * Each palette is the stand's materials (awning, painted signs, chalkboard and
 * its wood, counter, bunting, price tags, flowers) authored by hand from that
 * preset's app colors in lib/themes.ts and its ranch moment in
 * lib/ranchScenes.ts, so the home page agrees with the theme a visitor would
 * get in the app. Rose Milk is the approved sample, value for value.
 *
 * The page applies a palette as --fs-* custom properties on its root
 * (standVars), so one stylesheet serves all nine. Contrast for every text and
 * control pairing is checked by scripts/stand-contrast.ts and its test.
 */

import type { ThemePreset } from '../../../types';

export type StandTheme = Exclude<ThemePreset, 'custom'>;

/** Peony shades, outermost petals to the deep line color. */
export interface Bloom {
  outer: string;
  mid: string;
  inner: string;
  deep: string;
}

export interface StandPalette {
  scheme: 'light' | 'dark';
  /** Page ground: top of the page, the body of the page, the bottom of the close. */
  sky: string;
  pageMid: string;
  closeLow: string;
  /** Awning stripe, sign borders, bunting; strawInk is the emphasis ink on paper. */
  straw: string;
  strawInk: string;
  /** Paper: the other awning stripe, price tags, packets, the date sign. */
  milk: string;
  /** The valance and the painted headline lettering. */
  candy: string;
  candyDeep: string;
  candyInk: string;
  /** Main ink on paper, and its deeper shade (text on gold tags). */
  berry: string;
  berryDeep: string;
  /** Gold leaf: the save tag, sparkles, rosette. goldLine is the art's outline gold. */
  gold: string;
  goldDeep: string;
  goldLite: string;
  goldLine: string;
  /** The chalkboard, its chalk, and the highlighted chalk (chosen strategy, dates). */
  board: string;
  chalk: string;
  chalkHi: string;
  /** Wood: sign and board frames, the posts (light to dark), baskets and crates. */
  wood: string;
  woodDeep: string;
  post: [string, string, string, string];
  basket: string;
  /** The painted sign face, top and bottom of its sheen. */
  face: string;
  faceLow: string;
  /** The counter, its ledge and boards, and the ink painted on its front. */
  counter: string;
  counterDeep: string;
  counterLine: string;
  counterTop: string;
  counterInk: string;
  /** Grass under the counter and the footer that stands on it. */
  meadow: string;
  meadowDeep: string;
  footInk: string;
  footName: string;
  /** The "how it works" checkered cloth and the inks set straight on it. */
  howBg: string;
  howHead: string;
  howInk: string;
  /** Body ink on packets and cards; the backings of the strategy cards' "Best for" tags. */
  packetInk: string;
  bestA: string;
  bestB: string;
  /** Price tag bottom edge. */
  tagEdge: string;
  /** Shadow tints: general, deep (tags), under wood. */
  shade: string;
  shadeDeep: string;
  woodShade: string;
  /** The register's painted body and its base; the honey jar's gingham line. */
  register: string;
  registerBase: string;
  gingham: string;
  /** Focus ring on the valance (it must clear the candy paint). */
  ringValance: string;
  flags: [string, string, string, string, string, string];
  blooms: { pink: Bloom; blush: Bloom; berry: Bloom };
  /** The stardust cursor and particles: pointer ink, sparkle color, heart color. */
  dust: { ink: string; theme: string; accent: string };
}

export const STAND_PALETTES: Record<StandTheme, StandPalette> = {
  // Lavender Dream: lavender-field dusk
  default: {
    scheme: 'light',
    sky: '#EEE5F9', pageMid: '#F3ECFB', closeLow: '#E6D9F6',
    straw: '#A584DD', strawInk: '#563797', milk: '#FBF8FE',
    candy: '#8560C9', candyDeep: '#6C47B5', candyInk: '#6C47B5',
    berry: '#3A2466', berryDeep: '#2B1A4F',
    gold: '#F5C66A', goldDeep: '#B5832A', goldLite: '#FFE9B0', goldLine: '#C9922E',
    board: '#2D2A44', chalk: '#F6F1FB', chalkHi: '#F7CF73',
    wood: '#B98A6E', woodDeep: '#86593F', post: ['#9C7258', '#CFA184', '#A87A5E', '#7A5040'], basket: '#C99A7C',
    face: '#FDFAFF', faceLow: '#EFE5FA',
    counter: '#DDCCF3', counterDeep: '#C3A9EA', counterLine: '#D2BDEF', counterTop: '#EEE5F9', counterInk: '#3A2466',
    meadow: '#D9C8F2', meadowDeep: '#C3ABEA', footInk: '#2B1A4F', footName: '#3A2466',
    howBg: '#F8F4FD', howHead: '#3A2466', howInk: '#4A3474',
    packetInk: '#33205C', bestA: '#F3ECFB', bestB: '#FCEAF0',
    tagEdge: '#D9CBEE',
    shade: '#3A2466', shadeDeep: '#1F1338', woodShade: '#3E2A20',
    register: '#563797', registerBase: '#2B1A4F', gingham: '#B79AE3',
    ringValance: '#FBF8FE',
    flags: ['#A584DD', '#F5C66A', '#FBF8FE', '#F2A7C3', '#C3A9EA', '#8560C9'],
    blooms: {
      pink: { outer: '#E8DBFB', mid: '#CFB7F4', inner: '#A584DD', deep: '#6C47B5' },
      blush: { outer: '#FFE3EC', mid: '#FBCFDF', inner: '#F2A7C3', deep: '#C9799A' },
      berry: { outer: '#C7A9EE', mid: '#A584DD', inner: '#7C55C4', deep: '#4A2C8A' },
    },
    dust: { ink: '#3A2466', theme: '#A584DD', accent: '#F2A7C3' },
  },

  // Rose Milk: strawberry-field sunrise. The approved sample, value for value.
  'my-melody': {
    scheme: 'light',
    sky: '#FFE2EB', pageMid: '#FFE8EF', closeLow: '#FFD9E5',
    straw: '#F2789F', strawInk: '#B8346A', milk: '#FFF4F7',
    candy: '#E8608F', candyDeep: '#C24476', candyInk: '#D43F78',
    berry: '#7A1F45', berryDeep: '#561331',
    gold: '#F6C75B', goldDeep: '#B57A17', goldLite: '#FFE6A3', goldLine: '#C98A1E',
    board: '#2F4A3A', chalk: '#F4F0E6', chalkHi: '#F6C75B',
    wood: '#C98F5E', woodDeep: '#9A6238', post: ['#A9734A', '#DDA772', '#B57E52', '#8A5531'], basket: '#D9A06A',
    face: '#FFF7FA', faceLow: '#FFE4EE',
    counter: '#F7B6CB', counterDeep: '#EC93B1', counterLine: '#F2A6C0', counterTop: '#FFD3E0', counterInk: '#7A1F45',
    meadow: '#CDE8B5', meadowDeep: '#B8DD9D', footInk: '#2F4A2A', footName: '#7A1F45',
    howBg: '#FFF1F5', howHead: '#7A1F45', howInk: '#6A2342',
    packetInk: '#5C1A38', bestA: '#FFE9F0', bestB: '#FFF4D6',
    tagEdge: '#E9C6D3',
    shade: '#7A1F45', shadeDeep: '#3E0B22', woodShade: '#50280C',
    register: '#7A1F45', registerBase: '#5C1433', gingham: '#E58FAD',
    ringValance: '#7A1F45',
    flags: ['#F2789F', '#F6C75B', '#FFF4F7', '#A8DCC6', '#DCC0F7', '#E46A95'],
    blooms: {
      pink: { outer: '#FFC4D6', mid: '#FF9FBD', inner: '#F2789F', deep: '#C24C78' },
      blush: { outer: '#FFE3EC', mid: '#FFCADA', inner: '#FBA6C0', deep: '#D97B9C' },
      berry: { outer: '#F59BBA', mid: '#E46A95', inner: '#C8406F', deep: '#8E2350' },
    },
    dust: { ink: '#7A1F45', theme: '#F2789F', accent: '#F6C75B' },
  },

  // Midnight Grape: the stand at night under the stars, its signs lamp-lit
  kuromi: {
    scheme: 'dark',
    sky: '#110A28', pageMid: '#1D1344', closeLow: '#2D1D60',
    straw: '#7556D6', strawInk: '#5B3FBF', milk: '#F4EFFF',
    candy: '#4E33A0', candyDeep: '#352470', candyInk: '#5B3FBF',
    berry: '#2A1740', berryDeep: '#1D1344',
    gold: '#FFD58A', goldDeep: '#B98A3A', goldLite: '#FFF1D6', goldLine: '#C9963F',
    board: '#232C3D', chalk: '#F4EDFF', chalkHi: '#FFD58A',
    wood: '#8F6E7E', woodDeep: '#5E4656', post: ['#6E5262', '#A88A98', '#7A5C6C', '#4A3442'], basket: '#9C7A86',
    face: '#FFF9EE', faceLow: '#EDE4FF',
    counter: '#3E2E7A', counterDeep: '#2D2160', counterLine: '#36286C', counterTop: '#5B45A8', counterInk: '#F4EDFF',
    meadow: '#2A1F5D', meadowDeep: '#21184E', footInk: '#E6DEFF', footName: '#FFD58A',
    howBg: '#1A1140', howHead: '#F4EDFF', howInk: '#C6B9EA',
    packetInk: '#2A1740', bestA: '#EEE8FF', bestB: '#FFF3DC',
    tagEdge: '#C9BCEB',
    shade: '#05010F', shadeDeep: '#05010F', woodShade: '#05010F',
    register: '#4E33A0', registerBase: '#1D1344', gingham: '#B39CFF',
    ringValance: '#FFD58A',
    flags: ['#9677F2', '#FFD58A', '#F4EFFF', '#FF9EC2', '#B39CFF', '#5B3FBF'],
    blooms: {
      pink: { outer: '#E3D6FF', mid: '#C8A6FF', inner: '#9C7DE0', deep: '#5C40A0' },
      blush: { outer: '#F3ECFF', mid: '#DCCBFF', inner: '#B79CF5', deep: '#7E62C8' },
      berry: { outer: '#B39CFF', mid: '#9677F2', inner: '#6343C2', deep: '#352470' },
    },
    dust: { ink: '#FFD58A', theme: '#9677F2', accent: '#FF9EC2' },
  },

  // Cloud Nine: a bright day by the pond, hydrangeas in the buckets
  cinnamoroll: {
    scheme: 'light',
    sky: '#D6EBFA', pageMid: '#E6F2FB', closeLow: '#CFE5F7',
    straw: '#63B0E6', strawInk: '#1C5D93', milk: '#F7FBFF',
    candy: '#2C7AB6', candyDeep: '#1C5D93', candyInk: '#2170AE',
    berry: '#12324F', berryDeep: '#0B2238',
    gold: '#F5C451', goldDeep: '#B58419', goldLite: '#FFF3D1', goldLine: '#C99A2E',
    board: '#264552', chalk: '#F2F8FD', chalkHi: '#F8D163',
    wood: '#C99D6B', woodDeep: '#8E6440', post: ['#A9794C', '#DDB27F', '#B6875A', '#86592F'], basket: '#D9A86E',
    face: '#F9FCFF', faceLow: '#E2EFFA',
    counter: '#C4E0F6', counterDeep: '#97CBF0', counterLine: '#B0D5F3', counterTop: '#E2EFFA', counterInk: '#12324F',
    meadow: '#C6E8BE', meadowDeep: '#A6D79A', footInk: '#173A1F', footName: '#12324F',
    howBg: '#F2F8FD', howHead: '#12324F', howInk: '#21466A',
    packetInk: '#163A5A', bestA: '#E9F3FC', bestB: '#FFF6DC',
    tagEdge: '#C6DAEC',
    shade: '#12324F', shadeDeep: '#0A1C2E', woodShade: '#3E2A14',
    register: '#1C5D93', registerBase: '#0B2238', gingham: '#7FBDEB',
    ringValance: '#F7FBFF',
    flags: ['#63B0E6', '#F5C451', '#F7FBFF', '#A8DCC6', '#FFC9DA', '#2C7AB6'],
    blooms: {
      pink: { outer: '#D9ECFB', mid: '#AFD6F5', inner: '#6CB4E8', deep: '#2D6FA6' },
      blush: { outer: '#F4F9FE', mid: '#DFEDF9', inner: '#BFD9EF', deep: '#7FA4C6' },
      berry: { outer: '#BCC8F5', mid: '#93A6EC', inner: '#6479D6', deep: '#34479A' },
    },
    dust: { ink: '#1C5487', theme: '#63B0E6', accent: '#F5C451' },
  },

  // Golden Hour: golden sunset over the wheat, marigolds and peaches
  pompompurin: {
    scheme: 'light',
    sky: '#FCDFB0', pageMid: '#FDEBCB', closeLow: '#FBD9A0',
    straw: '#EFAE3E', strawInk: '#8A4A0C', milk: '#FFF9EC',
    candy: '#B86418', candyDeep: '#8E4A10', candyInk: '#A6560E',
    berry: '#4A2A0C', berryDeep: '#3B2408',
    gold: '#FFD45C', goldDeep: '#B57A17', goldLite: '#FFF1C2', goldLine: '#C9901E',
    board: '#3A2F2A', chalk: '#FFF6E8', chalkHi: '#FFD45C',
    wood: '#B07A4A', woodDeep: '#7A4E2A', post: ['#94633A', '#CC9A66', '#A06E44', '#6E4524'], basket: '#D19B62',
    face: '#FFFBF1', faceLow: '#FDEBC8',
    counter: '#FCE1A6', counterDeep: '#F8CA6C', counterLine: '#FAD68A', counterTop: '#FEF1D4', counterInk: '#4A2A0C',
    meadow: '#EBD08A', meadowDeep: '#D9B65E', footInk: '#3B2408', footName: '#5E300A',
    howBg: '#FFFAEE', howHead: '#4A2A0C', howInk: '#5E380C',
    packetInk: '#4A2A0C', bestA: '#FEF5E0', bestB: '#FDEBDF',
    tagEdge: '#EBD3A4',
    shade: '#5E380C', shadeDeep: '#2E1A05', woodShade: '#3E2208',
    register: '#8E4A10', registerBase: '#3B2408', gingham: '#F2B66A',
    ringValance: '#FFF9EC',
    flags: ['#EFAE3E', '#FFD45C', '#FFF9EC', '#F28C5B', '#E9BD55', '#C8553F'],
    blooms: {
      pink: { outer: '#FFE6A0', mid: '#FFD064', inner: '#F2A93A', deep: '#B5701A' },
      blush: { outer: '#FFE6D6', mid: '#FFCDB0', inner: '#F7A57C', deep: '#C46F4A' },
      berry: { outer: '#F7A27F', mid: '#EE7B4F', inner: '#D0552D', deep: '#8E3212' },
    },
    dust: { ink: '#7A410C', theme: '#EFAE3E', accent: '#F28C5B' },
  },

  // Cherry Pop: cherry-blossom spring, a red awning under a blue sky
  'hello-kitty': {
    scheme: 'light',
    sky: '#D8EDF6', pageMid: '#FCEEF2', closeLow: '#F9DCE4',
    straw: '#D63356', strawInk: '#A8203F', milk: '#FFF6F8',
    candy: '#BE2646', candyDeep: '#9E1E3C', candyInk: '#BE2646',
    berry: '#40101F', berryDeep: '#2E0A15',
    gold: '#F7C85B', goldDeep: '#B57A17', goldLite: '#FFE7A6', goldLine: '#C98A1E',
    board: '#22433E', chalk: '#FFF8F9', chalkHi: '#FFD36B',
    wood: '#B26A50', woodDeep: '#7E4434', post: ['#97553E', '#CF8E72', '#A3604A', '#6E3A2A'], basket: '#C98466',
    face: '#FFFAFB', faceLow: '#FFE5EA',
    counter: '#FFC9D4', counterDeep: '#FF9EB2', counterLine: '#FFB5C4', counterTop: '#FFE5EA', counterInk: '#40101F',
    meadow: '#C9E6B4', meadowDeep: '#A9D690', footInk: '#1E3D1C', footName: '#7A1830',
    howBg: '#FFF5F7', howHead: '#40101F', howInk: '#6E1D33',
    packetInk: '#4E1427', bestA: '#FFEEF2', bestB: '#FFF4D6',
    tagEdge: '#F0C4CE',
    shade: '#7A1830', shadeDeep: '#3A0A16', woodShade: '#3E1A10',
    register: '#9E1E3C', registerBase: '#40101F', gingham: '#F28FA6',
    ringValance: '#FFF6F8',
    flags: ['#D63356', '#F7C85B', '#FFF6F8', '#FFB3C8', '#A8DCC6', '#F76B88'],
    blooms: {
      pink: { outer: '#FFE4EC', mid: '#FFC3D5', inner: '#F7A3BE', deep: '#D4668A' },
      blush: { outer: '#FFF3F6', mid: '#FFE0E8', inner: '#FFC6D5', deep: '#E08AA6' },
      berry: { outer: '#F7899F', mid: '#E8506E', inner: '#C42646', deep: '#7A1830' },
    },
    dust: { ink: '#A8203F', theme: '#F76B88', accent: '#FFB3C8' },
  },

  // Fresh Mint: spring morning by the lily pond
  keroppi: {
    scheme: 'light',
    sky: '#E3F5E8', pageMid: '#EEF8F0', closeLow: '#DAF0E1',
    straw: '#62BE8A', strawInk: '#1D5C44', milk: '#F8FDF9',
    candy: '#2C8457', candyDeep: '#1D5C44', candyInk: '#24784F',
    berry: '#143D2E', berryDeep: '#0E2C21',
    gold: '#FFD95C', goldDeep: '#B58F17', goldLite: '#FFF4C2', goldLine: '#C9A027',
    board: '#263B40', chalk: '#F4FBF6', chalkHi: '#FFE27A',
    wood: '#C9A070', woodDeep: '#8C6640', post: ['#A97F52', '#DDB683', '#B58A5E', '#7E5A36'], basket: '#D8B07E',
    face: '#FAFEFB', faceLow: '#E1F3E8',
    counter: '#C3E7D1', counterDeep: '#97D6B0', counterLine: '#AEDFC0', counterTop: '#E1F3E8', counterInk: '#143D2E',
    meadow: '#B9E3A6', meadowDeep: '#98D184', footInk: '#123620', footName: '#143D2E',
    howBg: '#F3FBF5', howHead: '#143D2E', howInk: '#1D4A38',
    packetInk: '#143D2E', bestA: '#E9F6EE', bestB: '#FFF8DC',
    tagEdge: '#C4E0CF',
    shade: '#18503B', shadeDeep: '#0A2219', woodShade: '#33240F',
    register: '#1D5C44', registerBase: '#0E2C21', gingham: '#7ACB9C',
    ringValance: '#F8FDF9',
    flags: ['#62BE8A', '#FFE27A', '#F8FDF9', '#FFB5C9', '#97D6B0', '#2C8457'],
    blooms: {
      pink: { outer: '#FFDDE7', mid: '#FFBBCF', inner: '#F796B2', deep: '#C7607F' },
      blush: { outer: '#FFF7DE', mid: '#FFECB0', inner: '#FFDC80', deep: '#C9A04A' },
      berry: { outer: '#C4EBCF', mid: '#97D6B0', inner: '#5FB87C', deep: '#2C8457' },
    },
    dust: { ink: '#1D5C44', theme: '#62BE8A', accent: '#FFE27A' },
  },

  // Maple Season: an autumn afternoon in the maples
  maple: {
    scheme: 'light',
    sky: '#FCE3CC', pageMid: '#FDEEE0', closeLow: '#FAD8BC',
    straw: '#EE8F52', strawInk: '#8A3C16', milk: '#FFF9F2',
    candy: '#C2551C', candyDeep: '#8A3C16', candyInk: '#A84A18',
    berry: '#3A1F0F', berryDeep: '#2A160A',
    gold: '#F2B13C', goldDeep: '#A86F12', goldLite: '#FDEFCD', goldLine: '#B88320',
    board: '#33302A', chalk: '#FFF7EE', chalkHi: '#F6C450',
    wood: '#B5764A', woodDeep: '#7A4A2A', post: ['#9A6038', '#D0965F', '#A66C42', '#6E4022'], basket: '#C98E5E',
    face: '#FFFBF5', faceLow: '#FDEBDC',
    counter: '#FAD3B5', counterDeep: '#F5B384', counterLine: '#F8C49E', counterTop: '#FDEBDC', counterInk: '#3A1F0F',
    meadow: '#D8C77A', meadowDeep: '#BFAE5C', footInk: '#2E1A0C', footName: '#5E2A10',
    howBg: '#FFF8F1', howHead: '#3A1F0F', howInk: '#6A3118',
    packetInk: '#4A2612', bestA: '#FEF2E7', bestB: '#FEF4DA',
    tagEdge: '#EED0B8',
    shade: '#6A3118', shadeDeep: '#2A1208', woodShade: '#3A1E0A',
    register: '#8A3C16', registerBase: '#2A160A', gingham: '#F0A274',
    ringValance: '#FFF9F2',
    flags: ['#EE8F52', '#F2B13C', '#FFF9F2', '#DD5B3B', '#E9BF62', '#8A5A9E'],
    blooms: {
      pink: { outer: '#FFD9BF', mid: '#FBB487', inner: '#EE8F52', deep: '#B25420' },
      blush: { outer: '#FFEBD9', mid: '#FDD3B0', inner: '#F5B384', deep: '#C7835A' },
      berry: { outer: '#F29A7E', mid: '#E8704E', inner: '#C9472E', deep: '#82271A' },
    },
    dust: { ink: '#8E3B16', theme: '#EE8F52', accent: '#F2B13C' },
  },

  // Cocoa Dream: a snowy winter evening, snow on the ground and red winter roses
  chococat: {
    scheme: 'light',
    sky: '#E9E4F1', pageMid: '#F3F0F8', closeLow: '#E3DCEC',
    straw: '#946A50', strawInk: '#6B3A2A', milk: '#FFF9F2',
    candy: '#7E553F', candyDeep: '#553528', candyInk: '#7E553F',
    berry: '#3A2419', berryDeep: '#2A1A12',
    gold: '#FFC873', goldDeep: '#B8862F', goldLite: '#FFF0D6', goldLine: '#C99442',
    board: '#2C3A3A', chalk: '#FBF7F3', chalkHi: '#FFC873',
    wood: '#9C7560', woodDeep: '#6C4E40', post: ['#80604E', '#B8927A', '#8C6A56', '#5A3E30'], basket: '#B48A70',
    face: '#FFFCF8', faceLow: '#F4EAE2',
    counter: '#E8D5C6', counterDeep: '#D6B8A2', counterLine: '#DFC7B5', counterTop: '#F4EAE2', counterInk: '#3A2419',
    meadow: '#FBF9FD', meadowDeep: '#E2DCEC', footInk: '#3A2419', footName: '#6B3A2A',
    howBg: '#FBF8FC', howHead: '#3A2419', howInk: '#553528',
    packetInk: '#3A2419', bestA: '#F8F1EB', bestB: '#FFF4E0',
    tagEdge: '#E0D0C2',
    shade: '#553528', shadeDeep: '#2A1A12', woodShade: '#2A1A12',
    register: '#6B3A2A', registerBase: '#2A1A12', gingham: '#C9A48E',
    ringValance: '#FFF9F2',
    flags: ['#946A50', '#FFC873', '#FFF9F2', '#D9434D', '#BF967A', '#6B3A2A'],
    blooms: {
      pink: { outer: '#F7B9BD', mid: '#EE858C', inner: '#D9434D', deep: '#962A33' },
      blush: { outer: '#FFFFFF', mid: '#F3EFF7', inner: '#E0D9EA', deep: '#A99FBA' },
      berry: { outer: '#E8C2B4', mid: '#D49B88', inner: '#B8735E', deep: '#7A4434' },
    },
    dust: { ink: '#6B3A2A', theme: '#BF967A', accent: '#FFC873' },
  },
};

/** Theme order matches the app's theme picker (THEME_PRESETS key order). */
export const STAND_ORDER: StandTheme[] = [
  'default',
  'my-melody',
  'kuromi',
  'cinnamoroll',
  'pompompurin',
  'hello-kitty',
  'keroppi',
  'maple',
  'chococat',
];

export const DEFAULT_STAND_THEME: StandTheme = 'my-melody';

export const isStandTheme = (v: unknown): v is StandTheme =>
  typeof v === 'string' && (STAND_ORDER as string[]).includes(v);

const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

/** The palette as --fs-* custom properties for the page root. */
export function standVars(p: StandPalette): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const [key, value] of Object.entries(p)) {
    if (typeof value === 'string') vars[`--fs-${kebab(key)}`] = value;
  }
  p.post.forEach((c, i) => (vars[`--fs-post-${i}`] = c));
  p.flags.forEach((c, i) => (vars[`--fs-flag-${i}`] = c));
  for (const [tone, bloom] of Object.entries(p.blooms)) {
    for (const [part, c] of Object.entries(bloom)) vars[`--fs-bl-${tone}-${part}`] = c;
  }
  return vars;
}

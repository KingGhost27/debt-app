/**
 * Ranch scenes: one per theme preset.
 *
 * Each theme is a time of day or a season on the same ranch. A scene has
 * three parts:
 *  - art:      the illustration palette (sky, hills, barn, trail, signs…),
 *              applied as --r-* custom properties on the scene element;
 *  - features: which props appear (moon or sun, rows or a pond, snow…);
 *  - ui:       the product-surface tokens (ground, ink, plank…) that the
 *              rest of the app reads as --ranch-* custom properties.
 *
 * Pure data and small helpers only: no React, so scripts can import it.
 */

import type { ThemeColors, ThemePreset, ThemeSettings } from '../types';

export type RanchSceneKey = Exclude<ThemePreset, 'custom'>;

export type RanchFriend =
  | 'LunaBunny' | 'BooBoo' | 'ShadowBunny' | 'LiloOtter' | 'SunshineChick'
  | 'CherryKitty' | 'MochiFrog' | 'ChaiBear' | 'MapleFox';

export type CelestialKind = 'moon' | 'sun' | 'crescent' | 'sunrise' | 'sunset' | 'softSun' | 'winterMoon';

export interface RanchFeatures {
  celestial: CelestialKind;
  /** Share (0–1) of the composition's star budget. */
  stars: number;
  fireflies: boolean;
  /** Barn lit from inside: lamp beam, window spill, door gap. */
  glow: boolean;
  /** Soft halo behind the friend so it reads at night. */
  friendGlow: boolean;
  /** Snow caps on roofs, posts and signs. */
  snow: boolean;
  field: 'lavender' | 'strawberry' | 'tulips' | 'wheat' | 'pumpkins' | 'drifts' | 'meadow';
  pond: 'left' | 'right' | null;
  lilies: boolean;
  trees: 'round' | 'blossom' | 'maple' | 'pine';
  groundDeco: 'flowers' | 'leaves' | 'sparkles';
  clouds: 'normal' | 'fluffy';
  falling: 'snow' | 'petals' | 'leaves' | null;
  birds: boolean;
  snowman: boolean;
  extraHay: boolean;
}

/** Illustration palette. Keys become --r-<kebab-case> on the scene element. */
export interface RanchArt {
  sky1: string; sky2: string; sky3: string; sky4: string;
  glow: string; glowO: string; halo: string; orb: string; orbSh: string;
  cloud: string; cloudSh: string;
  hA1: string; hA1b: string; hA2: string; hA2b: string; hB: string; hBb: string;
  hC: string; hCb: string; hD: string; hDb: string; rim: string; rimO: string; haze: string;
  path: string; pathHi: string; pathEdge: string;
  barn: string; barnSh: string; barnDoor: string; barnLine: string; barnDark: string;
  roof: string; roof2: string; roofLine: string; trim: string; window: string;
  hay: string; hayFace: string; hayLine: string; stone: string; lamp: string;
  silo: string; siloSh: string; siloHi: string; siloBand: string; dome: string;
  tree: string; treeD: string; treeL: string; trunk: string;
  tree2: string; treeD2: string; treeL2: string; tree3: string; treeD3: string; treeL3: string;
  wood: string; woodD: string; board: string; boardInk: string; nail: string;
  row: string; rowD: string; rowH: string; rowH2: string;
  fl1: string; fl2: string; fl3: string; flc: string; tuft: string;
  water: string; waterHi: string; waterEdge: string; lily: string; lilyD: string;
  snow: string; snowSh: string;
  fall1: string; fall2: string; fall3: string;
  pumpkin: string; pumpkinD: string; vine: string;
  banner: string; bannerInk: string; pole: string;
  signFocus: string; signFocusInk: string; signOk: string; gshadow: string;
  fglow: string; firefly: string;
  /** Text set directly on the sky (greeting, headline, money line). */
  title: string; title2: string;
}

/** Product-surface tokens. Keys become --ranch-<kebab-case> on :root. */
export interface RanchUi {
  scheme: 'light' | 'dark';
  ground: string; page: string; page2: string; line: string; track: string;
  ink: string; ink2: string; ring: string;
  btnBg: string; btnFg: string; btnSh: string;
  focus: string; focusBg: string; okInk: string; okBg: string; soonInk: string; soonBg: string;
  fill: string; okFill: string; sh: string; thumb: string; sel: string; selInk: string;
  plank: string; plankInk: string; picket: string; picketLine: string;
}

export interface RanchSceneDef {
  key: RanchSceneKey;
  /** Used in the scene's text alternative, e.g. "lavender-field dusk". */
  moment: string;
  friend: RanchFriend;
  friendName: string;
  features: RanchFeatures;
  art: RanchArt;
  ui: RanchUi;
}

/* ------------------------------------------------------------------ */
/* shared defaults                                                     */
/* ------------------------------------------------------------------ */

const FEATURES: RanchFeatures = {
  celestial: 'sun', stars: 0, fireflies: false, glow: false, friendGlow: false, snow: false,
  field: 'lavender', pond: null, lilies: false, trees: 'round', groundDeco: 'flowers',
  clouds: 'normal', falling: null, birds: true, snowman: false, extraHay: false,
};

/** Keys most scenes share; each scene overrides what it needs. */
const ART_BASE = {
  siloHi: '#FFFFFF',
  water: '#8ED2D8', waterHi: '#C9EFF1', waterEdge: '#5DAFB5', lily: '#5FAF6E', lilyD: '#46935A',
  snow: '#FFFFFF', snowSh: '#DCD6EA',
  pumpkin: '#EE8A2E', pumpkinD: '#C9661C', vine: '#5E7A2E',
  fglow: '#C9B2FF', firefly: '#FFE68A',
  signFocusInk: '#FFFFFF',
  bannerInk: '#3D290F',
};

const UI_STATE_LIGHT = {
  okInk: '#1D6A45', okBg: '#D6F1E1', soonInk: '#694700', soonBg: '#FBE9AE',
  okFill: '#3E9C6B', picket: '#FFFFFF', btnFg: '#FFFFFF',
};

/* ------------------------------------------------------------------ */
/* the nine scenes                                                     */
/* ------------------------------------------------------------------ */

export const RANCH_SCENES: Record<RanchSceneKey, RanchSceneDef> = {
  // Lavender Dream: lavender-field dusk (the approved sample, verbatim)
  default: {
    key: 'default', moment: 'lavender-field dusk', friend: 'LunaBunny', friendName: 'Luna',
    features: { ...FEATURES, celestial: 'moon', field: 'lavender' },
    art: {
      ...ART_BASE,
      sky1: '#A891E2', sky2: '#C3AFEE', sky3: '#E6C6EA', sky4: '#F9D6D6',
      glow: '#FFE0D0', glowO: '.85', halo: '#FFF3EC', orb: '#FFF8EE', orbSh: '#EFDDE8',
      cloud: '#F7EFFF', cloudSh: '#DCC7F1',
      hA1: '#D7C0EA', hA1b: '#E4CFEC', hA2: '#C6ABE2', hA2b: '#D2BBE8', hB: '#A797D3', hBb: '#B3A4DA',
      hC: '#8E8AC6', hCb: '#9894CB', hD: '#7C78B8', hDb: '#6E69A8', rim: '#FCE6F1', rimO: '.75', haze: '#F3D8EC',
      path: '#EBC9C6', pathHi: '#F8E1DA', pathEdge: '#BE97AE',
      barn: '#D88B9D', barnSh: '#BC6F88', barnDoor: '#C77A8F', barnLine: '#B66B83', barnDark: '#5E3A58',
      roof: '#6C4C80', roof2: '#5A3D6D', roofLine: '#5B3E6E', trim: '#FFF4F6', window: '#4B3263',
      hay: '#F2CF7A', hayFace: '#F7DD97', hayLine: '#D7AF55', stone: '#A98BAA', lamp: '#FFE7B0',
      silo: '#ECE1F3', siloSh: '#CBB8DC', siloBand: '#B7A2CB', dome: '#7C5A8F',
      tree: '#6E6DAE', treeD: '#57559A', treeL: '#8C89C7', trunk: '#5D4562',
      tree2: '#6E6DAE', treeD2: '#57559A', treeL2: '#8C89C7', tree3: '#6E6DAE', treeD3: '#57559A', treeL3: '#8C89C7',
      wood: '#9A7257', woodD: '#7A5640', board: '#F4DFC2', boardInk: '#4E321D', nail: '#9A7A66',
      row: '#A77EDC', rowD: '#8360BD', rowH: '#DCC2F7', rowH2: '#DCC2F7',
      fl1: '#FFFFFF', fl2: '#FFC2D8', fl3: '#FFE28C', flc: '#E9AE4A', tuft: '#5D59A0',
      fall1: '#FFFFFF', fall2: '#FFFFFF', fall3: '#FFFFFF',
      banner: '#FFD47E', pole: '#7C5C4B',
      signFocus: '#C23B69', signOk: '#2C9A64', gshadow: 'rgb(64 40 110 / .22)',
      title: '#2B1A4F', title2: '#36235F',
    },
    ui: {
      ...UI_STATE_LIGHT, scheme: 'light',
      ground: '#F5EFFA', page: '#FFFCFF', page2: '#F0E8F8', line: '#E0D3EE', track: '#E7DCF3',
      ink: '#2B1A4F', ink2: '#5B4A7F', ring: '#2B1A4F',
      btnBg: '#3A2466', btnSh: 'rgb(58 36 102 / .32)',
      focus: '#B1335F', focusBg: '#FBE4EC', fill: '#7B58C9', sh: 'rgb(70 40 130 / .16)',
      thumb: '#C9B6E6', sel: '#D9C4F5', selInk: '#2B1A4F',
      plank: '#84593F', plankInk: '#FFF5EC', picketLine: '#B99C8C',
    },
  },

  // Rose Milk: strawberry-field pink sunrise
  'my-melody': {
    key: 'my-melody', moment: 'strawberry-field sunrise', friend: 'BooBoo', friendName: 'BooBoo',
    features: { ...FEATURES, celestial: 'sunrise', field: 'strawberry' },
    art: {
      ...ART_BASE,
      sky1: '#F2A4BC', sky2: '#F8BFCB', sky3: '#FCD9D3', sky4: '#FFEBCB',
      glow: '#FFD9B0', glowO: '.9', halo: '#FFE6C4', orb: '#FFE2A0', orbSh: '#FFF0CC',
      cloud: '#FFF2F4', cloudSh: '#F3C2CF',
      hA1: '#EAC3CF', hA1b: '#F0D2D9', hA2: '#D3AEC2', hA2b: '#DDBECD', hB: '#B6CCA1', hBb: '#C1D4AC',
      hC: '#96C084', hCb: '#A0C68E', hD: '#78AD6A', hDb: '#6CA15E', rim: '#FFF0E6', rimO: '.8', haze: '#FBDDE2',
      path: '#F2D7C2', pathHi: '#FCEADB', pathEdge: '#CFA690',
      barn: '#E3899A', barnSh: '#C86D80', barnDoor: '#D67B8D', barnLine: '#C26A7C', barnDark: '#5C2C3C',
      roof: '#8A4459', roof2: '#763A4C', roofLine: '#74384B', trim: '#FFF7F4', window: '#5A2D3D',
      hay: '#F4D07C', hayFace: '#F8DEA0', hayLine: '#D9AE56', stone: '#C7A2A6', lamp: '#FFE9C4',
      silo: '#F8EDEA', siloSh: '#DEC8C6', siloBand: '#CDB0AF', dome: '#B4566D',
      tree: '#6FA864', treeD: '#57904F', treeL: '#95C286', trunk: '#7A5145',
      tree2: '#6FA864', treeD2: '#57904F', treeL2: '#95C286', tree3: '#6FA864', treeD3: '#57904F', treeL3: '#95C286',
      wood: '#A07158', woodD: '#7E5341', board: '#F8E4D0', boardInk: '#4E281B', nail: '#A27F6E',
      row: '#5E9F57', rowD: '#427F3E', rowH: '#E5405A', rowH2: '#FFFFFF',
      fl1: '#FFFFFF', fl2: '#FF9EB6', fl3: '#FFE08C', flc: '#EDA747', tuft: '#4D8C46',
      fall1: '#FFFFFF', fall2: '#FFFFFF', fall3: '#FFFFFF',
      banner: '#FFD27A', pole: '#7D5747',
      signFocus: '#BB2F5C', signOk: '#2A9563', gshadow: 'rgb(120 50 70 / .2)',
      title: '#4A1A2C', title2: '#57203A',
    },
    ui: {
      ...UI_STATE_LIGHT, scheme: 'light',
      ground: '#FCF1F3', page: '#FFFDFD', page2: '#F8E4E9', line: '#EFD2DA', track: '#F4DCE2',
      ink: '#4A1A2C', ink2: '#7A4256', ring: '#4A1A2C',
      btnBg: '#6E2440', btnSh: 'rgb(110 36 64 / .3)',
      focus: '#B42C5A', focusBg: '#FCE4EB', fill: '#D2577D', sh: 'rgb(120 40 70 / .14)',
      thumb: '#EAB6C5', sel: '#F7C9D6', selInk: '#4A1A2C',
      plank: '#8A5A45', plankInk: '#FFF5EC', picketLine: '#C4A096',
    },
  },

  // Midnight Grape: starry night, barn lit from inside (the approved sample, verbatim)
  kuromi: {
    key: 'kuromi', moment: 'starry night', friend: 'ShadowBunny', friendName: 'Shadow',
    features: { ...FEATURES, celestial: 'crescent', stars: 1, fireflies: true, glow: true, friendGlow: true, field: 'lavender', birds: false },
    art: {
      ...ART_BASE,
      sky1: '#110A28', sky2: '#1D1344', sky3: '#2D1D60', sky4: '#4A2F80',
      glow: '#7650B8', glowO: '.55', halo: '#FFF1C6', orb: '#FFF0C2', orbSh: '#F1DC9C',
      cloud: '#3B2B70', cloudSh: '#2C2058',
      hA1: '#4A3788', hA1b: '#3F2F78', hA2: '#3F2E7A', hA2b: '#36286C', hB: '#33266A', hBb: '#2D215F',
      hC: '#2A1F5D', hCb: '#251B54', hD: '#21184E', hDb: '#1B1343', rim: '#9C87E6', rimO: '.55', haze: '#4B3590',
      path: '#7C69B2', pathHi: '#9A88CC', pathEdge: '#5D4E94',
      barn: '#7B4576', barnSh: '#5F345E', barnDoor: '#6C3B68', barnLine: '#5A3058', barnDark: '#2A1530',
      roof: '#3B2452', roof2: '#311D45', roofLine: '#2E1B42', trim: '#DAC8EE', window: '#FFC873',
      hay: '#C4974E', hayFace: '#A98246', hayLine: '#8A6634', stone: '#5B4774', lamp: '#FFE3A0',
      silo: '#5E5391', siloSh: '#473D76', siloHi: '#8B80C2', siloBand: '#3F356A', dome: '#3A2E62',
      tree: '#302B6B', treeD: '#26215A', treeL: '#47408A', trunk: '#2B1F42',
      tree2: '#302B6B', treeD2: '#26215A', treeL2: '#47408A', tree3: '#302B6B', treeD3: '#26215A', treeL3: '#47408A',
      wood: '#7C6070', woodD: '#5B4454', board: '#DCC6AA', boardInk: '#3A2618', nail: '#8E7480',
      row: '#5C40A0', rowD: '#40297A', rowH: '#9C7DE0', rowH2: '#9C7DE0',
      fl1: '#E9DEFF', fl2: '#C8A6FF', fl3: '#FFE28A', flc: '#FFCF66', tuft: '#30246A',
      fall1: '#FFFFFF', fall2: '#FFFFFF', fall3: '#FFFFFF',
      banner: '#FFD68C', bannerInk: '#3A2410', pole: '#A48DBE',
      signFocus: '#F39A52', signFocusInk: '#2A1740', signOk: '#3BBF7E', gshadow: 'rgb(5 0 20 / .4)',
      title: '#FFF7EA', title2: '#EDE3FF',
    },
    ui: {
      scheme: 'dark',
      ground: '#160F2C', page: '#211845', page2: '#2B2054', line: '#3E3170', track: '#3A2E66',
      ink: '#F4EDFF', ink2: '#C6B9EA', ring: '#FFD58A',
      btnBg: '#FFD58A', btnFg: '#2A1740', btnSh: 'rgb(0 0 0 / .45)',
      focus: '#FFB36B', focusBg: '#3F2A3A', okInk: '#93E6B8', okBg: '#183F34', soonInk: '#FFE08A', soonBg: '#45381A',
      fill: '#B69CFF', okFill: '#4CC48A', sh: 'rgb(0 0 0 / .4)', thumb: '#4A3B80', sel: '#5B45A8', selInk: '#FFFFFF',
      plank: '#C9A27F', plankInk: '#2A1A10', picket: '#E9E0FF', picketLine: '#8C7DB8',
    },
  },

  // Cloud Nine: bright sky, big fluffy clouds, a pond for Lilo
  cinnamoroll: {
    key: 'cinnamoroll', moment: 'bright day by the pond', friend: 'LiloOtter', friendName: 'Lilo',
    features: { ...FEATURES, celestial: 'sun', field: 'meadow', pond: 'left', clouds: 'fluffy' },
    art: {
      ...ART_BASE,
      sky1: '#6DB6EE', sky2: '#92CBF4', sky3: '#BFE2F8', sky4: '#E9F6FC',
      glow: '#FFFBE6', glowO: '.7', halo: '#FFF8D6', orb: '#FFE98A', orbSh: '#FFF6C8',
      cloud: '#FFFFFF', cloudSh: '#CDE0F2',
      hA1: '#BCD9EA', hA1b: '#CAE3EF', hA2: '#A3D2C6', hA2b: '#B3DACE', hB: '#8FCB98', hBb: '#9DD2A5',
      hC: '#6EBA7F', hCb: '#79C08A', hD: '#55A869', hDb: '#4B9C5F', rim: '#F5FFF4', rimO: '.8', haze: '#E1F1F8',
      path: '#F2E0BC', pathHi: '#FBEFD6', pathEdge: '#CFB487',
      barn: '#F1C25C', barnSh: '#D8A744', barnDoor: '#E6B44F', barnLine: '#CF9C3E', barnDark: '#4B3A1E',
      roof: '#4D6A8C', roof2: '#405A79', roofLine: '#3E5775', trim: '#FFFDF5', window: '#3E5372',
      hay: '#F6D98A', hayFace: '#FAE6B0', hayLine: '#D9B35C', stone: '#B4AA96', lamp: '#FFF4CC',
      silo: '#EEF3F7', siloSh: '#CFD9E2', siloBand: '#B5C3CF', dome: '#5A7A9C',
      tree: '#4FA36A', treeD: '#3B8A57', treeL: '#78C08C', trunk: '#7A5A44',
      tree2: '#4FA36A', treeD2: '#3B8A57', treeL2: '#78C08C', tree3: '#4FA36A', treeD3: '#3B8A57', treeL3: '#78C08C',
      wood: '#9C7350', woodD: '#7B5637', board: '#F7E6C6', boardInk: '#4F3319', nail: '#9C7E62',
      row: '#66B67E', rowD: '#4A9C65', rowH: '#FFFFFF', rowH2: '#FFE58A',
      fl1: '#FFFFFF', fl2: '#A9CFFF', fl3: '#FFE27A', flc: '#F0A63A', tuft: '#3E9663',
      water: '#6FBDEB', waterHi: '#C2E8FB', waterEdge: '#4F97C6',
      fall1: '#FFFFFF', fall2: '#FFFFFF', fall3: '#FFFFFF',
      banner: '#FFCB52', pole: '#6E5A4B',
      signFocus: '#C2452A', signOk: '#25965E', gshadow: 'rgb(30 70 110 / .2)',
      title: '#0F2E4C', title2: '#173A5B',
    },
    ui: {
      ...UI_STATE_LIGHT, scheme: 'light', okInk: '#14633F', okBg: '#D3F0DE', okFill: '#2E8C5C',
      ground: '#EEF6FC', page: '#FFFFFF', page2: '#E2EFF9', line: '#CEE1F0', track: '#D9E9F5',
      ink: '#12324F', ink2: '#3B5975', ring: '#12324F',
      btnBg: '#1C5487', btnSh: 'rgb(28 84 135 / .3)',
      focus: '#B9441E', focusBg: '#FCE8DE', fill: '#2F84C6', sh: 'rgb(20 60 100 / .14)',
      thumb: '#AFCFEA', sel: '#C2DFF7', selInk: '#12324F',
      plank: '#7B5A44', plankInk: '#FFF6EA', picketLine: '#AE9C88',
    },
  },

  // Golden Hour: golden sunset over wheat
  pompompurin: {
    key: 'pompompurin', moment: 'golden sunset over the wheat', friend: 'SunshineChick', friendName: 'Sunshine',
    features: { ...FEATURES, celestial: 'sunset', field: 'wheat', extraHay: true },
    art: {
      ...ART_BASE,
      sky1: '#E4876A', sky2: '#F0A465', sky3: '#F6C177', sky4: '#FBDDA0',
      glow: '#FFD98A', glowO: '.95', halo: '#FFE7A0', orb: '#FFE48F', orbSh: '#F59A5B',
      cloud: '#FFDCC2', cloudSh: '#EFAA86',
      hA1: '#E6B494', hA1b: '#EDC3A2', hA2: '#CFA26F', hA2b: '#D8B07F', hB: '#B3B263', hBb: '#BEBD70',
      hC: '#DEB054', hCb: '#E5BC65', hD: '#95A04F', hDb: '#889346', rim: '#FFE6AE', rimO: '.95', haze: '#FAD7A6',
      path: '#EFD2A0', pathHi: '#FAE6C2', pathEdge: '#C7A06A',
      barn: '#C8553F', barnSh: '#A6432F', barnDoor: '#B84C38', barnLine: '#A13F2D', barnDark: '#47231A',
      roof: '#5A3A2E', roof2: '#4B3027', roofLine: '#482E25', trim: '#FFF3E0', window: '#4D2C20',
      hay: '#F0C35F', hayFace: '#F6D88F', hayLine: '#CF9F45', stone: '#B09178', lamp: '#FFE3A0',
      silo: '#F4E7D3', siloSh: '#D9C2A4', siloHi: '#FFF9EE', siloBand: '#C3A886', dome: '#9A583A',
      tree: '#7F933F', treeD: '#65782F', treeL: '#B5B75A', trunk: '#6C4A31',
      tree2: '#7F933F', treeD2: '#65782F', treeL2: '#B5B75A', tree3: '#7F933F', treeD3: '#65782F', treeL3: '#B5B75A',
      wood: '#9A6B45', woodD: '#774F31', board: '#F7E1BD', boardInk: '#4A2C12', nail: '#9A7A58',
      row: '#E9BD55', rowD: '#C99532', rowH: '#F8DE8E', rowH2: '#FFF1C2',
      fl1: '#FFF6DA', fl2: '#F59A76', fl3: '#FFD45C', flc: '#D9822B', tuft: '#6E7A2E',
      fall1: '#FFFFFF', fall2: '#FFFFFF', fall3: '#FFFFFF',
      banner: '#FFF2D2', bannerInk: '#4A2A0C', pole: '#774F31',
      signFocus: '#B03A1E', signOk: '#2C8A55', gshadow: 'rgb(110 60 20 / .22)',
      title: '#3B1F08', title2: '#4A2A10',
    },
    ui: {
      ...UI_STATE_LIGHT, scheme: 'light', okInk: '#1F663F', okBg: '#DAF0D9', soonInk: '#6A4300', soonBg: '#FCE7A6', okFill: '#3E8F5A',
      ground: '#FBF3E3', page: '#FFFDF8', page2: '#F5E8CF', line: '#EAD8B5', track: '#F0E1C3',
      ink: '#3B2408', ink2: '#6B4C22', ring: '#3B2408',
      btnBg: '#7A410C', btnSh: 'rgb(122 65 12 / .3)',
      focus: '#A8361B', focusBg: '#FBE5DA', fill: '#C2841A', sh: 'rgb(110 70 20 / .14)',
      thumb: '#E5C98D', sel: '#F7DD9C', selInk: '#3B2408',
      plank: '#7B4F2C', plankInk: '#FFF5E6', picketLine: '#BC9E7E',
    },
  },

  // Cherry Pop: cherry-blossom spring
  'hello-kitty': {
    key: 'hello-kitty', moment: 'cherry-blossom spring', friend: 'CherryKitty', friendName: 'Cherry',
    features: { ...FEATURES, celestial: 'softSun', field: 'tulips', trees: 'blossom', falling: 'petals' },
    art: {
      ...ART_BASE,
      sky1: '#86C2EC', sky2: '#ACD7F2', sky3: '#D8EDF6', sky4: '#FCEEF2',
      glow: '#FFF6F0', glowO: '.7', halo: '#FFF6E0', orb: '#FFF2C2', orbSh: '#FFFBEA',
      cloud: '#FFFFFF', cloudSh: '#D9E7F4',
      hA1: '#CCE2DA', hA1b: '#D8EADF', hA2: '#B6DBB9', hA2b: '#C4E2C5', hB: '#9CD08E', hBb: '#A8D69B',
      hC: '#80C072', hCb: '#8AC67C', hD: '#66AE5B', hDb: '#5CA252', rim: '#F7FFF0', rimO: '.8', haze: '#F8E6EC',
      path: '#F4DFC0', pathHi: '#FCEEDB', pathEdge: '#D2B28C',
      barn: '#D6475D', barnSh: '#B5364B', barnDoor: '#C83F54', barnLine: '#B0374B', barnDark: '#4A1A24',
      roof: '#6A3442', roof2: '#592B37', roofLine: '#572A36', trim: '#FFFFFF', window: '#4A2631',
      hay: '#F4D27A', hayFace: '#F8DFA0', hayLine: '#D7AF55', stone: '#B8A29E', lamp: '#FFF2C6',
      silo: '#F7F1EF', siloSh: '#DCCFCB', siloBand: '#C9B6B1', dome: '#BF3A52',
      tree: '#F6AEC4', treeD: '#E98AA9', treeL: '#FFD6E2', trunk: '#6E4A4A',
      tree2: '#F6AEC4', treeD2: '#E98AA9', treeL2: '#FFD6E2', tree3: '#F6AEC4', treeD3: '#E98AA9', treeL3: '#FFD6E2',
      wood: '#9C7350', woodD: '#7B5637', board: '#F7E5C4', boardInk: '#4F3319', nail: '#9C7E62',
      row: '#5DA957', rowD: '#3F8A42', rowH: '#E23C56', rowH2: '#FF9CB8',
      fl1: '#FFFFFF', fl2: '#FF93B1', fl3: '#FFE070', flc: '#EBA13E', tuft: '#3F8F48',
      fall1: '#FFC3D5', fall2: '#FFE4EC', fall3: '#F7A3BE',
      banner: '#FFD36B', pole: '#6E4A4A',
      signFocus: '#A3247E', signOk: '#25965E', gshadow: 'rgb(60 70 40 / .2)',
      title: '#3D0C1C', title2: '#4E1427',
    },
    ui: {
      ...UI_STATE_LIGHT, scheme: 'light', okInk: '#14633F', okBg: '#D3F0DE', okFill: '#2E8C5C',
      ground: '#FDF1F3', page: '#FFFFFF', page2: '#FBE3E8', line: '#F2D0D8', track: '#F6DCE2',
      ink: '#40101F', ink2: '#73384A', ring: '#40101F',
      btnBg: '#A8203F', btnSh: 'rgb(168 32 63 / .3)',
      focus: '#9A1F78', focusBg: '#F8E1F0', fill: '#E04B68', sh: 'rgb(120 30 50 / .14)',
      thumb: '#F0B5C4', sel: '#FAC8D6', selInk: '#40101F',
      plank: '#7B5539', plankInk: '#FFF6EA', picketLine: '#C0A090',
    },
  },

  // Fresh Mint: spring morning, a lily pond for Mochi (the approved sample + the pond)
  keroppi: {
    key: 'keroppi', moment: 'spring morning by the lily pond', friend: 'MochiFrog', friendName: 'Mochi',
    features: { ...FEATURES, celestial: 'sun', field: 'lavender', pond: 'right', lilies: true },
    art: {
      ...ART_BASE,
      sky1: '#9FDCCE', sky2: '#C2EBDF', sky3: '#E6F6E8', sky4: '#FFF3D3',
      glow: '#FFF0BF', glowO: '.9', halo: '#FFF4C2', orb: '#FFE27A', orbSh: '#FFF2B5',
      cloud: '#FFFFFF', cloudSh: '#D3EEE5',
      hA1: '#C9EBD8', hA1b: '#D8F1E2', hA2: '#ACDEC0', hA2b: '#BCE5CB', hB: '#8ACFA3', hBb: '#98D6AE',
      hC: '#66BB85', hCb: '#71C28F', hD: '#50A974', hDb: '#459C69', rim: '#F3FFE6', rimO: '.8', haze: '#EAF8E9',
      path: '#F0DAAE', pathHi: '#FBEDCF', pathEdge: '#CFAF7E',
      barn: '#D8695D', barnSh: '#BA5249', barnDoor: '#C95D52', barnLine: '#B44E45', barnDark: '#56332E',
      roof: '#6A5257', roof2: '#584348', roofLine: '#57434A', trim: '#FFFDF7', window: '#4A3936',
      hay: '#F4D27A', hayFace: '#F7DD97', hayLine: '#D7AF55', stone: '#B2A399', lamp: '#FFF2C6',
      silo: '#F3EFE7', siloSh: '#D3CCC0', siloBand: '#C1B8AA', dome: '#7D919B',
      tree: '#43A06C', treeD: '#318758', treeL: '#6BC089', trunk: '#7A5A44',
      tree2: '#43A06C', treeD2: '#318758', treeL2: '#6BC089', tree3: '#43A06C', treeD3: '#318758', treeL3: '#6BC089',
      wood: '#9C7350', woodD: '#7B5637', board: '#F7E5C4', boardInk: '#4F3319', nail: '#9C7E62',
      row: '#5FB87C', rowD: '#3E9A60', rowH: '#FFB5C9', rowH2: '#FFE066',
      fl1: '#FFFFFF', fl2: '#FFB5C9', fl3: '#FFE066', flc: '#EFA53A', tuft: '#3D9663',
      water: '#86CFD3', waterHi: '#C6EDEE', waterEdge: '#57A9AE', lily: '#4FA866', lilyD: '#3A8D52',
      fall1: '#FFFFFF', fall2: '#FFFFFF', fall3: '#FFFFFF',
      banner: '#FFCB52', pole: '#7B5A44',
      signFocus: '#B5461C', signOk: '#25965E', gshadow: 'rgb(30 80 50 / .2)',
      title: '#123A2B', title2: '#1A4636',
    },
    ui: {
      ...UI_STATE_LIGHT, scheme: 'light', okInk: '#14633F', okBg: '#D3F0DE', soonInk: '#664400', soonBg: '#FAEAA8', okFill: '#2E8C5C',
      ground: '#EEF7F0', page: '#FFFFFF', page2: '#E4F2E8', line: '#D0E6D7', track: '#DCEDE2',
      ink: '#143D2E', ink2: '#3D6454', ring: '#143D2E',
      btnBg: '#1D5C44', btnSh: 'rgb(20 80 55 / .3)',
      focus: '#B4430F', focusBg: '#FDE9DD', fill: '#2E8C5C', sh: 'rgb(20 80 55 / .14)',
      thumb: '#AFD8BE', sel: '#BFE8CF', selInk: '#143D2E',
      plank: '#7B5539', plankInk: '#FFF6EA', picketLine: '#B39A82',
    },
  },

  // Cocoa Dream: snowy winter evening, warm windows
  chococat: {
    key: 'chococat', moment: 'snowy winter evening', friend: 'ChaiBear', friendName: 'Chai',
    features: {
      ...FEATURES, celestial: 'winterMoon', stars: 0.4, glow: true, snow: true, field: 'drifts',
      trees: 'pine', groundDeco: 'sparkles', falling: 'snow', birds: false, snowman: true,
    },
    art: {
      ...ART_BASE,
      sky1: '#28264C', sky2: '#433D6C', sky3: '#7A6290', sky4: '#E2A99D',
      glow: '#F2B39C', glowO: '.6', halo: '#FFF3DC', orb: '#FFF4DE', orbSh: '#EFDCC2',
      cloud: '#5E5180', cloudSh: '#483E69',
      hA1: '#A79CC2', hA1b: '#B5ABCB', hA2: '#C2B8D6', hA2b: '#CDC4DD', hB: '#DAD3E7', hBb: '#E2DCEC',
      hC: '#EDE9F4', hCb: '#F2EFF7', hD: '#FBF9FD', hDb: '#F1EDF5', rim: '#FFE6D6', rimO: '.85', haze: '#CDB5C8',
      path: '#D3C8DF', pathHi: '#E6DFEE', pathEdge: '#ADA0C4',
      barn: '#9C4E44', barnSh: '#7E3D35', barnDoor: '#8C463C', barnLine: '#7A3C33', barnDark: '#3A1E1A',
      roof: '#5B3A36', roof2: '#4C302D', roofLine: '#482D2A', trim: '#F6E9DE', window: '#FFC873',
      hay: '#C9A060', hayFace: '#DBB878', hayLine: '#A98246', stone: '#8C7A86', lamp: '#FFE3A0',
      silo: '#DDD5E2', siloSh: '#BBB0C8', siloHi: '#F4F0F8', siloBand: '#A79AB6', dome: '#6B5571',
      tree: '#4F6F6B', treeD: '#3D5956', treeL: '#6E8D87', trunk: '#4A3530',
      tree2: '#4F6F6B', treeD2: '#3D5956', treeL2: '#6E8D87', tree3: '#4F6F6B', treeD3: '#3D5956', treeL3: '#6E8D87',
      wood: '#8E6B5A', woodD: '#6C4E40', board: '#F1DDC6', boardInk: '#45291A', nail: '#8E7466',
      row: '#E4DEEE', rowD: '#CFC6E0', rowH: '#FFFFFF', rowH2: '#FFFFFF',
      fl1: '#FFFFFF', fl2: '#D9434D', fl3: '#FFE0A8', flc: '#B8323B', tuft: '#5E7A72',
      snow: '#FFFFFF', snowSh: '#D8D0E6',
      fall1: '#FFFFFF', fall2: '#F1EDFA', fall3: '#FFFFFF',
      banner: '#FFD68C', bannerInk: '#3A2410', pole: '#8C7480',
      signFocus: '#B53A2E', signOk: '#2C8A5A', gshadow: 'rgb(60 40 90 / .2)',
      title: '#FFF4EA', title2: '#F3E2D6',
    },
    ui: {
      ...UI_STATE_LIGHT, scheme: 'light',
      ground: '#F7F0EA', page: '#FFFDFB', page2: '#F1E6DD', line: '#E5D5C9', track: '#ECDFD4',
      ink: '#3A2419', ink2: '#6A4A3A', ring: '#3A2419',
      btnBg: '#6B3A2A', btnSh: 'rgb(107 58 42 / .3)',
      focus: '#B23A2C', focusBg: '#FBE4DF', fill: '#9A5A3E', sh: 'rgb(80 50 35 / .15)',
      thumb: '#D8C2B2', sel: '#EED6C4', selInk: '#3A2419',
      plank: '#6E4A34', plankInk: '#FFF5EC', picketLine: '#B99C8C',
    },
  },

  // Maple Season: autumn maples, falling leaves
  maple: {
    key: 'maple', moment: 'autumn afternoon in the maples', friend: 'MapleFox', friendName: 'Maple',
    features: { ...FEATURES, celestial: 'softSun', field: 'pumpkins', trees: 'maple', groundDeco: 'leaves', falling: 'leaves' },
    art: {
      ...ART_BASE,
      sky1: '#93C1E2', sky2: '#BBD7E6', sky3: '#EFDCC8', sky4: '#FBD1A6',
      glow: '#FFE3C2', glowO: '.8', halo: '#FFF0D0', orb: '#FFE7A8', orbSh: '#FFF4D2',
      cloud: '#FFFFFF', cloudSh: '#DCE6EE',
      hA1: '#D3C1C3', hA1b: '#DDCDCD', hA2: '#CBAE86', hA2b: '#D4BC96', hB: '#C2A955', hBb: '#CBB363',
      hC: '#AE9B4C', hCb: '#B7A456', hD: '#8F8A45', hDb: '#83803E', rim: '#FFEFD8', rimO: '.8', haze: '#EFD9CB',
      path: '#ECD3AE', pathHi: '#F7E5CA', pathEdge: '#C4A178',
      barn: '#B04A3A', barnSh: '#8E3A2E', barnDoor: '#A04234', barnLine: '#8C392D', barnDark: '#3E1E17',
      roof: '#4E3B36', roof2: '#42322E', roofLine: '#3F302C', trim: '#FFF4E6', window: '#4A2E26',
      hay: '#E9BF62', hayFace: '#F2D38E', hayLine: '#C99A45', stone: '#A89283', lamp: '#FFE3A8',
      silo: '#F1E8DC', siloSh: '#D5C7B5', siloHi: '#FFFCF6', siloBand: '#BFAF9B', dome: '#8A5038',
      tree: '#E8803A', treeD: '#CB5A2A', treeL: '#F6B158', trunk: '#5E3D2C',
      tree2: '#DD5B3B', treeD2: '#B73F2C', treeL2: '#F08A5A', tree3: '#EDB23E', treeD3: '#CF8A27', treeL3: '#F8D27A',
      wood: '#946A4C', woodD: '#714E35', board: '#F5E1C3', boardInk: '#4A2C16', nail: '#957659',
      row: '#B9A657', rowD: '#9A8841', rowH: '#E2C46C', rowH2: '#E2C46C',
      fl1: '#F6C450', fl2: '#E2683A', fl3: '#C9472E', flc: '#8A5A9E', tuft: '#6E7434',
      fall1: '#E8803A', fall2: '#DD5B3B', fall3: '#EDB23E',
      banner: '#FFD36B', pole: '#714E35',
      signFocus: '#8E3A86', signOk: '#2C8A55', gshadow: 'rgb(90 60 20 / .22)',
      title: '#2B1A0E', title2: '#3A2414',
    },
    ui: {
      ...UI_STATE_LIGHT, scheme: 'light', okInk: '#1F663F', okBg: '#DAF0D9', soonInk: '#6A4300', soonBg: '#FCE7A6', okFill: '#3E8F5A',
      ground: '#FBF2E9', page: '#FFFDF9', page2: '#F5E6D6', line: '#EAD4BF', track: '#F0DECB',
      ink: '#3A1F0F', ink2: '#6C4430', ring: '#3A1F0F',
      btnBg: '#8E3B16', btnSh: 'rgb(142 59 22 / .3)',
      focus: '#8E3A86', focusBg: '#F4E2F1', fill: '#CF6A2C', sh: 'rgb(100 50 20 / .14)',
      thumb: '#E5C3A5', sel: '#F6D3B5', selInk: '#3A1F0F',
      plank: '#7B4A2C', plankInk: '#FFF5E8', picketLine: '#BC9E7E',
    },
  },
};

/** The scene for a theme preset. Custom themes borrow Lavender Dream's dusk. */
export function sceneKeyForPreset(preset: ThemePreset | undefined): RanchSceneKey {
  return preset && preset !== 'custom' && preset in RANCH_SCENES ? preset : 'default';
}

/* ------------------------------------------------------------------ */
/* product tokens: --ranch-* on :root                                 */
/* ------------------------------------------------------------------ */

const kebab = (k: string) => k.replace(/[A-Z0-9]/g, (m) => '-' + m.toLowerCase()).replace(/-(\d)/g, '$1');

/** Art palette → CSS custom properties for the scene element. */
export function ranchArtVars(art: RanchArt): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(art)) out[`--r-${kebab(k)}`] = v;
  return out;
}

/** UI tokens → CSS custom properties (scheme becomes --ranch-scheme for color-scheme). */
export function ranchUiVars(ui: RanchUi): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(ui)) out[`--ranch-${kebab(k)}`] = v;
  return out;
}

/* small color helpers for derived token sets */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function rgbToHex([r, g, b]: [number, number, number]) {
  return '#' + [r, g, b].map((n) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0')).join('');
}
/** Linear mix of two hex colors; k = 0 → a, k = 1 → b. */
export function mixHex(a: string, b: string, k: number) {
  const x = hexToRgb(a), y = hexToRgb(b);
  return rgbToHex([x[0] + (y[0] - x[0]) * k, x[1] + (y[1] - x[1]) * k, x[2] + (y[2] - x[2]) * k]);
}

/**
 * Night version of a light scene's product tokens, for the app's dark-mode
 * toggle. Built from the scene's own ink so every theme keeps its hue.
 */
export function darkUiFrom(ui: RanchUi): RanchUi {
  if (ui.scheme === 'dark') return ui;
  const ground = mixHex(ui.ink, '#000000', 0.42);
  const page = mixHex(ui.ink, '#000000', 0.18);
  const page2 = mixHex(ui.ink, '#FFFFFF', 0.06);
  return {
    scheme: 'dark',
    ground, page, page2,
    line: mixHex(ui.ink, '#FFFFFF', 0.16),
    track: mixHex(ui.ink, '#FFFFFF', 0.12),
    ink: mixHex(ui.ground, '#FFFFFF', 0.4),
    ink2: mixHex(ui.ground, ui.ink, 0.28),
    ring: mixHex(ui.focusBg, '#FFFFFF', 0.2),
    btnBg: mixHex(ui.sel, '#FFFFFF', 0.25),
    btnFg: mixHex(ui.ink, '#000000', 0.25),
    btnSh: 'rgb(0 0 0 / .45)',
    focus: mixHex(ui.focus, '#FFFFFF', 0.5),
    focusBg: mixHex(ui.focus, ground, 0.72),
    okInk: '#93E6B8', okBg: '#183F34', soonInk: '#FFE08A', soonBg: '#45381A',
    fill: mixHex(ui.fill, '#FFFFFF', 0.35),
    okFill: '#4CC48A',
    sh: 'rgb(0 0 0 / .4)',
    thumb: mixHex(ui.ink, '#FFFFFF', 0.25),
    sel: mixHex(ui.ink, '#FFFFFF', 0.3),
    selInk: '#FFFFFF',
    plank: mixHex(ui.plank, '#FFFFFF', 0.35),
    plankInk: mixHex(ui.plank, '#000000', 0.55),
    picket: mixHex(ui.ground, '#FFFFFF', 0.3),
    picketLine: mixHex(ui.picketLine, ground, 0.25),
  };
}

/**
 * Product tokens for a custom theme: built from the user's own palette,
 * with the deepest shade pushed dark enough to carry body text.
 */
export function customUiFrom(colors: ThemeColors): RanchUi {
  const base = RANCH_SCENES.default.ui;
  const ink = mixHex(colors.primary900, '#000000', 0.35);
  return {
    ...base,
    ground: mixHex(colors.primary50, '#FFFFFF', 0.2),
    page: '#FFFFFF',
    page2: colors.primary50,
    line: colors.primary100,
    track: colors.primary100,
    ink,
    ink2: mixHex(colors.primary800, '#000000', 0.15),
    ring: ink,
    btnBg: mixHex(colors.primary700, '#000000', 0.25),
    btnSh: 'rgb(0 0 0 / .25)',
    fill: colors.primary500,
    thumb: colors.primary200,
    sel: colors.primary200,
    selInk: ink,
  };
}

/** The product tokens in force for a theme setting (preset, custom, dark toggle). */
export function ranchUiFor(theme: ThemeSettings | undefined): RanchUi {
  const preset = theme?.preset ?? 'default';
  const base = preset === 'custom' && theme?.customColors
    ? customUiFrom(theme.customColors)
    : RANCH_SCENES[sceneKeyForPreset(preset)].ui;
  return theme?.darkMode ? darkUiFrom(base) : base;
}

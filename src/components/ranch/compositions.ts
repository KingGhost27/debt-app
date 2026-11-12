/**
 * The two hand-tuned ranch compositions: a 1300×600 wide stage and a
 * 390×420 phone stage. Same world, own framing: the phone keeps the barn,
 * Debtsy, the friend and the trail ahead in frame instead of squashing
 * the wide picture.
 */

import { chain, type Box, type Cubic, type P, type TrailSeg } from './geometry';
import type { CelestialKind } from '../../lib/ranchScenes';

export type CompositionId = 'wide' | 'phone';
type TreeLayer = 'A' | 'B' | 'C' | 'D' | 'behindBarn';

export interface Oval { cx: number; cy: number; rx: number; ry: number }

export interface Composition {
  id: CompositionId;
  W: number;
  H: number;
  seed: number;
  hills: { A1: Cubic[]; A2: Cubic[]; B: Cubic[]; C: Cubic[]; D: Cubic[] };
  edge: Cubic[];
  trail: TrailSeg[];
  anchors: [number, number, number][];
  barn: [number, number, number];
  silo: [number, number, number];
  /** x, y (feet), size, rotation */
  debtsy: [number, number, number, number];
  debtsyFront: boolean;
  friendSize: number;
  wRef: number;
  postScale: number;
  /** Board lettering size (user units) at post scale 1. */
  boardFont: number;
  /** Posts at or above this scale carry their name on the board itself. */
  boardTextMin: number;
  /** Label-chip lettering size (user units); sized to stay ≥ ~11.5px at the smallest stage. */
  chipFont: number;
  flag: { s: number; bannerLen: number };
  trees: { x: number; y: number; s: number; layer: TreeLayer; kind?: 'poplar' }[];
  clouds: [number, number, number][];
  fluffyClouds: [number, number, number][];
  celestial: Record<CelestialKind, [number, number, number]>;
  birds: [number, number, number][];
  /** Where the sky copy sits; stars and labels stay out. */
  copyBox: Box;
  /** Keep-out zones for scattered flowers and field rows (barn, Debtsy). */
  avoid: [number, number, number, number][];
  rows: { vp: P; bottoms: number[]; yBottom: number; maxX: number };
  /** Open ground for the pumpkin patch / snow drifts in place of rows. */
  fieldBox: Box;
  midRows: { x0: number; x1: number; offs: number[] };
  fenceC: Cubic[] | null;
  fenceB: Cubic[] | null;
  hay: [number, number, number] | null;
  extraHay: [number, number, number][];
  snowman: [number, number, number];
  pondLeft: Oval;
  pondRight: Oval;
  /** flowers in the near / middle / far bands */
  flowerCount: [number, number, number];
  depth: (y: number) => number;
  starCount: number;
  fireflies: P[];
  falling: { snow: number; petals: number; leaves: number };
  /** Labels must stay inside this box (survives the narrowest crop). */
  safe: Box;
  /** Speech bubble size in user units at the reference scale (an obstacle for labels). */
  bubble: { w: number; h: number; above: boolean };
}

export const WIDE: Composition = {
  id: 'wide',
  W: 1300,
  H: 600,
  seed: 11,
  hills: {
    A1: chain([-10, 358], [[[150, 346], [300, 354], [420, 360]], [[560, 367], [700, 350], [820, 348]], [[930, 346], [1010, 356], [1090, 352]], [[1180, 347], [1240, 350], [1310, 356]]]),
    A2: chain([880, 396], [[[990, 386], [1062, 318], [1150, 312]], [[1222, 307], [1266, 334], [1310, 346]]]),
    B: chain([-10, 410], [[[110, 398], [220, 392], [330, 402]], [[450, 414], [560, 420], [680, 407]], [[790, 395], [880, 386], [980, 392]], [[1080, 398], [1160, 412], [1310, 404]]]),
    C: chain([-10, 430], [[[60, 428], [110, 448], [160, 455]], [[260, 462], [380, 458], [450, 462]], [[540, 468], [600, 486], [700, 482]], [[800, 478], [860, 452], [960, 448]], [[1060, 444], [1180, 458], [1310, 466]]]),
    D: chain([-10, 522], [[[120, 502], [260, 498], [380, 512]], [[520, 528], [640, 522], [760, 510]], [[900, 496], [1040, 504], [1150, 520]], [[1220, 530], [1270, 526], [1310, 522]]]),
  },
  edge: chain([-10, 588], [[[200, 576], [380, 592], [620, 584]], [[860, 576], [1060, 594], [1310, 582]]]),
  trail: [
    { c: [[200, 459], [203, 491], [286, 522], [410, 537]], w0: 17, w1: 27, layer: 'top' },
    { c: [[410, 537], [530, 553], [660, 561], [770, 548]], w0: 27, w1: 27, layer: 'top' },
    { c: [[770, 548], [850, 538], [893, 516], [902, 490]], w0: 27, w1: 19, layer: 'top' },
    { c: [[902, 490], [907, 474], [914, 461], [934, 451]], w0: 19, w1: 15, layer: 'top' },
    { c: [[934, 451], [954, 440], [985, 427], [1010, 415]], w0: 15, w1: 10.5, layer: 'B' },
    { c: [[1010, 415], [1030, 406], [1050, 401], [1064, 395]], w0: 10.5, w1: 8.5, layer: 'B' },
    { c: [[1064, 395], [1088, 376], [1122, 338], [1150, 313]], w0: 8.5, w1: 3.5, layer: 'A' },
  ],
  anchors: [[0, 0, 0], [25, 0, 0.97], [40, 2, 0.32], [55, 3, 1], [80, 5, 1], [100, 6, 1]],
  barn: [120, 458, 1],
  silo: [120, 455, 1],
  debtsy: [318, 467, 96, -5],
  debtsyFront: false,
  friendSize: 78,
  wRef: 27,
  postScale: 1,
  boardFont: 16,
  boardTextMin: 0.86,
  chipFont: 15.5,
  flag: { s: 0.95, bannerLen: 160 },
  trees: [
    { x: 76, y: 452, s: 1.3, layer: 'behindBarn' },
    { x: 1016, y: 398, s: 0.5, layer: 'B' }, { x: 1036, y: 402, s: 0.4, layer: 'B' },
    { x: 604, y: 419, s: 0.3, layer: 'B' }, { x: 624, y: 420, s: 0.24, layer: 'B' },
    { x: 420, y: 412, s: 0.26, layer: 'B' }, { x: 438, y: 413, s: 0.21, layer: 'B' }, { x: 455, y: 414, s: 0.25, layer: 'B' }, { x: 470, y: 415, s: 0.19, layer: 'B' },
    { x: 1250, y: 540, s: 1.55, layer: 'D' },
  ],
  clouds: [[190, 104, 1], [1000, 176, 0.78], [30, 236, 0.5]],
  fluffyClouds: [[150, 92, 1.45], [560, 40, 0.8], [960, 152, 1.15], [1150, 238, 0.9], [10, 246, 0.85], [1230, 60, 0.7]],
  celestial: {
    moon: [1212, 292, 44],
    sun: [1160, 112, 34],
    crescent: [1178, 98, 28],
    sunrise: [1240, 298, 50],
    sunset: [1236, 284, 60],
    softSun: [1190, 104, 32],
    winterMoon: [1186, 112, 30],
  },
  birds: [[1052, 232, 1], [1072, 222, 0.8], [1086, 238, 0.7]],
  copyBox: { x0: 470, y0: 20, x1: 1010, y1: 340 },
  avoid: [[110, 180, 440, 470], [262, 368, 372, 476]],
  rows: { vp: [150, 466], bottoms: [-120, -40, 40, 120, 200, 280], yBottom: 640, maxX: 360 },
  fieldBox: { x0: 0, y0: 486, x1: 360, y1: 592 },
  midRows: { x0: 690, x1: 1300, offs: [10, 20, 31] },
  fenceC: chain([120, 452], [[[84, 446], [36, 433], [-12, 431]]]),
  fenceB: chain([1080, 398], [[[1120, 403], [1160, 410], [1210, 406]]]),
  hay: [100, 470, 1.1],
  extraHay: [[808, 470, 0.6], [770, 474, 0.5]],
  snowman: [92, 474, 1],
  pondLeft: { cx: 150, cy: 552, rx: 132, ry: 27 },
  pondRight: { cx: 1084, cy: 556, rx: 104, ry: 22 },
  flowerCount: [80, 46, 24],
  depth: (y) => Math.max(0.22, Math.min(1.15, 0.22 + ((y - 350) / 210) * 0.85)),
  starCount: 120,
  fireflies: [[500, 470], [760, 500], [300, 560], [860, 470], [1180, 470], [120, 520], [640, 470], [980, 560]],
  falling: { snow: 70, petals: 26, leaves: 16 },
  safe: { x0: 134, y0: 30, x1: 1166, y1: 590 },
  bubble: { w: 236, h: 58, above: true },
};

export const PHONE: Composition = {
  id: 'phone',
  W: 390,
  H: 420,
  seed: 5,
  hills: {
    A1: chain([-10, 262], [[[60, 254], [140, 257], [200, 262]], [[260, 267], [320, 256], [400, 258]]]),
    A2: chain([226, 290], [[[276, 283], [298, 238], [334, 236]], [[362, 234], [386, 248], [400, 254]]]),
    B: chain([-10, 296], [[[60, 288], [130, 286], [190, 294]], [[250, 302], [300, 301], [340, 293]], [[360, 289], [380, 290], [400, 292]]]),
    C: chain([-10, 322], [[[30, 322], [60, 333], [100, 336]], [[160, 339], [200, 338], [240, 343]], [[280, 349], [312, 347], [340, 338]], [[360, 332], [380, 333], [400, 335]]]),
    D: chain([-10, 380], [[[50, 370], [110, 368], [170, 374]], [[230, 380], [290, 378], [330, 372]], [[360, 368], [380, 371], [400, 373]]]),
  },
  edge: chain([-10, 413], [[[80, 407], [180, 417], [260, 411]], [[320, 406], [360, 415], [400, 411]]]),
  trail: [
    { c: [[58, 336], [60, 358], [96, 374], [146, 381]], w0: 10, w1: 16, layer: 'top' },
    { c: [[146, 381], [200, 389], [250, 391], [290, 384]], w0: 16, w1: 16, layer: 'top' },
    { c: [[290, 384], [326, 377], [347, 363], [342, 348]], w0: 16, w1: 12, layer: 'top' },
    { c: [[342, 348], [339, 338], [326, 332], [330, 322]], w0: 12, w1: 9, layer: 'top' },
    { c: [[330, 322], [334, 312], [344, 304], [344, 295]], w0: 9, w1: 7, layer: 'B' },
    { c: [[344, 295], [343, 280], [338, 256], [334, 238]], w0: 7, w1: 3, layer: 'A' },
  ],
  anchors: [[0, 0, 0], [20, 0, 0.72], [30, 1, 0.3], [42, 1, 0.92], [58, 3, 0.6], [80, 4, 1], [100, 5, 1]],
  barn: [10, 336, 0.6],
  silo: [10, 333, 0.6],
  debtsy: [37, 387, 58, -6],
  debtsyFront: true,
  friendSize: 56,
  wRef: 16,
  postScale: 0.9,
  boardFont: 14,
  boardTextMin: 0.86,
  chipFont: 13.5,
  flag: { s: 0.8, bannerLen: 132 },
  trees: [
    { x: 378, y: 293, s: 0.36, layer: 'B' },
    { x: 212, y: 298, s: 0.42, layer: 'B', kind: 'poplar' }, { x: 224, y: 299, s: 0.32, layer: 'B', kind: 'poplar' },
  ],
  clouds: [[226, 186, 0.36], [-8, 214, 0.3]],
  fluffyClouds: [[214, 182, 0.5], [-14, 208, 0.42], [300, 118, 0.34]],
  celestial: {
    moon: [354, 244, 24],
    sun: [342, 52, 20],
    crescent: [342, 46, 17],
    sunrise: [362, 224, 25],
    sunset: [364, 216, 26],
    softSun: [344, 50, 19],
    winterMoon: [342, 50, 17],
  },
  birds: [[268, 216, 0.7], [280, 210, 0.55]],
  copyBox: { x0: 0, y0: 0, x1: 400, y1: 168 },
  avoid: [[0, 160, 200, 338], [4, 326, 72, 392]],
  rows: { vp: [52, 372], bottoms: [-90, -30, 30, 90, 150], yBottom: 460, maxX: 130 },
  fieldBox: { x0: 64, y0: 388, x1: 140, y1: 414 },
  midRows: { x0: 250, x1: 390, offs: [8, 15] },
  fenceC: null,
  fenceB: chain([236, 301], [[[262, 303], [290, 302], [318, 297]]]),
  hay: null,
  extraHay: [],
  snowman: [112, 405, 0.5],
  pondLeft: { cx: 108, cy: 396, rx: 42, ry: 9.5 },
  pondRight: { cx: 336, cy: 397, rx: 42, ry: 9 },
  flowerCount: [38, 22, 10],
  depth: (y) => Math.max(0.22, Math.min(1.1, 0.22 + ((y - 262) / 130) * 0.8)),
  starCount: 46,
  fireflies: [[120, 356], [250, 360], [40, 395], [300, 400], [372, 340]],
  falling: { snow: 30, petals: 12, leaves: 8 },
  safe: { x0: 6, y0: 150, x1: 384, y1: 414 },
  bubble: { w: 0, h: 0, above: false },
};

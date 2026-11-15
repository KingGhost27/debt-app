/**
 * Stardust: one shared canvas over the home page for the cursor trail and the
 * little bursts (a click, a section title arriving, the debt-free date getting
 * closer).
 *
 * Adapted from 21st.dev #44750 "Rainbow Comet Cursor" (felix-au): the idea of
 * a pointer-events-free canvas overlay that trails the pointer and bursts on
 * click. Rebuilt so it only draws while particles are alive (no idle frames),
 * never hit-tests the page per frame, and paints in the page's own materials:
 * the barn's gold, the theme's colors, coins and hearts instead of a rainbow.
 *
 * Everything is a no-op until `mountStardust()` runs, and while disabled
 * (prefers-reduced-motion).
 */

type Kind = 'spark' | 'coin' | 'heart' | 'ring';

interface Particle {
  kind: Kind;
  x: number; y: number;
  vx: number; vy: number;
  g: number;
  life: number;
  decay: number;
  size: number;
  rot: number; vr: number;
  color: string;
}

export interface StardustPalette {
  theme: string;
  accent: string;
}

const GOLD = '#F5C04A';
const GOLD_LIGHT = '#FFE58A';
const GOLD_DEEP = '#C98A1B';
const MAX = 180;

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let parts: Particle[] = [];
let raf = 0;
let last = 0;
let dpr = 1;
let enabled = true;
let palette: StardustPalette = { theme: '#A584DD', accent: '#F2A7C3' };

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];

function resize() {
  if (!canvas || !ctx) return;
  dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(window.innerWidth * dpr);
  canvas.height = Math.round(window.innerHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

/** Adds the overlay canvas to the page; returns the cleanup. */
export function mountStardust(): () => void {
  if (canvas) return () => {};
  canvas = document.createElement('canvas');
  canvas.className = 'cb-stardust';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  ctx = canvas.getContext('2d');
  resize();
  window.addEventListener('resize', resize);
  return () => {
    window.removeEventListener('resize', resize);
    cancelAnimationFrame(raf);
    raf = 0;
    parts = [];
    canvas?.remove();
    canvas = null;
    ctx = null;
  };
}

export function setStardustPalette(p: StardustPalette) {
  palette = p;
}

export function setStardustEnabled(on: boolean) {
  enabled = on;
  if (!on) {
    parts = [];
    ctx?.clearRect(0, 0, window.innerWidth, window.innerHeight);
  }
}

function add(p: Particle) {
  if (parts.length >= MAX) parts.shift();
  parts.push(p);
}

function start() {
  if (!raf && ctx) {
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }
}

const sparkColor = () => pick([GOLD, GOLD_LIGHT, GOLD_LIGHT, palette.theme, '#FFFFFF']);

/** A sparkle or two where the pointer is. `eager` = over something clickable. */
export function trail(x: number, y: number, eager = false) {
  if (!enabled || !ctx) return;
  const n = eager ? 2 : 1;
  for (let i = 0; i < n; i++) {
    add({
      kind: 'spark', x: x + rand(-5, 5), y: y + rand(-5, 5),
      vx: rand(-0.35, 0.35), vy: rand(-0.6, 0.1), g: 0.025,
      life: 1, decay: rand(0.022, 0.032), size: rand(eager ? 4 : 3, eager ? 7.5 : 6),
      rot: rand(0, Math.PI), vr: rand(-0.06, 0.06), color: sparkColor(),
    });
  }
  start();
}

export type BurstSize = 'small' | 'big' | 'party';

/** A pop of coins, hearts and sparkles from one point. */
export function burst(x: number, y: number, size: BurstSize = 'small') {
  if (!enabled || !ctx) return;
  const coins = size === 'party' ? 5 : size === 'big' ? 3 : 0;
  const hearts = size === 'party' ? 3 : size === 'big' ? 2 : 1;
  const sparks = size === 'party' ? 16 : size === 'big' ? 8 : 6;
  const up = size === 'party' ? 1.6 : 1;
  add({ kind: 'ring', x, y, vx: 0, vy: 0, g: 0, life: 1, decay: 0.06, size: size === 'small' ? 16 : 26, rot: 0, vr: 0, color: palette.theme });
  for (let i = 0; i < coins; i++) {
    add({
      kind: 'coin', x, y, vx: rand(-3.2, 3.2), vy: rand(-6.5, -3.5) * up, g: 0.3,
      life: 1, decay: rand(0.016, 0.022), size: rand(6, 8.5), rot: rand(0, Math.PI), vr: rand(0.18, 0.32), color: GOLD,
    });
  }
  for (let i = 0; i < hearts; i++) {
    add({
      kind: 'heart', x, y, vx: rand(-2.2, 2.2), vy: rand(-4.5, -2.5) * up, g: 0.12,
      life: 1, decay: rand(0.018, 0.024), size: rand(5.5, 8), rot: rand(-0.4, 0.4), vr: rand(-0.03, 0.03), color: palette.accent,
    });
  }
  for (let i = 0; i < sparks; i++) {
    const a = rand(0, Math.PI * 2);
    const s = rand(1.6, size === 'small' ? 3.4 : 4.6);
    add({
      kind: 'spark', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - (up - 1) * 2, g: 0.06,
      life: 1, decay: rand(0.024, 0.034), size: rand(3.5, 7), rot: rand(0, Math.PI), vr: rand(-0.12, 0.12), color: sparkColor(),
    });
  }
  start();
}

/** Sparkles scattered along the edges of a box (a title arriving). */
export function sparkleRect(r: { left: number; top: number; width: number; height: number }, n = 9) {
  if (!enabled || !ctx) return;
  for (let i = 0; i < n; i++) {
    const onTop = Math.random() < 0.5;
    const x = r.left + rand(-0.06, 1.06) * r.width;
    const y = onTop ? r.top + rand(-12, 6) : r.top + r.height + rand(-6, 12);
    add({
      kind: 'spark', x, y, vx: rand(-0.4, 0.4), vy: rand(-0.9, -0.2), g: 0.01,
      life: 1, decay: rand(0.014, 0.022), size: rand(4, 8), rot: rand(0, Math.PI), vr: rand(-0.05, 0.05), color: sparkColor(),
    });
  }
  start();
}

/**
 * The debt-free date just got closer: a party pop from every visible date and
 * from the barn's sign, and the sign gives a little bounce.
 */
export function celebrateCloser() {
  if (!enabled || !ctx) return;
  const inView = (r: DOMRect) => r.bottom > 0 && r.top < window.innerHeight && r.width > 0;
  document.querySelectorAll<HTMLElement>('[data-cb-date]').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (inView(r)) burst(r.left + r.width / 2, r.top + r.height / 2, 'party');
  });
  document.querySelectorAll<SVGGElement>('.cb-sign').forEach((g) => {
    const r = g.getBoundingClientRect();
    if (!inView(r)) return;
    burst(r.left + r.width / 2, r.top + r.height / 2, 'big');
    g.classList.remove('is-pop');
    void g.getBoundingClientRect();
    g.classList.add('is-pop');
  });
}

/* ------------------------------------------------------------------ */
/* drawing                                                             */
/* ------------------------------------------------------------------ */

function star(c: CanvasRenderingContext2D, s: number) {
  const k = s * 0.22;
  c.beginPath();
  c.moveTo(0, -s);
  c.quadraticCurveTo(k, -k, s, 0);
  c.quadraticCurveTo(k, k, 0, s);
  c.quadraticCurveTo(-k, k, -s, 0);
  c.quadraticCurveTo(-k, -k, 0, -s);
  c.closePath();
}

function heart(c: CanvasRenderingContext2D, s: number) {
  c.beginPath();
  c.moveTo(0, s * 0.9);
  c.bezierCurveTo(-s * 1.4, -s * 0.1, -s * 0.7, -s * 1.2, 0, -s * 0.45);
  c.bezierCurveTo(s * 0.7, -s * 1.2, s * 1.4, -s * 0.1, 0, s * 0.9);
  c.closePath();
}

function draw(c: CanvasRenderingContext2D, p: Particle) {
  const a = Math.max(0, Math.min(1, p.life * 1.4));
  c.save();
  c.globalAlpha = a;
  c.translate(p.x, p.y);
  if (p.kind === 'ring') {
    const r = p.size * (1.15 - p.life);
    c.beginPath();
    c.arc(0, 0, r, 0, Math.PI * 2);
    c.lineWidth = 2.5 * p.life;
    c.strokeStyle = p.color;
    c.stroke();
  } else if (p.kind === 'coin') {
    // a gold coin flipping: squash its width with the spin
    const w = Math.max(0.12, Math.abs(Math.cos(p.rot)));
    c.scale(w, 1);
    c.beginPath();
    c.arc(0, 0, p.size, 0, Math.PI * 2);
    c.fillStyle = GOLD;
    c.fill();
    c.lineWidth = 1.4;
    c.strokeStyle = GOLD_DEEP;
    c.stroke();
    c.beginPath();
    c.arc(0, 0, p.size * 0.58, 0, Math.PI * 2);
    c.fillStyle = GOLD_LIGHT;
    c.fill();
  } else if (p.kind === 'heart') {
    c.rotate(p.rot);
    heart(c, p.size);
    c.fillStyle = p.color;
    c.fill();
    c.lineWidth = 1.2;
    c.strokeStyle = '#FFFFFF';
    c.stroke();
  } else {
    c.rotate(p.rot);
    star(c, p.size * (0.55 + 0.45 * p.life));
    c.fillStyle = p.color;
    c.fill();
    // a thin honey edge keeps pale sparkles visible on the pale themes
    c.lineWidth = 0.9;
    c.strokeStyle = 'rgba(201, 138, 27, 0.55)';
    c.stroke();
  }
  c.restore();
}

function frame(now: number) {
  if (!ctx) { raf = 0; return; }
  const dt = Math.min(2.2, (now - last) / 16.67);
  last = now;
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  const alive: Particle[] = [];
  for (const p of parts) {
    p.vy += p.g * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.rot += p.vr * dt;
    p.life -= p.decay * dt;
    if (p.life > 0) {
      draw(ctx, p);
      alive.push(p);
    }
  }
  parts = alive;
  // nothing left to draw: stop asking for frames until the next sparkle
  raf = parts.length ? requestAnimationFrame(frame) : 0;
}

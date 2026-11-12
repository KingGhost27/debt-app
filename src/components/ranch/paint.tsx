/**
 * Painters that merge many small shapes (flowers, leaves, sparkles, grass
 * tufts) into a handful of paths, so a meadow costs a few DOM nodes.
 */

import { circleD, pt, r1 } from './geometry';

/* ------------------------------------------------------------------ */
/* small painters that merge many shapes into a few paths             */
/* ------------------------------------------------------------------ */

export class Bloomer {
  fl1 = ''; fl2 = ''; fl3 = ''; flc = '';
  flower(x: number, y: number, r: number, k: number) {
    const cls = (['fl1', 'fl2', 'fl3'] as const)[k % 3];
    if (r < 2.2) { this[cls] += circleD(x, y, r); return; }
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      this[cls] += circleD(x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.5, r * 0.48);
    }
    this.flc += circleD(x, y, r * 0.3);
  }
  leaf(x: number, y: number, r: number, k: number, ang: number) {
    const cls = (['fl1', 'fl2', 'fl3'] as const)[k % 3];
    const c = Math.cos(ang), s = Math.sin(ang);
    const T = (dx: number, dy: number) => pt([x + dx * c - dy * s, y + dx * s + dy * c]);
    this[cls] += `M${T(0, -r)} Q${T(r * 0.75, -r * 0.15)} ${T(0, r)} Q${T(-r * 0.75, -r * 0.15)} ${T(0, -r)}Z`;
  }
  sparkle(x: number, y: number, r: number) {
    this.fl1 += `M${r1(x)},${r1(y - r)} Q${r1(x + r * 0.18)},${r1(y - r * 0.18)} ${r1(x + r)},${r1(y)} Q${r1(x + r * 0.18)},${r1(y + r * 0.18)} ${r1(x)},${r1(y + r)} Q${r1(x - r * 0.18)},${r1(y + r * 0.18)} ${r1(x - r)},${r1(y)} Q${r1(x - r * 0.18)},${r1(y - r * 0.18)} ${r1(x)},${r1(y - r)}Z`;
  }
  render(key: string) {
    return (
      <g key={key}>
        {this.fl1 && <path className="r-fl1" d={this.fl1} />}
        {this.fl2 && <path className="r-fl2" d={this.fl2} />}
        {this.fl3 && <path className="r-fl3" d={this.fl3} />}
        {this.flc && <path className="r-flc" d={this.flc} />}
      </g>
    );
  }
}

export class Tufts {
  private byW = new Map<string, string>();
  add(x: number, y: number, s: number) {
    const w = r1(Math.max(1, 1.6 * s)).toFixed(1);
    const d = `M${r1(x - 4 * s)},${r1(y)} q${r1(-1 * s)},${r1(-6 * s)} ${r1(-4 * s)},${r1(-9 * s)} M${r1(x)},${r1(y)} q0,${r1(-7 * s)} ${r1(1 * s)},${r1(-12 * s)} M${r1(x + 4 * s)},${r1(y)} q${r1(1 * s)},${r1(-6 * s)} ${r1(4 * s)},${r1(-8 * s)} `;
    this.byW.set(w, (this.byW.get(w) ?? '') + d);
  }
  render(key: string) {
    return <g key={key}>{[...this.byW].map(([w, d]) => <path key={w} className="r-tuft" strokeWidth={w} d={d} />)}</g>;
  }
}

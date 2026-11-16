/* Minimal pixel painter: draw into a palette buffer, auto-outline, export to canvas. */

export class Px {
  readonly w: number;
  readonly h: number;
  data: (string | null)[];

  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.data = new Array(w * h).fill(null);
  }

  set(x: number, y: number, c: string | null) {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.data[y * this.w + x] = c;
  }

  get(x: number, y: number): string | null {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return null;
    return this.data[y * this.w + x];
  }

  /** inclusive horizontal run */
  row(y: number, x0: number, x1: number, c: string) {
    for (let x = x0; x <= x1; x++) this.set(x, y, c);
  }

  col(x: number, y0: number, y1: number, c: string) {
    for (let y = y0; y <= y1; y++) this.set(x, y, c);
  }

  rect(x: number, y: number, w: number, h: number, c: string) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c);
  }

  /** draw a list of [y, x0, x1] runs */
  runs(list: [number, number, number][], c: string) {
    for (const [y, a, b] of list) this.row(y, a, b, c);
  }

  /** draw individual points */
  pts(list: [number, number][], c: string) {
    for (const [x, y] of list) this.set(x, y, c);
  }

  disc(cx: number, cy: number, r: number, c: string) {
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++)
      for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++)
        if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r + 0.3) this.set(x, y, c);
  }

  ring(cx: number, cy: number, r: number, c: string) {
    for (let y = Math.floor(cy - r - 1); y <= Math.ceil(cy + r + 1); y++)
      for (let x = Math.floor(cx - r - 1); x <= Math.ceil(cx + r + 1); x++) {
        const d = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
        if (Math.abs(d - r) < 0.6) this.set(x, y, c);
      }
  }

  /** recolor existing pixels of one color within a box */
  swap(from: string, to: string, x0 = 0, y0 = 0, x1 = this.w - 1, y1 = this.h - 1) {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (this.get(x, y) === from) this.set(x, y, to);
  }

  /** shade every pixel in a box that matches `only` (or any non-null) */
  tint(fn: (c: string) => string, x0: number, y0: number, x1: number, y1: number) {
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++) {
        const c = this.get(x, y);
        if (c) this.set(x, y, fn(c));
      }
  }

  /** paint an outline on empty pixels that touch filled ones */
  outline(c: string, diagonal = false) {
    const add: number[] = [];
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        if (this.get(x, y)) continue;
        const n =
          this.get(x - 1, y) || this.get(x + 1, y) || this.get(x, y - 1) || this.get(x, y + 1) ||
          (diagonal && (this.get(x - 1, y - 1) || this.get(x + 1, y - 1) || this.get(x - 1, y + 1) || this.get(x + 1, y + 1)));
        if (n) add.push(y * this.w + x);
      }
    for (const i of add) this.data[i] = c;
  }

  stamp(o: Px, ox = 0, oy = 0) {
    for (let y = 0; y < o.h; y++) for (let x = 0; x < o.w; x++) {
      const c = o.get(x, y);
      if (c) this.set(ox + x, oy + y, c);
    }
  }

  flipX(): Px {
    const p = new Px(this.w, this.h);
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) p.set(this.w - 1 - x, y, this.get(x, y));
    return p;
  }

  clone(): Px {
    const p = new Px(this.w, this.h);
    p.data = [...this.data];
    return p;
  }

  toCanvas(scale = 1): HTMLCanvasElement {
    const cv = document.createElement('canvas');
    cv.width = this.w * scale;
    cv.height = this.h * scale;
    const ctx = cv.getContext('2d')!;
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        const c = this.data[y * this.w + x];
        if (!c) continue;
        ctx.fillStyle = c;
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    return cv;
  }
}

/* ---------- color helpers ---------- */

function parse(hex: string): [number, number, number, number] {
  if (hex.startsWith('rgba')) {
    const m = hex.match(/[\d.]+/g)!.map(Number);
    return [m[0], m[1], m[2], m[3]];
  }
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), 1];
}

function hex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** amt < 0 darkens toward a cool shadow, amt > 0 lightens */
export function shade(color: string, amt: number): string {
  const [r, g, b] = parse(color);
  if (amt < 0) {
    const k = 1 + amt;
    return hex(r * k + 18 * -amt, g * k + 10 * -amt, b * k + 40 * -amt);
  }
  return hex(r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt);
}

export function mix(a: string, b: string, t: number): string {
  const [r1, g1, b1] = parse(a);
  const [r2, g2, b2] = parse(b);
  return hex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}

const urlCache = new Map<string, string>();
/** memoized data URL for a painter function */
export function dataUrl(key: string, paint: () => Px, scale = 1): string {
  const hit = urlCache.get(key);
  if (hit) return hit;
  const url = paint().toCanvas(scale).toDataURL();
  urlCache.set(key, url);
  return url;
}

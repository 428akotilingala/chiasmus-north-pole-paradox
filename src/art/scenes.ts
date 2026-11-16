/* Low-res painted backdrops (drawn straight to canvas, then scaled up with pixelated rendering). */

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function canvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  return { c, ctx };
}

function rect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, col: string) {
  ctx.fillStyle = col;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

/** vertical gradient with ordered-dither bands, for a pixel-art sky */
function ditherSky(ctx: CanvasRenderingContext2D, w: number, h: number, stops: string[]) {
  const band = h / (stops.length - 1);
  for (let y = 0; y < h; y++) {
    const i = Math.min(stops.length - 2, Math.floor(y / band));
    const t = (y - i * band) / band;
    for (let x = 0; x < w; x++) {
      const bayer = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]][y % 4][x % 4] / 16;
      ctx.fillStyle = t > bayer ? stops[i + 1] : stops[i];
      ctx.fillRect(x, y, 1, 1);
    }
  }
}

function stars(ctx: CanvasRenderingContext2D, w: number, h: number, n: number, seed: number) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const x = Math.floor(r() * w);
    const y = Math.floor(r() * h);
    rect(ctx, x, y, 1, 1, r() > 0.8 ? '#F7C65F' : r() > 0.5 ? '#c9d6ea' : '#6b7fa8');
  }
}

function aurora(ctx: CanvasRenderingContext2D, w: number, y0: number, seed: number) {
  const r = rng(seed);
  const cols = ['rgba(105,230,241,0.22)', 'rgba(20,125,100,0.28)', 'rgba(155,93,229,0.2)'];
  for (let band = 0; band < 3; band++) {
    const phase = r() * 6;
    for (let x = 0; x < w; x++) {
      const y = y0 + band * 7 + Math.sin(x / 38 + phase) * 9 + Math.sin(x / 13 + phase * 2) * 3;
      rect(ctx, x, y, 1, 10 + Math.sin(x / 20 + phase) * 4, cols[band]);
    }
  }
}

function pine(ctx: CanvasRenderingContext2D, x: number, base: number, size: number, col: string, snow: string) {
  for (let i = 0; i < size; i++) {
    const half = Math.floor((i * 0.55) % (size * 0.33) + i * 0.18);
    rect(ctx, x - half, base - size + i, half * 2 + 1, 1, col);
    if (i % 5 === 0) rect(ctx, x - half, base - size + i, half * 2 + 1, 1, snow);
  }
  rect(ctx, x - 1, base, 3, 3, '#2a1a14');
}

function house(ctx: CanvasRenderingContext2D, x: number, base: number, w: number, h: number, wall: string, r: () => number) {
  rect(ctx, x, base - h, w, h, wall);
  // roof with snow
  for (let i = 0; i < w / 2 + 3; i++) {
    rect(ctx, x - 3 + i, base - h - i * 0.7, w + 6 - i * 2, 1, '#e3ecf7');
  }
  rect(ctx, x - 3, base - h, w + 6, 2, '#F7FAFC');
  // windows
  for (let wx = x + 3; wx < x + w - 5; wx += 9) {
    const lit = r() > 0.2;
    rect(ctx, wx, base - h + 6, 5, 6, lit ? '#F7C65F' : '#22304d');
    if (lit) rect(ctx, wx + 1, base - h + 7, 2, 2, '#fff3c8');
  }
  rect(ctx, x + w / 2 - 2, base - 9, 5, 9, '#4a2e1e');
  // chimney
  rect(ctx, x + w - 8, base - h - w * 0.32, 4, 8, '#7a3a2a');
}

/** Title / intro: the North Pole village under the aurora. 400x225 */
export function paintVillage(): HTMLCanvasElement {
  const W = 400;
  const H = 225;
  const { c, ctx } = canvas(W, H);
  ditherSky(ctx, W, H, ['#070b14', '#101827', '#1b2a4a', '#2a3d66']);
  stars(ctx, W, 150, 140, 7);
  aurora(ctx, W, 30, 3);
  // moon
  ctx.fillStyle = '#F7FAFC';
  ctx.beginPath();
  ctx.arc(368, 52, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#101827';
  ctx.beginPath();
  ctx.arc(373, 48, 11, 0, Math.PI * 2);
  ctx.fill();
  // far mountains
  for (let x = 0; x < W; x++) {
    const y = 150 - Math.abs(Math.sin(x / 47)) * 30 - Math.abs(Math.sin(x / 19 + 1)) * 10;
    rect(ctx, x, y, 1, H - y, '#1c2a48');
    if (x % 2 === 0) rect(ctx, x, y, 1, 2, '#3a4f7a');
  }
  const r = rng(11);
  // mid trees
  for (let i = 0; i < 26; i++) pine(ctx, 8 + i * 16 + r() * 6, 178, 18 + r() * 12, '#0f2a2e', '#1f4a4c');
  // houses
  house(ctx, 30, 192, 46, 26, '#5a3a2a', r);
  house(ctx, 92, 196, 38, 22, '#3d5a7a', r);
  house(ctx, 270, 194, 44, 24, '#5d2a35', r);
  house(ctx, 332, 192, 50, 28, '#3a4a32', r);
  // snow ground
  for (let x = 0; x < W; x++) {
    const y = 192 + Math.sin(x / 23) * 3 + Math.sin(x / 7) * 1;
    rect(ctx, x, y, 1, H - y, '#dfe9f5');
    rect(ctx, x, y, 1, 1, '#F7FAFC');
  }
  for (let i = 0; i < 60; i++) rect(ctx, r() * W, 200 + r() * 25, 2, 1, '#c3d2e8');
  // front pines
  pine(ctx, 8, 214, 40, '#0b3d33', '#e3ecf7');
  pine(ctx, 392, 216, 46, '#0b3d33', '#e3ecf7');
  return c;
}

/** Santa's workshop interior for the investigation. 400x225 */
export function paintWorkshop(): HTMLCanvasElement {
  const W = 400;
  const H = 225;
  const { c, ctx } = canvas(W, H);
  const r = rng(5);
  // plank wall
  rect(ctx, 0, 0, W, 150, '#5a3524');
  for (let x = 0; x < W; x += 18) {
    rect(ctx, x, 0, 1, 150, '#3e2318');
    for (let y = 0; y < 150; y += 2) if (r() > 0.86) rect(ctx, x + 2 + r() * 14, y, 3, 1, '#6a4230');
  }
  rect(ctx, 0, 140, W, 10, '#3e2318');
  // window with snowy night
  rect(ctx, 30, 30, 84, 70, '#2a1a12');
  for (let y = 0; y < 62; y++) for (let x = 0; x < 76; x++) rect(ctx, 34 + x, 34 + y, 1, 1, y < 30 ? '#101827' : y < 50 ? '#16223a' : '#1d2d4d');
  for (let i = 0; i < 40; i++) rect(ctx, 34 + r() * 76, 34 + r() * 62, 1, 1, '#c9d6ea');
  rect(ctx, 34, 86, 76, 10, '#dfe9f5');
  rect(ctx, 70, 34, 4, 62, '#2a1a12');
  rect(ctx, 34, 62, 76, 3, '#2a1a12');
  rect(ctx, 26, 98, 92, 6, '#e3ecf7');
  // shelves with toys
  for (const sy of [52, 92]) {
    rect(ctx, 150, sy, 104, 5, '#3e2318');
    rect(ctx, 150, sy + 5, 104, 2, '#2a1a12');
  }
  const toyCols = ['#E63946', '#147D64', '#F7C65F', '#69E6F1', '#9B5DE5'];
  for (let i = 0; i < 7; i++) {
    const col = toyCols[i % 5];
    rect(ctx, 154 + i * 14, 40, 10, 12, col);
    rect(ctx, 158 + i * 14, 40, 2, 12, '#F7C65F');
    rect(ctx, 156 + i * 14 + (i % 2), 80 - (i % 3) * 3, 9, 12 + (i % 3) * 3, toyCols[(i + 2) % 5]);
  }
  // fireplace
  rect(ctx, 286, 66, 92, 84, '#7a3a2a');
  for (let y = 66; y < 150; y += 6) for (let x = 286 + ((y / 6) % 2) * 6; x < 378; x += 12) rect(ctx, x, y, 11, 5, '#8f4634');
  rect(ctx, 280, 60, 104, 8, '#3e2318');
  rect(ctx, 302, 92, 60, 58, '#160b0d');
  rect(ctx, 306, 140, 52, 10, '#2a1a12');
  // stockings on the mantel
  const stockCols = ['#E63946', '#147D64', '#F7C65F'];
  stockCols.forEach((col, i) => {
    rect(ctx, 296 + i * 30, 68, 8, 14, col);
    rect(ctx, 296 + i * 30, 68, 8, 3, '#F7FAFC');
    rect(ctx, 296 + i * 30 + 4, 78, 7, 5, col);
  });
  // floor
  for (let y = 150; y < H; y++) rect(ctx, 0, y, W, 1, y % 9 === 0 ? '#4a2c1e' : '#7a4a30');
  for (let i = 0; i < 40; i++) rect(ctx, r() * W, 152 + r() * 70, 12, 1, '#6a3e28');
  // rug
  ctx.fillStyle = '#a51f2e';
  ctx.beginPath();
  ctx.ellipse(200, 196, 150, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#F7C65F';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(200, 196, 140, 18, 0, 0, Math.PI * 2);
  ctx.stroke();
  // garland
  for (let x = 0; x < W; x++) {
    const y = 10 + Math.abs(Math.sin(x / 32)) * 10;
    rect(ctx, x, y, 1, 5, x % 3 ? '#147D64' : '#0b5544');
  }
  return c;
}

/** Top of the clock tower for the finale. 400x225 (clock hands are drawn separately so they can move). */
export function paintTower(): HTMLCanvasElement {
  const W = 400;
  const H = 225;
  const { c, ctx } = canvas(W, H);
  ditherSky(ctx, W, H, ['#05060d', '#101827', '#1d1640', '#2b1f4d']);
  stars(ctx, W, 160, 160, 21);
  aurora(ctx, W, 18, 9);
  // tower stone backdrop
  rect(ctx, 120, 18, 160, 180, '#2c3552');
  for (let y = 18; y < 198; y += 8) for (let x = 120 + ((y / 8) % 2) * 8; x < 280; x += 16) rect(ctx, x, y, 15, 7, '#353f60');
  // clock face
  ctx.fillStyle = '#e8dcc0';
  ctx.beginPath();
  ctx.arc(200, 88, 58, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#b98426';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(200, 88, 58, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const x = 200 + Math.sin(a) * 48;
    const y = 88 - Math.cos(a) * 48;
    rect(ctx, x - 2, y - 2, i % 3 === 0 ? 5 : 3, i % 3 === 0 ? 5 : 3, '#3a2a1a');
  }
  // balcony
  rect(ctx, 0, 182, W, 43, '#3a3456');
  for (let x = 0; x < W; x += 20) rect(ctx, x, 182, 19, 6, '#4a4470');
  for (let x = 6; x < W; x += 14) rect(ctx, x, 170, 5, 12, '#4a4470');
  rect(ctx, 0, 166, W, 5, '#5d5680');
  rect(ctx, 0, 164, W, 2, '#e3ecf7');
  return c;
}

const cache = new Map<string, string>();
export function sceneUrl(name: 'village' | 'workshop' | 'tower'): string {
  const hit = cache.get(name);
  if (hit) return hit;
  const cv = name === 'village' ? paintVillage() : name === 'workshop' ? paintWorkshop() : paintTower();
  const url = cv.toDataURL();
  cache.set(name, url);
  return url;
}

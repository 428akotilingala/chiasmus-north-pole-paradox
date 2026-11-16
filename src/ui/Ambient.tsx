import { useEffect, useRef } from 'react';

/** Chunky pixel snowfall on a 400x225 canvas (scaled 4x by CSS). Cheap enough for any Chromebook. */
export function Snow({ count = 90, reduced = false, tint = '#F7FAFC', className = '' }: { count?: number; reduced?: boolean; tint?: string; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d')!;
    const W = 400;
    const H = 225;
    const n = reduced ? Math.round(count / 3) : count;
    const flakes = Array.from({ length: n }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      s: Math.random() < 0.15 ? 2 : 1,
      v: 0.15 + Math.random() * 0.35,
      p: Math.random() * Math.PI * 2,
    }));
    let raf = 0;
    let last = performance.now();
    const draw = (now: number) => {
      const dt = Math.min(50, now - last) / 16.7;
      last = now;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = tint;
      for (const f of flakes) {
        if (!reduced) {
          f.y += f.v * dt;
          f.p += 0.02 * dt;
          f.x += Math.sin(f.p) * 0.15 * dt;
          if (f.y > H) {
            f.y = -2;
            f.x = Math.random() * W;
          }
        }
        ctx.globalAlpha = f.s === 2 ? 0.9 : 0.6;
        ctx.fillRect(Math.round(f.x), Math.round(f.y), f.s, f.s);
      }
      if (!reduced) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [count, reduced, tint]);
  return <canvas ref={ref} width={400} height={225} className={`pixelated pointer-events-none absolute inset-0 h-full w-full ${className}`} aria-hidden />;
}

const BULBS = ['#E63946', '#F7C65F', '#147D64', '#69E6F1', '#F7FAFC'];

/** A sagging string of Christmas lights across the top of the stage. Gentle twinkle, no flashing. */
export function Lights({ count = 26, y = 0 }: { count?: number; y?: number }) {
  const pts = Array.from({ length: count }, (_, i) => {
    const x = (i + 0.5) * (1600 / count);
    const sag = Math.sin(((i % 6) / 6) * Math.PI) * 26;
    return { x, y: y + 14 + sag, c: BULBS[i % BULBS.length], d: (i * 0.37) % 2.6 };
  });
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(0)},${(p.y - 8).toFixed(0)}`).join(' ');
  return (
    <svg className="pointer-events-none absolute left-0 top-0" width={1600} height={90} aria-hidden>
      <path d={path} stroke="#0b3d33" strokeWidth={4} fill="none" />
      {pts.map((p, i) => (
        <g key={i}>
          <rect x={p.x - 3} y={p.y - 10} width={6} height={5} fill="#2a2340" />
          <rect
            x={p.x - 6}
            y={p.y - 5}
            width={12}
            height={14}
            fill={p.c}
            className="anim-twinkle"
            style={{ animationDelay: `${p.d}s`, filter: `drop-shadow(0 0 6px ${p.c})` }}
          />
        </g>
      ))}
    </svg>
  );
}

/** Canvas confetti / fireworks for the victory. Static sparkles when reduced motion is on. */
export function Confetti({ reduced = false, burst = 0 }: { reduced?: boolean; burst?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d')!;
    const W = 400;
    const H = 225;
    const cols = ['#E63946', '#F7C65F', '#147D64', '#69E6F1', '#F7FAFC', '#9B5DE5'];
    type P = { x: number; y: number; vx: number; vy: number; c: string; life: number; s: number };
    const parts: P[] = [];
    const firework = (x: number, y: number) => {
      const c = cols[Math.floor(Math.random() * cols.length)];
      for (let i = 0; i < 46; i++) {
        const a = (i / 46) * Math.PI * 2;
        const sp = 0.8 + Math.random() * 1.6;
        parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, c, life: 70 + Math.random() * 30, s: 1 });
      }
    };
    const confetti = () => {
      for (let i = 0; i < 4; i++)
        parts.push({ x: Math.random() * W, y: -4, vx: (Math.random() - 0.5) * 0.6, vy: 0.6 + Math.random() * 0.8, c: cols[Math.floor(Math.random() * cols.length)], life: 400, s: 2 });
    };
    if (reduced) {
      for (let i = 0; i < 120; i++) {
        ctx.fillStyle = cols[i % cols.length];
        ctx.fillRect(Math.floor(Math.random() * W), Math.floor(Math.random() * H), 2, 2);
      }
      return;
    }
    let raf = 0;
    let t = 0;
    const loop = () => {
      t++;
      if (t % 50 === 1 && t < 900) firework(60 + Math.random() * 280, 30 + Math.random() * 80);
      if (t < 1200) confetti();
      ctx.clearRect(0, 0, W, H);
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.s === 1) {
          p.vy += 0.02;
          p.vx *= 0.985;
        } else p.vx += Math.sin((t + i) / 10) * 0.02;
        p.life--;
        if (p.life <= 0 || p.y > H + 4) {
          parts.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = p.s === 1 ? Math.min(1, p.life / 40) : 1;
        ctx.fillStyle = p.c;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reduced, burst]);
  return <canvas ref={ref} width={400} height={225} className="pixelated pointer-events-none absolute inset-0 h-full w-full" aria-hidden />;
}

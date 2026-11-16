import { useLayoutEffect, useRef, useState } from 'react';
import type { Lines } from '../content/types';

const ROLE_COLOR: Record<string, string> = { A: '#F7C65F', B: '#69E6F1', C: '#ff9aa2' };

/** A statement with optional role highlighting ("Detect reversal"). */
export function Quote({ lines, highlight = false, tags = false, className = '' }: { lines: Lines; highlight?: boolean; tags?: boolean; className?: string }) {
  return (
    <span className={className}>
      {lines.map((segs, li) => (
        <span key={li}>
          {li > 0 ? ' ' : ''}
          {segs.map((s, si) =>
            s.role && highlight ? (
              <span key={si} className={`mark-${s.role}`}>
                {s.t}
                {tags && <span className={`tag role-${s.role}`}>{s.role}</span>}
              </span>
            ) : (
              <span key={si}>{s.t}</span>
            ),
          )}
        </span>
      ))}
    </span>
  );
}

interface Link {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  role: string;
}

/**
 * The chi diagram. The full sentence sits on top; below it, the parallel parts
 * become chips in a two-column grid, one row per half. Matching parts (A with A,
 * B with B) are joined: a true chiasmus always draws an X (the Greek letter chi,
 * which gives the device its name), parallelism draws two straight lines that
 * never cross, and plain repetition draws a single vertical chain.
 */
export function ChiDiagram({
  lines,
  fontSize = 34,
  animate = true,
  gap = 1.6,
  sentence = true,
  className = '',
}: {
  lines: Lines;
  fontSize?: number;
  animate?: boolean;
  /** vertical gap between chip rows, in em */
  gap?: number;
  sentence?: boolean;
  className?: string;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const [links, setLinks] = useState<Link[]>([]);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const rows = lines.map((segs) => segs.filter((s) => s.role));
  const chipSize = Math.round(fontSize * 0.86);

  useLayoutEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const measure = () => {
      const chips = [...el.querySelectorAll<HTMLElement>('[data-chip]')];
      const at = (row: number, role: string) => chips.find((c) => c.dataset.row === String(row) && c.dataset.role === role);
      const out: Link[] = [];
      for (let i = 0; i < rows.length - 1; i++) {
        for (const role of ['A', 'B', 'C']) {
          const a = at(i, role);
          const b = at(i + 1, role);
          if (!a || !b) continue;
          out.push({
            role,
            x1: a.offsetLeft + a.offsetWidth / 2,
            y1: a.offsetTop + a.offsetHeight + 3,
            x2: b.offsetLeft + b.offsetWidth / 2,
            y2: b.offsetTop - 3,
          });
        }
      }
      setLinks(out);
      setBox({ w: el.offsetWidth, h: el.offsetHeight });
    };
    measure();
    void document.fonts?.ready.then(measure);
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
    // rows derive from lines
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines, fontSize, gap]);

  return (
    <div className={`flex flex-col items-center font-read ${className}`}>
      {sentence && (
        <p className="max-w-[24em] text-center" style={{ fontSize, lineHeight: 1.3 }}>
          <Quote lines={lines} highlight tags />
        </p>
      )}
      <div
        ref={wrap}
        className="relative grid items-center justify-items-center"
        style={{ gridTemplateColumns: 'auto auto', columnGap: chipSize * 3.2, rowGap: `${gap}em`, fontSize: chipSize, marginTop: sentence ? fontSize * 0.75 : 0 }}
        aria-hidden
      >
        {rows.flatMap((r, ri) => {
          const cells = r.slice(0, 2).map((s, ci) => (
            <span key={`${ri}-${ci}`} data-chip data-row={ri} data-role={s.role} className={`chip chip-${s.role}`}>
              {s.t}
            </span>
          ));
          if (cells.length === 1) cells.push(<span key={`${ri}-x`} />);
          return cells;
        })}
        <svg className="pointer-events-none absolute left-0 top-0 overflow-visible" width={box.w} height={box.h}>
          {links.map((l, i) => {
            const len = Math.hypot(l.x2 - l.x1, l.y2 - l.y1);
            return (
              <g key={i}>
                <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="#070b14" strokeWidth={11} strokeLinecap="square" />
                <line
                  x1={l.x1}
                  y1={l.y1}
                  x2={l.x2}
                  y2={l.y2}
                  stroke={ROLE_COLOR[l.role]}
                  strokeWidth={6}
                  strokeLinecap="square"
                  strokeDasharray={len}
                  style={animate ? ({ ['--len' as string]: len, animation: `draw-line 650ms ${i * 220 + 200}ms ease-out both` } as React.CSSProperties) : undefined}
                />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

/** "A-B / B-A" style label with colored letters. */
export function PatternLabel({ text, className = '' }: { text: string; className?: string }) {
  return (
    <span className={`font-pixel ${className}`}>
      {[...text].map((ch, i) => (
        <span key={i} className={ch === 'A' ? 'role-A' : ch === 'B' ? 'role-B' : ''}>
          {ch}
        </span>
      ))}
    </span>
  );
}

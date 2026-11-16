/* Custom 5x7 pixel logotype for the title, drawn as crisp SVG with a stepped 3D extrusion. */

const GLYPHS: Record<string, string[]> = {
  C: ['.####', '##...', '##...', '##...', '##...', '##...', '.####'],
  H: ['##.##', '##.##', '##.##', '#####', '##.##', '##.##', '##.##'],
  I: ['#####', '.###.', '.###.', '.###.', '.###.', '.###.', '#####'],
  A: ['.###.', '##.##', '##.##', '#####', '##.##', '##.##', '##.##'],
  S: ['.####', '##...', '##...', '.###.', '...##', '...##', '####.'],
  M: ['#...#', '##.##', '#####', '#.#.#', '#...#', '#...#', '#...#'],
  U: ['##.##', '##.##', '##.##', '##.##', '##.##', '##.##', '.###.'],
};

export function PixelWord({
  text,
  px = 22,
  face = '#F7C65F',
  light = '#ffe7a8',
  depth = ['#a51f2e'],
  className = '',
  style,
}: {
  text: string;
  px?: number;
  face?: string;
  light?: string;
  depth?: string[];
  className?: string;
  style?: React.CSSProperties;
}) {
  const letters = [...text];
  const gap = 1;
  const cols = letters.length * 5 + (letters.length - 1) * gap;
  const ext = depth.length;
  const w = cols * px;
  const h = (7 + ext * 0.4) * px;
  const cells: { x: number; y: number }[] = [];
  letters.forEach((ch, li) => {
    const g = GLYPHS[ch] ?? GLYPHS.I;
    g.forEach((row, y) =>
      [...row].forEach((v, x) => {
        if (v === '#') cells.push({ x: li * (5 + gap) + x, y });
      }),
    );
  });
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} shapeRendering="crispEdges" className={className} style={style} aria-hidden>
      {depth
        .map((c, i) => ({ c, dy: (ext - i) * px * 0.4 }))
        .map(({ c, dy }) => (
          <g key={c} fill={c}>
            {cells.map((p, i) => (
              <rect key={i} x={p.x * px} y={p.y * px + dy} width={px} height={px} />
            ))}
          </g>
        ))}
      <g fill={face}>
        {cells.map((p, i) => (
          <rect key={i} x={p.x * px} y={p.y * px} width={px} height={px} />
        ))}
      </g>
      <g fill={light}>
        {cells
          .filter((p) => !cells.some((q) => q.x === p.x && q.y === p.y - 1))
          .map((p, i) => (
            <rect key={i} x={p.x * px} y={p.y * px} width={px} height={px * 0.28} />
          ))}
      </g>
    </svg>
  );
}

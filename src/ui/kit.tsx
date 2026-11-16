import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { audio } from '../audio/audio';

/** Pixel button that plays hover/select sounds. */
export function Btn({
  variant = 'gold',
  size = 'md',
  className = '',
  sound = 'select',
  onClick,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'gold' | 'red' | 'pine' | 'ice' | 'hex' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  sound?: 'select' | 'back' | 'none';
}) {
  const v = variant === 'gold' ? '' : `btn-${variant}`;
  const s = size === 'md' ? '' : `btn-${size}`;
  return (
    <button
      type="button"
      className={`btn ${v} ${s} ${className}`}
      onMouseEnter={() => audio.sfx('hover')}
      onClick={(e) => {
        audio.unlock();
        if (sound !== 'none') audio.sfx(sound);
        onClick?.(e);
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return <span className="kbd">{children}</span>;
}

/** Typewriter text. Click / Enter completes it; `onDone` fires once fully shown. */
export function Typewriter({
  text,
  speed = 28,
  instant = false,
  onDone,
  className = '',
}: {
  text: string;
  speed?: number;
  instant?: boolean;
  onDone?: () => void;
  className?: string;
}) {
  const [n, setN] = useState(instant ? text.length : 0);
  const done = n >= text.length;
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    setN(instant ? text.length : 0);
  }, [text, instant]);

  useEffect(() => {
    if (done) {
      doneRef.current?.();
      return;
    }
    const id = window.setTimeout(() => {
      setN((v) => Math.min(text.length, v + 1));
      if (text[n] && text[n] !== ' ') audio.sfx('type');
    }, text[n - 1] && '.!?'.includes(text[n - 1]) ? speed * 6 : speed);
    return () => clearTimeout(id);
  }, [n, done, text, speed]);

  return (
    <span className={`${className} ${done ? '' : 'caret'}`} onClick={() => setN(text.length)} aria-label={text}>
      <span aria-hidden>{text.slice(0, n)}</span>
      <span aria-hidden className="opacity-0">
        {text.slice(n)}
      </span>
    </span>
  );
}

/** Countdown ring. Ticks every second; calls onDone at zero. */
export function Countdown({
  seconds,
  running,
  onDone,
  size = 150,
}: {
  seconds: number;
  running: boolean;
  onDone?: () => void;
  size?: number;
}) {
  const [left, setLeft] = useState(seconds);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  useEffect(() => setLeft(seconds), [seconds]);
  useEffect(() => {
    if (!running || left <= 0) return;
    const id = window.setTimeout(() => {
      const nl = left - 1;
      setLeft(nl);
      if (nl === 0) {
        audio.sfx('timeup');
        doneRef.current?.();
      } else audio.sfx(nl % 2 ? 'tick' : 'tock');
    }, 1000);
    return () => clearTimeout(id);
  }, [left, running]);
  const r = size / 2 - 12;
  const c = 2 * Math.PI * r;
  const frac = left / seconds;
  const urgent = left <= 3 && left > 0;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }} role="timer" aria-label={`${left} seconds left`}>
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#223052" strokeWidth={14} fill="#101827" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={urgent ? '#E63946' : '#F7C65F'}
          strokeWidth={14}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - frac)}
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
      </svg>
      <span className={`relative font-pixel font-bold ${urgent ? 'text-berry-light' : 'text-snow'}`} style={{ fontSize: size * 0.42 }}>
        {left}
      </span>
    </div>
  );
}

/** The "Naughty or Grammatically Nice" meter. */
export function NiceMeter({ value, compact = false }: { value: number; compact?: boolean }) {
  const w = compact ? 260 : 380;
  return (
    <div className="flex items-center gap-3" aria-label={`Naughty or Grammatically Nice meter: ${value} out of 100`}>
      <span className="font-pixel text-berry-light" style={{ fontSize: compact ? 20 : 24 }}>
        Naughty
      </span>
      <div className="relative h-7" style={{ width: w, background: '#070b14', boxShadow: '0 0 0 3px #070b14, inset 0 0 0 3px #33467a' }}>
        <div
          className="absolute left-[3px] top-[3px] bottom-[3px]"
          style={{
            width: `calc(${value}% - 6px)`,
            background: 'repeating-linear-gradient(-45deg, #E63946 0 10px, #F7FAFC 10px 20px)',
            transition: 'width 600ms steps(12)',
          }}
        />
        <div className="absolute top-[-6px] bottom-[-6px] w-[4px] bg-gold" style={{ left: `calc(${value}% - 2px)`, transition: 'left 600ms steps(12)' }} />
      </div>
      <span className="font-pixel text-pine" style={{ fontSize: compact ? 20 : 24, color: '#4fd1a5' }}>
        Grammatically nice
      </span>
    </div>
  );
}

/** +/- hand-count tally for presenters. */
export function Tally({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        className="kbd cursor-pointer"
        style={{ fontSize: 26, padding: '6px 14px' }}
        aria-label="Remove a vote"
        onClick={() => onChange(Math.max(0, value - 1))}
      >
        −
      </button>
      <span className="font-pixel min-w-[2.2ch] text-center" style={{ fontSize: 34 }}>
        {value}
      </span>
      <button
        type="button"
        className="kbd cursor-pointer"
        style={{ fontSize: 26, padding: '6px 14px' }}
        aria-label="Add a vote"
        onClick={() => {
          audio.sfx('place');
          onChange(value + 1);
        }}
      >
        +
      </button>
    </div>
  );
}

/** Small icon set drawn as pixel SVG paths. */
export function Icon({ name, size = 28 }: { name: 'notes' | 'pause' | 'sound' | 'mute' | 'full' | 'skip' | 'back' | 'eye'; size?: number }) {
  const paths: Record<string, string> = {
    notes: 'M3 2h10v12H3zM5 4v1h6V4zm0 3v1h6V7zm0 3v1h4v-1z',
    pause: 'M3 2h4v12H3zm6 0h4v12H9z',
    sound: 'M2 6h3l4-4v12l-4-4H2zm9-1h1v1h1v4h-1v1h-1zm2-2h1v1h1v8h-1v1h-1v-1h1V4h-1z',
    mute: 'M2 6h3l4-4v12l-4-4H2zm9 0h1v1h1V6h1v1h-1v1h1v1h1v1h-1V9h-1v1h-1V9h1V8h-1z',
    full: 'M1 1h5v2H3v3H1zm9 0h5v5h-2V3h-3zM1 10h2v3h3v2H1zm12 0h2v5h-5v-2h3z',
    skip: 'M2 3h2v1h1v1h1v1h1v1h1v2H7v1H6v1H5v1H4v1H2zm7 0h2v1h1v1h1v1h1v1h1v2h-1v1h-1v1h-1v1h-1v1H9z',
    back: 'M9 2h2v2H9v1H8v1H7v1H6v2h1v1h1v1h1v1h2v2H9v-1H8v-1H7v-1H6v-1H5V9H4V7h1V6h1V5h1V4h1V3h1z',
    eye: 'M5 4h6v1h2v1h1v1h1v2h-1v1h-1v1h-2v1H5v-1H3v-1H2V9H1V7h1V6h1V5h2zm2 2v4h2V6z',
  };
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden>
      <path d={paths[name]} fill="currentColor" fillRule="evenodd" />
    </svg>
  );
}

/** True when a key event is aimed at a focused control that will handle Enter/Space itself. */
export function fromControl(e: KeyboardEvent): boolean {
  const t = e.target as HTMLElement | null;
  return !!t?.closest?.('button, a, input, textarea, select, [role="radio"]');
}

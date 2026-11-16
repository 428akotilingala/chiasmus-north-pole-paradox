import { useEffect, useState } from 'react';
import { audio } from '../audio/audio';
import { lines } from '../content/markup';
import { useStore } from '../state/store';
import { ChiDiagram } from '../ui/Chi';
import { Btn } from '../ui/kit';
import { Portrait } from '../ui/Portrait';

const EXAMPLE = lines('Great [A:teams] build great [B:players],', 'and great [B:players] build great [A:teams].');

/** Mini diagram: X for chiasmus, parallel bars for the impostor patterns. */
function MiniDiagram({ kind }: { kind: 'cross' | 'parallel' | 'repeat' }) {
  const A = '#F7C65F';
  const B = '#69E6F1';
  return (
    <svg width={112} height={68} viewBox="0 0 150 90" aria-hidden className="shrink-0">
      {kind === 'repeat' ? (
        <>
          {[20, 75, 130].map((x) => (
            <g key={x}>
              <rect x={x - 14} y={34} width={28} height={22} fill={A} />
              <text x={x} y={51} textAnchor="middle" fontFamily="Jersey 15 Game" fontSize={18} fill="#101827" fontWeight={700}>A</text>
            </g>
          ))}
        </>
      ) : (
        <>
          <rect x={6} y={4} width={28} height={22} fill={A} />
          <rect x={116} y={4} width={28} height={22} fill={B} />
          <rect x={6} y={64} width={28} height={22} fill={kind === 'cross' ? B : A} />
          <rect x={116} y={64} width={28} height={22} fill={kind === 'cross' ? A : B} />
          {kind === 'cross' ? (
            <>
              <line x1={20} y1={26} x2={130} y2={64} stroke={A} strokeWidth={5} />
              <line x1={130} y1={26} x2={20} y2={64} stroke={B} strokeWidth={5} />
            </>
          ) : (
            <>
              <line x1={20} y1={26} x2={20} y2={64} stroke={A} strokeWidth={5} />
              <line x1={130} y1={26} x2={130} y2={64} stroke={B} strokeWidth={5} />
            </>
          )}
          {['A', kind === 'cross' ? 'B' : 'B', kind === 'cross' ? 'B' : 'A', kind === 'cross' ? 'A' : 'B'].map((l, i) => (
            <text key={i} x={[20, 130, 20, 130][i]} y={[21, 21, 81, 81][i]} textAnchor="middle" fontFamily="Jersey 15 Game" fontSize={18} fill="#101827" fontWeight={700}>
              {l}
            </text>
          ))}
        </>
      )}
    </svg>
  );
}

export function Briefing() {
  const { next } = useStore();
  const [shown, setShown] = useState(false);
  useEffect(() => {
    audio.play('menu');
    const id = window.setTimeout(() => setShown(true), 400);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden bg-night px-16 pt-10" data-testid="briefing">
      <div className="flex items-start gap-8">
        <div>
          <p className="font-pixel text-[26px] text-berry-light">N.R.I.D. training, 30 seconds</p>
          <h1 className="font-pixel text-[72px] font-bold leading-none text-gold">What is chiasmus?</h1>
          <p className="mt-4 max-w-[1440px] text-[34px] leading-snug">
            <b>Chiasmus</b> (ky-AZ-mus) reverses parallel parts of a sentence: <span className="role-A font-bold">A</span>-
            <span className="role-B font-bold">B</span>, then <span className="role-B font-bold">B</span>-<span className="role-A font-bold">A</span>. Draw lines between the
            matching parts and they cross, like the Greek letter <span className="font-pixel text-ice">χ</span> (chi) that gives it its name.
          </p>
        </div>
      </div>

      <div className="absolute left-16 right-16 top-[262px] flex items-center justify-between gap-10">
        <div className="frame frame-gold px-12 py-6">{shown && <ChiDiagram lines={EXAMPLE} fontSize={40} gap={1.8} />}</div>
        <div className="flex w-[400px] flex-col items-center gap-3 text-center">
          <Portrait who={{ kind: 'reindeer' }} size={150} />
          <p className="text-[25px] leading-snug text-frost">The swap says each one builds the other. Teamwork and talent become a loop.</p>
          <Btn size="lg" variant="red" onClick={next} autoFocus className="mt-2">
            Start the investigation
          </Btn>
        </div>
      </div>

      <div className="absolute bottom-9 left-16 right-16 grid grid-cols-3 gap-7">
        <div className="frame frame-ice flex items-center gap-5 px-5 py-4">
          <MiniDiagram kind="cross" />
          <p className="text-[23px] leading-snug">
            <span className="font-pixel text-[28px] text-ice">Antimetabole</span>
            <br />
            Chiasmus that repeats the exact same words in reverse, like the example above.
          </p>
        </div>
        <div className="frame frame-hex flex items-center gap-5 px-5 py-4">
          <MiniDiagram kind="cross" />
          <p className="text-[23px] leading-snug">
            <span className="font-pixel text-[28px]" style={{ color: '#c8a2ff' }}>
              Also chiasmus
            </span>
            <br />
            Grammar or ideas reversed with new words: “By day we work; we rest by night.”
          </p>
        </div>
        <div className="frame frame-berry flex items-center gap-5 px-5 py-4">
          <MiniDiagram kind="parallel" />
          <p className="text-[23px] leading-snug">
            <span className="font-pixel text-[28px] text-berry-light">Not chiasmus</span>
            <br />
            Same order twice (A-B, A-B) or plain repetition (A, A, A). Nothing crosses.
          </p>
        </div>
      </div>
    </div>
  );
}

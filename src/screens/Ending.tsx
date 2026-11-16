import { useEffect, useState } from 'react';
import { audio } from '../audio/audio';
import { sceneUrl } from '../art/scenes';
import { lines } from '../content/markup';
import { CLOSING_LINE, WHY_POINTS } from '../content/script';
import { ACHIEVEMENTS, useStore } from '../state/store';
import { Confetti, Lights, Snow } from '../ui/Ambient';
import { ChiDiagram } from '../ui/Chi';
import { Btn, NiceMeter } from '../ui/kit';
import { Portrait } from '../ui/Portrait';

const CLOSING = lines('We made [A:a game] about [B:chiasmus],', 'and [B:chiasmus] made [A:the game].');

function rating(n: number) {
  if (n >= 80) return 'Grammatically Nice. Santa is weeping with pride.';
  if (n >= 50) return 'Nice-ish. Santa is cautiously optimistic.';
  return 'Naughty, but improving, which is very Christmas.';
}

/** Point icons: each point gets a symbol, not a number (the points aren't a sequence). */
function PointIcon({ i }: { i: number }) {
  const common = { width: 64, height: 64, viewBox: '0 0 16 16', shapeRendering: 'crispEdges' as const, 'aria-hidden': true };
  if (i === 0)
    return (
      <svg {...common}>
        <path d="M2 2h3v2h1v2h1v1h2V6h1V4h1V2h3v2h-1v2h-1v2h-1v1h1v2h1v2h1v1h-3v-1h-1v-2h-1V9H7v1H6v2H5v1H2v-1h1v-2h1V8h1V7h1V6H5V4H4V3H2z" fill="#F7C65F" />
      </svg>
    );
  if (i === 1)
    return (
      <svg {...common}>
        <rect x="3" y="1" width="10" height="14" fill="#b98426" />
        <rect x="4" y="2" width="8" height="12" fill="#69E6F1" />
        <path d="M5 4h2v1H6v1H5zm4 5h2v2h-1v-1H9z" fill="#F7FAFC" />
      </svg>
    );
  if (i === 2)
    return (
      <svg {...common}>
        <rect x="2" y="2" width="8" height="8" fill="#69E6F1" />
        <rect x="3" y="3" width="6" height="6" fill="#101827" />
        <rect x="9" y="9" width="2" height="2" fill="#b98426" />
        <rect x="11" y="11" width="3" height="3" fill="#b98426" />
      </svg>
    );
  return (
    <svg {...common}>
      <path d="M11 1h2v1h1v2h-1v1h-1V4h-1V3h-1V2h1zM9 3h1v1h1v1h1v1h-1v1h-1v1H9v1H8v1H7v1H6v1H5v1H4v1H2v-2h1v-1h1v-1h1V9h1V8h1V7h1V6h1V5h1z" fill="#E63946" />
    </svg>
  );
}

export function Ending() {
  const { state, dispatch } = useStore();
  const reduced = state.settings.reducedMotion;
  const p = state.progress;
  const [phase, setPhase] = useState<'celebrate' | 'why'>('celebrate');

  useEffect(() => {
    audio.play('victory');
    audio.sfx('victory');
  }, []);

  useEffect(() => {
    if (p && p.nice >= 80) dispatch({ type: 'achieve', id: 'nice' });
  }, [p, dispatch]);

  if (phase === 'celebrate') {
    const mins = p ? Math.max(1, Math.round((Date.now() - p.startedAt) / 60000)) : 0;
    return (
      <div className="absolute inset-0 overflow-hidden" data-testid="ending-celebrate">
        <img src={sceneUrl('village')} alt="" className="pixelated absolute inset-0 h-full w-full" draggable={false} />
        <Snow reduced={reduced} count={140} />
        <Confetti reduced={reduced} />
        <Lights />
        <div className="absolute inset-x-0 top-[90px] text-center">
          <p className="font-pixel text-[36px] text-ice" style={{ textShadow: '3px 3px 0 #070b14' }}>
            12:00 AM, December 25
          </p>
          <h1 className="font-pixel text-[120px] font-bold leading-none text-gold anim-pop" style={{ textShadow: '0 6px 0 #a51f2e, 0 12px 0 #5d1520' }}>
            Christmas is saved!
          </h1>
          <p className="mx-auto mt-6 max-w-[1100px] text-[32px] leading-snug" style={{ textShadow: '2px 2px 0 #070b14' }}>
            Presents wrap themselves again, the reindeer are back in front of the sleigh, and the cookies have agreed to be eaten.
          </p>
        </div>
        <div className="absolute inset-x-0 bottom-[60px] flex items-end justify-center gap-10">
          <Portrait who={{ kind: 'santa', expr: 'happy' }} size={200} />
          <div className="frame frame-gold w-[820px] px-8 py-6" style={{ ['--panel' as string]: 'rgba(16,24,39,0.94)' }}>
            {p && (
              <>
                <NiceMeter value={p.nice} />
                <p className="mt-3 text-[28px]">{rating(p.nice)}</p>
                <p className="mt-2 text-[22px] text-frost">
                  Cases solved by the class: {Object.values(p.results).filter(Boolean).length} of {Object.keys(p.results).length}. Reality flips: {p.flips}. Time: about {mins} min.
                </p>
                {p.achievements.length > 0 && (
                  <p className="mt-2 text-[22px] text-gold">★ {p.achievements.map((a) => ACHIEVEMENTS[a]?.name).join(', ')}</p>
                )}
              </>
            )}
            <Btn size="lg" className="mt-5" onClick={() => setPhase('why')} autoFocus>
              Why this game is chiasmus
            </Btn>
          </div>
          <Portrait who={{ kind: 'grinch', mood: 'reformed' }} size={200} flip />
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden bg-night px-14 pt-7" data-testid="ending-why">
      <h1 className="font-pixel text-[74px] font-bold leading-none text-gold">WHY THIS GAME IS CHIASMUS</h1>
      <p className="mt-2 max-w-[1200px] pr-[200px] text-[26px] leading-snug text-frost">
        Chiasmus reverses parallel parts, A-B then B-A, and the crossing changes the meaning. This whole game is built the same way.
      </p>
      <div className="mt-6 grid grid-cols-2 gap-5">
        {WHY_POINTS.map((w, i) => (
          <div key={w.title} className="frame flex gap-5 px-5 py-4 anim-rise" style={{ animationDelay: `${i * 120}ms` }}>
            <PointIcon i={i} />
            <div>
              <h2 className="font-pixel text-[32px] leading-tight text-ice">{w.title}</h2>
              <p className="mt-1 text-[23px] leading-snug">{w.body}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex items-start gap-10">
        <div className="frame frame-gold px-8 py-4">
          <ChiDiagram lines={CLOSING} fontSize={27} gap={1.1} />
        </div>
        <div className="flex-1 pt-3">
          <p className="font-pixel text-[26px] text-gold">Take this into your notes</p>
          <p className="text-[27px] leading-snug">
            Chiasmus: A-B, then B-A. The crossing makes relationships run both ways, makes contrasts sharper, and makes ideas easy to remember.
          </p>
          <p className="mt-2 sr-only">{CLOSING_LINE.lines.join(' ')}</p>
        </div>
      </div>
      <div className="absolute bottom-8 right-14 flex gap-5">
        <Btn variant="ice" onClick={() => dispatch({ type: 'overlay', overlay: 'archive' })}>
          Kennedy examples
        </Btn>
        <Btn variant="ghost" onClick={() => dispatch({ type: 'quit' })}>
          Back to title
        </Btn>
        <Btn variant="red" onClick={() => dispatch({ type: 'start', mode: p?.mode ?? 'quick' })}>
          Play again
        </Btn>
      </div>
    </div>
  );
}

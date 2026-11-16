import { useEffect, useState } from 'react';
import { audio } from '../audio/audio';
import { sceneUrl } from '../art/scenes';
import { STEP_LABEL, SEQUENCES, useStore } from '../state/store';
import { Lights, Snow } from '../ui/Ambient';
import { Btn } from '../ui/kit';
import { Portrait } from '../ui/Portrait';
import { PixelWord } from '../ui/PixelWord';

/**
 * The title's one big moment: CHIASMUS and its reflection in the ice.
 * On load the two halves of the word cross over each other (CHIA SMUS → SMUS CHIA → back),
 * a literal A-B / B-A, then settle above their mirror image.
 */
export function Title() {
  const { state, dispatch } = useStore();
  const reduced = state.settings.reducedMotion;
  const [phase, setPhase] = useState(reduced ? 3 : 0);
  const p = state.progress;
  const canContinue = !!p && p.step > 0;

  useEffect(() => {
    audio.play('menu');
  }, []);

  useEffect(() => {
    if (reduced) return;
    const t = [window.setTimeout(() => setPhase(1), 500), window.setTimeout(() => setPhase(2), 1500), window.setTimeout(() => setPhase(3), 2300)];
    return () => t.forEach(clearTimeout);
  }, [reduced]);

  const swapped = phase === 1;
  const PX = 22;
  const HALF = (4 * 5 + 3) * PX + PX; // width of "CHIA" plus the gap
  const halfStyle = (side: 'L' | 'R'): React.CSSProperties => ({
    display: 'inline-block',
    transition: reduced ? 'none' : 'transform 700ms cubic-bezier(.6,-0.3,.4,1.3)',
    transform: swapped ? (side === 'L' ? `translate(${HALF}px, 26px)` : `translate(-${HALF}px, -26px)`) : 'none',
  });

  return (
    <div className="absolute inset-0 overflow-hidden" data-testid="title">
      <img src={sceneUrl('village')} alt="" className="pixelated absolute inset-0 h-full w-full" draggable={false} />
      <Snow reduced={reduced} count={110} />
      <Lights />

      <div className="absolute inset-x-0 top-[78px] flex flex-col items-center">
        <h1 className="relative flex select-none gap-[22px]" aria-label="Chiasmus" style={{ filter: 'drop-shadow(0 14px 18px rgba(0,0,0,0.55))' }}>
          <span style={halfStyle('L')}>
            <PixelWord text="CHIA" px={PX} />
          </span>
          <span style={halfStyle('R')}>
            <PixelWord text="SMUS" px={PX} />
          </span>
        </h1>
        <div className="mt-3 h-[6px] w-[1100px]" style={{ background: 'linear-gradient(90deg, transparent, #69E6F1, #F7FAFC, #69E6F1, transparent)', opacity: phase >= 2 ? 1 : 0, transition: 'opacity 600ms' }} />
        {/* the reflection in the ice: flipped below the mirror line, fading with distance */}
        <div
          aria-hidden
          style={{
            height: 154,
            marginBottom: -77,
            transform: 'translateY(77px) scaleY(-0.5)',
            transformOrigin: 'top center',
            opacity: phase >= 2 ? 0.45 : 0,
            transition: 'opacity 900ms ease',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 10%, rgba(0,0,0,0.95) 100%)',
            maskImage: 'linear-gradient(to bottom, transparent 10%, rgba(0,0,0,0.95) 100%)',
          }}
        >
          <PixelWord text="CHIASMUS" px={PX} face="#69E6F1" light="#d6fbff" depth={[]} />
        </div>
        <p
          className="mt-7 font-pixel text-[52px] font-semibold tracking-wide text-snow"
          style={{ textShadow: '4px 4px 0 #070b14', opacity: phase >= 3 ? 1 : 0, transform: phase >= 3 ? 'none' : 'translateY(16px)', transition: 'all 500ms ease-out' }}
        >
          THE NORTH POLE PARADOX
        </p>
        <p className="mt-2 text-[28px] text-frost" style={{ textShadow: '2px 2px 0 #070b14', opacity: phase >= 3 ? 1 : 0, transition: 'opacity 600ms 200ms' }}>
          Christmas is backwards. Someone is sus. Save the North Pole.
        </p>
      </div>

      <div className="absolute inset-x-0 top-[520px] flex flex-col items-center gap-7" style={{ opacity: phase >= 3 ? 1 : 0, transition: 'opacity 500ms 300ms' }}>
        <div className="grid grid-cols-2 gap-x-10 gap-y-7">
          <div className="flex flex-col items-center gap-2">
            <Btn size="lg" variant="red" className="w-[560px]" onClick={() => dispatch({ type: 'start', mode: 'quick' })} data-testid="quick-play">
              CLASSROOM QUICK PLAY
            </Btn>
            <span className="text-[21px] text-snow" style={{ textShadow: '2px 2px 0 #070b14' }}>
              About 7 minutes, built for the projector
            </span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Btn size="lg" className="w-[560px]" onClick={() => dispatch({ type: 'start', mode: 'adventure' })} data-testid="adventure">
              START ADVENTURE
            </Btn>
            <span className="text-[21px] text-snow" style={{ textShadow: '2px 2px 0 #070b14' }}>
              Three cases and three mazes, about 25 minutes
            </span>
          </div>
          <Btn variant="ghost" className="w-[560px]" onClick={() => dispatch({ type: 'view', view: 'howto' })}>
            HOW TO PLAY
          </Btn>
          <Btn variant="ghost" className="w-[560px]" onClick={() => dispatch({ type: 'view', view: 'settings' })}>
            SETTINGS
          </Btn>
        </div>
        <div className="flex items-center gap-6">
          {canContinue && p && (
            <Btn size="sm" variant="pine" onClick={() => dispatch({ type: 'continue' })}>
              Continue: {STEP_LABEL[SEQUENCES[p.mode][p.step]]}
            </Btn>
          )}
          <Btn size="sm" variant="ice" onClick={() => dispatch({ type: 'view', view: 'archive' })}>
            Kennedy examples for your notes
          </Btn>
        </div>
      </div>

      <div className="absolute bottom-0 left-10 flex items-end gap-2" aria-hidden>
        <Portrait who={{ kind: 'reindeer' }} size={150} />
      </div>
      <div className="absolute bottom-0 right-10" aria-hidden>
        <Portrait who={{ kind: 'grinch', mood: 'grin' }} size={150} flip />
      </div>
      {!audio.ready && (
        <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[20px] text-frost" style={{ textShadow: '2px 2px 0 #070b14' }}>
          Sound starts after your first click. Press M any time to mute.
        </p>
      )}
    </div>
  );
}

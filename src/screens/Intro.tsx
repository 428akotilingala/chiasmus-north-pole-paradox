import { useCallback, useEffect, useState } from 'react';
import { audio } from '../audio/audio';
import { sceneUrl } from '../art/scenes';
import { INTRO } from '../content/script';
import { useStore } from '../state/store';
import { Lights, Snow } from '../ui/Ambient';
import { Btn, Icon, Typewriter, fromControl } from '../ui/kit';
import { Portrait } from '../ui/Portrait';

/** The Christmas emergency: five short story panels. Advances only when the presenter clicks. */
export function Intro() {
  const { state, next } = useStore();
  const reduced = state.settings.reducedMotion;
  const [i, setI] = useState(0);
  const [typed, setTyped] = useState(false);
  const panel = INTRO[i];
  const last = i === INTRO.length - 1;

  useEffect(() => {
    audio.play(panel.who === 'grinch' ? 'boss' : 'menu');
    if (panel.who === 'grinch') audio.sfx('shout');
  }, [panel.who]);

  const advance = useCallback(() => {
    if (!typed) {
      setTyped(true);
      return;
    }
    if (last) next();
    else {
      setI((v) => v + 1);
      setTyped(false);
    }
  }, [typed, last, next]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (state.overlay) return;
      if ((e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') && !fromControl(e)) {
        e.preventDefault();
        advance();
      }
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [advance, state.overlay]);

  return (
    <div className="absolute inset-0 overflow-hidden" data-testid="intro" onClick={advance}>
      <img src={sceneUrl('village')} alt="" className="pixelated absolute inset-0 h-full w-full" draggable={false} />
      <div className={`absolute inset-0 transition-colors duration-700 ${panel.who === 'grinch' ? 'bg-hex-dark/60' : 'bg-ink/30'}`} />
      <Snow reduced={reduced} />
      <Lights />

      {panel.heading && (
        <div className="absolute inset-x-0 top-[200px] text-center anim-pop" key={`h${i}`}>
          <p className="font-pixel text-[96px] font-bold text-gold" style={{ textShadow: '6px 6px 0 #070b14' }}>
            {panel.heading}
          </p>
        </div>
      )}

      {panel.who !== 'none' && (
        <div key={`p${i}`} className={`absolute bottom-[300px] left-[120px] ${panel.who === 'grinch' && !reduced ? 'anim-shake' : 'anim-rise'}`}>
          <Portrait
            who={panel.who === 'grinch' ? { kind: 'grinch', mood: 'shout' } : { kind: 'santa', expr: panel.who === 'santa-happy' ? 'happy' : 'alarm' }}
            size={340}
            talking={!typed}
          />
        </div>
      )}

      {panel.list && (
        <ul className="absolute right-[90px] top-[130px] w-[760px] space-y-4">
          {panel.list.map((l, j) => (
            <li
              key={l}
              className="frame frame-hex px-6 py-3 text-[32px] anim-rise"
              style={{ animationDelay: `${300 + j * 450}ms`, ['--panel' as string]: 'rgba(16,24,39,0.92)' }}
            >
              {l}
            </li>
          ))}
        </ul>
      )}

      <div className="absolute bottom-10 left-10 right-10" key={`t${i}`}>
        <div className="frame frame-gold px-10 py-7" style={{ ['--panel' as string]: 'rgba(16,24,39,0.95)' }}>
          {panel.speaker && <p className="font-pixel text-[30px] text-gold">{panel.speaker}</p>}
          <p className={`mt-1 leading-snug ${panel.who === 'none' ? 'text-[40px]' : 'text-[38px]'}`}>
            <Typewriter text={panel.text} instant={typed} onDone={() => setTyped(true)} />
          </p>
          <div className="mt-3 flex items-center justify-between text-[22px] text-frost">
            <span>
              {i + 1} / {INTRO.length}
            </span>
            <span>{typed ? (last ? 'Click to begin the briefing' : 'Click or press Enter to continue') : 'Click to finish the line'}</span>
          </div>
        </div>
      </div>

      <div className="absolute right-[340px] top-5" onClick={(e) => e.stopPropagation()}>
        <Btn size="sm" variant="ghost" onClick={next}>
          <Icon name="skip" size={20} /> Skip intro
        </Btn>
      </div>
    </div>
  );
}

import Phaser from 'phaser';
import { useCallback, useEffect, useRef, useState } from 'react';
import { audio } from '../audio/audio';
import { LEVELS, type LevelDef } from '../content/levels';
import { getQuestion } from '../content/questions';
import { MazeScene, type MazeControls } from '../game/MazeScene';
import type { Dir, Reality } from '../game/logic';
import { useStore } from '../state/store';
import { ClassPrompt } from '../ui/ClassPrompt';
import { Btn, Kbd, NiceMeter, Typewriter, fromControl } from '../ui/kit';
import { Portrait } from '../ui/Portrait';
import { MirrorShard } from './CaseScreen';

const KEY_DIR: Record<string, Dir> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
  W: 'up',
  S: 'down',
  A: 'left',
  D: 'right',
};

type Modal = null | { kind: 'intro' } | { kind: 'gate'; digit: string } | { kind: 'npc'; who: 'R' | 'H' } | { kind: 'secret' } | { kind: 'done' };

export function MazeScreen({ levelId }: { levelId: LevelDef['id'] }) {
  const level = LEVELS[levelId];
  const { state, dispatch, next } = useStore();
  const host = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<MazeScene | null>(null);
  const controls = useRef<MazeControls>({ order: [], tap: null });
  const [reality, setReality] = useState<Reality>('A');
  const [modal, setModal] = useState<Modal>({ kind: 'intro' });
  const [hint, setHint] = useState<{ text: string; id: number } | null>(null);
  const [flash, setFlash] = useState<{ r: Reality; id: number } | null>(null);
  const [secretDone, setSecretDone] = useState(false);
  const reduced = state.settings.reducedMotion;
  const w = level.map[0].length * 16;
  const h = level.map.length * 16;
  const scale = Math.min(1536 / w, 768 / h);

  const showHint = useCallback((text: string) => setHint({ text, id: Date.now() }), []);

  useEffect(() => {
    audio.play('maze');
  }, []);

  // boot Phaser
  useEffect(() => {
    if (!host.current) return;
    const scene = new MazeScene(
      level,
      {
        onGate: (digit) => setModal({ kind: 'gate', digit }),
        onNpc: (who) => setModal(who === 'H' ? { kind: 'secret' } : { kind: 'npc', who }),
        onReality: (r) => setReality(r),
        onHint: showHint,
        onExit: () => setModal({ kind: 'done' }),
        onFlip: () => dispatch({ type: 'flip' }),
        onSparkle: () => dispatch({ type: 'sparkle' }),
        onAmbush: () => {},
      },
      controls.current,
      reduced,
    );
    sceneRef.current = scene;
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: host.current,
      width: w,
      height: h,
      pixelArt: true,
      backgroundColor: '#070b14',
      banner: false,
      audio: { noAudio: true },
      input: { keyboard: false, gamepad: false },
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      scene: scene,
    });
    return () => {
      sceneRef.current = null;
      game.destroy(true);
    };
    // the level never changes for a mounted screen
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // pause the scene whenever something covers it
  useEffect(() => {
    sceneRef.current?.setPaused(modal !== null || state.overlay !== null);
    if (modal !== null || state.overlay !== null) {
      controls.current.order = [];
      controls.current.tap = null;
    }
  }, [modal, state.overlay]);

  // flip banner
  useEffect(() => {
    if (!flash) return;
    const id = window.setTimeout(() => setFlash(null), 1100);
    return () => clearTimeout(id);
  }, [flash]);

  const prevReality = useRef<Reality>('A');
  useEffect(() => {
    if (prevReality.current !== reality) setFlash({ r: reality, id: Date.now() });
    prevReality.current = reality;
  }, [reality]);

  useEffect(() => {
    if (!hint) return;
    const id = window.setTimeout(() => setHint(null), 5200);
    return () => clearTimeout(id);
  }, [hint]);

  // keyboard
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (state.overlay) return;
      if (modal?.kind === 'intro' && (e.key === 'Enter' || e.key === ' ') && !fromControl(e)) {
        e.preventDefault();
        setModal(null);
        return;
      }
      if (modal) return;
      const d = KEY_DIR[e.key];
      if (d) {
        e.preventDefault();
        if (!controls.current.order.includes(d)) controls.current.order.push(d);
        if (!e.repeat) controls.current.tap = d;
        return;
      }
      if (e.key === 'r' || e.key === 'R') sceneRef.current?.flip();
      else if ((e.key === ' ' || e.key === 'Enter') && !fromControl(e)) {
        e.preventDefault();
        sceneRef.current?.interact();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        sceneRef.current?.resetRoom();
      }
    };
    const up = (e: KeyboardEvent) => {
      const d = KEY_DIR[e.key];
      if (d) controls.current.order = controls.current.order.filter((x) => x !== d);
    };
    const blur = () => (controls.current.order = []);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, [modal, state.overlay]);

  const touchOn =
    state.settings.touch === 'on' || (state.settings.touch === 'auto' && typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0 && window.matchMedia?.('(pointer: coarse)').matches);

  const solveGate = (digit: string, firstTry: boolean) => {
    const q = getQuestion(level.gates[digit]);
    if (q.award === 'fragmentC') {
      dispatch({ type: 'fragment', id: 'C' });
      dispatch({ type: 'toast', text: 'Mirror fragment C recovered: Rhetorical purpose', tone: 'good' });
      audio.sfx('fragment');
    }
    if (firstTry) dispatch({ type: 'toast', text: 'Gate opened on the first try. Very nice.', tone: 'good' });
    setModal(null);
    sceneRef.current?.solveGate(digit);
  };

  const isFinalLevel = levelId === 'maze3' || levelId === 'mazeX';
  const frags = state.progress?.fragments ?? [];
  const mirror = reality === 'B';

  return (
    <div
      className="absolute inset-0 transition-colors duration-500"
      style={{ background: mirror ? 'radial-gradient(ellipse at center, #2b1f4d 0%, #120a24 80%)' : 'radial-gradient(ellipse at center, #1b2a4a 0%, #0b1220 80%)' }}
      data-testid={`maze-${levelId}`}
      data-reality={reality}
    >
      {/* top bar */}
      <div className="absolute left-8 top-3 flex items-center gap-5">
        <div
          className={`frame flex items-center px-5 py-1 font-pixel text-[34px] ${mirror ? 'frame-hex text-ice' : 'frame-gold text-gold'}`}
          aria-live="polite"
          data-testid="reality"
        >
          {mirror ? 'Mirror B-A' : 'Reality A-B'}
        </div>
        <h1 className="font-pixel text-[36px] text-snow">{level.title}</h1>
        <span className="text-[22px] text-frost">{level.subtitle}</span>
      </div>

      {/* the playfield */}
      <div className="absolute left-1/2 -translate-x-1/2" style={{ top: 72, width: w * scale, height: h * scale }}>
        <div ref={host} className="h-full w-full" />
        {hint && (
          <div key={hint.id} className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 anim-pop">
            <div className="frame frame-ice max-w-[1200px] px-6 py-3 text-center text-[27px] leading-snug" style={{ ['--panel' as string]: 'rgba(16,24,39,0.95)' }}>
              {hint.text}
            </div>
          </div>
        )}
        {flash && (
          <div key={flash.id} className="pointer-events-none absolute inset-0 grid place-items-center">
            <p
              className={`font-pixel text-[120px] font-bold anim-pop ${flash.r === 'B' ? 'text-ice' : 'text-gold'}`}
              style={{ textShadow: '6px 6px 0 #070b14', opacity: 0.92 }}
            >
              {flash.r === 'B' ? 'B-A' : 'A-B'}
            </p>
          </div>
        )}
        {touchOn && !modal && <TouchPad controls={controls.current} scene={sceneRef} />}
      </div>

      {/* bottom bar */}
      <div className="absolute bottom-3 left-8 right-8 flex items-center gap-6 text-[21px] text-frost">
        <span>
          <Kbd>WASD</Kbd> move
        </span>
        <span>
          <Kbd>R</Kbd> flip on a mirror
        </span>
        <span>
          <Kbd>Space</Kbd> interact
        </span>
        <span>
          <Kbd>Backspace</Kbd> reset room
        </span>
        <span className="flex-1" />
        <span className="flex items-center gap-1" aria-label={`Mirror fragments: ${frags.join(', ') || 'none'}`}>
          {(['A', 'B', 'C'] as const).map((f) => (
            <MirrorShard key={f} id={f} size={40} dim={!frags.includes(f)} />
          ))}
        </span>
        {state.progress && <NiceMeter value={state.progress.nice} compact />}
      </div>

      {modal?.kind === 'intro' && (
        <div className="absolute inset-0 z-20 grid place-items-center bg-ink/80 anim-fade">
          <div className="frame frame-gold w-[1000px] p-10 text-center">
            <p className="font-pixel text-[28px] text-ice">{level.subtitle}</p>
            <h2 className="font-pixel text-[64px] font-bold leading-tight text-gold">{level.title}</h2>
            <p className="mx-auto mt-4 max-w-[820px] text-[30px] leading-snug">{level.intro}</p>
            <div className="mx-auto mt-6 grid max-w-[820px] grid-cols-2 gap-x-8 gap-y-3 text-left text-[24px]">
              <span>
                <Kbd>WASD</Kbd> / <Kbd>Arrows</Kbd> move
              </span>
              <span>
                <Kbd>R</Kbd> reverse reality on a mirror
              </span>
              <span>
                <Kbd>Space</Kbd> interact
              </span>
              <span>
                <Kbd>Esc</Kbd> pause
              </span>
            </div>
            <Btn size="lg" className="mt-8" onClick={() => setModal(null)} autoFocus>
              Enter the maze
            </Btn>
          </div>
        </div>
      )}

      {modal?.kind === 'gate' && (
        <ClassPrompt
          q={getQuestion(level.gates[modal.digit])}
          intro="A chiasmus gate blocks the path."
          continueLabel="Open the gate"
          onSolved={(first) => solveGate(modal.digit, first)}
        />
      )}

      {modal?.kind === 'npc' && <ReversoTalk lines={level.reverso} onClose={() => setModal(null)} />}

      {modal?.kind === 'secret' &&
        (secretDone ? (
          <ReversoTalk
            speaker="Hoops McJingle"
            hoops
            lines={['You already have the trophy. Great players make great elves, and great elves make great players.']}
            onClose={() => setModal(null)}
          />
        ) : level.secret ? (
          <ClassPrompt
            q={getQuestion(level.secret)}
            intro="Hoops McJingle, the North Pole’s best (only) basketball elf, blocks the trophy: “Finish my reversal and it’s yours.”"
            continueLabel="Claim the trophy"
            onSolved={() => {
              setSecretDone(true);
              dispatch({ type: 'achieve', id: 'lechiasmus' });
              dispatch({ type: 'toast', text: 'You won the LeChiasmus Trophy (definitely not affiliated with any real basketball player).', tone: 'good' });
              setModal(null);
            }}
          />
        ) : null)}

      {modal?.kind === 'done' && (
        <div className="absolute inset-0 z-20 grid place-items-center bg-ink/85 anim-fade">
          <div className="frame frame-gold w-[980px] p-10 text-center anim-pop">
            <p className="font-pixel text-[30px] text-ice">{isFinalLevel ? 'The top of the tower' : 'Level complete'}</p>
            <h2 className="font-pixel text-[64px] font-bold leading-tight text-gold">{isFinalLevel ? 'The Reality Mirror is through this portal.' : level.title + ' cleared.'}</h2>
            <p className="mx-auto mt-4 max-w-[780px] text-[28px] leading-snug">
              {isFinalLevel
                ? 'The Syntax Grinch is waiting with the broken mirror. Bring the fragments.'
                : 'Every gate you opened crossed A-B into B-A. The next case file is waiting in the workshop.'}
            </p>
            <Btn size="lg" className="mt-8" onClick={next} autoFocus>
              {isFinalLevel ? 'Face the Syntax Grinch' : 'Continue'}
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}

function ReversoTalk({ lines, onClose, speaker = 'Reverso the reindeer', hoops = false }: { lines: string[]; onClose: () => void; speaker?: string; hoops?: boolean }) {
  const [i, setI] = useState(0);
  const [typing, setTyping] = useState(true);
  const last = i >= lines.length - 1;
  const advance = useCallback(() => {
    if (typing) return;
    if (last) onClose();
    else {
      setI((v) => v + 1);
      setTyping(true);
    }
  }, [typing, last, onClose]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.key === 'Enter' || e.key === ' ') && !fromControl(e)) {
        e.preventDefault();
        advance();
      }
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [advance, onClose]);
  return (
    <div className="absolute inset-x-0 bottom-0 z-20 flex justify-center pb-16 anim-rise">
      <div className="frame frame-gold flex w-[1300px] items-center gap-8 p-7">
        {hoops ? (
          <Portrait who={{ kind: 'elf', look: { skin: '#8d5638', hat: '#F7C65F', hair: '#22192b', tunic: '#E63946', collar: '#F7FAFC', accessories: ['headband'] } }} size={190} talking={typing} />
        ) : (
          <Portrait who={{ kind: 'reindeer' }} size={190} talking={typing} />
        )}
        <div className="flex-1">
          <p className="font-pixel text-[28px] text-gold">{speaker}</p>
          <p className="mt-2 min-h-[110px] text-[34px] leading-snug">
            <Typewriter key={i} text={lines[i]} onDone={() => setTyping(false)} />
          </p>
          <div className="mt-3 flex justify-end">
            <Btn size="sm" onClick={advance} disabled={typing}>
              {last ? 'Bye' : 'Next'}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

function TouchPad({ controls, scene }: { controls: MazeControls; scene: React.RefObject<MazeScene | null> }) {
  const hold = (d: Dir) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      if (!controls.order.includes(d)) controls.order.push(d);
      controls.tap = d;
    },
    onPointerUp: () => (controls.order = controls.order.filter((x) => x !== d)),
    onPointerLeave: () => (controls.order = controls.order.filter((x) => x !== d)),
    onPointerCancel: () => (controls.order = controls.order.filter((x) => x !== d)),
  });
  const b = 'grid h-[96px] w-[96px] place-items-center bg-night-3/80 font-pixel text-[40px] text-snow active:bg-gold active:text-ink touch-none';
  const edge = { boxShadow: '0 0 0 4px #070b14' };
  return (
    <>
      <div className="absolute bottom-4 left-4 grid grid-cols-3 gap-2" style={{ touchAction: 'none' }} aria-label="Touch movement pad">
        <span />
        <button type="button" className={b} style={edge} {...hold('up')} aria-label="Up">▲</button>
        <span />
        <button type="button" className={b} style={edge} {...hold('left')} aria-label="Left">◀</button>
        <span />
        <button type="button" className={b} style={edge} {...hold('right')} aria-label="Right">▶</button>
        <span />
        <button type="button" className={b} style={edge} {...hold('down')} aria-label="Down">▼</button>
        <span />
      </div>
      <div className="absolute bottom-4 right-4 flex gap-4" style={{ touchAction: 'none' }}>
        <button type="button" className={`${b} w-[130px] text-[30px]`} style={edge} onPointerDown={() => scene.current?.interact()}>
          Talk
        </button>
        <button type="button" className={`${b} w-[130px] text-[30px]`} style={edge} onPointerDown={() => scene.current?.flip()}>
          Flip R
        </button>
      </div>
    </>
  );
}

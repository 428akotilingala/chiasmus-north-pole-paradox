import { useCallback, useEffect, useRef, useState } from 'react';
import { audio } from '../audio/audio';
import { sceneUrl } from '../art/scenes';
import { lines } from '../content/markup';
import { getQuestion } from '../content/questions';
import { useStore } from '../state/store';
import { ChiDiagram } from '../ui/Chi';
import { ClassPrompt } from '../ui/ClassPrompt';
import { Btn, Icon, Typewriter, fromControl } from '../ui/kit';
import { Portrait } from '../ui/Portrait';
import { useStageScale } from '../ui/Stage';
import { MirrorShard } from './CaseScreen';

type Phase = 'arrive' | 'build' | 'restored' | 'emphasis';
type Word = 'YOU' | 'CHRISTMAS';
interface Block {
  id: number;
  word: Word;
}

const GRINCH_LINES = [
  'You climbed my tower? Cute. But you’ll never fix the mirror.',
  'Reversal is confusing! Repetition is easy! Christmas, Christmas, Christmas, Christmas!',
  'A-A-A-A!',
];

const BLOCKS: Block[] = [
  { id: 0, word: 'CHRISTMAS' },
  { id: 1, word: 'YOU' },
  { id: 2, word: 'CHRISTMAS' },
  { id: 3, word: 'YOU' },
];

function judge(words: Word[]): { ok: boolean; order?: 'gratitude' | 'responsibility'; msg: string } {
  const [a, b, c, d] = words;
  if (a === d && b === c && a !== b) return { ok: true, order: a === 'YOU' ? 'gratitude' : 'responsibility', msg: '' };
  if (a === c && b === d) return { ok: false, msg: 'A-B, A-B! That’s parallelism: the same order twice, so nothing crosses. It also contradicts itself. Love it.' };
  return { ok: false, msg: 'A-A-B-B! That’s just two repetitions glued together. My favorite. The matching pair has to wrap around the outside.' };
}

export function Final() {
  const { state, dispatch, next } = useStore();
  const reduced = state.settings.reducedMotion;
  const scale = useStageScale();
  const [phase, setPhase] = useState<Phase>('arrive');
  const [line, setLine] = useState(0);
  const [typing, setTyping] = useState(true);
  const [slots, setSlots] = useState<(number | null)[]>([null, null, null, null]);
  const [taunt, setTaunt] = useState<string | null>(null);
  const [order, setOrder] = useState<'gratitude' | 'responsibility'>('gratitude');
  const [drag, setDrag] = useState<{ id: number; x: number; y: number } | null>(null);
  const [restoreStep, setRestoreStep] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const moved = useRef(false);

  useEffect(() => {
    audio.play(phase === 'restored' || phase === 'emphasis' ? 'menu' : 'boss');
  }, [phase]);

  useEffect(() => {
    if (line === 2 && phase === 'arrive') audio.sfx('shout');
  }, [line, phase]);

  const advanceArrive = useCallback(() => {
    if (typing) return;
    if (line < GRINCH_LINES.length - 1) {
      setLine((l) => l + 1);
      setTyping(true);
    } else {
      setPhase('build');
      audio.sfx('fragment');
    }
  }, [typing, line]);

  useEffect(() => {
    if (phase !== 'arrive') return;
    const k = (e: KeyboardEvent) => {
      if (state.overlay) return;
      if ((e.key === 'Enter' || e.key === ' ') && !fromControl(e)) {
        e.preventDefault();
        if (typing) setTyping(false);
        else advanceArrive();
      }
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [phase, typing, advanceArrive, state.overlay]);

  useEffect(() => {
    if (phase !== 'restored') return;
    const t = [window.setTimeout(() => setRestoreStep(1), 900), window.setTimeout(() => setRestoreStep(2), 2600), window.setTimeout(() => setRestoreStep(3), 4600)];
    return () => t.forEach(clearTimeout);
  }, [phase]);

  const place = (id: number, slot?: number) => {
    setTaunt(null);
    setSlots((s) => {
      const out = s.map((v) => (v === id ? null : v));
      const target = slot ?? out.findIndex((v) => v === null);
      if (target < 0) return s;
      out[target] = id;
      return out;
    });
    audio.sfx('place');
  };

  const unplace = (slot: number) => {
    setTaunt(null);
    setSlots((s) => s.map((v, i) => (i === slot ? null : v)));
    audio.sfx('back');
  };

  const check = () => {
    const words = slots.map((id) => BLOCKS[id!].word);
    const r = judge(words);
    if (r.ok) {
      audio.sfx('victory');
      setOrder(r.order!);
      dispatch({ type: 'finalOrder', order: r.order! });
      dispatch({ type: 'nice', delta: 10 });
      dispatch({ type: 'achieve', id: 'reformed' });
      setPhase('restored');
    } else {
      audio.sfx('shout');
      dispatch({ type: 'nice', delta: -3 });
      setTaunt(r.msg);
    }
  };

  // pointer drag (works with mouse and touch)
  const toStage = (cx: number, cy: number) => {
    const r = root.current!.getBoundingClientRect();
    return { x: (cx - r.left) / scale, y: (cy - r.top) / scale };
  };
  const onDown = (id: number) => (e: React.PointerEvent) => {
    moved.current = false;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    const p = toStage(e.clientX, e.clientY);
    setDrag({ id, ...p });
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag) return;
    moved.current = true;
    setDrag({ ...drag, ...toStage(e.clientX, e.clientY) });
  };
  const onUp = (e: React.PointerEvent) => {
    if (!drag) return;
    const id = drag.id;
    setDrag(null);
    if (!moved.current) {
      const inSlot = slots.indexOf(id);
      if (inSlot >= 0) unplace(inSlot);
      else place(id);
      return;
    }
    const el = document.elementsFromPoint(e.clientX, e.clientY).find((n) => (n as HTMLElement).dataset?.slot !== undefined) as HTMLElement | undefined;
    if (el) place(id, Number(el.dataset.slot));
    else if (slots.includes(id)) unplace(slots.indexOf(id));
  };

  const full = slots.every((v) => v !== null);
  const built = order === 'gratitude' ? lines('[A:You] didn’t save [B:Christmas] —', '[B:Christmas] saved [A:you].') : lines('[A:Christmas] didn’t save [B:you] —', '[B:you] saved [A:Christmas].');
  const frags = state.progress?.fragments ?? [];

  const chip = (b: Block, inSlot = false) => (
    <button
      type="button"
      onPointerDown={onDown(b.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (inSlot) unplace(slots.indexOf(b.id));
          else place(b.id);
        }
      }}
      className={`frame frame-ice cursor-grab touch-none px-6 py-3 font-pixel text-[40px] font-bold text-snow active:cursor-grabbing ${drag?.id === b.id ? 'opacity-30' : ''}`}
      style={{ ['--panel' as string]: '#1f3550' }}
      aria-label={inSlot ? `${b.word}, placed. Press Enter to remove.` : `${b.word} block. Press Enter to place it.`}
    >
      {b.word === 'YOU' ? (inSlot && slots.indexOf(b.id) > 0 ? 'you' : 'You') : 'Christmas'}
    </button>
  );

  const slot = (i: number) => {
    const id = slots[i];
    const b = id !== null ? BLOCKS[id] : null;
    return (
      <span data-slot={i} className={`inline-flex items-center justify-center align-middle ${b ? '' : 'min-w-[230px]'}`} style={{ minHeight: 86, outline: b ? 'none' : '4px dashed rgba(105,230,241,0.6)', outlineOffset: -4 }}>
        {b ? (
          chip(b, true)
        ) : (
          <span data-slot={i} className="font-pixel text-[30px] text-ice/70">
            slot {i + 1}
          </span>
        )}
      </span>
    );
  };

  return (
    <div ref={root} className="absolute inset-0 overflow-hidden" data-testid="final" onPointerMove={onMove} onPointerUp={onUp}>
      <img src={sceneUrl('tower')} alt="" className="pixelated absolute inset-0 h-full w-full" draggable={false} />
      {/* clock hands: 11:59, then midnight */}
      <div className="absolute" style={{ left: 800, top: 352 }} aria-hidden>
        <div className="absolute bottom-0 left-[-6px] h-[150px] w-[12px] origin-bottom bg-[#3a2a1a]" style={{ transform: `rotate(${phase === 'restored' || phase === 'emphasis' ? 0 : -6}deg)`, transition: 'transform 1.5s' }} />
        <div className="absolute bottom-0 left-[-8px] h-[100px] w-[16px] origin-bottom bg-[#3a2a1a]" style={{ transform: `rotate(${phase === 'restored' || phase === 'emphasis' ? 0 : -1}deg)`, transition: 'transform 1.5s' }} />
      </div>
      <div className="absolute inset-0 bg-ink/40" />

      <div className="absolute left-10 top-6">
        <p className="font-pixel text-[26px] text-berry-light">The top of the Clock Tower, 11:59 PM</p>
        <h1 className="font-pixel text-[50px] font-bold leading-none text-gold">The Reality Mirror</h1>
      </div>

      {/* the Syntax Grinch */}
      <div className={`absolute bottom-[40px] right-[40px] flex flex-col items-center ${phase === 'arrive' && line === 2 && !reduced ? 'anim-shake' : ''}`}>
        <Portrait
          who={{ kind: 'grinch', mood: phase === 'restored' ? (restoreStep >= 2 ? 'reformed' : 'dizzy') : phase === 'emphasis' ? 'reformed' : 'grin' }}
          size={phase === 'build' ? 230 : 300}
          talking={(phase === 'arrive' && typing) || (phase === 'build' && !!taunt)}
          flip
        />
        <p className="font-pixel text-[24px] text-hex" style={{ color: '#c8a2ff' }}>
          The Syntax Grinch
        </p>
      </div>

      {phase === 'arrive' && (
        <div className="absolute bottom-10 left-10 right-[380px]" onClick={() => (typing ? setTyping(false) : advanceArrive())}>
          <div className="frame frame-hex px-10 py-7" style={{ ['--panel' as string]: 'rgba(16,24,39,0.95)' }}>
            <p className="font-pixel text-[30px]" style={{ color: '#c8a2ff' }}>
              The Syntax Grinch
            </p>
            <p className={`mt-2 leading-snug ${line === 2 ? 'font-pixel text-[96px] font-bold text-berry' : 'text-[40px]'}`}>
              <Typewriter key={line} text={GRINCH_LINES[line]} instant={!typing} onDone={() => setTyping(false)} speed={line === 2 ? 90 : 28} />
            </p>
            <div className="mt-3 text-right text-[22px] text-frost">{typing ? 'Click to finish the line' : 'Click or press Enter to continue'}</div>
          </div>
        </div>
      )}

      {phase !== 'arrive' && (
        <div className="absolute left-[60px] right-[340px] top-[150px] flex flex-col items-center">
          {/* the mirror */}
          <div
            className={`relative px-16 py-10 ${phase === 'restored' && restoreStep >= 1 ? 'anim-glow' : ''}`}
            style={{
              background: phase === 'restored' || phase === 'emphasis' ? 'linear-gradient(160deg, #1d6f80 0%, #0d4a5c 55%, #145c6e 100%)' : 'linear-gradient(160deg, #2b3b5c, #1b2a4a)',
              boxShadow: '0 0 0 10px #F7C65F, 0 0 0 16px #b98426, 0 0 0 22px #070b14',
              ['--glow' as string]: '#69E6F1',
              minWidth: 1080,
              transition: 'background 800ms',
            }}
          >
            <div className="absolute -top-[46px] left-1/2 flex -translate-x-1/2 gap-6">
              {(['A', 'B', 'C'] as const).map((f) => (
                <MirrorShard key={f} id={f} size={70} dim={!frags.includes(f) && phase === 'build'} />
              ))}
            </div>
            {phase === 'build' ? (
              <div className="font-read text-[40px] leading-[1.9] text-snow">
                <div className="flex flex-wrap items-center gap-4">
                  {slot(0)} <span>didn’t save</span>
                  <span className="inline-flex items-center gap-3">
                    {slot(1)}
                    <span>—</span>
                  </span>
                </div>
                <div className="ml-16 flex flex-wrap items-center gap-4">
                  {slot(2)} <span>saved</span>
                  <span className="inline-flex items-center">
                    {slot(3)}
                    <span>.</span>
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-2 text-snow">
                <ChiDiagram lines={built} fontSize={40} gap={1.4} className="[&>p]:max-w-none" />
              </div>
            )}
          </div>

          {phase === 'build' && (
            <>
              <p className="mt-10 text-center text-[30px]" style={{ textShadow: '2px 2px 0 #070b14' }}>
                Restore the mirror: drag the blocks (or click them) to build a chiasmus. <b className="role-A">A</b>-<b className="role-B">B</b>, then{' '}
                <b className="role-B">B</b>-<b className="role-A">A</b>.
              </p>
              <div className="mt-6 flex min-h-[96px] gap-6">
                {BLOCKS.filter((b) => !slots.includes(b.id)).map((b) => (
                  <span key={b.id}>{chip(b)}</span>
                ))}
              </div>
              <div className="mt-6 flex gap-5">
                <Btn variant="ghost" sound="back" onClick={() => setSlots([null, null, null, null])}>
                  Clear
                </Btn>
                <Btn size="lg" disabled={!full} onClick={check}>
                  Restore the mirror
                </Btn>
              </div>
            </>
          )}

          {phase === 'restored' && (
            <div className="mt-8 text-center">
              {restoreStep >= 1 && <p className="font-pixel text-[56px] font-bold leading-none text-gold anim-pop">The Reality Mirror is restored!</p>}
              {restoreStep >= 2 && (
                <p className="mt-3 text-[32px] leading-snug anim-rise">
                  <span className="font-pixel" style={{ color: '#c8a2ff' }}>
                    Syntax Grinch:
                  </span>{' '}
                  “A-B-B-A? Like the band? …I came to destroy reversal, and reversal destroyed me. In a good way.”
                </p>
              )}
              {restoreStep >= 3 && (
                <Btn size="lg" className="mt-6 anim-rise" onClick={() => setPhase('emphasis')} autoFocus>
                  What does it emphasize?
                </Btn>
              )}
              {restoreStep < 3 && (
                <div className="mt-8">
                  <Btn size="sm" variant="ghost" onClick={() => setRestoreStep(3)}>
                    <Icon name="skip" size={20} /> Skip animation
                  </Btn>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {taunt && phase === 'build' && (
        <div className="absolute bottom-[310px] right-[26px] w-[330px] anim-pop">
          <div className="frame frame-hex px-5 py-4 text-[24px] leading-snug" style={{ ['--panel' as string]: 'rgba(16,24,39,0.96)' }}>
            {taunt}
          </div>
        </div>
      )}

      {drag && moved.current && (
        <div className="pointer-events-none absolute z-50 -translate-x-1/2 -translate-y-1/2" style={{ left: drag.x, top: drag.y }}>
          <div className="frame frame-gold px-6 py-3 font-pixel text-[40px] font-bold text-snow" style={{ ['--panel' as string]: '#1f3550' }}>
            {BLOCKS[drag.id].word === 'YOU' ? 'You' : 'Christmas'}
          </div>
        </div>
      )}

      {phase === 'emphasis' && (
        <ClassPrompt
          q={getQuestion('finale')}
          intro={
            order === 'responsibility'
              ? 'You built “Christmas didn’t save you — you saved Christmas.” That’s chiasmus too, and it ends on responsibility. The mirror’s version ends on gratitude. Same structure, different emphasis.'
              : 'The mirror now reads:'
          }
          continueLabel="Save Christmas"
          onSolved={() => next()}
        />
      )}
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { audio } from '../audio/audio';
import { sceneUrl } from '../art/scenes';
import { getCase } from '../content/cases';
import { plain } from '../content/markup';
import type { CaseRound, ElfLook, Suspect } from '../content/types';
import { useStore } from '../state/store';
import { ChiDiagram, PatternLabel, Quote } from '../ui/Chi';
import { Btn, Countdown, Icon, NiceMeter, Tally, Typewriter, fromControl } from '../ui/kit';
import { Portrait } from '../ui/Portrait';

type Phase = 'title' | 'investigate' | 'evidence' | 'vote' | 'reveal' | 'debrief';
const LETTERS = ['A', 'B', 'C', 'D'];

const SIR_REPEATS: ElfLook = { skin: '#f6d1b4', hat: '#E63946', hair: '#e9eef5', tunic: '#22304d', collar: '#F7C65F', accessories: ['tophat', 'monocle', 'bowtie'] };

export function CaseScreen({ caseId }: { caseId: string }) {
  const c = getCase(caseId);
  const { state, dispatch, next } = useStore();
  const [phase, setPhase] = useState<Phase>('title');
  const [detect, setDetect] = useState(false);
  const [interview, setInterview] = useState<Suspect | null>(null);
  const [chosen, setChosen] = useState<number | null>(null);
  const reduced = state.settings.reducedMotion;

  useEffect(() => {
    audio.play(phase === 'vote' || phase === 'reveal' ? 'reveal' : phase === 'debrief' ? 'menu' : 'investigate');
  }, [phase]);

  useEffect(() => {
    if (phase !== 'title') return;
    const id = window.setTimeout(() => setPhase('investigate'), reduced ? 1600 : 2600);
    return () => clearTimeout(id);
  }, [phase, reduced]);

  const impostorIdx = c.suspects.findIndex((s) => s.impostor);
  const correct = chosen === impostorIdx;

  const lockIn = (i: number) => {
    setChosen(i);
    const ok = i === impostorIdx;
    dispatch({ type: 'result', caseId: c.id, correct: ok });
    dispatch({ type: 'nice', delta: ok ? 12 : -8 });
    setPhase('reveal');
  };

  return (
    <div className="absolute inset-0 overflow-hidden" data-testid={`case-${c.id}`}>
      <img src={sceneUrl('workshop')} alt="" className="pixelated absolute inset-0 h-full w-full" draggable={false} />
      <div className="absolute inset-0 bg-gradient-to-b from-ink/55 via-transparent to-ink/50" />

      {phase === 'title' && (
        <button type="button" className="absolute inset-0 grid place-items-center bg-ink/70 anim-fade" onClick={() => setPhase('investigate')} aria-label="Begin investigation">
          <div className="text-center anim-pop">
            <p className="font-pixel text-[40px] text-berry">Case file {c.number}</p>
            <h1 className="mt-2 font-pixel text-[92px] font-bold leading-none text-gold">{c.title}</h1>
            <p className="mt-6 text-[32px] text-frost">{c.focus}</p>
          </div>
        </button>
      )}

      {phase !== 'title' && (
        <div inert={phase !== 'investigate' || !!interview}>
          <header className="absolute left-10 right-[300px] top-6 flex flex-col gap-1">
            <p className="font-pixel text-[24px] text-berry-light">Case file {c.number}: who is the rhetorical impostor?</p>
            <h1 className="font-pixel text-[46px] font-bold leading-none text-gold">{c.title}</h1>
            <p className="mt-1 max-w-[1150px] text-[24px] leading-snug text-snow">{c.setup}</p>
          </header>
          {state.progress && (
            <div className="absolute right-10 top-[96px]">
              <NiceMeter value={state.progress.nice} compact />
            </div>
          )}

          <div className="absolute left-8 right-8 top-[214px] grid grid-cols-4 gap-6">
            {c.suspects.map((s, i) => (
              <SuspectColumn key={s.id} s={s} letter={LETTERS[i]} detect={detect} onInterview={() => setInterview(s)} reduced={reduced} index={i} />
            ))}
          </div>

          <footer className="absolute bottom-6 left-8 right-8 flex items-center gap-5">
            <Btn variant="ghost" onClick={() => setPhase('evidence')}>
              Evidence board
            </Btn>
            <Btn variant={detect ? 'ice' : 'ghost'} onClick={() => setDetect((d) => !d)} aria-pressed={detect}>
              <Icon name="eye" /> Detect reversal: {detect ? 'on' : 'off'}
            </Btn>
            <span className="flex-1 text-right text-[22px] text-frost">Click an elf to interview them.</span>
            <Btn variant="red" size="lg" onClick={() => setPhase('vote')}>
              Call the class vote
            </Btn>
          </footer>
        </div>
      )}

      {interview && <Interview s={interview} letter={LETTERS[c.suspects.indexOf(interview)]} onClose={() => setInterview(null)} detect={detect} />}
      {phase === 'evidence' && <EvidenceBoard c={c} detect={detect} setDetect={setDetect} onClose={() => setPhase('investigate')} onVote={() => setPhase('vote')} />}
      {phase === 'vote' && <Vote c={c} onBack={() => setPhase('investigate')} onLock={lockIn} />}
      {phase === 'reveal' && chosen !== null && <Reveal c={c} chosen={chosen} correct={correct} reduced={reduced} onDone={() => setPhase('debrief')} />}
      {phase === 'debrief' && chosen !== null && <Debrief c={c} correct={correct} onContinue={next} />}
    </div>
  );
}

function SuspectColumn({ s, letter, detect, onInterview, reduced, index }: { s: Suspect; letter: string; detect: boolean; onInterview: () => void; reduced: boolean; index: number }) {
  return (
    <div className="flex flex-col items-center">
      <div className="frame frame-paper on-paper relative w-full px-5 py-4 text-[29px] leading-[1.28] anim-rise" style={{ minHeight: 214, animationDelay: `${index * 90}ms` }}>
        <Quote lines={s.quote} highlight={detect} tags={detect} />
        <span className="absolute -bottom-[22px] left-1/2 h-0 w-0 -translate-x-1/2 border-x-[16px] border-t-[18px] border-x-transparent border-t-[#f4ead2]" />
      </div>
      <button type="button" onClick={onInterview} onMouseEnter={() => audio.sfx('hover')} className="group mt-8 flex cursor-pointer flex-col items-center" aria-label={`Interview ${s.name}`}>
        <div className={reduced ? '' : 'anim-bob'} style={{ animationDelay: `${index * 0.35}s` }}>
          <Portrait who={{ kind: 'elf', look: s.look, expr: 'idle' }} size={176} className="transition-transform group-hover:scale-105" />
        </div>
        <div className="frame mt-1 flex items-center gap-3 px-4 py-2" style={{ ['--panel' as string]: 'rgba(16,24,39,0.92)' }}>
          <span className="grid h-10 w-10 place-items-center bg-gold font-pixel text-[26px] font-bold text-ink">{letter}</span>
          <span className="text-left">
            <span className="block font-pixel text-[25px] leading-tight text-snow">{s.name}</span>
            <span className="block text-[20px] leading-tight text-frost">{s.role}</span>
          </span>
        </div>
      </button>
    </div>
  );
}

function Interview({ s, letter, onClose, detect }: { s: Suspect; letter: string; onClose: () => void; detect: boolean }) {
  const [line, setLine] = useState(0);
  const [typing, setTyping] = useState(true);
  const last = line >= s.interview.length - 1;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'Enter' || e.key === ' ') && !fromControl(e)) {
        e.preventDefault();
        if (typing) return;
        if (last) onClose();
        else {
          setLine((l) => l + 1);
          setTyping(true);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [typing, last, onClose]);
  return (
    <div className="absolute inset-0 z-30 grid place-items-center bg-ink/80 anim-fade" role="dialog" aria-label={`Interview with ${s.name}`}>
      <div className="frame frame-gold flex w-[1380px] gap-10 p-10">
        <div className="flex shrink-0 flex-col items-center gap-3">
          <Portrait who={{ kind: 'elf', look: s.look, expr: s.mood }} size={300} talking={typing} />
          <p className="font-pixel text-[30px] text-gold">
            {letter}. {s.name}
          </p>
          <p className="max-w-[300px] text-center text-[20px] text-frost">{s.role}</p>
        </div>
        <div className="flex flex-1 flex-col">
          <p className="font-pixel text-[24px] text-ice">The statement</p>
          <p className="frame frame-paper on-paper mt-2 px-5 py-3 text-[32px] leading-snug">
            <Quote lines={s.quote} highlight={detect} tags={detect} />
          </p>
          <p className="mt-6 font-pixel text-[24px] text-ice">Their explanation</p>
          <div className="mt-2 min-h-[190px] text-[34px] leading-snug text-snow">
            {s.interview.slice(0, line).map((l, i) => (
              <p key={i} className="mb-3 text-frost">
                “{l}”
              </p>
            ))}
            <p>
              “<Typewriter key={line} text={s.interview[line]} onDone={() => setTyping(false)} />”
            </p>
          </div>
          <div className="mt-auto flex items-center justify-between gap-4 pt-4">
            <span className="text-[22px] text-frost">Careful: suspects can explain a sentence wrong. Judge the sentence, not the speaker.</span>
            {last ? (
              <Btn onClick={onClose} disabled={typing} autoFocus>
                Back to the workshop
              </Btn>
            ) : (
              <Btn
                onClick={() => {
                  setLine((l) => l + 1);
                  setTyping(true);
                }}
                disabled={typing}
              >
                Keep talking
              </Btn>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EvidenceBoard({ c, detect, setDetect, onClose, onVote }: { c: CaseRound; detect: boolean; setDetect: (v: boolean) => void; onClose: () => void; onVote: () => void }) {
  const [tip, setTip] = useState(!!c.badTip);
  return (
    <div
      className="absolute inset-0 z-20 flex flex-col px-12 pb-8 pt-8 anim-fade"
      style={{ background: 'repeating-linear-gradient(45deg, #7a4f30 0 6px, #84583a 6px 12px), #7a4f30' }}
      role="dialog"
      aria-label="Evidence board"
    >
      <div className="flex items-end gap-6 pr-[280px]">
        <h2 className="font-pixel text-[56px] font-bold leading-none text-snow" style={{ textShadow: '4px 4px 0 #070b14' }}>
          Evidence board
        </h2>
        <p className="pb-1 text-[24px] text-snow" style={{ textShadow: '2px 2px 0 #070b14' }}>
          Compare where each key part sits in the first half and the second half.
        </p>
      </div>
      <div className="mt-6 flex flex-col gap-5">
        {c.suspects.map((s, i) => (
          <div key={s.id} className="frame frame-paper on-paper relative flex items-center gap-6 px-6 py-3" style={{ transform: `rotate(${[-0.4, 0.3, -0.2, 0.5][i]}deg)` }}>
            <span className="absolute -top-3 left-1/2 h-6 w-6 -translate-x-1/2 rounded-full bg-berry shadow-[0_3px_0_#070b14]" />
            <span className="grid h-14 w-14 shrink-0 place-items-center bg-night font-pixel text-[34px] font-bold text-gold">{LETTERS[i]}</span>
            <Portrait who={{ kind: 'elf', look: s.look }} size={88} still />
            <div className="flex-1">
              <p className="font-pixel text-[22px] text-[#5a3a22]">{s.name}</p>
              <p className="text-[34px] leading-tight">
                <Quote lines={s.quote} highlight={detect} tags={detect} />
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex items-center gap-5">
        <Btn variant="ghost" sound="back" onClick={onClose}>
          <Icon name="back" /> Back to the workshop
        </Btn>
        <Btn variant={detect ? 'ice' : 'ghost'} onClick={() => setDetect(!detect)} aria-pressed={detect}>
          <Icon name="eye" /> Detect reversal: {detect ? 'on' : 'off'}
        </Btn>
        <span className="flex-1" />
        <Btn variant="red" size="lg" onClick={onVote}>
          Call the class vote
        </Btn>
      </div>
      {tip && c.badTip && (
        <div className="absolute bottom-[126px] left-12 right-12 flex items-center gap-5 anim-pop">
          <Portrait who={{ kind: 'elf', look: SIR_REPEATS, expr: 'smug' }} size={120} talking />
          <div className="frame frame-berry flex flex-1 items-center gap-6 px-6 py-4">
            <p className="flex-1 text-[25px] leading-snug">
              <span className="font-pixel text-[24px] text-berry-light">Sir Repeats-a-Lot: </span>
              {c.badTip}
              <span className="block text-[21px] text-frost">Repeated words alone prove nothing. Look for a swap.</span>
            </p>
            <Btn size="sm" variant="ghost" onClick={() => setTip(false)}>
              Ignore Sir Repeats-a-Lot
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}

function Vote({ c, onBack, onLock }: { c: CaseRound; onBack: () => void; onLock: (i: number) => void }) {
  const { state } = useStore();
  const timer = state.settings.timer;
  const [sel, setSel] = useState<number | null>(null);
  const [running, setRunning] = useState(timer > 0);
  const [timeUp, setTimeUp] = useState(false);
  const [counting, setCounting] = useState(false);
  const [tally, setTally] = useState([0, 0, 0, 0]);
  const leader = useMemo(() => {
    const max = Math.max(...tally);
    return max > 0 && tally.filter((t) => t === max).length === 1 ? tally.indexOf(max) : null;
  }, [tally]);

  useEffect(() => {
    if (leader !== null && counting) setSel(leader);
  }, [leader, counting]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (state.overlay) return;
      const i = ['1', '2', '3', '4'].indexOf(e.key);
      if (i >= 0) {
        audio.sfx('select');
        setSel(i);
      }
      if (e.key === 'Enter' && sel !== null && !fromControl(e)) onLock(sel);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sel, onLock, state.overlay]);

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-ink/[0.97] px-12 pt-10 anim-fade" role="dialog" aria-label="Class vote">
      <div className="flex items-start gap-8 pr-[230px]">
        <div className="flex-1">
          <h2 className="font-pixel text-[80px] font-bold leading-none text-berry" style={{ textShadow: '5px 5px 0 #070b14' }}>
            CLASS, WHO IS THE IMPOSTOR?
          </h2>
          <p className="mt-3 text-[28px] text-frost">Three of these are true reversals. One is not. Hands up for A, B, C, or D.</p>
        </div>
      </div>
      {timer > 0 && (
        <div className="absolute right-12 top-[84px]">
          <Countdown seconds={timer} running={running} onDone={() => setTimeUp(true)} size={124} />
        </div>
      )}
      <div className="mt-10 grid grid-cols-4 gap-6">
        {c.suspects.map((s, i) => (
          <div
            key={s.id}
            className={`frame flex flex-col items-center gap-3 px-4 pb-5 pt-4 text-center transition-transform ${sel === i ? 'frame-gold -translate-y-2' : ''}`}
            style={{ ['--panel' as string]: sel === i ? '#2a2030' : undefined }}
          >
            <button
              type="button"
              onClick={() => {
                audio.sfx('select');
                setSel(i);
              }}
              onMouseEnter={() => audio.sfx('hover')}
              className="flex w-full cursor-pointer flex-col items-center gap-3"
              aria-pressed={sel === i}
              aria-label={`Suspect ${LETTERS[i]}: ${s.name}`}
            >
              <span className={`grid h-16 w-16 place-items-center font-pixel text-[44px] font-bold ${sel === i ? 'bg-berry text-snow' : 'bg-gold text-ink'}`}>{LETTERS[i]}</span>
              <Portrait who={{ kind: 'elf', look: s.look, expr: sel === i ? 'nervous' : 'idle' }} size={150} />
              <span className="font-pixel text-[28px] leading-tight">{s.name}</span>
              <span className="text-[22px] leading-snug text-frost">{plain(s.quote)}</span>
            </button>
            {counting && <Tally value={tally[i]} onChange={(v) => setTally((t) => t.map((x, j) => (j === i ? v : x)))} />}
          </div>
        ))}
      </div>
      <div className="mt-auto flex items-center gap-5 pb-8">
        <Btn variant="ghost" sound="back" onClick={onBack}>
          <Icon name="back" /> Keep investigating
        </Btn>
        <Btn variant="ghost" onClick={() => setCounting((v) => !v)} aria-pressed={counting}>
          {counting ? 'Hide hand count' : 'Count hands'}
        </Btn>
        {timer > 0 && (
          <Btn variant="ghost" onClick={() => setRunning((r) => !r)} disabled={timeUp}>
            {running ? 'Pause timer' : 'Resume timer'}
          </Btn>
        )}
        <span className="flex-1 text-center text-[26px]">
          {timeUp ? <span className="font-pixel text-[34px] text-berry-light">Time! Lock it in.</span> : <span className="text-frost">Pick one, then eject.</span>}
        </span>
        <Btn variant="red" size="lg" disabled={sel === null} onClick={() => sel !== null && onLock(sel)}>
          {sel === null ? 'Choose a suspect' : `Eject ${c.suspects[sel].name.split(' ')[0]}`}
        </Btn>
      </div>
    </div>
  );
}

function Reveal({ c, chosen, correct, reduced, onDone }: { c: CaseRound; chosen: number; correct: boolean; reduced: boolean; onDone: () => void }) {
  const [t, setT] = useState(0);
  const s = c.suspects[chosen];
  const imp = c.suspects.find((x) => x.impostor)!;
  const unmask = correct && !!c.unmask;
  useEffect(() => {
    audio.sfx('drumroll');
    const timers = [
      window.setTimeout(() => setT(1), unmask ? 1500 : 1500),
      window.setTimeout(() => setT(2), unmask ? 3300 : 1900),
      window.setTimeout(() => setT(3), unmask ? 4300 : 2900),
    ];
    return () => timers.forEach(clearTimeout);
  }, [unmask]);
  useEffect(() => {
    if (t === 1 && unmask) audio.sfx('whoosh');
    if (t === 2) audio.sfx(correct ? 'eject' : 'promote');
  }, [t, correct, unmask]);

  const look = unmask && t >= 1 ? SIR_REPEATS : s.look;
  const crowned: ElfLook = { ...imp.look, accessories: [...imp.look.accessories.filter((a) => a !== 'cap' && a !== 'tophat'), 'crown'] };

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center overflow-hidden bg-ink/95" role="status" aria-live="assertive">
      {t < 3 && (
        <div className="absolute bottom-8 right-10">
          <Btn size="sm" variant="ghost" onClick={() => setT(3)}>
            <Icon name="skip" size={20} /> Skip animation
          </Btn>
        </div>
      )}
      <p className="mb-6 font-pixel text-[36px] text-frost">The class chose {s.name}…</p>
      <div className="relative flex items-end gap-16" style={{ height: 330 }}>
        {correct ? (
          <div
            style={{
              transition: reduced ? 'opacity 500ms' : 'transform 1000ms cubic-bezier(.5,-0.4,.8,.6), opacity 1000ms',
              transform: t >= 2 && !reduced ? 'translateY(-900px) rotate(540deg) scale(0.6)' : 'none',
              opacity: t >= 2 ? 0 : 1,
            }}
          >
            <Portrait who={{ kind: 'elf', look, expr: t >= 1 ? 'shocked' : 'nervous' }} size={300} />
          </div>
        ) : (
          <>
            <div className="text-center">
              <Portrait who={{ kind: 'elf', look: s.look, expr: t >= 2 ? 'sad' : 'nervous' }} size={240} />
              {t >= 2 && <p className="font-pixel text-[26px] text-frost">“Wait, me?!”</p>}
            </div>
            {t >= 1 && (
              <div className="text-center anim-rise">
                <div className={t >= 2 ? 'anim-pop' : ''}>
                  <Portrait who={{ kind: 'elf', look: t >= 2 ? crowned : imp.look, expr: 'smug' }} size={300} />
                </div>
                <p className="font-pixel text-[26px] text-gold">{imp.name}</p>
              </div>
            )}
          </>
        )}
        {unmask && t === 1 && <p className="absolute -top-16 left-1/2 w-[900px] -translate-x-1/2 text-center font-pixel text-[44px] text-berry anim-pop">{c.unmask}</p>}
      </div>
      {t >= 2 && (
        <div className="mt-8 max-w-[1350px] text-center anim-pop">
          {correct ? (
            <>
              <h2 className="font-pixel text-[96px] font-bold leading-none text-gold" style={{ textShadow: '6px 6px 0 #a51f2e' }}>
                IMPOSTOR EJECTED.
              </h2>
              <p className="mt-4 font-pixel text-[48px] text-snow">CHRISTMAS SAVED… TEMPORARILY.</p>
            </>
          ) : (
            <>
              <h2 className="font-pixel text-[54px] font-bold leading-tight text-berry" style={{ textShadow: '4px 4px 0 #070b14' }}>
                THE CLASS HAS ACCIDENTALLY PROMOTED THE IMPOSTOR TO HEAD OF GRAMMAR.
              </h2>
              <p className="mt-4 text-[32px] text-snow">The real impostor was {imp.name}.</p>
            </>
          )}
        </div>
      )}
      {t >= 3 && (
        <div className="mt-10 anim-rise">
          <Btn size="lg" onClick={onDone} autoFocus>
            See why
          </Btn>
        </div>
      )}
    </div>
  );
}

function Debrief({ c, correct, onContinue }: { c: CaseRound; correct: boolean; onContinue: () => void }) {
  const { state, dispatch } = useStore();
  const imp = c.suspects.find((s) => s.impostor)!;
  const real = c.suspects.find((s) => s.id === c.authenticId)!;
  const [answer, setAnswer] = useState(false);
  useEffect(() => {
    dispatch({ type: 'fragment', id: c.fragment.id });
    if (correct) dispatch({ type: 'achieve', id: 'first-eject' });
    if (correct && c.unmask) dispatch({ type: 'achieve', id: 'unmasked' });
    audio.sfx('fragment');
  }, [c, correct, dispatch]);
  const mode = state.progress?.mode;
  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-night px-12 pb-8 pt-8 anim-fade">
      <div className="pr-[280px]">
        <p className="font-pixel text-[24px] text-berry-light">Case {c.number} closed</p>
        <h2 className="font-pixel text-[48px] font-bold leading-none text-gold">{correct ? 'The class caught the impostor.' : 'The impostor slipped by. Here’s how to catch them.'}</h2>
      </div>
      <div className="mt-5 grid min-h-0 flex-1 grid-cols-2 gap-8">
        <section className="frame frame-berry flex min-h-0 flex-col px-6 py-5">
          <div className="flex items-center gap-4">
            <Portrait who={{ kind: 'elf', look: c.unmask ? SIR_REPEATS : imp.look, expr: 'shocked' }} size={84} still />
            <div>
              <p className="font-pixel text-[22px] text-berry-light">{c.unmask ? 'The impostor, disguised as Mistle Toby' : 'The impostor'}</p>
              <p className="font-pixel text-[30px]">{c.unmask ? 'Sir Repeats-a-Lot' : imp.name}</p>
            </div>
            <PatternLabel text={imp.pattern} className="ml-auto whitespace-nowrap text-[28px]" />
          </div>
          <div className="my-3 flex min-h-0 flex-1 items-center justify-center">
            <ChiDiagram lines={imp.quote} fontSize={27} gap={imp.quote.length > 2 ? 0.8 : 2.6} />
          </div>
          <p className="text-[24px] leading-snug">{c.impostorWhy}</p>
        </section>
        <section className="frame frame-gold flex min-h-0 flex-col px-6 py-5">
          <div className="flex items-center gap-4">
            <Portrait who={{ kind: 'elf', look: real.look, expr: 'idle' }} size={84} still />
            <div>
              <p className="font-pixel text-[22px] text-ice">The real thing</p>
              <p className="font-pixel text-[30px]">{real.name}</p>
            </div>
            <PatternLabel text={real.pattern} className="ml-auto whitespace-nowrap text-[28px]" />
          </div>
          <div className="my-3 flex min-h-0 flex-1 items-center justify-center">
            <ChiDiagram lines={real.quote} fontSize={29} gap={2.6} />
          </div>
          <p className="text-[24px] leading-snug">{c.authenticWhy}</p>
        </section>
      </div>
      <div className="mt-6 flex items-stretch gap-6">
        <div className="frame frame-ice flex flex-1 items-center gap-5 px-6 py-4">
          <MirrorShard id={c.fragment.id} />
          <div>
            <p className="font-pixel text-[27px] leading-tight text-ice">
              Mirror fragment {c.fragment.id} recovered: {c.fragment.name}
            </p>
            <p className="text-[22px] leading-snug">{c.fragment.lesson}</p>
          </div>
        </div>
        {c.discussion && mode && (
          <div className="frame flex w-[560px] flex-col justify-center px-5 py-3">
            <p className="font-pixel text-[20px] leading-tight text-gold">Class: {c.discussion.prompt.toLowerCase().replace(/^./, (m) => m.toUpperCase())}</p>
            {answer ? (
              <p className="mt-1 text-[20px] leading-snug">{c.discussion.answer}</p>
            ) : (
              <Btn size="sm" variant="ghost" className="mt-2 self-start" onClick={() => setAnswer(true)}>
                Reveal an answer
              </Btn>
            )}
          </div>
        )}
        <div className="flex items-center">
          <Btn size="lg" onClick={onContinue} autoFocus>
            Continue
          </Btn>
        </div>
      </div>
    </div>
  );
}

export function MirrorShard({ id, size = 84, dim = false }: { id: string; size?: number; dim?: boolean }) {
  const pts = id === 'A' ? '10,4 58,10 46,60 6,44' : id === 'B' ? '8,12 54,4 60,52 18,58' : '14,6 60,20 44,60 4,40';
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={dim ? 'opacity-30' : 'anim-glow'} style={{ ['--glow' as string]: '#69E6F1' }} aria-hidden>
      <polygon points={pts} fill="#9fe9f2" stroke="#F7FAFC" strokeWidth={3} />
      <polyline points="16,18 28,30 22,46" stroke="#ffffff" strokeWidth={3} fill="none" opacity={0.8} />
      <text x="34" y="44" fontFamily="Jersey 15 Game, monospace" fontSize="24" fontWeight="700" fill="#101827">
        {id}
      </text>
    </svg>
  );
}

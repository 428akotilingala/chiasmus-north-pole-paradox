import { useEffect, useState } from 'react';
import { audio } from '../audio/audio';
import type { Question } from '../content/types';
import { useStore } from '../state/store';
import { ChiDiagram } from './Chi';
import { Btn, Countdown, Icon, Tally, fromControl } from './kit';

const LETTERS = ['A', 'B', 'C', 'D'];

/**
 * Full-stage class question: big prompt, A-D options, optional countdown and
 * hand-count tally. Wrong picks explain themselves and stay on screen; the
 * game never advances until the presenter chooses to continue.
 */
export function ClassPrompt({
  q,
  onSolved,
  intro,
  continueLabel = 'Continue',
}: {
  q: Question;
  onSolved: (firstTry: boolean) => void;
  intro?: string;
  continueLabel?: string;
}) {
  const { state, dispatch } = useStore();
  const timer = state.settings.timer;
  const [wrong, setWrong] = useState<number[]>([]);
  const [solved, setSolved] = useState<null | 'class' | 'reveal'>(null);
  const [running, setRunning] = useState(timer > 0);
  const [timeUp, setTimeUp] = useState(false);
  const [counting, setCounting] = useState(false);
  const [tally, setTally] = useState([0, 0, 0, 0]);
  const [shake, setShake] = useState<number | null>(null);

  const choose = (i: number) => {
    if (solved || wrong.includes(i)) return;
    setRunning(false);
    if (q.options[i].correct) {
      audio.sfx('correct');
      setSolved('class');
      if (wrong.length === 0) dispatch({ type: 'nice', delta: 8 });
    } else {
      audio.sfx('wrong');
      setWrong((w) => [...w, i]);
      setShake(i);
      window.setTimeout(() => setShake(null), 600);
      if (wrong.length === 0) dispatch({ type: 'nice', delta: -4 });
    }
  };

  const reveal = () => {
    setRunning(false);
    audio.sfx('correct');
    setSolved('reveal');
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (state.overlay) return;
      if ((e.key === 'Enter' || e.key === ' ') && fromControl(e)) return;
      const k = e.key.toLowerCase();
      const idx = ['1', '2', '3', '4'].indexOf(k) >= 0 ? ['1', '2', '3', '4'].indexOf(k) : ['a', 'b', 'c', 'd'].indexOf(k);
      if (!solved && idx >= 0 && idx < q.options.length) choose(idx);
      if (solved && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        onSolved(solved === 'class' && wrong.length === 0);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const correctIdx = q.options.findIndex((o) => o.correct);

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-night/95 anim-fade" role="dialog" aria-label={q.prompt}>
      <div className="flex items-start gap-8 px-16 pt-10">
        <div className={`flex-1 ${!solved && timer > 0 ? 'pr-[240px]' : 'pr-[280px]'}`}>
          {intro && <p className="mb-2 text-[26px] text-frost">{intro}</p>}
          <h2 className="font-pixel text-[54px] font-bold leading-[1.05] text-gold">
            {solved ? (solved === 'class' ? 'The class got it.' : 'Here’s the answer.') : q.prompt.replace(/^/, 'CLASS: ')}
          </h2>
          <p className="mt-4 max-w-[1150px] text-[38px] leading-snug text-snow">{q.stem}</p>
        </div>
        {!solved && timer > 0 && (
          <div className="absolute right-16 top-[92px] flex flex-col items-center gap-3">
            <Countdown seconds={timer} running={running} onDone={() => setTimeUp(true)} size={140} />
            <div className="flex gap-2">
              <Btn size="sm" variant="ghost" onClick={() => setRunning((r) => !r)} disabled={timeUp}>
                {running ? 'Pause' : 'Resume'}
              </Btn>
            </div>
          </div>
        )}
      </div>

      {!solved && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-x-10 gap-y-8 px-16">
            {q.options.map((o, i) => {
              const isWrong = wrong.includes(i);
              return (
                <div key={i} className={`flex items-center gap-4 ${shake === i ? 'anim-shake' : ''}`}>
                  <button
                    type="button"
                    onClick={() => choose(i)}
                    onMouseEnter={() => audio.sfx('hover')}
                    disabled={isWrong}
                    className={`frame flex flex-1 items-start gap-5 p-5 text-left transition-transform ${isWrong ? 'frame-berry opacity-80' : 'frame-ice cursor-pointer hover:-translate-y-1'}`}
                    style={{ minHeight: 120 }}
                  >
                    <span
                      className={`grid h-[64px] w-[64px] shrink-0 place-items-center font-pixel text-[42px] font-bold ${isWrong ? 'bg-berry text-snow' : 'bg-gold text-ink'}`}
                    >
                      {LETTERS[i]}
                    </span>
                    <span className="flex-1">
                      <span className={`block text-[32px] leading-tight ${isWrong ? 'text-frost line-through decoration-berry decoration-4' : 'text-snow'}`}>{o.text}</span>
                      {isWrong && o.why && <span className="mt-2 block text-[24px] leading-snug text-[#ffb3ba]">{o.why}</span>}
                    </span>
                  </button>
                  {counting && !isWrong && (
                    <Tally value={tally[i]} onChange={(v) => setTally((t) => t.map((x, j) => (j === i ? v : x)))} />
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-auto flex items-center gap-5 px-16 pb-10">
            <p className="flex-1 text-[24px] text-frost">
              {timeUp ? (
                <span className="font-pixel text-[30px] text-berry-light">Time! Lock in the class’s answer.</span>
              ) : (
                <>Discuss, then click the class’s answer (or press 1–4).</>
              )}
            </p>
            <Btn size="sm" variant="ghost" onClick={() => setCounting((c) => !c)} aria-pressed={counting}>
              {counting ? 'Hide hand count' : 'Count hands'}
            </Btn>
            <Btn size="sm" variant="hex" onClick={reveal}>
              <Icon name="eye" size={22} /> Reveal answer
            </Btn>
          </div>
        </>
      )}

      {solved && (
        <div className="mt-4 flex flex-1 flex-col px-16 pb-10 anim-rise">
          <div className="frame frame-gold flex items-center gap-5 px-6 py-4">
            <span className="grid h-[60px] w-[60px] shrink-0 place-items-center bg-pine font-pixel text-[38px] font-bold text-snow">{LETTERS[correctIdx]}</span>
            <span className="text-[34px] text-snow">{q.options[correctIdx].text}</span>
          </div>
          <div className="mt-8 flex flex-1 gap-12">
            <div className="flex shrink-0 items-center justify-center" style={{ minWidth: 640 }}>
              <ChiDiagram lines={q.full} fontSize={q.full.flat().reduce((n, s) => n + s.t.length, 0) > 80 ? 26 : 30} gap={2} />
            </div>
            <div className="flex flex-1 flex-col gap-5 text-[28px] leading-snug">
              <p>
                <span className="font-pixel text-[26px] text-ice">What’s reversed</span>
                <br />
                {q.structure}
              </p>
              <p>
                <span className="font-pixel text-[26px] text-gold">Why it matters</span>
                <br />
                {q.effect}
              </p>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Btn size="lg" onClick={() => onSolved(solved === 'class' && wrong.length === 0)} autoFocus>
              {continueLabel}
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}

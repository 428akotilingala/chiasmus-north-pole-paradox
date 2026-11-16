import { useEffect, useState } from 'react';
import { audio } from '../audio/audio';
import { NOTES } from '../content/script';
import { ACHIEVEMENTS, SEQUENCES, STEP_LABEL, useStore } from '../state/store';
import { Btn, Icon } from './kit';

export function toggleFullscreen() {
  try {
    if (!document.fullscreenElement) void document.documentElement.requestFullscreen?.().catch(() => {});
    else void document.exitFullscreen?.();
  } catch {
    /* fullscreen not allowed here */
  }
}

/** Top-right presenter controls, always on screen. */
export function HudControls() {
  const { state, dispatch } = useStore();
  const muted = !state.settings.music && !state.settings.sfx;
  const inGame = state.view === 'game';
  const btn = 'grid h-[52px] min-w-[52px] place-items-center gap-2 px-3 bg-night-3/90 text-snow hover:bg-night-4 cursor-pointer';
  const edge = { boxShadow: '0 0 0 3px #070b14, inset 0 -4px 0 #141d33' };
  return (
    <div className="absolute right-5 top-5 z-50 flex gap-3" data-testid="hud">
      {inGame && (
        <button type="button" className={btn} style={edge} title="Presenter notes (N)" aria-label="Presenter notes" onClick={() => dispatch({ type: 'notes' })}>
          <span className="flex items-center gap-2 font-pixel text-[20px]">
            <Icon name="notes" size={24} /> Notes
          </span>
        </button>
      )}
      <button
        type="button"
        className={btn}
        style={edge}
        title="Mute (M)"
        aria-label={muted ? 'Unmute' : 'Mute'}
        onClick={() => {
          audio.unlock();
          dispatch({ type: 'settings', patch: { music: muted, sfx: muted } });
        }}
      >
        <Icon name={muted ? 'mute' : 'sound'} size={26} />
      </button>
      <button type="button" className={btn} style={edge} title="Fullscreen (F)" aria-label="Fullscreen" onClick={toggleFullscreen}>
        <Icon name="full" size={24} />
      </button>
      {inGame && (
        <button type="button" className={btn} style={edge} title="Pause (Esc)" aria-label="Pause" onClick={() => dispatch({ type: 'overlay', overlay: state.overlay ? null : 'pause' })}>
          <Icon name="pause" size={24} />
        </button>
      )}
    </div>
  );
}

export function Toasts() {
  const { state, dispatch } = useStore();
  useEffect(() => {
    if (!state.toasts.length) return;
    const t = state.toasts[0];
    const id = window.setTimeout(() => dispatch({ type: 'dismiss', id: t.id }), t.tone === 'achievement' ? 4200 : 3200);
    return () => clearTimeout(id);
  }, [state.toasts, dispatch]);
  return (
    <div className="pointer-events-none absolute left-1/2 top-4 z-[60] flex -translate-x-1/2 flex-col items-center gap-3" aria-live="polite">
      {state.toasts.map((t) => (
        <div
          key={t.id}
          className={`frame anim-pop px-6 py-3 font-pixel text-[26px] ${t.tone === 'achievement' ? 'frame-gold text-gold' : t.tone === 'good' ? 'frame-ice text-ice' : t.tone === 'bad' ? 'frame-berry text-[#ffb3ba]' : 'text-snow'}`}
        >
          {t.tone === 'achievement' ? '★ ' : ''}
          {t.text}
        </div>
      ))}
    </div>
  );
}

/** Presenter notes drawer. Visible to the room on a single projector, so the answer key stays hidden until asked for. */
export function PresenterNotes() {
  const { state, dispatch, step, sequence } = useStore();
  const [showAnswer, setShowAnswer] = useState(false);
  useEffect(() => setShowAnswer(false), [step]);
  if (!state.notes || !step) return null;
  const n = NOTES[step];
  return (
    <aside className="frame frame-ice absolute bottom-6 right-6 top-24 z-40 flex w-[560px] flex-col gap-4 p-7 anim-fade" style={{ ['--panel' as string]: 'rgba(16,24,39,0.97)' }} aria-label="Presenter notes">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-pixel text-[30px] text-ice">Presenter notes</h2>
        <span className="text-[20px] text-frost">{n.time}</span>
      </div>
      <p className="font-pixel text-[22px] text-gold">{STEP_LABEL[step]}</p>
      <div className="scroll-y flex-1 space-y-5 text-[22px] leading-snug">
        <div>
          <p className="font-pixel text-[20px] text-berry-light">Presenter 1</p>
          <ul className="list-disc pl-6">{n.p1.map((l, i) => <li key={i}>{l}</li>)}</ul>
        </div>
        <div>
          <p className="font-pixel text-[20px] text-[#4fd1a5]">Presenter 2</p>
          <ul className="list-disc pl-6">{n.p2.map((l, i) => <li key={i}>{l}</li>)}</ul>
        </div>
        {n.answer && (
          <div>
            {showAnswer ? (
              <p className="bg-night-3 p-3 text-[21px]"><span className="font-pixel text-gold">Answer key: </span>{n.answer}</p>
            ) : (
              <Btn size="sm" variant="ghost" onClick={() => setShowAnswer(true)}>
                <Icon name="eye" size={20} /> Show answer key
              </Btn>
            )}
          </div>
        )}
      </div>
      <div className="flex gap-3">
        <Btn size="sm" variant="ghost" onClick={() => dispatch({ type: 'notes', open: false })}>
          Close (N)
        </Btn>
        {state.progress && state.progress.step < sequence.length - 1 && (
          <Btn size="sm" variant="hex" onClick={() => dispatch({ type: 'next' })}>
            <Icon name="skip" size={20} /> Skip chapter
          </Btn>
        )}
      </div>
    </aside>
  );
}

export function PauseOverlay() {
  const { state, dispatch } = useStore();
  if (state.overlay !== 'pause' && state.overlay !== 'chapters') return null;
  const p = state.progress;
  const seq = p ? SEQUENCES[p.mode] : [];
  return (
    <div className="absolute inset-0 z-[45] grid place-items-center bg-ink/80 anim-fade" role="dialog" aria-label="Paused">
      <div className="frame frame-gold w-[760px] p-10">
        {state.overlay === 'pause' ? (
          <>
            <h2 className="font-pixel text-[64px] text-gold">Paused</h2>
            <p className="mb-8 text-[24px] text-frost">{p ? STEP_LABEL[seq[p.step]] : ''}</p>
            <div className="grid grid-cols-2 gap-6">
              <Btn onClick={() => dispatch({ type: 'overlay', overlay: null })} autoFocus>
                Resume
              </Btn>
              <Btn variant="ghost" onClick={() => dispatch({ type: 'restartStep' })}>
                Restart chapter
              </Btn>
              <Btn variant="ghost" onClick={() => dispatch({ type: 'overlay', overlay: 'chapters' })}>
                Chapters
              </Btn>
              <Btn variant="ghost" onClick={() => dispatch({ type: 'overlay', overlay: 'settings' })}>
                Settings
              </Btn>
              <Btn variant="ice" onClick={() => dispatch({ type: 'overlay', overlay: 'archive' })}>
                Kennedy examples
              </Btn>
              <Btn variant="red" sound="back" onClick={() => dispatch({ type: 'quit' })}>
                Quit to title
              </Btn>
            </div>
            {p && p.achievements.length > 0 && (
              <p className="mt-8 text-[22px] text-frost">
                Achievements: {p.achievements.map((a) => ACHIEVEMENTS[a]?.name).join(', ')}
              </p>
            )}
          </>
        ) : (
          <>
            <h2 className="mb-6 font-pixel text-[48px] text-gold">Jump to a chapter</h2>
            <ol className="scroll-y grid max-h-[520px] gap-3">
              {seq.map((id, i) => (
                <li key={id}>
                  <button
                    type="button"
                    className={`frame flex w-full items-center gap-5 px-5 py-3 text-left text-[26px] hover:brightness-125 ${p && i === p.step ? 'frame-gold' : ''}`}
                    onClick={() => {
                      audio.sfx('select');
                      dispatch({ type: 'jump', step: i });
                    }}
                  >
                    <span className="font-pixel text-gold">{i + 1}</span>
                    {STEP_LABEL[id]}
                  </button>
                </li>
              ))}
            </ol>
            <div className="mt-6">
              <Btn variant="ghost" sound="back" onClick={() => dispatch({ type: 'overlay', overlay: 'pause' })}>
                <Icon name="back" size={22} /> Back
              </Btn>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

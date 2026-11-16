import { useEffect } from 'react';
import { audio } from './audio/audio';
import { Briefing } from './screens/Briefing';
import { CaseScreen } from './screens/CaseScreen';
import { Ending } from './screens/Ending';
import { Final } from './screens/Final';
import { Intro } from './screens/Intro';
import { MazeScreen } from './screens/MazeScreen';
import { Archive, HowTo, SettingsPanel } from './screens/Panels';
import { Title } from './screens/Title';
import { StoreProvider, useStore, type StepId } from './state/store';
import { HudControls, PauseOverlay, PresenterNotes, Toasts, toggleFullscreen } from './ui/Chrome';
import { Stage } from './ui/Stage';

function StepView({ step }: { step: StepId }) {
  switch (step) {
    case 'intro':
      return <Intro />;
    case 'briefing':
      return <Briefing />;
    case 'case1':
    case 'case2':
    case 'case3':
      return <CaseScreen caseId={step} />;
    case 'maze1':
    case 'maze2':
    case 'maze3':
    case 'mazeX':
      return <MazeScreen levelId={step} />;
    case 'final':
      return <Final />;
    case 'ending':
      return <Ending />;
  }
}

function Shell() {
  const { state, dispatch, step } = useStore();

  // audio may only start after a user gesture
  useEffect(() => {
    const unlock = () => audio.unlock();
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  // presenter keys
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key;
      if (k === 'Escape') {
        if (state.overlay === 'pause') dispatch({ type: 'overlay', overlay: null });
        else if (state.overlay) dispatch({ type: 'overlay', overlay: state.view === 'game' && step !== 'ending' ? 'pause' : null });
        else if (state.view === 'game') dispatch({ type: 'overlay', overlay: 'pause' });
        else if (state.view !== 'title') dispatch({ type: 'view', view: 'title' });
      } else if ((k === 'n' || k === 'N') && state.view === 'game') {
        dispatch({ type: 'notes' });
      } else if (k === 'm' || k === 'M') {
        const muted = !state.settings.music && !state.settings.sfx;
        dispatch({ type: 'settings', patch: { music: muted, sfx: muted } });
      } else if (k === 'f' || k === 'F') {
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state.overlay, state.view, state.settings, step, dispatch]);

  const toTitle = () => dispatch({ type: 'view', view: 'title' });
  const closeOverlay = () => dispatch({ type: 'overlay', overlay: step === 'ending' ? null : 'pause' });

  return (
    <Stage reducedMotion={state.settings.reducedMotion}>
      {state.view === 'title' && <Title />}
      {state.view === 'howto' && <HowTo onClose={toTitle} />}
      {state.view === 'settings' && <SettingsPanel onClose={toTitle} />}
      {state.view === 'archive' && <Archive onClose={toTitle} />}
      {state.view === 'game' && step && <StepView key={state.stepKey} step={step} />}
      {state.overlay === 'settings' && <SettingsPanel onClose={closeOverlay} />}
      {state.overlay === 'archive' && <Archive onClose={closeOverlay} />}
      <PauseOverlay />
      <PresenterNotes />
      <Toasts />
      <HudControls />
    </Stage>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}

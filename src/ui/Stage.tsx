import { createContext, useContext, useLayoutEffect, useState, type ReactNode } from 'react';

export const STAGE_W = 1600;
export const STAGE_H = 900;

const ScaleCtx = createContext(1);
export const useStageScale = () => useContext(ScaleCtx);

/** Fixed 1600x900 stage scaled to fit the window (identical layout on every screen size). */
export function Stage({ children, reducedMotion }: { children: ReactNode; reducedMotion: boolean }) {
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H));
    fit();
    window.addEventListener('resize', fit);
    document.addEventListener('fullscreenchange', fit);
    return () => {
      window.removeEventListener('resize', fit);
      document.removeEventListener('fullscreenchange', fit);
    };
  }, []);
  return (
    <ScaleCtx.Provider value={scale}>
      <div className="fixed inset-0" style={{ background: 'radial-gradient(ellipse at center, #141e33 0%, #070b14 75%)' }}>
        <div
          className={`stage${reducedMotion ? ' reduced-motion' : ''}`}
          style={{ transform: `translate(-50%, -50%) scale(${scale})` }}
          data-testid="stage"
          onClickCapture={(e) => {
            const b = (e.target as HTMLElement).closest('button');
            if (b && e.detail > 0) window.setTimeout(() => b.blur(), 0);
          }}
        >
          {children}
        </div>
      </div>
    </ScaleCtx.Provider>
  );
}

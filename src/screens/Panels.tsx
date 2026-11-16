import { useState } from 'react';
import * as T from '../art/tiles';
import { dataUrl } from '../art/px';
import { elfSprite, reindeerSprite } from '../art/characters';
import { lines } from '../content/markup';
import { useStore, type Settings } from '../state/store';
import { ChiDiagram } from '../ui/Chi';
import { Btn, Icon, Kbd } from '../ui/kit';

function Shell({ title, onClose, children, testid }: { title: string; onClose: () => void; children: React.ReactNode; testid: string }) {
  return (
    <div className="absolute inset-0 z-[46] flex flex-col bg-night px-14 pb-8 pt-8" data-testid={testid}>
      <div className="flex items-center gap-6 pr-[260px]">
        <Btn variant="ghost" sound="back" onClick={onClose}>
          <Icon name="back" /> Back
        </Btn>
        <h1 className="font-pixel text-[60px] font-bold leading-none text-gold">{title}</h1>
      </div>
      {children}
    </div>
  );
}

function Toggle({ label, desc, on, set }: { label: string; desc: string; on: boolean; set: (v: boolean) => void }) {
  return (
    <button type="button" className="frame flex w-full items-center gap-6 px-6 py-4 text-left hover:brightness-110" onClick={() => set(!on)} aria-pressed={on}>
      <span className="flex-1">
        <span className="block font-pixel text-[30px]">{label}</span>
        <span className="block text-[22px] text-frost">{desc}</span>
      </span>
      <span className={`grid h-12 w-[110px] place-items-center font-pixel text-[26px] font-bold ${on ? 'bg-pine text-snow' : 'bg-night-4 text-frost'}`}>{on ? 'On' : 'Off'}</span>
    </button>
  );
}

function Choice<V extends string | number>({ label, desc, value, options, set }: { label: string; desc: string; value: V; options: { v: V; label: string }[]; set: (v: V) => void }) {
  return (
    <div className="frame flex items-center gap-6 px-6 py-4">
      <span className="flex-1">
        <span className="block font-pixel text-[30px]">{label}</span>
        <span className="block text-[22px] text-frost">{desc}</span>
      </span>
      <span className="flex gap-2" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={String(o.v)}
            type="button"
            role="radio"
            aria-checked={value === o.v}
            onClick={() => set(o.v)}
            className={`h-12 min-w-[90px] px-3 font-pixel text-[24px] font-bold ${value === o.v ? 'bg-gold text-ink' : 'bg-night-4 text-frost hover:text-snow'}`}
          >
            {o.label}
          </button>
        ))}
      </span>
    </div>
  );
}

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore();
  const s = state.settings;
  const set = (patch: Partial<Settings>) => dispatch({ type: 'settings', patch });
  const [confirm, setConfirm] = useState(false);
  return (
    <Shell title="Settings" onClose={onClose} testid="settings">
      <div className="mt-8 grid max-w-[1200px] gap-6">
        <div className="grid grid-cols-2 gap-6">
          <Toggle label="Music" desc="Original soundtrack, made in your browser." on={s.music} set={(v) => set({ music: v })} />
          <Toggle label="Sound effects" desc="Doors, mirrors, votes, and celebrations." on={s.sfx} set={(v) => set({ sfx: v })} />
        </div>
        <Toggle label="Reduced motion" desc="Stops screen shake, flips, falling snow, and fireworks. Everything still works." on={s.reducedMotion} set={(v) => set({ reducedMotion: v })} />
        <Choice
          label="Class vote timer"
          desc="Countdown for every class question. Off removes time pressure."
          value={s.timer}
          options={[
            { v: 0, label: 'Off' },
            { v: 10, label: '10s' },
            { v: 20, label: '20s' },
            { v: 30, label: '30s' },
          ]}
          set={(v) => set({ timer: v as Settings['timer'] })}
        />
        <Choice
          label="Touch controls in the maze"
          desc="On-screen pad for touchscreens. Auto shows it on touch devices."
          value={s.touch}
          options={[
            { v: 'auto', label: 'Auto' },
            { v: 'on', label: 'On' },
            { v: 'off', label: 'Off' },
          ]}
          set={(v) => set({ touch: v as Settings['touch'] })}
        />
        <div className="flex items-center gap-6">
          {confirm ? (
            <>
              <span className="text-[24px]">Erase saved progress and achievements on this computer?</span>
              <Btn variant="red" size="sm" onClick={() => { dispatch({ type: 'resetAll' }); setConfirm(false); }}>
                Erase progress
              </Btn>
              <Btn variant="ghost" size="sm" onClick={() => setConfirm(false)}>
                Keep it
              </Btn>
            </>
          ) : (
            <Btn variant="ghost" size="sm" onClick={() => setConfirm(true)}>
              Reset saved progress
            </Btn>
          )}
        </div>
      </div>
      <p className="mt-auto text-[22px] text-frost">
        Presenter keys anywhere: <Kbd>N</Kbd> notes, <Kbd>Esc</Kbd> pause, <Kbd>F</Kbd> fullscreen, <Kbd>M</Kbd> mute.
      </p>
    </Shell>
  );
}

const JFK = [
  {
    quote: lines('Ask not what [A:your country] can do for [B:you] —', 'ask what [B:you] can do for [A:your country].'),
    source: 'John F. Kennedy, Inaugural Address, January 20, 1961',
    url: 'https://www.jfklibrary.org/archives/other-resources/john-f-kennedy-speeches/inaugural-address-19610120',
    structure: 'A = your country, B = you. The second half reverses who serves whom.',
    purpose: 'Encourages citizens to prioritize service and civic responsibility over personal benefit.',
    effect:
      'The swap turns a familiar expectation (what will my country do for me?) into a challenge to the listener. The balanced, mirrored shape makes that challenge easy to remember and repeat.',
  },
  {
    quote: lines('[A:Mankind] must put an end to [B:war] —', 'or [B:war] will put an end to [A:mankind].'),
    source: 'John F. Kennedy, Address to the United Nations General Assembly, September 25, 1961',
    url: 'https://www.jfklibrary.org/archives/other-resources/john-f-kennedy-speeches/united-nations-19610925',
    structure: 'A = mankind, B = war. The reversal swaps which one ends the other.',
    purpose: 'Emphasizes the existential danger of war by reversing humanity’s relationship with it.',
    effect:
      'Spoken during the nuclear arms race, the mirror leaves only two outcomes: people act on war, or war acts on people. The symmetry makes the stakes feel urgent and unavoidable.',
  },
];

export function Archive({ onClose }: { onClose: () => void }) {
  return (
    <Shell title="Chiasmus in history" onClose={onClose} testid="archive">
      <p className="mt-3 text-[25px] text-frost">Two real examples from John F. Kennedy, for your rhetorical device organizer. Quotations are from the JFK Presidential Library transcripts.</p>
      <div className="mt-6 grid flex-1 grid-cols-2 gap-8">
        {JFK.map((j) => (
          <article key={j.source} className="frame frame-gold flex flex-col p-7">
            <div className="flex justify-center py-2">
              <ChiDiagram lines={j.quote} fontSize={28} gap={1.8} animate={false} />
            </div>
            <dl className="mt-5 space-y-3 text-[22px] leading-snug">
              <div>
                <dt className="font-pixel text-[22px] text-ice">What reverses</dt>
                <dd>{j.structure}</dd>
              </div>
              <div>
                <dt className="font-pixel text-[22px] text-gold">Purpose</dt>
                <dd>{j.purpose}</dd>
              </div>
              <div>
                <dt className="font-pixel text-[22px] text-[#4fd1a5]">Effect on the audience</dt>
                <dd>{j.effect}</dd>
              </div>
            </dl>
            <p className="mt-auto pt-4 text-[19px] text-frost">
              Source: {j.source}.{' '}
              <a href={j.url} target="_blank" rel="noreferrer" className="underline decoration-2 underline-offset-4">
                JFK Library transcript
              </a>
            </p>
          </article>
        ))}
      </div>
    </Shell>
  );
}

function TileImg({ k, paint, size = 64 }: { k: string; paint: () => ReturnType<typeof T.floor>; size?: number }) {
  return <img src={dataUrl(k, paint)} width={size} height={size} alt="" className="pixelated shrink-0" style={{ width: size, height: size }} />;
}

export function HowTo({ onClose }: { onClose: () => void }) {
  const legend: { k: string; paint: () => ReturnType<typeof T.floor>; text: string }[] = [
    { k: 'h-pad', paint: () => T.mirrorPad('A', 0), text: 'Mirror pad. Stand on it and press R to flip between Reality A-B and Mirror B-A.' },
    { k: 'h-da', paint: () => T.door('A', 'A', false), text: 'Gold door. Open in Reality A-B, shut in Mirror B-A.' },
    { k: 'h-db', paint: () => T.door('A', 'B', false), text: 'Cyan door. Open in Mirror B-A, shut in Reality A-B.' },
    { k: 'h-br', paint: () => T.bridge('B', '=', true, false), text: 'Ice bridge. Only exists in Mirror B-A.' },
    { k: 'h-gi', paint: () => T.gingerbread('A', true), text: 'Feral gingerbread. Dangerous in one reality, a faint outline in the other.' },
    { k: 'h-gate', paint: () => T.gate('A', false), text: 'Chiasmus gate. Walk into it and the class completes the reversal.' },
    { k: 'h-box', paint: () => T.giftBox(), text: 'Gift box. Push it onto a pressure plate to open candy-cane doors.' },
    { k: 'h-lev', paint: () => T.lever('A', false), text: 'Lever. Walk into it to open the green door.' },
    { k: 'h-lan', paint: () => T.lantern('A', true, 0), text: 'Lantern checkpoint. Ambushes send you back here; Backspace resets the room.' },
    { k: 'h-deer', paint: () => reindeerSprite(0), text: 'Reverso the reindeer. Speaks only in reversals. Hints included.' },
  ];
  return (
    <Shell title="How to play" onClose={onClose} testid="howto">
      <div className="mt-6 grid flex-1 grid-cols-[1fr_1.15fr] gap-10">
        <div className="space-y-5 text-[23px] leading-snug">
          <div className="frame p-5">
            <h2 className="font-pixel text-[30px] text-ice">The mission</h2>
            <p>Interview elves and vote out the one whose sentence isn’t really chiasmus. Each caught impostor gives you a mirror fragment. Then cross the Mirror Maze and rebuild the Reality Mirror.</p>
          </div>
          <div className="frame p-5">
            <h2 className="font-pixel text-[30px] text-ice">Controls</h2>
            <ul className="mt-2 space-y-2">
              <li><Kbd>WASD</Kbd> or <Kbd>Arrows</Kbd> move the elf</li>
              <li><Kbd>R</Kbd> reverse reality (on a mirror pad)</li>
              <li><Kbd>Space</Kbd> interact, <Kbd>Backspace</Kbd> reset the room</li>
              <li><Kbd>1</Kbd>–<Kbd>4</Kbd> pick an answer, <Kbd>Enter</Kbd> continue</li>
              <li>Touchscreens get an on-screen pad in the maze.</li>
            </ul>
          </div>
          <div className="frame frame-gold p-5">
            <h2 className="font-pixel text-[30px] text-gold">Running it in class</h2>
            <p>One person drives; the class votes by raising hands. <Kbd>N</Kbd> presenter notes, <Kbd>Esc</Kbd> pause and chapters, <Kbd>F</Kbd> fullscreen, <Kbd>M</Kbd> mute. Nothing advances until you click.</p>
          </div>
        </div>
        <div className="frame flex flex-col p-5">
          <h2 className="font-pixel text-[30px] text-ice">Mirror Maze field guide</h2>
          <div className="mt-3 grid flex-1 grid-cols-1 content-between gap-2">
            <div className="flex items-center gap-4 text-[22px] leading-tight">
              <TileImg k="h-elf" paint={() => elfSprite('down', 0)} size={56} />
              <span>You, a tiny N.R.I.D. agent.</span>
            </div>
            {legend.map((l) => (
              <div key={l.k} className="flex items-center gap-4 text-[21px] leading-tight">
                <TileImg k={l.k} paint={l.paint} size={56} />
                <span>{l.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Shell>
  );
}

import { useEffect, useState } from 'react';
import { elfPortrait, grinchPortrait, reindeerPortrait, santaPortrait, type GrinchMood } from '../art/characters';
import { dataUrl } from '../art/px';
import type { ElfLook, Expression } from '../content/types';

type Who =
  | { kind: 'elf'; look: ElfLook; expr?: Expression }
  | { kind: 'santa'; expr?: 'alarm' | 'happy' }
  | { kind: 'grinch'; mood?: GrinchMood }
  | { kind: 'reindeer' };

function keyOf(w: Who, blink: boolean, talk: boolean) {
  switch (w.kind) {
    case 'elf':
      return `elf:${JSON.stringify(w.look)}:${talk ? 'talk' : w.expr ?? 'idle'}:${blink}`;
    case 'santa':
      return `santa:${w.expr}:${blink}`;
    case 'grinch':
      return `grinch:${talk && w.mood !== 'dizzy' ? 'shout' : w.mood}:${blink}`;
    case 'reindeer':
      return `deer:${blink}:${talk}`;
  }
}

function paint(w: Who, blink: boolean, talk: boolean) {
  switch (w.kind) {
    case 'elf':
      return elfPortrait(w.look, talk ? 'talk' : w.expr ?? 'idle', blink);
    case 'santa':
      return santaPortrait(w.expr ?? 'alarm', blink);
    case 'grinch':
      return grinchPortrait(talk && w.mood !== 'dizzy' ? 'shout' : w.mood ?? 'grin', blink);
    case 'reindeer':
      return reindeerPortrait(blink, talk);
  }
}

/** Animated pixel portrait: blinks every few seconds and flaps its mouth while talking. */
export function Portrait({
  who,
  size = 192,
  talking = false,
  flip = false,
  className = '',
  still = false,
}: {
  who: Who;
  size?: number;
  talking?: boolean;
  flip?: boolean;
  className?: string;
  still?: boolean;
}) {
  const [blink, setBlink] = useState(false);
  const [mouth, setMouth] = useState(false);

  useEffect(() => {
    if (still) return;
    let t: number;
    const loop = () => {
      t = window.setTimeout(() => {
        setBlink(true);
        t = window.setTimeout(() => {
          setBlink(false);
          loop();
        }, 140);
      }, 2400 + Math.random() * 2600);
    };
    loop();
    return () => clearTimeout(t);
  }, [still]);

  useEffect(() => {
    if (!talking) return;
    const id = window.setInterval(() => setMouth((m) => !m), 150);
    return () => {
      clearInterval(id);
      setMouth(false);
    };
  }, [talking]);

  const talk = talking && mouth;
  const src = dataUrl(keyOf(who, blink, talk), () => paint(who, blink, talk), 1);
  return (
    <img
      src={src}
      width={size}
      height={size}
      alt=""
      draggable={false}
      className={`pixelated ${className}`}
      style={{ width: size, height: size, transform: flip ? 'scaleX(-1)' : undefined }}
    />
  );
}

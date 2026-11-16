/*
  Procedural audio: an original soundtrack and sound effects synthesized with
  the Web Audio API. No audio files, no network. The AudioContext is created
  only after the first user gesture, so nothing autoplays.
*/

export type Mood = 'menu' | 'investigate' | 'maze' | 'reveal' | 'boss' | 'victory' | 'none';
export type Sfx =
  | 'hover' | 'select' | 'back' | 'step' | 'door' | 'mirror' | 'correct' | 'wrong' | 'eject' | 'promote'
  | 'victory' | 'tick' | 'tock' | 'timeup' | 'type' | 'bonk' | 'push' | 'lever' | 'sparkle' | 'checkpoint'
  | 'drumroll' | 'whoosh' | 'place' | 'shout' | 'fragment';

type Inst = 'box' | 'bell' | 'pluck' | 'bass' | 'pad' | 'square' | 'hat' | 'kick' | 'snare' | 'sub';

interface NoteEv {
  step: number;
  midi: number;
  len: number;
  inst: Inst;
  vol: number;
}

interface Track {
  bpm: number;
  steps: number;
  notes: NoteEv[];
}

const NOTE_INDEX: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

function midiOf(name: string): number {
  const m = name.match(/^([A-G])([#b]?)(-?\d)$/);
  if (!m) throw new Error(`bad note ${name}`);
  let n = NOTE_INDEX[m[1]] + (Number(m[3]) + 1) * 12;
  if (m[2] === '#') n += 1;
  if (m[2] === 'b') n -= 1;
  return n;
}

/** "C4:2 E4:2 r:4 G4:8" -> notes, durations in 16th steps */
function seq(src: string, inst: Inst, vol = 1, offset = 0): NoteEv[] {
  const out: NoteEv[] = [];
  let t = offset;
  for (const tok of src.trim().split(/\s+/)) {
    const [n, d] = tok.split(':');
    const len = Number(d ?? 1);
    if (n !== 'r') {
      for (const part of n.split('+')) out.push({ step: t, midi: midiOf(part), len, inst, vol });
    }
    t += len;
  }
  return out;
}

function every(steps: number, interval: number, inst: Inst, vol: number, offset = 0, midi = 60): NoteEv[] {
  const out: NoteEv[] = [];
  for (let s = offset; s < steps; s += interval) out.push({ step: s, midi, len: 1, inst, vol });
  return out;
}

/* ---------------- original compositions ---------------- */

const TRACKS: Record<Exclude<Mood, 'none'>, Track> = {
  // Cozy North Pole menu: music box arpeggios over a warm bass, bell melody.
  menu: {
    bpm: 92,
    steps: 128,
    notes: [
      ...seq('C3:8 G2:8 A2:8 E2:8 F2:8 C3:8 G2:8 G2:4 B2:4 C3:8 G2:8 A2:8 E2:8 F2:8 G2:8 C3:16', 'bass', 0.55),
      ...seq(
        'C4:2 E4:2 G4:2 C5:2 E5:2 C5:2 G4:2 E4:2 A3:2 C4:2 E4:2 A4:2 C5:2 A4:2 E4:2 C4:2 ' +
          'F3:2 A3:2 C4:2 F4:2 A4:2 F4:2 C4:2 A3:2 G3:2 B3:2 D4:2 G4:2 B4:2 G4:2 F4:2 D4:2 ' +
          'C4:2 E4:2 G4:2 C5:2 E5:2 C5:2 G4:2 E4:2 A3:2 C4:2 E4:2 A4:2 C5:2 A4:2 E4:2 C4:2 ' +
          'F3:2 A3:2 C4:2 F4:2 G3:2 B3:2 D4:2 G4:2 C4:2 E4:2 G4:2 C5:2 G4:4 r:4',
        'box',
        0.32,
      ),
      ...seq(
        'E5:4 G5:4 C6:6 B5:2 A5:4 G5:4 E5:8 F5:4 A5:4 C6:4 A5:4 G5:6 F5:2 E5:4 D5:4 ' +
          'E5:4 G5:4 C6:6 D6:2 E6:4 D6:4 C6:8 A5:4 C6:4 B5:4 G5:4 C6:16',
        'bell',
        0.36,
      ),
      ...every(128, 4, 'hat', 0.09, 2),
    ],
  },
  // Suspicious investigation: tiptoe pizzicato in D minor.
  investigate: {
    bpm: 104,
    steps: 64,
    notes: [
      ...seq('D2:2 r:2 F2:2 r:2 A2:2 r:2 G#2:2 r:2 G2:2 r:2 Bb2:2 r:2 D3:2 r:2 C#3:2 r:2 ' +
        'D2:2 r:2 F2:2 r:2 A2:2 r:2 G#2:2 r:2 Bb2:2 r:2 A2:2 r:2 G2:2 r:2 A2:2 r:2', 'pluck', 0.6),
      ...seq('r:4 D5:1 r:1 F5:1 r:1 r:4 E5:1 r:1 C#5:1 r:1 r:4 D5:1 r:1 A4:1 r:1 r:4 Bb4:2 A4:2 ' +
        'r:4 D5:1 r:1 F5:1 r:1 r:4 G5:1 r:1 F5:1 r:1 r:4 E5:1 r:1 C#5:1 r:1 D5:4 r:4', 'pluck', 0.28),
      ...seq('r:28 A5:2 Bb5:2 r:28 C#6:2 D6:2', 'bell', 0.16),
      ...every(64, 4, 'hat', 0.07, 2),
      ...every(64, 16, 'kick', 0.18, 0),
    ],
  },
  // Magical mirror maze: dreamy E minor / C / G / D arpeggios with shimmer.
  maze: {
    bpm: 84,
    steps: 64,
    notes: [
      ...seq('E2:16 C2:16 G2:16 D2:16', 'sub', 0.45),
      ...seq('E3+G3+B3:16 C3+E3+G3:16 G3+B3+D4:16 D3+F#3+A3:16', 'pad', 0.13),
      ...seq(
        'E4:2 B4:2 G4:2 B4:2 F#5:2 B4:2 G4:2 B4:2 C4:2 G4:2 E4:2 G4:2 D5:2 G4:2 E4:2 G4:2 ' +
          'G4:2 D5:2 B4:2 D5:2 A5:2 D5:2 B4:2 D5:2 D4:2 A4:2 F#4:2 A4:2 E5:2 A4:2 F#4:2 A4:2',
        'box',
        0.22,
      ),
      ...seq('r:8 B5:4 r:4 r:8 G5:4 r:4 r:8 D6:4 r:4 r:8 F#5:4 E5:4', 'bell', 0.18),
    ],
  },
  // Dramatic reveal: low pulse and rising tension.
  reveal: {
    bpm: 120,
    steps: 32,
    notes: [
      ...every(32, 4, 'kick', 0.32, 0, 40),
      ...seq('D2+A2:16 Eb2+Bb2:16', 'pad', 0.18),
      ...every(32, 1, 'snare', 0.05, 0),
    ],
  },
  // Final boss: fast A minor ostinato; the lead literally repeats A-A-A-A.
  boss: {
    bpm: 144,
    steps: 64,
    notes: [
      ...seq('A2:2 A2:2 A3:2 A2:2 G2:2 A2:2 C3:2 A2:2 F2:2 F2:2 F3:2 F2:2 E2:2 E2:2 G#2:2 B2:2 ' +
        'A2:2 A2:2 A3:2 A2:2 G2:2 A2:2 C3:2 A2:2 F2:2 F2:2 D3:2 F2:2 E2:2 G#2:2 B2:2 E3:2', 'bass', 0.55),
      ...seq('A5:1 r:1 A5:1 r:1 A5:1 r:1 A5:2 r:10 r:16 A5:1 r:1 A5:1 r:1 A5:1 r:1 A5:2 r:10 E5:4 F5:4 G#5:4 B5:4', 'square', 0.16),
      ...every(64, 8, 'kick', 0.4, 0, 36),
      ...every(64, 8, 'snare', 0.22, 4),
      ...every(64, 2, 'hat', 0.06, 1),
    ],
  },
  // Christmas victory: bright fanfare in C major.
  victory: {
    bpm: 120,
    steps: 64,
    notes: [
      ...seq('G4:2 C5:2 E5:2 G5:6 E5:2 G5:2 A5:4 G5:4 E5:4 F5:2 E5:2 D5:4 C5:2 D5:2 E5:4 G5:4 C6:8 r:8', 'square', 0.16),
      ...seq('C3:8 G2:8 A2:8 F2:8 C3:8 G2:8 C3:16', 'bass', 0.5),
      ...seq('C4+E4+G4:8 G3+B3+D4:8 A3+C4+E4:8 F3+A3+C4:8 C4+E4+G4:8 G3+B3+D4:8 C4+E4+G4:16', 'pad', 0.12),
      ...seq('r:32 C6:2 G5:2 E5:2 G5:2 C6:2 E6:2 G6:4 r:16', 'bell', 0.25),
      ...every(64, 8, 'kick', 0.3, 0, 40),
      ...every(64, 8, 'snare', 0.15, 4),
      ...every(64, 2, 'hat', 0.07, 0),
    ],
  },
};

function freq(midi: number) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private musicBus!: GainNode;
  private sfxBus!: GainNode;
  private noiseBuf!: AudioBuffer;
  private musicOn = true;
  private sfxOn = true;
  private mood: Mood = 'none';
  private track: Track | null = null;
  private trackGain: GainNode | null = null;
  private stepIdx = 0;
  private nextTime = 0;
  private timer: number | null = null;
  private byStep = new Map<number, NoteEv[]>();
  private lastType = 0;

  /** Call from a user gesture. Safe to call repeatedly. */
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.8;
    const comp = this.ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 4;
    this.master.connect(comp).connect(this.ctx.destination);
    this.musicBus = this.ctx.createGain();
    this.musicBus.gain.value = this.musicOn ? 0.55 : 0;
    this.musicBus.connect(this.master);
    this.sfxBus = this.ctx.createGain();
    this.sfxBus.gain.value = this.sfxOn ? 0.9 : 0;
    this.sfxBus.connect(this.master);
    const len = this.ctx.sampleRate;
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const pending = this.mood;
    this.mood = 'none';
    if (pending !== 'none') this.play(pending);
  }

  get ready() {
    return !!this.ctx;
  }

  setMusic(on: boolean) {
    this.musicOn = on;
    if (this.ctx) this.musicBus.gain.setTargetAtTime(on ? 0.55 : 0, this.ctx.currentTime, 0.1);
  }

  setSfx(on: boolean) {
    this.sfxOn = on;
    if (this.ctx) this.sfxBus.gain.setTargetAtTime(on ? 0.9 : 0, this.ctx.currentTime, 0.05);
  }

  play(mood: Mood) {
    if (mood === this.mood) return;
    this.mood = mood;
    if (!this.ctx) return; // remembered; starts after unlock
    const ctx = this.ctx;
    if (this.trackGain) {
      const g = this.trackGain;
      g.gain.setTargetAtTime(0, ctx.currentTime, 0.25);
      setTimeout(() => g.disconnect(), 1500);
      this.trackGain = null;
    }
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (mood === 'none') return;
    this.track = TRACKS[mood];
    this.byStep.clear();
    for (const n of this.track.notes) {
      const list = this.byStep.get(n.step);
      if (list) list.push(n);
      else this.byStep.set(n.step, [n]);
    }
    this.trackGain = ctx.createGain();
    this.trackGain.gain.value = 0;
    this.trackGain.gain.setTargetAtTime(1, ctx.currentTime, 0.3);
    this.trackGain.connect(this.musicBus);
    this.stepIdx = 0;
    this.nextTime = ctx.currentTime + 0.08;
    this.timer = window.setInterval(() => this.schedule(), 25);
  }

  private schedule() {
    const ctx = this.ctx;
    const track = this.track;
    const out = this.trackGain;
    if (!ctx || !track || !out) return;
    const stepDur = 60 / track.bpm / 4;
    while (this.nextTime < ctx.currentTime + 0.12) {
      const notes = this.byStep.get(this.stepIdx);
      if (notes) for (const n of notes) this.voice(n.inst, freq(n.midi), this.nextTime, n.len * stepDur, n.vol, out);
      this.stepIdx = (this.stepIdx + 1) % track.steps;
      this.nextTime += stepDur;
    }
  }

  private env(g: GainNode, t: number, peak: number, attack: number, decay: number, sustain = 0, hold = 0) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + attack);
    if (sustain > 0) {
      g.gain.setTargetAtTime(peak * sustain, t + attack, decay / 3);
      g.gain.setTargetAtTime(0.0001, t + attack + hold, decay / 2);
    } else {
      g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    }
  }

  private osc(type: OscillatorType, f: number, t: number, dur: number, dest: AudioNode) {
    const o = this.ctx!.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    o.connect(dest);
    o.start(t);
    o.stop(t + dur + 0.05);
    return o;
  }

  private noise(t: number, dur: number, dest: AudioNode) {
    const s = this.ctx!.createBufferSource();
    s.buffer = this.noiseBuf;
    s.connect(dest);
    s.start(t, Math.random() * 0.5);
    s.stop(t + dur + 0.05);
    return s;
  }

  private voice(inst: Inst, f: number, t: number, len: number, vol: number, dest: AudioNode) {
    const ctx = this.ctx!;
    const g = ctx.createGain();
    g.connect(dest);
    switch (inst) {
      case 'box': {
        this.env(g, t, vol, 0.005, 0.6);
        this.osc('triangle', f, t, 0.7, g);
        const g2 = ctx.createGain();
        g2.gain.value = 0.25;
        g2.connect(g);
        this.osc('sine', f * 2, t, 0.4, g2);
        break;
      }
      case 'bell': {
        this.env(g, t, vol, 0.004, 1.4);
        this.osc('sine', f, t, 1.5, g);
        const g2 = ctx.createGain();
        g2.gain.value = 0.35;
        g2.connect(g);
        this.osc('sine', f * 2.76, t, 0.8, g2);
        const g3 = ctx.createGain();
        g3.gain.value = 0.15;
        g3.connect(g);
        this.osc('sine', f * 5.4, t, 0.4, g3);
        break;
      }
      case 'pluck': {
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(f * 6, t);
        lp.frequency.exponentialRampToValueAtTime(f * 1.2, t + 0.2);
        lp.connect(g);
        this.env(g, t, vol, 0.004, 0.28);
        this.osc('sawtooth', f, t, 0.3, lp);
        break;
      }
      case 'bass':
      case 'sub': {
        this.env(g, t, vol, 0.01, Math.min(len, 1.2) + 0.1, 0.6, Math.max(0.05, len - 0.08));
        this.osc(inst === 'sub' ? 'sine' : 'triangle', f, t, len + 0.4, g);
        break;
      }
      case 'pad': {
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 1100;
        lp.connect(g);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(vol, t + 0.35);
        g.gain.setValueAtTime(vol, t + Math.max(0.36, len - 0.2));
        g.gain.linearRampToValueAtTime(0.0001, t + len + 0.4);
        this.osc('sawtooth', f * 0.997, t, len + 0.5, lp);
        this.osc('sawtooth', f * 1.004, t, len + 0.5, lp);
        break;
      }
      case 'square': {
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 2600;
        lp.connect(g);
        this.env(g, t, vol, 0.006, Math.max(0.12, len), 0.7, Math.max(0.05, len - 0.05));
        this.osc('square', f, t, len + 0.3, lp);
        break;
      }
      case 'hat': {
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 7500;
        hp.connect(g);
        this.env(g, t, vol, 0.002, 0.05);
        this.noise(t, 0.08, hp);
        break;
      }
      case 'snare': {
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 1900;
        bp.connect(g);
        this.env(g, t, vol, 0.002, 0.14);
        this.noise(t, 0.16, bp);
        break;
      }
      case 'kick': {
        this.env(g, t, vol, 0.003, 0.22);
        const o = this.osc('sine', 150, t, 0.25, g);
        o.frequency.exponentialRampToValueAtTime(45, t + 0.18);
        break;
      }
    }
  }

  sfx(name: Sfx) {
    const ctx = this.ctx;
    if (!ctx || !this.sfxOn) return;
    const t = ctx.currentTime + 0.01;
    const out = this.sfxBus;
    const v = (inst: Inst, note: string, at: number, len: number, vol: number) => this.voice(inst, freq(midiOf(note)), t + at, len, vol, out);
    switch (name) {
      case 'hover':
        v('box', 'C6', 0, 0.05, 0.08);
        break;
      case 'select':
        v('box', 'E5', 0, 0.1, 0.3);
        v('box', 'A5', 0.06, 0.1, 0.3);
        break;
      case 'back':
        v('box', 'A5', 0, 0.1, 0.25);
        v('box', 'E5', 0.06, 0.1, 0.25);
        break;
      case 'type': {
        const now = performance.now();
        if (now - this.lastType < 45) return;
        this.lastType = now;
        v('box', ['C6', 'D6', 'E6'][Math.floor(Math.random() * 3)], 0, 0.03, 0.05);
        break;
      }
      case 'step': {
        const g = ctx.createGain();
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 900 + Math.random() * 400;
        lp.connect(g).connect(out);
        this.env(g, t, 0.12, 0.003, 0.07);
        this.noise(t, 0.08, lp);
        break;
      }
      case 'push':
        v('bass', 'C2', 0, 0.12, 0.4);
        this.sfxNoise(t, 0.15, 500, 0.15);
        break;
      case 'door':
        ['C5', 'E5', 'G5', 'C6'].forEach((n, i) => v('bell', n, i * 0.06, 0.2, 0.22));
        v('kick', 'C3', 0, 0.1, 0.25);
        break;
      case 'lever':
        v('pluck', 'G3', 0, 0.1, 0.5);
        v('pluck', 'D4', 0.08, 0.1, 0.4);
        v('kick', 'C3', 0, 0.1, 0.3);
        break;
      case 'mirror': {
        const g = ctx.createGain();
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.Q.value = 3;
        bp.frequency.setValueAtTime(300, t);
        bp.frequency.exponentialRampToValueAtTime(5000, t + 0.45);
        bp.frequency.exponentialRampToValueAtTime(900, t + 0.8);
        bp.connect(g).connect(out);
        this.env(g, t, 0.35, 0.05, 0.8);
        this.noise(t, 0.9, bp);
        ['E5', 'G#5', 'B5', 'E6'].forEach((n, i) => v('bell', n, 0.2 + i * 0.05, 0.4, 0.14));
        break;
      }
      case 'correct':
        ['C5', 'E5', 'G5', 'C6'].forEach((n, i) => v('bell', n, i * 0.08, 0.3, 0.3));
        break;
      case 'wrong':
        v('square', 'D#4', 0, 0.18, 0.18);
        v('square', 'A3', 0.18, 0.35, 0.18);
        break;
      case 'eject':
        this.sfxSweep(t, 200, 2400, 0.6, 0.25);
        v('kick', 'C3', 0.6, 0.1, 0.5);
        ['C6', 'G5', 'E5'].forEach((n, i) => v('bell', n, 0.7 + i * 0.07, 0.2, 0.2));
        break;
      case 'promote':
        ['G4', 'F#4', 'F4', 'E4'].forEach((n, i) => v('square', n, i * 0.28, i === 3 ? 0.8 : 0.24, 0.16));
        break;
      case 'victory':
        ['C5', 'E5', 'G5', 'C6', 'E6', 'G6'].forEach((n, i) => v('bell', n, i * 0.09, 0.4, 0.26));
        v('square', 'C5', 0, 0.6, 0.12);
        break;
      case 'tick':
        v('box', 'A6', 0, 0.03, 0.18);
        break;
      case 'tock':
        v('box', 'E6', 0, 0.03, 0.18);
        break;
      case 'timeup':
        v('square', 'A4', 0, 0.12, 0.2);
        v('square', 'A4', 0.16, 0.12, 0.2);
        v('square', 'A4', 0.32, 0.4, 0.2);
        break;
      case 'bonk':
        v('kick', 'C3', 0, 0.1, 0.5);
        this.sfxSweep(t, 900, 120, 0.25, 0.2);
        break;
      case 'sparkle':
        ['E6', 'B6', 'E7'].forEach((n, i) => v('bell', n, i * 0.04, 0.1, 0.12));
        break;
      case 'checkpoint':
        v('bell', 'G5', 0, 0.2, 0.2);
        v('bell', 'D6', 0.1, 0.3, 0.2);
        break;
      case 'drumroll':
        for (let i = 0; i < 24; i++) this.voice('snare', 200, t + i * 0.05, 0.05, 0.05 + i * 0.008, out);
        v('kick', 'C3', 1.2, 0.2, 0.5);
        break;
      case 'whoosh':
        this.sfxSweep(t, 400, 3000, 0.35, 0.18);
        break;
      case 'place':
        v('pluck', 'C5', 0, 0.08, 0.35);
        break;
      case 'shout':
        ['A3', 'A3', 'A3', 'A3'].forEach((n, i) => v('square', n, i * 0.16, 0.12, 0.16));
        break;
      case 'fragment':
        ['E5', 'B5', 'E6', 'G#6', 'B6'].forEach((n, i) => v('bell', n, i * 0.07, 0.4, 0.2));
        this.sfxSweep(t, 600, 4000, 0.5, 0.1);
        break;
    }
  }

  private sfxNoise(t: number, dur: number, f: number, vol: number) {
    const ctx = this.ctx!;
    const g = ctx.createGain();
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = f;
    lp.connect(g).connect(this.sfxBus);
    this.env(g, t, vol, 0.005, dur);
    this.noise(t, dur, lp);
  }

  private sfxSweep(t: number, from: number, to: number, dur: number, vol: number) {
    const ctx = this.ctx!;
    const g = ctx.createGain();
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 4;
    bp.frequency.setValueAtTime(from, t);
    bp.frequency.exponentialRampToValueAtTime(to, t + dur);
    bp.connect(g).connect(this.sfxBus);
    this.env(g, t, vol, 0.02, dur);
    this.noise(t, dur + 0.05, bp);
  }
}

export const audio = new AudioEngine();

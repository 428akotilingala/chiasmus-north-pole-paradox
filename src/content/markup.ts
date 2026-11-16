import type { Lines, Seg } from './types';

/**
 * Tiny markup for role-tagged sentences: "[A:Santa] trusts [B:the elves],"
 * becomes [{t:'Santa',role:'A'},{t:' trusts '},{t:'the elves',role:'B'},{t:','}].
 */
export function line(src: string): Seg[] {
  const out: Seg[] = [];
  const re = /\[([ABC]):([^\]]+)\]/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    if (m.index > last) out.push({ t: src.slice(last, m.index) });
    out.push({ t: m[2], role: m[1] as Seg['role'] });
    last = m.index + m[0].length;
  }
  if (last < src.length) out.push({ t: src.slice(last) });
  return out;
}

export function lines(...srcs: string[]): Lines {
  return srcs.map(line);
}

/** Plain text of a statement (all lines joined with spaces). */
export function plain(l: Lines): string {
  return l.map((segs) => segs.map((s) => s.t).join('')).join(' ');
}

/** Sequence of roles in reading order, e.g. ['A','B','B','A']. */
export function roleSequence(l: Lines): string[] {
  return l.flatMap((segs) => segs.filter((s) => s.role).map((s) => s.role as string));
}

/** True when the role sequence is a mirror (A-B-B-A, A-B-C-C-B-A, ...). */
export function isMirror(seq: string[]): boolean {
  if (seq.length < 4 || seq.length % 2 !== 0) return false;
  const half = seq.length / 2;
  const first = seq.slice(0, half);
  const second = seq.slice(half);
  if (new Set(first).size !== first.length) return false; // A-A... is repetition, not crossing
  return first.every((r, i) => r === second[second.length - 1 - i]);
}

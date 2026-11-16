import Phaser from 'phaser';
import * as T from '../art/tiles';
import { elfSprite, reindeerSprite, type Facing } from '../art/characters';
import type { Px } from '../art/px';
import type { LevelDef } from '../content/levels';
import { audio } from '../audio/audio';
import { hazardActive, isGate, parseLevel, platesPressed, tryMove, type Dir, type DynState, type ParsedLevel, type Reality } from './logic';

export interface MazeCallbacks {
  onGate: (digit: string) => void;
  onNpc: (who: 'R' | 'H') => void;
  onReality: (r: Reality) => void;
  onHint: (text: string) => void;
  onExit: () => void;
  onFlip: () => void;
  onSparkle: () => void;
  onAmbush: () => void;
}

/** Directions currently held, most recent last (written by the React key/touch handlers). */
export interface MazeControls {
  order: Dir[];
  /** a key pressed since the last step, so quick taps still move one tile */
  tap: Dir | null;
}

const TILE = 16;
const STEP_MS = 125;
const ANIMATED = new Set(['M', 'X', 'T', 'F', 'O', 'C']);

function addTex(scene: Phaser.Scene, key: string, p: Px) {
  if (!scene.textures.exists(key)) scene.textures.addCanvas(key, p.toCanvas(1));
}

function buildTextures(scene: Phaser.Scene) {
  for (const r of ['A', 'B'] as Reality[]) {
    for (let v = 0; v < 3; v++) addTex(scene, `floor_${r}_${v}`, T.floor(r, v));
    addTex(scene, `ice_${r}`, T.iceFloor(r));
    for (let v = 0; v < 2; v++) {
      addTex(scene, `wallTop_${r}_${v}`, T.wallTop(r, v));
      addTex(scene, `wallFace_${r}_${v}`, T.wallFace(r, v));
    }
    for (const e of [0, 1]) {
      addTex(scene, `chasm_${r}_${e}`, T.chasm(r, !!e, e));
      for (const pres of [0, 1]) {
        addTex(scene, `bridgeEq_${r}_${pres}_${e}`, T.bridge(r, '=', !!pres, !!e));
        addTex(scene, `bridgeDash_${r}_${pres}_${e}`, T.bridge(r, '-', !!pres, !!e));
      }
    }
    for (const o of [0, 1]) {
      addTex(scene, `doorA_${r}_${o}`, T.door(r, 'A', !!o));
      addTex(scene, `doorB_${r}_${o}`, T.door(r, 'B', !!o));
      addTex(scene, `ginger_${r}_${o}`, T.gingerbread(r, !!o));
      addTex(scene, `glitch_${r}_${o}`, T.glitch(r, !!o));
      addTex(scene, `gate_${r}_${o}`, T.gate(r, !!o));
      addTex(scene, `plate_${r}_${o}`, T.plate(r, !!o));
      addTex(scene, `pdoor_${r}_${o}`, T.plateDoor(r, !!o));
      addTex(scene, `lever_${r}_${o}`, T.lever(r, !!o));
      addTex(scene, `ldoor_${r}_${o}`, T.leverDoor(r, !!o));
      addTex(scene, `crack_${r}_${o}`, T.crackedWall(r, !!o));
      for (let f = 0; f < 2; f++) addTex(scene, `lantern_${r}_${o}_${f}`, T.lantern(r, !!o, f));
    }
    for (let f = 0; f < 4; f++) addTex(scene, `pad_${r}_${f}`, T.mirrorPad(r, f));
    for (let f = 0; f < 6; f++) addTex(scene, `exit_${r}_${f}`, T.exitPortal(r, f));
    for (let f = 0; f < 4; f++) addTex(scene, `tree_${r}_${f}`, T.tree(r, f));
    for (let f = 0; f < 2; f++) addTex(scene, `gear_${r}_${f}`, T.gear(r, f));
    addTex(scene, `gifts_${r}`, T.giftPile(r));
    addTex(scene, `hoop_${r}`, T.hoop(r));
    addTex(scene, `trophy_${r}`, T.trophy(r));
  }
  for (let f = 0; f < 3; f++) addTex(scene, `fire_${f}`, T.fireplace(f));
  for (let f = 0; f < 3; f++) addTex(scene, `sparkle_${f}`, T.sparkle(f));
  addTex(scene, 'footprint', T.footprint());
  addTex(scene, 'crate', T.giftBox());
  for (const d of ['down', 'up', 'left', 'right'] as Facing[]) for (const f of [0, 1, 2] as const) addTex(scene, `player_${d}_${f}`, elfSprite(d, f));
  for (const f of [0, 1] as const) {
    addTex(scene, `deer_${f}`, reindeerSprite(f));
    addTex(scene, `hoops_${f}`, elfSprite('down', f === 0 ? 0 : 1, { hat: '#F7C65F', tunic: '#E63946', skin: '#8d5638', hair: '#22192b' }, 'ball'));
  }
  if (!scene.textures.exists('snowflake')) {
    const c = document.createElement('canvas');
    c.width = 1;
    c.height = 1;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1, 1);
    scene.textures.addCanvas('snowflake', c);
  }
}

function hash(x: number, y: number) {
  return ((x * 73856093) ^ (y * 19349663)) >>> 0;
}

export class MazeScene extends Phaser.Scene {
  private level: LevelDef;
  private cb: MazeCallbacks;
  private controls: MazeControls;
  private reduced: boolean;

  private lv!: ParsedLevel;
  private st!: DynState;
  private px = 0;
  private py = 0;
  private facing: Facing = 'down';
  private moving = false;
  private paused = true;
  private frame = 0;
  private walkFrame: 1 | 2 = 1;

  private world!: Phaser.GameObjects.Container;
  private cells: Phaser.GameObjects.Image[] = [];
  private crates = new Map<number, Phaser.GameObjects.Image>();
  private sparkles = new Map<number, Phaser.GameObjects.Image>();
  private player!: Phaser.GameObjects.Image;
  private npcs: Phaser.GameObjects.Image[] = [];
  private lit = new Set<number>();
  private checkpoint = { x: 0, y: 0, reality: 'A' as Reality, crates: [] as number[], lever: false };
  private shownHints = new Set<string>();
  private bumpNotes = new Set<string>();
  private flipping = false;

  constructor(level: LevelDef, cb: MazeCallbacks, controls: MazeControls, reduced: boolean) {
    super({ key: 'maze' });
    this.level = level;
    this.cb = cb;
    this.controls = controls;
    this.reduced = reduced;
  }

  create() {
    buildTextures(this);
    this.lv = parseLevel(this.level.map);
    this.st = { reality: 'A', lever: false, crates: new Set(this.lv.crates), solved: new Set() };
    [this.px, this.py] = this.lv.start;
    this.checkpoint = { x: this.px, y: this.py, reality: 'A', crates: [...this.lv.crates], lever: false };

    const W = this.lv.w * TILE;
    const H = this.lv.h * TILE;
    this.world = this.add.container(W / 2, H / 2);
    const ox = -W / 2;
    const oy = -H / 2;

    for (let y = 0; y < this.lv.h; y++)
      for (let x = 0; x < this.lv.w; x++) {
        const img = this.add.image(ox + x * TILE + 8, oy + y * TILE + 8, this.cellKey(x, y));
        this.world.add(img);
        this.cells.push(img);
        const ch = this.lv.tiles[y][x];
        if (ch === '*') {
          const s = this.add.image(ox + x * TILE + 8, oy + y * TILE + 8, 'sparkle_0').setDepth(2);
          this.world.add(s);
          this.sparkles.set(y * this.lv.w + x, s);
        }
        if (ch === 'R' || ch === 'H') {
          const n = this.add.image(ox + x * TILE + 8, oy + y * TILE + 8, ch === 'R' ? 'deer_0' : 'hoops_0').setDepth(3);
          n.setData('who', ch);
          this.world.add(n);
          this.npcs.push(n);
        }
      }
    for (const c of this.lv.crates) {
      const img = this.add.image(ox + (c % this.lv.w) * TILE + 8, oy + Math.floor(c / this.lv.w) * TILE + 8, 'crate').setDepth(3);
      this.world.add(img);
      this.crates.set(c, img);
    }
    this.player = this.add.image(ox + this.px * TILE + 8, oy + this.py * TILE + 8, 'player_down_0').setDepth(4);
    this.world.add(this.player);

    if (!this.reduced) {
      this.add
        .particles(0, -2, 'snowflake', {
          x: { min: 0, max: W },
          lifespan: 14000,
          speedY: { min: 7, max: 15 },
          speedX: { min: -3, max: 3 },
          alpha: { start: 0.85, end: 0.5 },
          scale: { min: 1, max: 2 },
          frequency: 260,
          quantity: 1,
        })
        .setDepth(10);
    }

    this.time.addEvent({ delay: 230, loop: true, callback: () => this.tick() });
    this.cb.onReality('A');
  }

  /* ---------- public API (called from React) ---------- */

  setPaused(p: boolean) {
    this.paused = p;
  }

  solveGate(digit: string) {
    this.st.solved.add(digit);
    audio.sfx('door');
    this.refresh();
    if (!this.reduced) this.cameras.main.shake(160, 0.004);
    this.paused = false;
  }

  flip() {
    if (this.paused || this.moving || this.flipping) return;
    if (this.lv.tiles[this.py][this.px] !== 'M') {
      this.cb.onHint('Stand on a glowing mirror to reverse reality.');
      return;
    }
    this.flipping = true;
    const next: Reality = this.st.reality === 'A' ? 'B' : 'A';
    audio.sfx('mirror');
    this.cb.onFlip();
    const swap = () => {
      this.st.reality = next;
      this.refresh();
      this.cb.onReality(next);
    };
    if (this.reduced) {
      this.tweens.add({
        targets: this.world,
        alpha: 0.25,
        duration: 120,
        yoyo: true,
        onYoyo: swap,
        onComplete: () => {
          this.flipping = false;
        },
      });
    } else {
      this.cameras.main.flash(260, 105, 230, 241, false);
      this.tweens.add({
        targets: this.world,
        scaleX: 0,
        duration: 170,
        ease: 'Quad.easeIn',
        onComplete: () => {
          swap();
          this.tweens.add({
            targets: this.world,
            scaleX: 1,
            duration: 190,
            ease: 'Quad.easeOut',
            onComplete: () => {
              this.flipping = false;
            },
          });
        },
      });
    }
  }

  interact() {
    if (this.paused || this.moving) return;
    this.attempt(this.facing, true);
  }

  resetRoom() {
    if (this.moving) return;
    const cp = this.checkpoint;
    this.restoreCrates(cp.crates);
    this.st.lever = this.st.lever || cp.lever;
    this.teleport(cp.x, cp.y, cp.reality);
    this.cb.onHint('Room reset to the last lantern.');
  }

  /* ---------- internals ---------- */

  private restoreCrates(list: number[]) {
    const ox = -this.lv.w * 8;
    const oy = -this.lv.h * 8;
    for (const img of this.crates.values()) img.destroy();
    this.crates.clear();
    this.st.crates = new Set(list);
    for (const c of list) {
      const img = this.add.image(ox + (c % this.lv.w) * TILE + 8, oy + Math.floor(c / this.lv.w) * TILE + 8, 'crate').setDepth(3);
      this.world.add(img);
      this.crates.set(c, img);
    }
    this.world.sort('depth');
  }

  private teleport(x: number, y: number, r: Reality) {
    this.px = x;
    this.py = y;
    this.st.reality = r;
    this.player.setPosition(-this.lv.w * 8 + x * TILE + 8, -this.lv.h * 8 + y * TILE + 8);
    this.refresh();
    this.cb.onReality(r);
  }

  private tick() {
    this.frame++;
    for (let y = 0; y < this.lv.h; y++)
      for (let x = 0; x < this.lv.w; x++) {
        if (ANIMATED.has(this.lv.tiles[y][x])) this.cells[y * this.lv.w + x].setTexture(this.cellKey(x, y));
      }
    for (const s of this.sparkles.values()) s.setTexture(`sparkle_${this.frame % 3}`);
    for (const n of this.npcs) n.setTexture(`${n.getData('who') === 'R' ? 'deer' : 'hoops'}_${Math.floor(this.frame / 3) % 2}`);
  }

  private refresh() {
    for (let y = 0; y < this.lv.h; y++) for (let x = 0; x < this.lv.w; x++) this.cells[y * this.lv.w + x].setTexture(this.cellKey(x, y));
  }

  private isWallish(x: number, y: number) {
    const ch = this.lv.tiles[y]?.[x];
    return ch === '#' || ch === 'O' || ch === undefined || (ch === 'h' && this.st.reality === 'A');
  }

  private cellKey(x: number, y: number): string {
    const ch = this.lv.tiles[y][x];
    const r = this.st.reality;
    const f = this.frame;
    const v = hash(x, y) % 3;
    const chasmEdge = () => {
      const up = this.lv.tiles[y - 1]?.[x];
      return up === '~' || up === '=' || up === '-' ? 0 : 1;
    };
    switch (ch) {
      case '#':
        return this.isWallish(x, y + 1) ? `wallTop_${r}_${v % 2}` : `wallFace_${r}_${v % 2}`;
      case 'O':
        return `gear_${r}_${f % 2}`;
      case ',':
        return `ice_${r}`;
      case 'C':
        return `lantern_${r}_${this.lit.has(y * this.lv.w + x) ? 1 : 0}_${f % 2}`;
      case 'M':
        return `pad_${r}_${f % 4}`;
      case 'A':
        return `doorA_${r}_${r === 'A' ? 1 : 0}`;
      case 'B':
        return `doorB_${r}_${r === 'B' ? 1 : 0}`;
      case '~':
        return `chasm_${r}_${chasmEdge()}`;
      case '=':
        return `bridgeEq_${r}_${r === 'B' ? 1 : 0}_${chasmEdge()}`;
      case '-':
        return `bridgeDash_${r}_${r === 'A' ? 1 : 0}_${chasmEdge()}`;
      case '^':
        return `ginger_${r}_${r === 'A' ? 1 : 0}`;
      case 'v':
        return `glitch_${r}_${r === 'B' ? 1 : 0}`;
      case 'o':
        return `plate_${r}_${this.st.crates.has(y * this.lv.w + x) ? 1 : 0}`;
      case 'P':
        return `pdoor_${r}_${platesPressed(this.lv, this.st) ? 1 : 0}`;
      case 'L':
        return `lever_${r}_${this.st.lever ? 1 : 0}`;
      case 'l':
        return `ldoor_${r}_${this.st.lever ? 1 : 0}`;
      case 'X':
        return `exit_${r}_${f % 6}`;
      case 'T':
        return `tree_${r}_${f % 4}`;
      case 'F':
        return `fire_${f % 3}`;
      case 'g':
        return `gifts_${r}`;
      case 'Q':
        return `hoop_${r}`;
      case 'K':
        return `trophy_${r}`;
      case 'h':
        return `crack_${r}_${r === 'B' ? 1 : 0}`;
      default:
        if (isGate(ch)) return `gate_${r}_${this.st.solved.has(ch) ? 1 : 0}`;
        return `floor_${r}_${v}`;
    }
  }

  update() {
    if (this.paused || this.moving || this.flipping) return;
    const dir = this.controls.order[this.controls.order.length - 1] ?? this.controls.tap;
    this.controls.tap = null;
    if (!dir) return;
    this.attempt(dir, false);
  }

  private note(key: string, text: string) {
    if (this.bumpNotes.has(key)) return;
    this.bumpNotes.add(key);
    this.cb.onHint(text);
  }

  private attempt(dir: Dir, fromInteract: boolean) {
    this.facing = dir;
    this.player.setTexture(`player_${dir}_0`);
    const res = tryMove(this.lv, this.st, this.px, this.py, dir);
    switch (res.kind) {
      case 'blocked': {
        if (!fromInteract) this.bump(dir);
        const [dx, dy] = dir === 'up' ? [0, -1] : dir === 'down' ? [0, 1] : dir === 'left' ? [-1, 0] : [1, 0];
        const ch = this.lv.tiles[this.py + dy]?.[this.px + dx];
        if (ch === 'A') this.note('A', 'Gold doors are shut in Mirror B-A. Find a mirror and flip back to Reality A-B.');
        else if (ch === 'B') this.note('B', 'Cyan doors are shut in Reality A-B. Find a glowing mirror and press R.');
        else if (ch === '~' || ch === '=' || ch === '-') this.note('chasm', 'Too far to jump. A bridge might exist in the other reality.');
        else if (ch === 'P') this.note('P', 'This door opens while a gift box sits on a pressure plate.');
        else if (ch === 'l') this.note('l', 'This door is wired to a lever somewhere else.');
        else if (res.reason === 'crate') this.note('crate', 'The box is stuck. Press Backspace to reset the room.');
        return;
      }
      case 'gate':
        this.paused = true;
        this.cb.onGate(res.gate);
        return;
      case 'npc':
        this.paused = true;
        this.cb.onNpc(res.who);
        return;
      case 'lever':
        if (!this.st.lever) {
          this.st.lever = true;
          audio.sfx('lever');
          this.refresh();
          this.cb.onHint('Clank! Somewhere, a green door swings open.');
        } else this.note('lever2', 'The lever is already pulled.');
        return;
      case 'move': {
        if (fromInteract) return;
        const target = this.lv.tiles[res.y][res.x];
        if (hazardActive(target, this.st.reality)) {
          this.ambush(res.x, res.y);
          return;
        }
        this.step(res.x, res.y, res.push);
      }
    }
  }

  private bump(dir: Dir) {
    if (this.moving) return;
    this.moving = true;
    const [dx, dy] = dir === 'up' ? [0, -1] : dir === 'down' ? [0, 1] : dir === 'left' ? [-1, 0] : [1, 0];
    this.tweens.add({
      targets: this.player,
      x: this.player.x + dx * 3,
      y: this.player.y + dy * 3,
      duration: 60,
      yoyo: true,
      onComplete: () => {
        this.time.delayedCall(90, () => (this.moving = false));
      },
    });
  }

  private ambush(hx: number, hy: number) {
    this.paused = true;
    audio.sfx('bonk');
    this.cb.onAmbush();
    const sx = this.player.x;
    const sy = this.player.y;
    const tx = sx + (hx - this.px) * 6;
    const ty = sy + (hy - this.py) * 6;
    if (!this.reduced) this.cameras.main.shake(220, 0.01);
    this.tweens.add({
      targets: this.player,
      x: tx,
      y: ty,
      duration: 90,
      yoyo: true,
      onComplete: () => {
        this.time.delayedCall(250, () => {
          const cp = this.checkpoint;
          this.teleport(cp.x, cp.y, cp.reality);
          this.paused = false;
        });
      },
    });
    this.cb.onHint(this.st.reality === 'A' ? 'Gingerbread ambush! Back to the last lantern.' : 'Glitch ambush! Back to the last lantern.');
  }

  private step(nx: number, ny: number, push?: { from: number; to: number }) {
    this.moving = true;
    const fromPressed = platesPressed(this.lv, this.st);
    const dx = (nx - this.px) * TILE;
    const dy = (ny - this.py) * TILE;
    this.walkFrame = this.walkFrame === 1 ? 2 : 1;
    this.player.setTexture(`player_${this.facing}_${this.walkFrame}`);

    // footprints in the snow behind the player
    const fp = this.add.image(this.player.x, this.player.y + 2, 'footprint').setDepth(1).setAlpha(this.st.reality === 'A' ? 0.9 : 0.5);
    if (this.st.reality === 'B') fp.setTint(0x69e6f1);
    this.world.add(fp);
    this.world.sort('depth');
    this.tweens.add({ targets: fp, alpha: 0, delay: 1800, duration: 1200, onComplete: () => fp.destroy() });

    if (push) {
      const img = this.crates.get(push.from)!;
      this.crates.delete(push.from);
      this.crates.set(push.to, img);
      this.st.crates.delete(push.from);
      this.st.crates.add(push.to);
      audio.sfx('push');
      this.tweens.add({ targets: img, x: img.x + dx, y: img.y + dy, duration: STEP_MS });
    }
    audio.sfx('step');
    this.tweens.add({
      targets: this.player,
      x: this.player.x + dx,
      y: this.player.y + dy,
      duration: STEP_MS,
      onComplete: () => {
        this.px = nx;
        this.py = ny;
        this.player.setTexture(`player_${this.facing}_0`);
        if (push) {
          const nowPressed = platesPressed(this.lv, this.st);
          if (nowPressed !== fromPressed) {
            audio.sfx(nowPressed ? 'door' : 'back');
            this.cb.onHint(nowPressed ? 'The plate clicks. A candy-cane door opens.' : 'The plate pops up. The candy-cane door closes.');
          }
          this.refresh();
        }
        this.moving = false;
        this.arrive(nx, ny);
      },
    });
  }

  private arrive(x: number, y: number) {
    const ch = this.lv.tiles[y][x];
    const idx = y * this.lv.w + x;
    if (ch === 'C' && !this.lit.has(idx)) {
      this.lit.add(idx);
      this.checkpoint = { x, y, reality: this.st.reality, crates: [...this.st.crates], lever: this.st.lever };
      audio.sfx('checkpoint');
      this.refresh();
    } else if (ch === 'C') {
      this.checkpoint = { x, y, reality: this.st.reality, crates: [...this.st.crates], lever: this.st.lever };
    }
    const sp = this.sparkles.get(idx);
    if (sp) {
      this.sparkles.delete(idx);
      audio.sfx('sparkle');
      this.tweens.add({ targets: sp, y: sp.y - 10, alpha: 0, duration: 300, onComplete: () => sp.destroy() });
      this.cb.onSparkle();
    }
    if (ch === 'M' && !this.shownHints.has('pad')) {
      this.shownHints.add('pad');
      this.cb.onHint('You’re on a mirror. Press R to reverse reality.');
    }
    const hint = this.level.hints.find((h) => h.at[0] === x && h.at[1] === y);
    if (hint && !this.shownHints.has(hint.text)) {
      this.shownHints.add(hint.text);
      this.cb.onHint(hint.text);
    }
    if (ch === 'X') {
      this.paused = true;
      audio.sfx('victory');
      this.tweens.add({ targets: this.player, angle: 360, scale: 0, duration: 700 });
      this.time.delayedCall(700, () => this.cb.onExit());
    }
  }
}

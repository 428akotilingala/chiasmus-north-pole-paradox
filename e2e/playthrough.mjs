// Full browser playthrough: Quick Play end to end, then every Adventure maze and case 3.
// Usage: node e2e/playthrough.mjs [url] [width] [height] [quick|all]
// Requires e2e/paths.json (npm run e2e generates it from the maze solver first).
import { chromium } from 'playwright';
import { mkdirSync, readFileSync } from 'node:fs';

const URL = process.argv[2] ?? 'http://localhost:5199/';
const W = +(process.argv[3] ?? 1366);
const H = +(process.argv[4] ?? 768);
const SCOPE = process.argv[5] ?? 'all';
const paths = JSON.parse(readFileSync('e2e/paths.json', 'utf8'));
const out = `e2e/screens/${W}x${H}`;
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: W, height: H } });
const errors = [];
const failures = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push('console: ' + m.text());
});

let n = 0;
const shot = (name) => page.screenshot({ path: `${out}/${String(++n).padStart(2, '0')}-${name}.png` });
const wait = (ms) => page.waitForTimeout(ms);
const key = (k) => page.keyboard.press(k);
const btn = (name) => page.getByRole('button', { name, exact: false }).first();
const click = async (name) => {
  await btn(name).click({ timeout: 8000 });
};
const expectVisible = async (text, label) => {
  try {
    await page.getByText(text, { exact: false }).first().waitFor({ state: 'visible', timeout: 8000 });
  } catch {
    failures.push(`${label}: expected "${text}"`);
    await shot(`FAIL-${label}`);
  }
};
const DIRKEY = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };

async function runMaze(id, opts = {}) {
  const p = paths[id];
  let gateShot = false;
  let flipShot = false;
  for (const a of p.actions) {
    if (a === 'flip') {
      await key('r');
      await wait(650);
      if (!flipShot && opts.shots) {
        flipShot = true;
        await shot(`${id}-after-flip`);
      }
    } else if (a.startsWith('answer-')) {
      await key(DIRKEY[a.slice(7)]);
      await wait(900);
      const digitIdx = Object.values(p.gates);
      // which gate? the order in the path matches gate digits ascending for our levels
      const gi = p.answered = (p.answered ?? 0) + 1;
      const correct = digitIdx[gi - 1];
      if (opts.shots && !gateShot) await shot(`${id}-gate`);
      await key(String(correct + 1));
      await wait(1300);
      if (opts.shots && !gateShot) {
        gateShot = true;
        await shot(`${id}-gate-solved`);
      }
      await key('Enter');
      await wait(700);
    } else if (a.startsWith('pull-')) {
      await key(DIRKEY[a.slice(5)]);
      await wait(450);
    } else {
      await key(DIRKEY[a]);
      await wait(175);
    }
  }
}

const t0 = Date.now();
await page.goto(URL);
await page.evaluate(() => localStorage.clear());
await page.reload();
await wait(3200);
await shot('title');

/* ---------------- Quick Play ---------------- */
await page.getByTestId('quick-play').click();
await wait(500);
for (let i = 0; i < 5; i++) {
  await wait(500);
  await key('Enter'); // finish typing
  await wait(i === 2 ? 2600 : 400);
  await shot(`intro-${i + 1}`);
  await key('Enter'); // next panel
}
await wait(1500);
await expectVisible('What is chiasmus?', 'briefing');
await shot('briefing');
await click('Start the investigation');

// Case 1: correct vote
await wait(900);
await shot('case1-title');
await wait(2400);
await shot('case1-investigate');
await click('Detect reversal');
await wait(400);
await shot('case1-detect');
await key('n');
await wait(400);
await click('Show answer key');
await wait(200);
await shot('case1-notes');
await key('n');
await page.getByRole('button', { name: 'Interview Tinsel Twinkletoes' }).click();
await wait(3800);
await shot('case1-interview');
for (let i = 0; i < 8; i++) {
  await key('Enter');
  await wait(2200);
  if (!(await page.getByRole('dialog', { name: /Interview with/ }).count())) break;
}
await click('Evidence board');
await wait(900);
await shot('case1-evidence');
await click('Ignore Sir Repeats-a-Lot');
await page.getByRole('dialog', { name: 'Evidence board' }).getByRole('button', { name: 'Call the class vote' }).click();
await wait(1200);
await click('Count hands');
await page.getByRole('button', { name: 'Add a vote' }).nth(2).click();
await page.getByRole('button', { name: 'Add a vote' }).nth(2).click();
await wait(300);
await shot('case1-vote');
await key('3');
await key('Enter');
await wait(1100);
await shot('case1-reveal-start');
await wait(2400);
await expectVisible('IMPOSTOR EJECTED', 'case1-eject');
await shot('case1-ejected');
await click('See why');
await wait(1800);
await shot('case1-debrief');
await click('Continue');

// Case 2: deliberately wrong vote to see the promotion path
await wait(3300);
await shot('case2-investigate');
await click('Call the class vote');
await wait(800);
await key('1');
await key('Enter');
await wait(3600);
await expectVisible('PROMOTED THE IMPOSTOR TO HEAD OF GRAMMAR', 'case2-promote');
await shot('case2-promoted');
await click('See why');
await wait(1500);
await click('Reveal an answer');
await wait(400);
await shot('case2-debrief');
await click('Continue');

// Mirror maze (Quick Play)
await wait(1500);
await shot('mazeX-intro');
await key('Enter');
await wait(600);
await shot('mazeX-start');
await runMaze('mazeX', { shots: true });
await wait(1600);
await expectVisible('The Reality Mirror is through this portal', 'mazeX-exit');
await shot('mazeX-done');
await click('Face the Syntax Grinch');

// Finale
await wait(1500);
await shot('final-arrive');
for (let i = 0; i < 8; i++) {
  await key('Enter');
  await wait(i % 2 ? 300 : 1500);
  if (await btn('Restore the mirror').count()) break;
}
await wait(600);
await shot('final-build');
const tray = (w) => page.getByRole('button', { name: `${w} block. Press Enter to place it.` }).first();
for (const w of ['CHRISTMAS', 'YOU', 'CHRISTMAS', 'YOU']) await tray(w).click();
await click('Restore the mirror');
await wait(700);
await shot('final-wrong');
await click('Clear');
for (const w of ['YOU', 'CHRISTMAS', 'CHRISTMAS', 'YOU']) await tray(w).click();
await wait(300);
await shot('final-built');
await click('Restore the mirror');
await wait(5200);
await shot('final-restored');
await click('What does it emphasize?');
await wait(900);
await shot('final-emphasis');
await key('1');
await wait(1500);
await shot('final-emphasis-solved');
await click('Save Christmas');

// Ending
await wait(2600);
await shot('ending-celebrate');
await click('Why this game is chiasmus');
await wait(1500);
await expectVisible('WHY THIS GAME IS CHIASMUS', 'ending-why');
await shot('ending-why');
const quickSecs = Math.round((Date.now() - t0) / 1000);
await click('Kennedy examples');
await wait(1200);
await shot('archive');
await key('Escape');
await wait(400);
await key('Escape');
await wait(500);
await shot('pause');
await click('Chapters');
await wait(400);
await shot('chapters');
await key('Escape');
await key('Escape');

/* ---------------- Adventure: case 3 and all three mazes ---------------- */
if (SCOPE === 'all') {
  const jump = async (label) => {
    await key('Escape');
    await wait(300);
    if (!(await btn('Chapters').count())) await key('Escape');
    await click('Chapters');
    await page.getByRole('button', { name: label }).click();
    await wait(1500);
  };
  await click('Quit to title').catch(() => {});
  await wait(800);
  await page.getByTestId('adventure').click();
  await wait(800);

  await jump('Case 3: The Clock Tower Conspiracy');
  await wait(2300);
  await shot('case3-investigate');
  await click('Call the class vote');
  await wait(600);
  await key('4');
  await key('Enter');
  await wait(3200);
  await expectVisible('IMPOSTOR EJECTED', 'case3-eject');
  await click('See why');
  await wait(1500);
  await shot('case3-debrief');

  for (const id of ['maze1', 'maze2', 'maze3']) {
    const label = { maze1: 'Maze 1', maze2: 'Maze 2', maze3: 'Maze 3' }[id];
    await jump(label);
    await key('Enter');
    await wait(600);
    await shot(`${id}-start`);
    await runMaze(id, { shots: id !== 'maze1' });
    await wait(1600);
    const doneText = id === 'maze3' ? 'The Reality Mirror is through this portal' : 'cleared.';
    await expectVisible(doneText, `${id}-exit`);
    await shot(`${id}-done`);
  }

  // secret basketball court in level 2
  await jump('Maze 2');
  await key('Enter');
  await wait(600);
  paths.maze2secret.answered = 0;
  await runMaze('maze2secret');
  await wait(1000);
  await shot('maze2-secret-prompt');
  await key(String(paths.maze2secret.secret + 1));
  await wait(1300);
  await click('Claim the trophy');
  await wait(700);
  await expectVisible('LeChiasmus', 'secret-achievement');
  await shot('maze2-secret-done');

  // Settings and How to play
  await key('Escape');
  await click('Quit to title');
  await wait(800);
  await click('HOW TO PLAY');
  await wait(800);
  await shot('howto');
  await key('Escape');
  await wait(400);
  await click('SETTINGS');
  await wait(600);
  await shot('settings');
}

console.log(`Quick Play automated run: ${quickSecs}s (no class discussion time)`);
console.log(failures.length ? 'FAILURES:\n' + failures.join('\n') : 'All checkpoints passed');
console.log(errors.length ? 'ERRORS:\n' + [...new Set(errors)].join('\n') : 'No console errors');
await browser.close();
process.exit(failures.length || errors.length ? 1 : 0);

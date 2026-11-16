# Chiasmus: The North Pole Paradox

**Christmas is backwards. Someone is sus. Save the North Pole.**

A Christmas pixel-art browser game about the rhetorical device **chiasmus**, built as an original
creative piece for AP Language and Composition. Players vote out rhetorical impostors, walk through
a maze that literally reverses itself (Reality A-B ⇄ Mirror B-A), and rebuild Santa's Reality Mirror
by constructing an A-B-B-A sentence. It is designed to be run on one projector with the whole class
voting by raising hands.

**Play it:** https://428akotilingala.github.io/chiasmus-north-pole-paradox/

No accounts, downloads, ads, logins, or network calls. Everything (art, music, sound) is generated
in the browser.

## Two ways to play

| Mode | Length | What's in it |
| --- | --- | --- |
| **Classroom Quick Play** | about 7 minutes | Intro, 30-second definition, 2 impostor cases, 1 Mirror Maze, the finale, and the "why this game is chiasmus" ending |
| **Start Adventure** | about 25 minutes | Intro, definition, 3 impostor cases, 3 Mirror Maze levels, the finale, ending |

The presenter guide with a timed script, speaking parts for two presenters, and the full answer key
is in [`docs/PRESENTER_GUIDE.md`](docs/PRESENTER_GUIDE.md).

## Controls

| Key | Action |
| --- | --- |
| WASD / arrow keys | Move in the maze |
| R | Reverse reality (while standing on a glowing mirror) |
| Space / Enter | Interact, continue |
| Backspace | Reset the maze room to the last lantern |
| 1–4 | Pick an answer |
| Esc | Pause menu (resume, restart chapter, jump to any chapter, settings) |
| N | Presenter notes (answer key stays hidden until you click) |
| F | Fullscreen |
| M | Mute |

Touchscreens get an on-screen pad in the maze (Settings › Touch controls).

## Run it locally

Requires Node.js 20.19+ (or 22.12+).

```bash
npm install
npm run dev          # http://localhost:5173
```

Production build:

```bash
npm run build        # outputs dist/
npm run preview      # serves dist/ at http://localhost:4173
```

After `npm install` the game needs no internet connection. The build in `dist/` is a plain static
site with relative paths, so it also works from any folder or USB drive served by any static server.

## Deploy as a static website

- **GitHub Pages (already set up):** every push to `main` runs `.github/workflows/deploy.yml`, which
  tests, builds, and publishes `dist/`.
- **Anywhere else:** run `npm run build` and upload the `dist/` folder to Netlify, Vercel, Cloudflare
  Pages, or any web server. No server-side code is needed.

## Tests and checks

```bash
npm run check        # typecheck + lint + unit tests + production build
npm test             # unit tests only
```

The unit tests (`tests/`) verify the content and the mazes:

- every impostor round has exactly one impostor, valid statements really are A-B / B-A, and
  impostors never mirror;
- every question has exactly one correct option, and every wrong option explains why it is wrong;
- a breadth-first solver proves every maze level is **solvable**, **impossible without flipping
  reality**, **impossible without answering every gate**, and has **no reachable state that traps
  the player**.

There is also a browser playthrough (`e2e/playthrough.mjs`, Playwright) that plays Quick Play end to
end, replays the solver's solution for every maze in the real Phaser engine, finds the secret room,
screenshots every screen, and fails on any console error:

```bash
npx playwright install chromium        # once
EXPORT_PATHS=1 npx vitest run tests/export-paths.test.ts
npm run preview &                      # or npm run dev
node e2e/playthrough.mjs http://localhost:4173/ 1366 768 all
```

## How each mechanic demonstrates chiasmus

| Mechanic | The chiasmus in it |
| --- | --- |
| **The χ diagram** | Every chiasmus is drawn the way it got its name: matching parts joined by lines that cross like the Greek letter χ (chi). Impostors draw parallel lines that never cross. |
| **Impostor investigation** | Three elves speak true reversals; one uses something that only *looks* like one: same-order parallelism (A-B, A-B), plain repetition (A-A-A), or antithesis with no crossing. Finding the impostor means identifying what chiasmus is *not*. |
| **Mirror Maze** | Reality A-B and Mirror B-A are reversals of each other: gold doors open in one and cyan doors in the other, bridges appear and vanish, hazards trade places. The level can only be solved by crossing between them, so the device becomes a place you walk through. |
| **Chiasmus gates** | The class completes a reversal ("The elves protect Christmas, and Christmas protects ____") and the gate explains what is reversed and why the reversal matters. |
| **The finale** | The class builds "You didn't save Christmas — Christmas saved you" from four blocks. The Syntax Grinch diagnoses wrong builds as parallelism (A-B-A-B) or repetition (A-A-B-B), and both valid orders are accepted with a note on how the order changes the emphasis. |
| **Kennedy examples** | Two real chiasmi from John F. Kennedy with structure, purpose, and effect, cited to the JFK Presidential Library, on a screen students can copy from. |

## Project structure

```
src/
  content/      all educational content: cases, questions, levels, script, presenter notes
  game/         maze rules (logic.ts), BFS solver, Phaser scene
  art/          procedural pixel art: characters, tiles, painted backdrops
  audio/        Web Audio synth: original soundtrack and sound effects
  screens/      title, intro, briefing, cases, maze, finale, ending, panels
  ui/           stage scaler, chi diagram, class prompt, HUD, notes, pause
  state/        game state, settings, progress (saved in localStorage)
tests/          content and maze tests
e2e/            browser playthrough
docs/           presenter guide
```

## Verified features

Each of these was exercised by the automated tests or the browser playthrough at 1366×768 and
1920×1080, with no console errors:

- Title with animated A-B / B-A logo, Quick Play, Adventure, How to Play, Settings, Kennedy examples
- Five-panel story intro with skip; 30-second chiasmus briefing
- Three impostor cases: interviews, evidence board, Detect Reversal highlighting, class vote with
  countdown and hand-count tally, ejection and "promoted to Head of Grammar" outcomes, debrief with
  χ diagrams, mirror fragments A/B/C, class discussion question
- Mirror Maze: three Adventure levels plus the Quick Play level, all solved in the real engine;
  mirror flips, gold/cyan doors, ice bridges, gingerbread and glitch hazards, gift boxes on
  pressure plates, lever doors, lantern checkpoints, room reset, Reverso the reindeer
- Chiasmus gates as full-screen class questions; wrong answers explain themselves
- Secret basketball court with the LeChiasmus achievement
- Finale: the Syntax Grinch ("A-A-A-A!"), drag-or-click mirror construction, wrong-pattern
  diagnoses, mirror restoration, "what does it emphasize?" class question
- Ending: celebration, Naughty-or-Grammatically-Nice rating, achievements, WHY THIS GAME IS CHIASMUS
- Pause menu with chapter jump, presenter notes with hidden answer key, fullscreen, mute
- Settings: music, sound effects, reduced motion, vote timer (off/10/20/30 s), touch controls,
  reset progress; progress and settings saved in localStorage
- Projector-first layout: a fixed 1600×900 stage scaled to any screen; text contrast checked
  against WCAG/HIG minimums

## Known limitations

- The layout is a fixed 16:9 stage. On a phone held upright it letterboxes small; it is built for
  laptops, Chromebooks, and projectors.
- Browser zoom doesn't enlarge text, because the stage always scales to fill the window.
- Audio starts after the first click or key press (browsers block autoplay).
- The touch pad was checked for layout but not on a physical touchscreen device.
- Quick Play timing (about 6.5–7.5 minutes) is an estimate from the automated run (90 seconds with
  no discussion) plus typical reading and voting time; rehearse once with your class's pace.

## Credits

- Code, pixel art, music, sound effects, story, and all game dialogue are original to this project.
- Kennedy quotations: John F. Kennedy Presidential Library and Museum transcripts (linked in-game).
- Fonts: [Jersey 15](https://fonts.google.com/specimen/Jersey+15) and
  [Atkinson Hyperlegible Next](https://fonts.google.com/specimen/Atkinson+Hyperlegible+Next),
  both under the SIL Open Font License, bundled through Fontsource.
- Engine and libraries: [Phaser 3](https://phaser.io) (MIT), React, Vite, Tailwind CSS.
- The Syntax Grinch is an original character. The basketball room is a pun; it is not affiliated
  with any real player.

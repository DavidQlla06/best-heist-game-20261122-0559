# Glass Vault

[![make.fun competition](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/DavidQlla06/best-heist-game-20261122-0559/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/DavidQlla06/best-heist-game-20261122-0559/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)

**Glass Vault** is an original top-down vault-heist game built for the
[make.fun competition `best-heist-game-20261122-0559`](https://make.fun/bounty/best-heist-game-20261122-0559):
crack the vault on each of three floors, grab cash and gems, and slip out the
EXIT — without letting the alarm meter fill.

## How to play

- **Move:** WASD / arrow keys, or click a spot to walk there.
- **Sneak:** hold Shift — slower, but the alarm fills much more slowly.
- **Pause:** P · **Restart floor:** R · **Mute:** M.
- Guards patrol and cameras sweep **vision cones**; walls and crates block
  sight, so plan a route through the shadows. Being seen fills the **ALARM**
  meter (faster up close, slower while sneaking); a full meter means caught.
- The **vault** on each floor unlocks the EXIT. Optional cash and gems add
  score, and beating the floor's par time pays a time bonus.

Three floors — The Lobby Vault, The Marble Gallery, The Sunken Strongroom —
each with its own layout, palette, patrols and camera sweeps.

## Run it

Static files, no build step, fully offline. Serve the `game/` folder with any
static HTTP server, or from this repository:

```sh
node serve.ts        # then open http://localhost:8080
```

Hand-in (copies `game/` + `screenshots/` to the output dir and writes
`dossier.json`):

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts
```

## What's inside

- `game/` — the game: Canvas 2D, procedural art, WebAudio blips, no assets,
  no network. Modules under `game/src/`: `world.js` (rules, DOM-free),
  `levels.js` (the three floors as data), `render.js` (drawing, cones clipped
  by line of sight), `input.js`, `audio.js`, `shots.js` (the `?shot=` scenes
  behind the screenshots), `main.js` (loop and screens).
- `screenshots/` — real renders of the game's own code (`?shot=cover|title|alert|victory`, seed 7).
- `vendor/makefun-game.ts` — the make.fun kit library, unchanged.
- `main.ts` — the hand-in program.

Original game: own title, art, names and sounds. MIT licensed (see `LICENSE`).

// Boot and the one loop: input is read every frame, the world advances in fixed
// 1/60 s steps, and the renderer paints what is there. Screens: title, play,
// paused, caught, floor cleared, victory. ?seed=N fixes patrol phases;
// ?shot=cover|title|alert|victory stages that scene, paints twice and sets
// window.__shotReady for a screenshot.
import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_CAUGHT, EVENT_ESCAPED, EVENT_LOOT, EVENT_SPOTTED, EVENT_VAULT } from './world.js';
import { ACTION_CONFIRM, ACTION_PAUSE, ACTION_RESTART, createInput } from './input.js';
import { createAudio } from './audio.js';
import { createRenderer, SCREEN_CAUGHT, SCREEN_CLEAR, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_VICTORY } from './render.js';
import { stageShot } from './shots.js';
import { LEVELS } from './levels.js';

const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const audio = createAudio();
  const input = createInput(canvas, renderer.toField);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  function announce(message) {
    status.textContent = message;
  }

  function startRun() {
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    announce(`Floor 1: ${LEVELS[0].name}. Crack the vault, then reach the exit.`);
  }

  function retryFloor() {
    world.loadLevel(world.state.levelIndex);
    accumulator = 0;
    screen = SCREEN_PLAY;
    announce(`Floor ${world.state.levelIndex + 1} again. Stay out of the cones.`);
  }

  function nextFloor() {
    world.loadLevel(world.state.levelIndex + 1);
    accumulator = 0;
    screen = SCREEN_PLAY;
    announce(`Floor ${world.state.levelIndex + 1}: ${world.state.level.name}.`);
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    } else if (actions & (ACTION_PAUSE | ACTION_CONFIRM) && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Playing.');
    } else if (actions & ACTION_RESTART && (screen === SCREEN_PLAY || screen === SCREEN_CAUGHT || screen === SCREEN_PAUSED)) {
      retryFloor();
    } else if (actions & ACTION_CONFIRM) {
      if (screen === SCREEN_TITLE || screen === SCREEN_VICTORY) startRun();
      else if (screen === SCREEN_CLEAR) nextFloor();
      else if (screen === SCREEN_CAUGHT) retryFloor();
    }
  }

  function step() {
    const events = world.step(STEP, input.move(), input.sneaking(), input.takeClick());
    if (events & EVENT_LOOT) audio.loot();
    if (events & EVENT_VAULT) { audio.vault(); announce('Vault cracked. The exit is open.'); }
    if (events & EVENT_SPOTTED) { audio.spotted(); announce('Spotted! Break line of sight.'); }
    if (events & EVENT_CAUGHT) {
      audio.caught();
      screen = SCREEN_CAUGHT;
      announce(`Caught on floor ${world.state.levelIndex + 1}. Score ${world.state.score}.`);
    } else if (events & EVENT_ESCAPED) {
      audio.escaped();
      if (world.state.levelIndex === LEVELS.length - 1) {
        screen = SCREEN_VICTORY;
        if (world.state.score > best) { best = world.state.score; saveBest(best); }
        announce(`Clean getaway! Final score ${world.state.score}.`);
      } else {
        screen = SCREEN_CLEAR;
        announce(`Floor cleared. Score ${world.state.score}.`);
      }
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    if (screen === SCREEN_PLAY) {
      while (accumulator >= STEP && screen === SCREEN_PLAY) {
        step();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
      input.takeClick();
    }
    renderer.draw(world.state, screen, best);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Glass Vault. Press Space or click to start the heist.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();

// Screenshot scenes behind ?shot=cover|title|alert|victory. Each stages the real
// world (real level data, real guards/cameras/cones, real detection) and steps it
// forward with a fixed script, so the frame is what play really looks like and the
// same seed always gives the same frame. No scene paints anything by hand.
import { STEP } from './config.js';
import { LEVELS } from './levels.js';
import { SCREEN_PLAY, SCREEN_TITLE, SCREEN_VICTORY } from './render.js';

const STILL = { x: 0, y: 0 };

/** Step the world `seconds` with no input (guards patrol, cameras sweep). */
function idle(world, seconds) {
  const steps = Math.round(seconds / STEP);
  for (let i = 0; i < steps; i += 1) world.step(STEP, STILL, false, null);
}

/** Walk the thief toward a point through the real movement + collision rules. */
function walkTo(world, x, y, maxSeconds, sneak = false) {
  const steps = Math.round(maxSeconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    const t = world.state.thief;
    if (Math.hypot(x - t.x, y - t.y) < 8) return;
    world.step(STEP, null, sneak, { x, y });
    if (world.state.caught) return;
  }
}

export function stageShot(name, world) {
  world.reset();
  if (name === 'title') {
    idle(world, 2);
    return { screen: SCREEN_TITLE, best: 0 };
  }
  if (name === 'victory') {
    // A finished run: every floor escaped, final panel over the last room.
    world.loadLevel(LEVELS.length - 1);
    world.state.score = 4950;
    world.state.totalTime = 268;
    world.state.elapsed = 88;
    world.state.vaultTaken = true;
    for (const item of world.state.loot) item.taken = true;
    world.state.thief.x = world.state.level.exit.x;
    world.state.thief.y = world.state.level.exit.y + 40;
    idle(world, 1.2);
    return { screen: SCREEN_VICTORY, best: 4950 };
  }
  if (name === 'alert') {
    // Thief caught in a guard's cone: alarm nearly full, guard suspicious.
    idle(world, 1);
    const g = world.state.guards[0];
    const ahead = 95;
    world.state.thief.x = g.x + Math.cos(g.angle) * ahead;
    world.state.thief.y = g.y + Math.sin(g.angle) * ahead;
    if (!world.freeAt(world.state.thief.x, world.state.thief.y, 13)) {
      world.state.thief.x = g.x - Math.cos(g.angle) * ahead;
      world.state.thief.y = g.y - Math.sin(g.angle) * ahead;
      g.angle += Math.PI;
    }
    idle(world, 1.15);
    return { screen: SCREEN_PLAY, best: 0 };
  }
  // cover (default): mid-heist on floor 1 — thief crossing the middle room with two
  // guard cones and a camera cone in frame, vault loot ahead, alarm partly filled.
  idle(world, 1);
  walkTo(world, 250, 640, 4);
  walkTo(world, 250, 400, 4); // through the left doorway gap
  walkTo(world, 480, 400, 4);
  walkTo(world, 480, 620, 4); // grab the first gem
  walkTo(world, 600, 400, 5, true); // sneak up toward the middle room
  const g = world.state.guards[1];
  world.state.thief.x = g.x - 150;
  world.state.thief.y = g.y + 40;
  g.angle = Math.atan2(world.state.thief.y - g.y, world.state.thief.x - g.x);
  idle(world, 0.55); // seen briefly: alarm partly fills, cone turns red
  world.state.thief.angle = -Math.PI / 2;
  return { screen: SCREEN_PLAY, best: 0 };
}

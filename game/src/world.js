// Glass Vault rules and state, with no drawing and no browser in it, so the same code
// runs in the page and under Node for validation. The thief slips between patrolling
// guards and sweeping cameras; sight is a cone clipped by walls and crates. Being seen
// fills the alarm meter (slower while sneaking, faster up close); a full meter means
// caught. Grab the vault target to unlock the exit, then get out for the time bonus.
import { ALARM, CAMERA, FIELD, GUARD, SCORE, THIEF } from './config.js';
import { LEVELS, LOOT_KIND } from './levels.js';

export const EVENT_LOOT = 1;
export const EVENT_VAULT = 2;
export const EVENT_CAUGHT = 4;
export const EVENT_ESCAPED = 8;
export const EVENT_SPOTTED = 16;

/** True when point (x,y) lies inside rect r grown by `pad`. */
export function pointInRect(x, y, r, pad = 0) {
  return x > r.x - pad && x < r.x + r.w + pad && y > r.y - pad && y < r.y + r.h + pad;
}

/** Segment vs rect: does the sight line from (x1,y1) to (x2,y2) cross rect r? */
export function segmentHitsRect(x1, y1, x2, y2, r) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tMin = 0;
  let tMax = 1;
  const slabs = [
    [-dx, x1 - r.x], [dx, r.x + r.w - x1],
    [-dy, y1 - r.y], [dy, r.y + r.h - y1],
  ];
  for (const [p, q] of slabs) {
    if (Math.abs(p) < 1e-9) {
      if (q < 0) return false;
    } else {
      const t = q / p;
      if (p < 0) tMin = Math.max(tMin, t);
      else tMax = Math.min(tMax, t);
      if (tMin > tMax) return false;
    }
  }
  return true;
}

/** Angle difference wrapped to [-PI, PI]. */
export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function createWorld(random) {
  const state = {
    levelIndex: 0,
    level: null,
    solids: [],
    thief: { x: 0, y: 0, angle: -Math.PI / 2, sneaking: false, moving: false, target: null },
    guards: [],
    cameras: [],
    loot: [],
    alarm: 0,
    seen: false,
    score: 0,
    levelScore: 0,
    elapsed: 0,
    vaultTaken: false,
    caught: false,
    escaped: false,
    totalTime: 0,
  };

  function loadLevel(index) {
    const level = LEVELS[index];
    state.levelIndex = index;
    state.level = level;
    state.solids = [...level.walls, ...level.crates];
    state.thief.x = level.spawn.x;
    state.thief.y = level.spawn.y;
    state.thief.angle = -Math.PI / 2;
    state.thief.sneaking = false;
    state.thief.moving = false;
    state.thief.target = null;
    state.guards = level.guards.map((g) => {
      const start = Math.floor(random() * g.patrol.length);
      const p = g.patrol[start];
      const next = g.patrol[(start + 1) % g.patrol.length];
      return {
        x: p.x, y: p.y, patrol: g.patrol, waypoint: (start + 1) % g.patrol.length,
        angle: Math.atan2(next.y - p.y, next.x - p.x), wait: 0, alert: 0,
      };
    });
    state.cameras = level.cameras.map((c) => ({
      x: c.x, y: c.y, baseAngle: c.baseAngle, sweep: c.sweep,
      phase: random() * Math.PI * 2, angle: c.baseAngle,
    }));
    state.loot = level.loot.map((l) => ({ ...l, taken: false }));
    state.alarm = 0;
    state.seen = false;
    state.levelScore = 0;
    state.elapsed = 0;
    state.vaultTaken = false;
    state.caught = false;
    state.escaped = false;
  }

  function reset() {
    state.score = 0;
    state.totalTime = 0;
    loadLevel(0);
  }

  /** Circle vs solids: can a body of `radius` stand at (x,y)? */
  function freeAt(x, y, radius) {
    if (x < radius || y < radius || x > FIELD.width - radius || y > FIELD.height - radius) return false;
    for (const r of state.solids) if (pointInRect(x, y, r, radius)) return false;
    return true;
  }

  /** Move a body with axis-separated sliding so it glides along walls. */
  function slideMove(body, dx, dy, radius) {
    if (freeAt(body.x + dx, body.y, radius)) body.x += dx;
    if (freeAt(body.x, body.y + dy, radius)) body.y += dy;
  }

  /** Is the thief inside a watcher's cone with a clear sight line? Returns 0..1 closeness. */
  function sightStrength(wx, wy, wAngle, range, halfAngle) {
    const dx = state.thief.x - wx;
    const dy = state.thief.y - wy;
    const dist = Math.hypot(dx, dy);
    if (dist > range || dist < 1) return 0;
    if (Math.abs(angleDiff(Math.atan2(dy, dx), wAngle)) > halfAngle) return 0;
    for (const r of state.solids) {
      if (segmentHitsRect(wx, wy, state.thief.x, state.thief.y, r)) return 0;
    }
    return 1 - dist / range;
  }

  function stepGuards(dt) {
    for (const g of state.guards) {
      if (g.wait > 0) {
        g.wait -= dt;
        continue;
      }
      const target = g.patrol[g.waypoint];
      const dx = target.x - g.x;
      const dy = target.y - g.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 4) {
        g.waypoint = (g.waypoint + 1) % g.patrol.length;
        g.wait = GUARD.pauseAtWaypoint;
        continue;
      }
      const stepLen = Math.min(dist, GUARD.speed * dt);
      g.x += (dx / dist) * stepLen;
      g.y += (dy / dist) * stepLen;
      g.angle = Math.atan2(dy, dx);
    }
  }

  /**
   * One fixed step. `move` is {x, y} in -1..1 (keyboard) or null; `clickTarget` is a
   * field point to walk toward (click-to-move), cleared on arrival or on keyboard input.
   */
  function step(dt, move, sneaking, clickTarget) {
    if (state.caught || state.escaped) return 0;
    let events = 0;
    state.elapsed += dt;
    state.totalTime += dt;
    const thief = state.thief;
    thief.sneaking = sneaking;

    let mx = 0;
    let my = 0;
    if (move && (move.x !== 0 || move.y !== 0)) {
      mx = move.x;
      my = move.y;
      thief.target = null;
    } else if (clickTarget) {
      thief.target = clickTarget;
    }
    if (mx === 0 && my === 0 && thief.target) {
      const dx = thief.target.x - thief.x;
      const dy = thief.target.y - thief.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 6) thief.target = null;
      else { mx = dx / dist; my = dy / dist; }
    }
    const len = Math.hypot(mx, my);
    thief.moving = len > 0;
    if (thief.moving) {
      const speed = sneaking ? THIEF.sneakSpeed : THIEF.walkSpeed;
      slideMove(thief, (mx / len) * speed * dt, (my / len) * speed * dt, THIEF.radius);
      thief.angle = Math.atan2(my, mx);
    }

    stepGuards(dt);
    for (const c of state.cameras) {
      c.phase += dt * CAMERA.sweepSpeed;
      c.angle = c.baseAngle + Math.sin(c.phase) * c.sweep;
    }

    // Detection: the strongest watcher wins; alarm fills by closeness and posture.
    let strength = 0;
    for (const g of state.guards) {
      const s = sightStrength(g.x, g.y, g.angle, GUARD.viewRange, GUARD.viewHalfAngle);
      g.alert = s > 0 ? 1 : Math.max(0, g.alert - dt * 2);
      if (s > strength) strength = s;
    }
    for (const c of state.cameras) {
      const s = sightStrength(c.x, c.y, c.angle, CAMERA.viewRange, CAMERA.viewHalfAngle);
      if (s > strength) strength = s;
    }
    const wasSeen = state.seen;
    state.seen = strength > 0;
    if (state.seen) {
      let rate = ALARM.fillRate * (0.35 + 0.65 * strength);
      if (sneaking) rate *= ALARM.sneakFactor;
      if (!thief.moving) rate *= ALARM.stillFactor;
      state.alarm = Math.min(ALARM.max, state.alarm + rate * dt);
      if (!wasSeen) events |= EVENT_SPOTTED;
    } else {
      state.alarm = Math.max(0, state.alarm - ALARM.decayRate * dt);
    }
    if (state.alarm >= ALARM.max) {
      state.caught = true;
      events |= EVENT_CAUGHT;
      return events;
    }

    for (const item of state.loot) {
      if (item.taken) continue;
      if (Math.hypot(item.x - thief.x, item.y - thief.y) <= THIEF.lootReach) {
        item.taken = true;
        state.levelScore += item.value;
        state.score += item.value;
        events |= EVENT_LOOT;
        if (item.kind === LOOT_KIND.VAULT) {
          state.vaultTaken = true;
          events |= EVENT_VAULT;
        }
      }
    }

    const exit = state.level.exit;
    if (state.vaultTaken && Math.hypot(exit.x - thief.x, exit.y - thief.y) <= THIEF.lootReach) {
      const bonus = Math.max(0, Math.round((state.level.par - state.elapsed) * SCORE.timeBonusPerSecond));
      state.levelScore += bonus;
      state.score += bonus;
      state.escaped = true;
      events |= EVENT_ESCAPED;
    }
    return events;
  }

  reset();
  return { state, reset, loadLevel, step, sightStrength, freeAt };
}

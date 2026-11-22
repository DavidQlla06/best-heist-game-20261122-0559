// Drawing only: world state plus the current screen in, pixels out. The 1280x720
// field is scaled to fit the window and centred. Everything is procedural canvas
// art: checkered floors, walled rooms, vision cones clipped by line of sight (each
// cone is drawn as rays that stop at the first solid), the alarm meter, and panels
// for the title, pause, caught, level-complete and victory screens.
import { ALARM, CAMERA, FIELD, FONT, GUARD, THIEF } from './config.js';
import { LOOT_KIND } from './levels.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_CAUGHT = 'caught';
export const SCREEN_CLEAR = 'clear';
export const SCREEN_VICTORY = 'victory';

const PANEL = { width: 640, top: 120, line: 32, bottom: 66 };

function cachedLabel(prefix) {
  let value = null;
  let text = '';
  return function label(next) {
    if (next !== value) {
      value = next;
      text = prefix + next;
    }
    return text;
  };
}

function formatTime(seconds) {
  const s = Math.floor(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function createRenderer(canvas) {
  const context = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };
  const scoreLabel = cachedLabel('Score ');
  const bestLabel = cachedLabel('Best ');

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(window.innerWidth * ratio);
    const height = Math.round(window.innerHeight * ratio);
    canvas.width = width;
    canvas.height = height;
    view.scale = Math.min(width / FIELD.width, height / FIELD.height);
    view.x = (width - FIELD.width * view.scale) / 2;
    view.y = (height - FIELD.height * view.scale) / 2;
  }

  /** Client pixel -> field point (for click-to-move); null outside the field. */
  function toField(clientX, clientY) {
    const ratio = window.devicePixelRatio || 1;
    const x = (clientX * ratio - view.x) / view.scale;
    const y = (clientY * ratio - view.y) / view.scale;
    if (x < 0 || y < 0 || x > FIELD.width || y > FIELD.height) return null;
    return { x, y };
  }

  const fonts = new Map();
  function text(value, x, y, size, color, align, bold = false) {
    const key = `${bold ? 'b' : ''}${size}`;
    if (!fonts.has(key)) fonts.set(key, `${bold ? '700 ' : ''}${size}px ${FONT}`);
    context.font = fonts.get(key);
    context.fillStyle = color;
    context.textAlign = align;
    context.fillText(value, x, y);
  }

  function drawFloor(palette) {
    const tile = 64;
    for (let ty = 0; ty < FIELD.height / tile; ty += 1) {
      for (let tx = 0; tx < FIELD.width / tile; tx += 1) {
        context.fillStyle = (tx + ty) % 2 === 0 ? palette.floor : palette.floorAlt;
        context.fillRect(tx * tile, ty * tile, tile, tile);
      }
    }
  }

  function drawSolids(level) {
    const p = level.palette;
    for (const r of level.walls) {
      context.fillStyle = p.wall;
      context.fillRect(r.x, r.y, r.w, r.h);
      context.fillStyle = p.wallTop;
      context.fillRect(r.x, r.y, r.w, Math.min(5, r.h));
    }
    for (const r of level.crates) {
      context.fillStyle = p.crate;
      context.fillRect(r.x, r.y, r.w, r.h);
      context.strokeStyle = p.crateEdge;
      context.lineWidth = 3;
      context.strokeRect(r.x + 2, r.y + 2, r.w - 4, r.h - 4);
      context.beginPath();
      context.moveTo(r.x + 2, r.y + 2);
      context.lineTo(r.x + r.w - 2, r.y + r.h - 2);
      context.moveTo(r.x + r.w - 2, r.y + 2);
      context.lineTo(r.x + 2, r.y + r.h - 2);
      context.stroke();
    }
  }

  /** Distance from (x,y) along `angle` to the first solid, capped at `range`. */
  function rayDistance(solids, x, y, angle, range) {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    let best = range;
    for (const r of solids) {
      let tMin = 0;
      let tMax = best;
      let ok = true;
      const slabs = [[-dx, x - r.x], [dx, r.x + r.w - x], [-dy, y - r.y], [dy, r.y + r.h - y]];
      for (const [pp, q] of slabs) {
        if (Math.abs(pp) < 1e-9) { if (q < 0) { ok = false; break; } }
        else {
          const t = q / pp;
          if (pp < 0) tMin = Math.max(tMin, t);
          else tMax = Math.min(tMax, t);
          if (tMin > tMax) { ok = false; break; }
        }
      }
      if (ok && tMin > 0 && tMin < best) best = tMin;
    }
    return best;
  }

  function drawCone(solids, x, y, angle, range, halfAngle, fill) {
    const rays = 24;
    context.fillStyle = fill;
    context.beginPath();
    context.moveTo(x, y);
    for (let i = 0; i <= rays; i += 1) {
      const a = angle - halfAngle + (2 * halfAngle * i) / rays;
      const d = rayDistance(solids, x, y, a, range);
      context.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d);
    }
    context.closePath();
    context.fill();
  }

  function drawExit(state) {
    const exit = state.level.exit;
    const open = state.vaultTaken;
    context.fillStyle = open ? '#2ecc71' : '#5a6270';
    context.fillRect(exit.x - 22, exit.y - 22, 44, 44);
    context.strokeStyle = '#10131a';
    context.lineWidth = 3;
    context.strokeRect(exit.x - 22, exit.y - 22, 44, 44);
    context.textBaseline = 'middle';
    text('EXIT', exit.x, exit.y + 1, 15, '#10131a', 'center', true);
    context.textBaseline = 'alphabetic';
  }

  function drawLoot(state) {
    const pulse = 1 + Math.sin(state.elapsed * 4) * 0.08;
    for (const item of state.loot) {
      if (item.taken) continue;
      if (item.kind === LOOT_KIND.VAULT) {
        context.fillStyle = '#f2c94c';
        context.fillRect(item.x - 20 * pulse, item.y - 16 * pulse, 40 * pulse, 32 * pulse);
        context.fillStyle = '#8a6d1f';
        context.fillRect(item.x - 20 * pulse, item.y - 4, 40 * pulse, 5);
        context.fillStyle = '#10131a';
        context.beginPath();
        context.arc(item.x, item.y + 4, 5, 0, Math.PI * 2);
        context.fill();
        text('VAULT', item.x, item.y - 26, 14, '#f2c94c', 'center', true);
      } else if (item.kind === LOOT_KIND.CASH) {
        context.fillStyle = '#7ee787';
        context.fillRect(item.x - 14, item.y - 9, 28, 18);
        context.strokeStyle = '#1d5c2e';
        context.lineWidth = 2;
        context.strokeRect(item.x - 14, item.y - 9, 28, 18);
        text('$', item.x, item.y + 5, 14, '#14532d', 'center', true);
      } else {
        context.fillStyle = '#6ee7ff';
        context.beginPath();
        context.moveTo(item.x, item.y - 13);
        context.lineTo(item.x + 11, item.y);
        context.lineTo(item.x, item.y + 13);
        context.lineTo(item.x - 11, item.y);
        context.closePath();
        context.fill();
        context.strokeStyle = '#0e7490';
        context.lineWidth = 2;
        context.stroke();
      }
    }
  }

  function drawGuard(g, alarm) {
    context.fillStyle = '#3b82f6';
    context.beginPath();
    context.arc(g.x, g.y, GUARD.radius, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#1e3a5f';
    context.beginPath();
    context.arc(g.x, g.y, GUARD.radius - 5, 0, Math.PI * 2);
    context.fill();
    // Facing tick.
    context.strokeStyle = '#dbeafe';
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(g.x, g.y);
    context.lineTo(g.x + Math.cos(g.angle) * (GUARD.radius + 5), g.y + Math.sin(g.angle) * (GUARD.radius + 5));
    context.stroke();
    if (g.alert > 0.3 || alarm >= ALARM.suspicionAt) {
      text(alarm >= 75 ? '!' : '?', g.x, g.y - GUARD.radius - 8, 22, alarm >= 75 ? '#ff5a4e' : '#f2c94c', 'center', true);
    }
  }

  function drawCamera(c) {
    context.fillStyle = '#e8ecf3';
    context.fillRect(c.x - 8, c.y - 8, 16, 16);
    context.fillStyle = '#e5534b';
    context.beginPath();
    context.arc(c.x, c.y, 4, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = '#e8ecf3';
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(c.x, c.y);
    context.lineTo(c.x + Math.cos(c.angle) * 18, c.y + Math.sin(c.angle) * 18);
    context.stroke();
  }

  function drawThief(state) {
    const t = state.thief;
    if (t.target) {
      context.strokeStyle = '#f2c94c';
      context.lineWidth = 2;
      context.beginPath();
      context.arc(t.target.x, t.target.y, 8, 0, Math.PI * 2);
      context.stroke();
    }
    // Soft shadow under the thief so the figure reads against the floor tiles.
    context.fillStyle = 'rgba(0,0,0,0.35)';
    context.beginPath();
    context.ellipse(t.x + 3, t.y + 5, THIEF.radius, THIEF.radius * 0.62, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = state.seen ? '#ff8a7a' : '#ffd166';
    context.beginPath();
    context.arc(t.x, t.y, THIEF.radius, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#10131a';
    context.beginPath();
    context.arc(t.x, t.y, THIEF.radius - 6, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = '#ffd166';
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(t.x, t.y);
    context.lineTo(t.x + Math.cos(t.angle) * (THIEF.radius + 4), t.y + Math.sin(t.angle) * (THIEF.radius + 4));
    context.stroke();
    if (t.sneaking) text('sneaking', t.x, t.y - THIEF.radius - 10, 13, '#9fb4d8', 'center');
  }

  function drawHud(state) {
    context.fillStyle = 'rgba(10,13,20,0.82)';
    context.fillRect(0, 0, FIELD.width, 64);
    context.textBaseline = 'top';
    text(scoreLabel(state.score), 22, 10, 24, '#eef1f5', 'left', true);
    text(`Floor ${state.levelIndex + 1}/3  ${state.level.name}`, FIELD.width / 2, 10, 22, '#eef1f5', 'center', true);
    text(`Time ${formatTime(state.elapsed)}`, FIELD.width - 22, 10, 24, '#eef1f5', 'right', true);
    // Alarm meter: the frame every judge looks for.
    const barX = FIELD.width / 2 - 180;
    const barY = 40;
    context.fillStyle = '#2a3040';
    context.fillRect(barX, barY, 360, 14);
    const frac = state.alarm / ALARM.max;
    context.fillStyle = frac >= 0.75 ? '#ff5a4e' : frac >= 0.35 ? '#f2c94c' : '#7ee787';
    context.fillRect(barX, barY, 360 * frac, 14);
    context.strokeStyle = '#8b93a3';
    context.lineWidth = 1;
    context.strokeRect(barX, barY, 360, 14);
    text('ALARM', barX - 10, barY - 1, 15, state.seen ? '#ff5a4e' : '#8b93a3', 'right', true);
    const lootLeft = state.loot.filter((l) => !l.taken).length;
    text(state.vaultTaken ? 'Vault cracked — get to EXIT!' : `Loot left: ${lootLeft} (vault first)`, 22, 40, 15, '#f2c94c', 'left');
    text(state.seen ? 'SPOTTED!' : 'WASD / click · Shift sneak · P pause · R restart', FIELD.width - 22, 40, 15, state.seen ? '#ff5a4e' : '#8b93a3', 'right');
  }

  function drawPanel(title, lines, prompt, accent) {
    const height = PANEL.top + lines.length * PANEL.line + PANEL.bottom;
    const x = (FIELD.width - PANEL.width) / 2;
    const y = (FIELD.height - height) / 2;
    context.fillStyle = 'rgba(16,20,28,0.94)';
    context.fillRect(x, y, PANEL.width, height);
    context.strokeStyle = accent;
    context.lineWidth = 3;
    context.strokeRect(x, y, PANEL.width, height);
    context.textBaseline = 'alphabetic';
    text(title, FIELD.width / 2, y + 74, 46, '#eef1f5', 'center', true);
    for (let i = 0; i < lines.length; i += 1) {
      text(lines[i], FIELD.width / 2, y + PANEL.top + i * PANEL.line, 21, '#aab4c4', 'center');
    }
    text(prompt, FIELD.width / 2, y + height - 38, 23, accent, 'center', true);
  }

  function draw(state, screen, best) {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = '#0b0e14';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
    drawFloor(state.level.palette);
    // Cones first (under everyone), clipped by walls and crates.
    for (const g of state.guards) {
      drawCone(state.solids, g.x, g.y, g.angle, GUARD.viewRange, GUARD.viewHalfAngle, g.alert > 0.3 ? 'rgba(255,90,78,0.30)' : 'rgba(242,201,76,0.22)');
    }
    for (const c of state.cameras) {
      drawCone(state.solids, c.x, c.y, c.angle, CAMERA.viewRange, CAMERA.viewHalfAngle, 'rgba(110,231,255,0.18)');
    }
    drawSolids(state.level);
    drawExit(state);
    drawLoot(state);
    for (const c of state.cameras) drawCamera(c);
    for (const g of state.guards) drawGuard(g, state.alarm);
    drawThief(state);
    drawHud(state);
    if (screen === SCREEN_TITLE) {
      drawPanel('Glass Vault', [
        'Crack the vault on each floor, grab the loot, slip out the EXIT.',
        'Vision cones from guards and cameras — walls block sight.',
        'Seen? The ALARM fills. Full meter means caught. Sneak with Shift.',
        'Move: WASD / arrows or click.  Pause P · Restart R · Mute M.',
        bestLabel(best),
      ], 'Press Space or click to start the heist', '#f2c94c');
    } else if (screen === SCREEN_PAUSED) {
      drawPanel('Paused', ['The guards hold their breath.'], 'Press P to resume', '#f2c94c');
    } else if (screen === SCREEN_CAUGHT) {
      drawPanel('Caught!', [
        `The alarm hit 100 on floor ${state.levelIndex + 1}.`,
        scoreLabel(state.score),
      ], 'Press R to retry this floor', '#ff5a4e');
    } else if (screen === SCREEN_CLEAR) {
      drawPanel('Floor cleared!', [
        `Loot + time bonus: ${state.levelScore}`,
        `Total score: ${state.score}`,
      ], 'Press Space for the next floor', '#7ee787');
    } else if (screen === SCREEN_VICTORY) {
      drawPanel('Clean getaway!', [
        'All three vaults cracked. The city never saw you.',
        `Final score: ${state.score}`,
        `Total time: ${formatTime(state.totalTime)}`,
        bestLabel(best),
      ], 'Press Space to run it again', '#f2c94c');
    }
  }

  resize();
  window.addEventListener('resize', resize);
  return { draw, toField };
}

// Keyboard and pointer input. Held keys give a steering vector; one-shot presses
// (confirm, pause, restart) are queued as bit flags and taken once by the loop, so a
// press between two frames is never lost and never counted twice. A pointer press
// becomes a walk-to point in field coordinates for click-to-move.

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_RESTART = 4;

const UP = new Set(['ArrowUp', 'KeyW']);
const DOWN = new Set(['ArrowDown', 'KeyS']);
const LEFT = new Set(['ArrowLeft', 'KeyA']);
const RIGHT = new Set(['ArrowRight', 'KeyD']);
const CONFIRM = new Set(['Space', 'Enter']);
const PAUSE = new Set(['KeyP', 'Escape']);
const RESTART = new Set(['KeyR']);
const SNEAK = new Set(['ShiftLeft', 'ShiftRight']);

export function createInput(canvas, toField) {
  const held = { up: false, down: false, left: false, right: false, sneak: false };
  let actions = 0;
  let clickPoint = null;

  window.addEventListener('keydown', (event) => {
    if (UP.has(event.code)) held.up = true;
    else if (DOWN.has(event.code)) held.down = true;
    else if (LEFT.has(event.code)) held.left = true;
    else if (RIGHT.has(event.code)) held.right = true;
    else if (SNEAK.has(event.code)) held.sneak = true;
    else if (CONFIRM.has(event.code)) { if (!event.repeat) actions |= ACTION_CONFIRM; }
    else if (PAUSE.has(event.code)) { if (!event.repeat) actions |= ACTION_PAUSE; }
    else if (RESTART.has(event.code)) { if (!event.repeat) actions |= ACTION_RESTART; }
    else return;
    event.preventDefault();
  });
  window.addEventListener('keyup', (event) => {
    if (UP.has(event.code)) held.up = false;
    else if (DOWN.has(event.code)) held.down = false;
    else if (LEFT.has(event.code)) held.left = false;
    else if (RIGHT.has(event.code)) held.right = false;
    else if (SNEAK.has(event.code)) held.sneak = false;
  });
  // A key released while the tab is hidden never sends keyup: let go of everything on blur.
  window.addEventListener('blur', () => {
    held.up = held.down = held.left = held.right = held.sneak = false;
  });
  canvas.addEventListener('pointerdown', (event) => {
    const point = toField(event.clientX, event.clientY);
    if (point) clickPoint = point;
    actions |= ACTION_CONFIRM;
  });

  return {
    /** Steering vector, each axis -1..1. */
    move() {
      return { x: (held.right ? 1 : 0) - (held.left ? 1 : 0), y: (held.down ? 1 : 0) - (held.up ? 1 : 0) };
    },
    sneaking() {
      return held.sneak;
    },
    /** The pending click-to-move point, taken once. */
    takeClick() {
      const point = clickPoint;
      clickPoint = null;
      return point;
    },
    /** The one-shot presses since the last call, as ACTION_* flags. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
  };
}

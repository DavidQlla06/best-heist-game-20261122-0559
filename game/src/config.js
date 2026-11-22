// Glass Vault tuning: one place for every number the rules and the drawing share.
// The playfield is a fixed 1280x720 logical room; the renderer scales it to the window,
// so no rule depends on the screen size.

export const FIELD = { width: 1280, height: 720 };

/** Fixed simulation step (60 a second), whatever the display's rate. */
export const STEP = 1 / 60;

export const THIEF = {
  radius: 13,
  walkSpeed: 178,
  sneakSpeed: 96,
  lootReach: 26,
};

export const GUARD = {
  radius: 13,
  speed: 72,
  viewRange: 205,
  viewHalfAngle: 0.62, // radians, about 36 degrees each side of facing
  pauseAtWaypoint: 0.7,
};

export const CAMERA = {
  viewRange: 185,
  viewHalfAngle: 0.5,
  sweepSpeed: 0.55, // radians of swing per second at the extremes' pace
};

export const ALARM = {
  max: 100,
  // Detection per second at point blank, standing in the open; falls off with distance.
  fillRate: 55,
  sneakFactor: 0.45, // sneaking fills the meter this much slower
  stillFactor: 0.8, // standing still is a little harder to spot than moving
  decayRate: 9, // per second while nobody can see the thief
  suspicionAt: 35, // guards turn "?" yellow past this
};

export const SCORE = {
  timeBonusPerSecond: 5,
};

/** Where the best total score is kept between visits (this browser only). */
export const BEST_KEY = 'glass-vault.best';

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

// The three vault floors. Pure data: wall rectangles (solid, block sight), crates
// (solid, block sight, drawn as cover), the thief's entry, the getaway exit, loot,
// guard patrol loops and wall cameras. Coordinates are in the 1280x720 field;
// x/y are a rectangle's top-left corner, loot/guard points are centres.
//
// Every level has one vault target (the big score, needed to unlock the exit) plus
// optional cash and gems. `par` is the seconds a clean run should take; beating it
// pays a time bonus.

export const LOOT_KIND = { VAULT: 'vault', CASH: 'cash', GEM: 'gem' };

export const LEVELS = [
  {
    name: 'The Lobby Vault',
    par: 75,
    palette: {
      floor: '#232a38', floorAlt: '#273041', wall: '#4a5a75', wallTop: '#5d7194',
      crate: '#7a5c38', crateEdge: '#97744a', accent: '#f2c94c',
    },
    walls: [
      { x: 0, y: 0, w: 1280, h: 24 }, { x: 0, y: 696, w: 1280, h: 24 },
      { x: 0, y: 0, w: 24, h: 720 }, { x: 1256, y: 0, w: 24, h: 720 },
      { x: 300, y: 24, w: 24, h: 300 }, { x: 300, y: 470, w: 24, h: 250 },
      { x: 640, y: 200, w: 24, h: 320 }, { x: 640, y: 24, w: 24, h: 90 },
      { x: 960, y: 24, w: 24, h: 260 }, { x: 960, y: 440, w: 24, h: 280 },
      { x: 24, y: 350, w: 180, h: 24 }, { x: 1080, y: 330, w: 176, h: 24 },
    ],
    crates: [
      { x: 440, y: 300, w: 56, h: 56 }, { x: 800, y: 120, w: 56, h: 56 },
      { x: 800, y: 540, w: 56, h: 56 }, { x: 120, y: 520, w: 56, h: 56 },
      { x: 1120, y: 520, w: 56, h: 56 },
    ],
    spawn: { x: 90, y: 640 },
    exit: { x: 90, y: 80 },
    loot: [
      { kind: LOOT_KIND.VAULT, x: 1140, y: 110, value: 1000 },
      { kind: LOOT_KIND.CASH, x: 480, y: 120, value: 150 },
      { kind: LOOT_KIND.CASH, x: 1140, y: 640, value: 150 },
      { kind: LOOT_KIND.GEM, x: 480, y: 620, value: 300 },
      { kind: LOOT_KIND.GEM, x: 820, y: 360, value: 300 },
    ],
    guards: [
      { patrol: [{ x: 540, y: 180 }, { x: 540, y: 560 }, { x: 600, y: 560 }, { x: 600, y: 180 }] },
      { patrol: [{ x: 820, y: 250 }, { x: 820, y: 470 }, { x: 900, y: 470 }, { x: 900, y: 250 }] },
      { patrol: [{ x: 1020, y: 200 }, { x: 1020, y: 600 }] },
    ],
    cameras: [
      { x: 312, y: 396, baseAngle: 0, sweep: 0.9 },
      { x: 652, y: 560, baseAngle: Math.PI / 2, sweep: 0.8 },
      { x: 1244, y: 180, baseAngle: Math.PI, sweep: 0.7 },
    ],
  },
  {
    name: 'The Marble Gallery',
    par: 95,
    palette: {
      floor: '#2b2438', floorAlt: '#322a42', wall: '#5d4f7d', wallTop: '#75659c',
      crate: '#6e5a44', crateEdge: '#8a7357', accent: '#c792ff',
    },
    walls: [
      { x: 0, y: 0, w: 1280, h: 24 }, { x: 0, y: 696, w: 1280, h: 24 },
      { x: 0, y: 0, w: 24, h: 720 }, { x: 1256, y: 0, w: 24, h: 720 },
      { x: 24, y: 240, w: 420, h: 24 }, { x: 840, y: 240, w: 416, h: 24 },
      { x: 24, y: 480, w: 420, h: 24 }, { x: 840, y: 480, w: 416, h: 24 },
      { x: 520, y: 24, w: 24, h: 140 }, { x: 740, y: 556, w: 24, h: 140 },
      { x: 620, y: 330, w: 40, h: 60 },
    ],
    crates: [
      { x: 180, y: 120, w: 56, h: 56 }, { x: 1040, y: 120, w: 56, h: 56 },
      { x: 180, y: 560, w: 56, h: 56 }, { x: 1040, y: 560, w: 56, h: 56 },
      { x: 500, y: 350, w: 56, h: 56 }, { x: 730, y: 350, w: 56, h: 56 },
      { x: 612, y: 120, w: 56, h: 56 },
    ],
    spawn: { x: 640, y: 650 },
    exit: { x: 640, y: 660 },
    loot: [
      { kind: LOOT_KIND.VAULT, x: 640, y: 90, value: 1500 },
      { kind: LOOT_KIND.CASH, x: 120, y: 120, value: 150 },
      { kind: LOOT_KIND.CASH, x: 1160, y: 120, value: 150 },
      { kind: LOOT_KIND.CASH, x: 120, y: 620, value: 150 },
      { kind: LOOT_KIND.CASH, x: 1160, y: 620, value: 150 },
      { kind: LOOT_KIND.GEM, x: 590, y: 360, value: 400 },
      { kind: LOOT_KIND.GEM, x: 300, y: 360, value: 300 },
      { kind: LOOT_KIND.GEM, x: 980, y: 360, value: 300 },
    ],
    guards: [
      { patrol: [{ x: 200, y: 300 }, { x: 1080, y: 300 }] },
      { patrol: [{ x: 700, y: 300 }, { x: 700, y: 440 }] },
      { patrol: [{ x: 470, y: 150 }, { x: 470, y: 570 }] },
      { patrol: [{ x: 810, y: 570 }, { x: 810, y: 150 }] },
    ],
    cameras: [
      { x: 640, y: 36, baseAngle: Math.PI / 2, sweep: 1.0 },
      { x: 36, y: 360, baseAngle: 0, sweep: 0.8 },
      { x: 1244, y: 360, baseAngle: Math.PI, sweep: 0.8 },
      { x: 640, y: 684, baseAngle: -Math.PI / 2, sweep: 0.9 },
    ],
  },
  {
    name: 'The Sunken Strongroom',
    par: 115,
    palette: {
      floor: '#17302e', floorAlt: '#1b3835', wall: '#2f5d57', wallTop: '#3f7a72',
      crate: '#5d5240', crateEdge: '#776a52', accent: '#4fe3c1',
    },
    walls: [
      { x: 0, y: 0, w: 1280, h: 24 }, { x: 0, y: 696, w: 1280, h: 24 },
      { x: 0, y: 0, w: 24, h: 720 }, { x: 1256, y: 0, w: 24, h: 720 },
      { x: 200, y: 24, w: 24, h: 240 }, { x: 200, y: 460, w: 24, h: 260 },
      { x: 1056, y: 24, w: 24, h: 240 }, { x: 1056, y: 460, w: 24, h: 260 },
      { x: 420, y: 180, w: 440, h: 24 }, { x: 420, y: 516, w: 440, h: 24 },
      { x: 420, y: 180, w: 24, h: 140 }, { x: 836, y: 400, w: 24, h: 140 },
      { x: 580, y: 330, w: 120, h: 60 },
    ],
    crates: [
      { x: 320, y: 90, w: 56, h: 56 }, { x: 900, y: 90, w: 56, h: 56 },
      { x: 320, y: 580, w: 56, h: 56 }, { x: 900, y: 580, w: 56, h: 56 },
      { x: 460, y: 430, w: 56, h: 56 }, { x: 750, y: 230, w: 56, h: 56 },
      { x: 100, y: 330, w: 56, h: 56 }, { x: 1120, y: 330, w: 56, h: 56 },
    ],
    spawn: { x: 640, y: 640 },
    exit: { x: 640, y: 80 },
    loot: [
      { kind: LOOT_KIND.VAULT, x: 640, y: 440, value: 2000 },
      { kind: LOOT_KIND.CASH, x: 110, y: 110, value: 200 },
      { kind: LOOT_KIND.CASH, x: 1170, y: 110, value: 200 },
      { kind: LOOT_KIND.CASH, x: 110, y: 610, value: 200 },
      { kind: LOOT_KIND.CASH, x: 1170, y: 610, value: 200 },
      { kind: LOOT_KIND.GEM, x: 640, y: 110, value: 500 },
      { kind: LOOT_KIND.GEM, x: 640, y: 610, value: 500 },
      { kind: LOOT_KIND.GEM, x: 320, y: 360, value: 400 },
      { kind: LOOT_KIND.GEM, x: 960, y: 360, value: 400 },
    ],
    guards: [
      { patrol: [{ x: 360, y: 165 }, { x: 920, y: 165 }, { x: 920, y: 560 }, { x: 360, y: 560 }] },
      { patrol: [{ x: 540, y: 260 }, { x: 540, y: 460 }] },
      { patrol: [{ x: 175, y: 200 }, { x: 175, y: 520 }] },
      { patrol: [{ x: 1010, y: 520 }, { x: 1010, y: 200 }] },
      { patrol: [{ x: 500, y: 310 }, { x: 780, y: 310 }] },
    ],
    cameras: [
      { x: 640, y: 36, baseAngle: Math.PI / 2, sweep: 1.1 },
      { x: 212, y: 360, baseAngle: 0, sweep: 0.9 },
      { x: 1068, y: 360, baseAngle: Math.PI, sweep: 0.9 },
      { x: 640, y: 684, baseAngle: -Math.PI / 2, sweep: 1.0 },
      { x: 36, y: 80, baseAngle: Math.PI / 4, sweep: 0.7 },
      { x: 1244, y: 640, baseAngle: -3 * Math.PI / 4, sweep: 0.7 },
    ],
  },
];

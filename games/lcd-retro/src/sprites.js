const GUNFIGHTER_STROKES = [
  { part: 'hat', points: [[-17, -67], [-3, -75], [13, -72], [23, -63], [7, -62], [-7, -64], [-20, -59]] },
  { part: 'hair', points: [[-12, -61], [-20, -49], [-18, -38], [-9, -44], [-6, -56]] },
  { part: 'face', points: [[-4, -62], [9, -60], [17, -51], [15, -39], [4, -34], [-6, -39], [-10, -52], [-4, -62]] },
  { part: 'face', points: [[8, -54], [14, -54], [17, -49]] },
  { part: 'neck', points: [[3, -35], [0, -26], [10, -23], [15, -32]] },
  { part: 'vest', points: [[-7, -28], [-20, -7], [-14, 18], [8, 26], [27, 14], [25, -11], [10, -25], [-7, -28]] },
  { part: 'vest', points: [[0, -25], [4, 18], [20, 8]] },
  { part: 'belt', points: [[-16, 7], [2, 13], [24, 8]] },
  { part: 'arm', points: [[-11, -20], [-25, -10], [-29, 5], [-21, 10], [-14, 0]] },
  { part: 'arm', points: [[15, -21], [31, -14], [37, -3], [29, 2], [19, -7]] },
  { part: 'gun', points: [[-28, -2], [-43, -10], [-47, -18], [-39, -22], [-31, -11]] },
  { part: 'gun', points: [[-47, -18], [-55, -17], [-57, -11], [-49, -10]] },
  { part: 'hand', points: [[-29, 1], [-23, 6], [-17, 0]] },
  { part: 'hand', points: [[36, -2], [40, 5], [33, 8]] },
  { part: 'leg', points: [[-8, 20], [-20, 35], [-17, 50], [-5, 43], [1, 28]] },
  { part: 'bent-leg', points: [[13, 22], [28, 31], [19, 44], [4, 39], [8, 29]] },
  { part: 'boot', points: [[-17, 50], [-32, 53], [-27, 59], [-10, 55]] },
  { part: 'boot', points: [[19, 44], [32, 51], [25, 57], [10, 49]] },
  { part: 'detail', points: [[-3, -8], [8, -4], [18, -8]] },
  { part: 'detail', points: [[-11, -16], [0, -10], [-7, 0]] }
];

export function getCharacterSpriteAsset() {
  return 'assets/cowboy.png';
}

export function getEnemySpriteAsset(laneLabel) {
  const assets = {
    door: 'assets/cowboy.png',
    'table-left': 'assets/patron-1.png',
    'table-right': 'assets/patron-2.png',
    bar: 'assets/bartender.png'
  };
  return assets[laneLabel] ?? getCharacterSpriteAsset();
}

export function getGunfighterSpriteStrokes() {
  return GUNFIGHTER_STROKES.map((stroke) => ({
    part: stroke.part,
    points: stroke.points.map(([x, y]) => [x, y])
  }));
}

export function drawGunfighter(ctx, x, y, { facing = 1, scale = 1 } = {}) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing * scale, scale);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  for (const stroke of GUNFIGHTER_STROKES) {
    drawStroke(ctx, stroke.points);
  }

  ctx.restore();
}

function drawStroke(ctx, points) {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (const [x, y] of points.slice(1)) {
    ctx.lineTo(x, y);
  }
  ctx.stroke();
}

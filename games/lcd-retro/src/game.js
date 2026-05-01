export const LANES = [
  { x: 142, y: 292, enemyX: 122, enemyY: 112, label: 'door' },
  { x: 228, y: 292, enemyX: 236, enemyY: 176, label: 'table-left' },
  { x: 376, y: 292, enemyX: 360, enemyY: 176, label: 'table-right' },
  { x: 510, y: 292, enemyX: 512, enemyY: 86, label: 'bar' }
];

export const ACTORS = [
  { label: 'table-left', lane: 1, x: 236, y: 186, facing: 1 },
  { label: 'table-right', lane: 2, x: 360, y: 186, facing: 1 },
  { label: 'bar', lane: 3, x: 512, y: 112, facing: -1 }
];

export function createInitialState({ random = Math.random } = {}) {
  return {
    random,
    width: 576,
    height: 342,
    playerLane: 0,
    score: 0,
    lives: 3,
    roundTime: 0,
    beerTimer: 500,
    coffeeTimer: 2600,
    shotCooldown: 0,
    gameOver: false,
    flash: null,
    projectiles: []
  };
}

export function resetGame(state) {
  const next = createInitialState({ random: state.random });
  Object.assign(state, next);
}

export function movePlayer(state, direction) {
  if (state.gameOver) return;
  const delta = direction === 'left' ? -1 : 1;
  state.playerLane = clamp(state.playerLane + delta, 0, LANES.length - 1);
}

export function shoot(state) {
  if (state.gameOver || state.shotCooldown > 0) return;
  state.shotCooldown = 180;

  const projectileIndex = state.projectiles.findIndex((projectile) => projectile.lane === state.playerLane);
  if (projectileIndex >= 0) {
    const [projectile] = state.projectiles.splice(projectileIndex, 1);
    if (projectile.type === 'coffee') {
      state.score += 80;
      state.lives = Math.min(5, state.lives + 1);
      state.flash = { kind: 'coffee', lane: state.playerLane, timer: 220 };
    } else {
      state.score += projectile.type === 'beer' ? 50 : 30;
      state.flash = { kind: 'hit', lane: state.playerLane, timer: 160 };
    }
    return;
  }

  const patron = ACTORS.find((actor) => actor.lane === state.playerLane && actor.label !== 'bar');
  if (patron) {
    spawnThrownObject(state, patron);
    state.flash = { kind: 'patron', lane: state.playerLane, timer: 180 };
    return;
  }

  state.score = Math.max(0, state.score - 10);
  state.flash = { kind: 'miss', lane: state.playerLane, timer: 120 };
}

export function tickGame(state, deltaMs) {
  if (state.gameOver) return;

  state.roundTime += deltaMs;
  state.beerTimer -= deltaMs;
  state.coffeeTimer -= deltaMs;
  state.shotCooldown = Math.max(0, state.shotCooldown - deltaMs);

  if (state.flash) {
    state.flash.timer -= deltaMs;
    if (state.flash.timer <= 0) state.flash = null;
  }

  for (let index = state.projectiles.length - 1; index >= 0; index -= 1) {
    const projectile = state.projectiles[index];
    projectile.x += projectile.vx * deltaMs;

    if (projectile.type === 'beer') {
      projectile.lane = getBeerLane(projectile.x);
      if (projectile.x <= projectile.fallX) {
        state.projectiles.splice(index, 1);
        hurtPlayer(state, projectile.lane);
      }
      continue;
    }

    if (projectile.type === 'coffee') {
      projectile.lane = getBeerLane(projectile.x);
      projectile.x += Math.sin(state.roundTime / 180) * 0.08 * deltaMs;
      projectile.y += projectile.vy * deltaMs;
      projectile.timer -= deltaMs;
      if (projectile.timer <= 0 || projectile.y >= 306) {
        state.projectiles.splice(index, 1);
      }
      continue;
    }

    projectile.timer -= deltaMs;
    projectile.y += projectile.vy * deltaMs;
    if (projectile.timer <= 0) {
      state.projectiles.splice(index, 1);
      if (state.playerLane === projectile.targetLane) {
        hurtPlayer(state, projectile.targetLane);
      }
    }
  }

  if (state.beerTimer <= 0) {
    spawnBeer(state);
    state.beerTimer = Math.max(850, 1800 - Math.floor(state.score / 250) * 80);
  }

  if (state.coffeeTimer <= 0) {
    spawnCoffee(state);
    state.coffeeTimer = 5200 + Math.floor(state.random() * 2200);
  }
}

function spawnBeer(state) {
  if (state.projectiles.some((projectile) => projectile.type === 'beer')) return;
  const bartender = ACTORS.find((actor) => actor.label === 'bar');
  state.projectiles.push({
    type: 'beer',
    owner: 'bar',
    lane: 2,
    x: 430,
    y: bartender.y,
    vx: -0.09,
    vy: 0,
    fallX: 150
  });
}

function spawnThrownObject(state, actor) {
  const player = LANES[state.playerLane];
  state.projectiles.push({
    type: 'thrown',
    owner: actor.label,
    lane: state.playerLane,
    targetLane: state.playerLane,
    x: actor.x,
    y: actor.y - 32,
    vx: (player.x - actor.x) / 850,
    vy: (player.y - 84 - actor.y) / 850,
    timer: 850
  });
}

function spawnCoffee(state) {
  if (state.projectiles.some((projectile) => projectile.type === 'coffee')) return;
  const lane = 1 + Math.floor(state.random() * 2);
  const pos = LANES[lane];
  state.projectiles.push({
    type: 'coffee',
    owner: 'bonus',
    lane,
    x: pos.enemyX,
    y: 102,
    vx: 0,
    vy: 0.055,
    timer: 2600
  });
}

function getBeerLane(x) {
  if (x > 330) return 2;
  if (x > 190) return 1;
  return 0;
}

function hurtPlayer(state, lane) {
  state.lives -= 1;
  state.flash = { kind: 'hurt', lane, timer: 220 };
  if (state.lives <= 0) state.gameOver = true;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

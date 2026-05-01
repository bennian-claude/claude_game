import test from 'node:test';
import assert from 'node:assert/strict';

import { ACTORS, createInitialState, movePlayer, shoot, tickGame } from '../src/game.js';

test('player moves between fixed LCD lanes', () => {
  const state = createInitialState({ random: () => 0.9 });

  movePlayer(state, 'right');
  movePlayer(state, 'right');
  movePlayer(state, 'right');

  assert.equal(state.playerLane, 3);

  movePlayer(state, 'left');

  assert.equal(state.playerLane, 2);
});

test('bartender throws beer that moves left along the table', () => {
  const state = createInitialState({ random: () => 0.9 });
  state.beerTimer = 0;
  const bartender = ACTORS.find((actor) => actor.label === 'bar');

  tickGame(state, 16);

  assert.equal(state.projectiles.length, 1);
  assert.equal(state.projectiles[0].type, 'beer');
  assert.equal(state.projectiles[0].y, bartender.y);
  const startX = state.projectiles[0].x;

  tickGame(state, 500);

  assert.ok(state.projectiles[0].x < startX);
});

test('right seated patron is mirrored to face the left patron', () => {
  const rightPatron = ACTORS.find((actor) => actor.label === 'table-right');

  assert.equal(rightPatron.facing, 1);
});

test('shooting a beer before it drops adds score and removes it', () => {
  const state = createInitialState({ random: () => 0.9 });
  state.playerLane = 2;
  state.projectiles.push({ type: 'beer', lane: 2, x: 350, y: 214, vx: -0.09, fallX: 150 });

  shoot(state);

  assert.equal(state.score, 50);
  assert.equal(state.projectiles.length, 0);
  assert.equal(state.flash.kind, 'hit');
});

test('beer dropping off the table costs one life', () => {
  const state = createInitialState({ random: () => 0.9 });
  state.projectiles.push({ type: 'beer', lane: 0, x: 151, y: 214, vx: -0.09, fallX: 150 });

  tickGame(state, 16);

  assert.equal(state.lives, 2);
  assert.equal(state.projectiles.length, 0);
  assert.equal(state.flash.kind, 'hurt');
});

test('shooting a seated patron makes them throw something at the gunfighter', () => {
  const state = createInitialState({ random: () => 0.9 });
  state.playerLane = 1;

  shoot(state);

  assert.equal(state.projectiles.length, 1);
  assert.equal(state.projectiles[0].type, 'thrown');
  assert.equal(state.projectiles[0].owner, 'table-left');
  assert.equal(state.flash.kind, 'patron');
});

test('coffee bonus can be shot for score and one extra life', () => {
  const state = createInitialState({ random: () => 0.9 });
  state.playerLane = 1;
  state.lives = 2;
  state.projectiles.push({ type: 'coffee', lane: 1, x: 236, y: 180, vx: 0, vy: 0.055, timer: 1000 });

  shoot(state);

  assert.equal(state.score, 80);
  assert.equal(state.lives, 3);
  assert.equal(state.projectiles.length, 0);
  assert.equal(state.flash.kind, 'coffee');
});

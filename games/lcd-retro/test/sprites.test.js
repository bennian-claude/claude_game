import test from 'node:test';
import assert from 'node:assert/strict';

import { getCharacterSpriteAsset, getEnemySpriteAsset, getGunfighterSpriteStrokes } from '../src/sprites.js';

test('gunfighter sprite has detailed LCD-style body parts', () => {
  const strokes = getGunfighterSpriteStrokes();
  const parts = new Set(strokes.map((stroke) => stroke.part));

  assert.ok(strokes.length >= 18);
  assert.ok(parts.has('hat'));
  assert.ok(parts.has('hair'));
  assert.ok(parts.has('face'));
  assert.ok(parts.has('vest'));
  assert.ok(parts.has('gun'));
  assert.ok(parts.has('bent-leg'));
});

test('character sprite asset points at the extracted cowboy png', () => {
  assert.equal(getCharacterSpriteAsset(), 'assets/cowboy.png');
});

test('enemy lanes use the other extracted character sprites', () => {
  assert.equal(getEnemySpriteAsset('table-left'), 'assets/patron-1.png');
  assert.equal(getEnemySpriteAsset('table-right'), 'assets/patron-2.png');
  assert.equal(getEnemySpriteAsset('bar'), 'assets/bartender.png');
});

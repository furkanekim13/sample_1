import assert from 'node:assert/strict';
import test from 'node:test';
import { LEVELS } from '../src/data/levels.js';
import SaveSystem from '../src/systems/SaveSystem.js';

const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: (key) => storage.delete(key)
};

test('all five original paths have distinct settings and valid placements', () => {
  assert.equal(LEVELS.length, 5);
  assert.equal(new Set(LEVELS.map((level) => level.name)).size, 5);
  for (const level of LEVELS) {
    assert.ok(level.length > 3);
    assert.ok(level.hazards.length >= 6);
    assert.ok(level.items.length >= 6);
    for (const object of [...level.hazards, ...level.items]) {
      assert.ok(object.x > 0 && object.x < 1);
      assert.ok(object.y > 0 && object.y < 1);
    }
  }
});

test('the level set covers the reusable hazard and power-up types', () => {
  const hazards = new Set(LEVELS.flatMap((level) => level.hazards.map((entry) => entry.type)));
  const items = new Set(LEVELS.flatMap((level) => level.items.map((entry) => entry.type)));
  for (const type of ['blade', 'saw', 'crusher', 'rock', 'spikes', 'gear', 'platform', 'tunnel', 'laser', 'destructible']) {
    assert.ok(hazards.has(type), `missing hazard: ${type}`);
  }
  for (const type of ['orb', 'clone', 'grow', 'shrink', 'speed', 'gravity', 'shield']) {
    assert.ok(items.has(type), `missing collectible: ${type}`);
  }
});

test('missing or malformed save data restores safe defaults', () => {
  storage.clear();
  assert.deepEqual(SaveSystem.load(), {
    unlocked: 0,
    completed: [],
    best: {},
    orbs: 0,
    settings: { muted: false, volume: .65, musicVolume: .45, sfxVolume: .8 }
  });
  storage.set('furkanekim-save-v1', '{bad json');
  const originalWarn = console.warn;
  console.warn = () => {};
  try {
    assert.equal(SaveSystem.load().unlocked, 0);
  } finally {
    console.warn = originalWarn;
  }
});

test('progress and clamped audio settings persist safely', () => {
  storage.set('furkanekim-save-v1', JSON.stringify({
    unlocked: 8,
    completed: [0, 'bad', 4],
    best: { 0: .6 },
    orbs: 12,
    settings: { muted: 'false', volume: 2, musicVolume: -.5, sfxVolume: .25 }
  }));
  const save = SaveSystem.load();
  assert.equal(save.unlocked, 4);
  assert.deepEqual(save.completed, [0, 4]);
  assert.equal(save.settings.muted, false);
  assert.equal(save.settings.volume, 1);
  assert.equal(save.settings.musicVolume, 0);
  assert.equal(save.settings.sfxVolume, .25);
  save.orbs += 1;
  SaveSystem.store(save);
  assert.equal(SaveSystem.load().orbs, 13);
  assert.deepEqual(SaveSystem.reset(), {
    unlocked: 0,
    completed: [],
    best: {},
    orbs: 0,
    settings: { muted: false, volume: .65, musicVolume: .45, sfxVolume: .8 }
  });
});

test('legacy saved progress loads under the new game name', () => {
  storage.clear();
  storage.set('emberwing-save-v1', JSON.stringify({ unlocked: 2, orbs: 7 }));
  const save = SaveSystem.load();
  assert.equal(save.unlocked, 2);
  assert.equal(save.orbs, 7);
});

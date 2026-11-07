import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const helper=await readFile(new URL('../src/feedback/navigation-audio.js',import.meta.url),'utf8');
const {navigationCue,navigationAllowed}=await import('data:text/javascript;base64,'+Buffer.from(helper).toString('base64'));

test('front, sides, rear have bounded pan and increasingly long intervals', () => {
  assert.deepEqual(navigationCue(0), { pan: 0, intervalMs: 300, gainLeft: .5, gainRight: .5 });
  assert.deepEqual(navigationCue(-90), { pan: -1, intervalMs: 750, gainLeft: 1, gainRight: 0 });
  assert.deepEqual(navigationCue(90), { pan: 1, intervalMs: 750, gainLeft: 0, gainRight: 1 });
  assert.deepEqual(navigationCue(180), { pan: 1, intervalMs: 1200, gainLeft: 0, gainRight: 1 });
  for (let angle = -180; angle <= 180; angle++) {
    const c = navigationCue(angle), opposite = navigationCue(-angle);
    assert.ok(c.pan >= -1 && c.pan <= 1);
    assert.equal(c.gainLeft + c.gainRight, 1);
    assert.equal(c.intervalMs, opposite.intervalMs);
    if (Math.abs(angle) < 180) assert.equal(c.gainLeft, opposite.gainRight);
  }
});

test('wrapped bearings preserve direction; invalid bearings cannot schedule audio', () => {
  assert.deepEqual(navigationCue(395), navigationCue(35));
  assert.deepEqual(navigationCue(-395), navigationCue(-35));
  assert.deepEqual(navigationCue(-180), navigationCue(180));
  for (const value of [NaN, Infinity, -Infinity, undefined, null, '35']) assert.equal(navigationCue(value), null);
});

test('navigation yields to every warning, event, vario and lifecycle/toggle state', () => {
  const base = { active: true, sound: true, sfx: true, enabled: true, event: null, cue: 'engine', varioActive: false, bearingDeg: 35 };
  assert.equal(navigationAllowed(base), true);
  for (const cue of ['ground', 'stall', 'buffet']) assert.equal(navigationAllowed({ ...base, cue }), false);
  for (const event of ['collect', 'exitOpen', 'clear', 'crash']) assert.equal(navigationAllowed({ ...base, event }), false);
  for (const key of ['active', 'sound', 'sfx', 'enabled']) assert.equal(navigationAllowed({ ...base, [key]: false }), false);
  assert.equal(navigationAllowed({ ...base, varioActive: true }), false);
  assert.equal(navigationAllowed({ ...base, bearingDeg: NaN }), false);
});

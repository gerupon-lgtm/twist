import { test, expect } from '@playwright/test';
// This fixture retains the Japanese/legacy display comparison. Default English guidance is covered in guidance/hud-language.spec.js.
test.beforeEach(async({page})=>{await page.addInitScript(value=>{if(!localStorage.getItem('twist.flight-settings.v1'))localStorage.setItem('twist.flight-settings.v1',JSON.stringify(value));},{"hudLanguage": "ja", "flightDirector": false, "edgeGuidance": false, "targetHeadingCue": false, "nextTargetNotice": false});});

const data = (page, key) => page.locator('#app').getAttribute(`data-${key}`).then(Number);
const sensor = (page, sample) => page.evaluate(sample => window.dispatchEvent(Object.assign(new Event('deviceorientation'), sample)), sample);
async function startSensor(page, mode = 'explore') {
  await page.addInitScript(() => {
    class Orientation extends Event { static requestPermission() { return Promise.resolve('granted'); } }
    class Motion extends Event { static requestPermission() { return Promise.resolve('granted'); } }
    Object.defineProperty(window, 'DeviceOrientationEvent', { value: Orientation, configurable: true });
    Object.defineProperty(window, 'DeviceMotionEvent', { value: Motion, configurable: true });
  });
  await page.goto(`/?mode=${mode}&view=assisted`);
  await page.getByRole('button', { name: 'スマホの傾きで始める', exact: true }).click();
  await page.evaluate(() => {
    const neutral = () => window.dispatchEvent(Object.assign(new Event('deviceorientation'), { alpha: 0, beta: 0, gamma: 0 }));
    neutral(); window.pulse = setInterval(neutral, 50);
    window.heartbeat = setInterval(() => window.dispatchEvent(Object.assign(new Event('devicemotion'), { rotationRate: { alpha: 0, beta: 0, gamma: 0 } })), 100);
  });
  await page.getByRole('button', { name: mode === 'flight' ? 'この持ち方で飛ぶ' : 'この持ち方で始める', exact: true }).click();
  await expect(page.locator('#app')).toHaveAttribute('data-phase', 'running');
  await page.evaluate(() => clearInterval(window.pulse));
}
const steering = (page, value) => sensor(page, { alpha: 0, beta: 0, gamma: value });
async function turnTo(page, heading) {
  await steering(page, 25);
  await expect.poll(() => data(page, 'heading').then(value => Math.abs(Math.atan2(Math.sin(value - heading), Math.cos(value - heading)))), { timeout: 12000, intervals: [50] }).toBeLessThan(.06);
  await steering(page, 0);
}
async function clearMarker(page) {
  const safe = await page.evaluate(() => {
    const marker = document.querySelector('#target-edge-marker').getBoundingClientRect();
    const hud = document.querySelector('#bottom-panel').getBoundingClientRect();
    const nav = document.querySelector('.navigation').getBoundingClientRect();
    const craft = { left: innerWidth / 2 - 40, right: innerWidth / 2 + 40, top: innerHeight / 2 - 40, bottom: innerHeight / 2 + 40 };
    const overlaps = r => marker.left < r.right && marker.right > r.left && marker.top < r.bottom && marker.bottom > r.top;
    return marker.width === 100 && marker.height === 50 && marker.left >= 0 && marker.right <= innerWidth && marker.top >= 0 && marker.bottom <= innerHeight && !overlaps(hud) && !overlaps(nav) && !overlaps(craft);
  });
  expect(safe).toBe(true);
}

test('view picker compares assisted and classic at the same position without restarting flight', async ({ page }) => {
  await page.goto('/?mode=flight');
  await expect(page.getByRole('button', { name: '見失い対策', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: '画面で操縦（スマホ傾きは無効）', exact: true }).click();
  await expect.poll(() => data(page, 'horizontal-fov')).toBeCloseTo(45, 5);
  await expect(page.locator('#app')).toHaveAttribute('data-landmark-count', '4');
  await page.getByRole('button', { name: '一時停止', exact: true }).click();
  await expect(page.locator('#speed-value')).toHaveText('0.0');
  const position = await page.locator('#app').getAttribute('data-position');
  const heading = await data(page, 'heading');
  await page.getByRole('button', { name: '従来', exact: true }).click();
  await expect.poll(() => data(page, 'horizontal-fov')).toBeLessThan(33);
  await expect(page.locator('#app')).toHaveAttribute('data-landmark-count', '0');
  await expect(page.locator('#target-edge-marker')).toBeHidden();
  expect(await page.locator('#app').getAttribute('data-position')).toBe(position);
  expect(await data(page, 'heading')).toBe(heading);
  await expect(page.locator('#app')).toHaveAttribute('data-phase', 'paused');
  await expect(page.locator('#throttle-value')).toHaveText('0%');
  await page.getByRole('button', { name: '見失い対策', exact: true }).click();
  await expect.poll(() => data(page, 'horizontal-fov')).toBeCloseTo(45, 5);
  expect(await page.locator('#app').getAttribute('data-position')).toBe(position);
  await expect(page.locator('#home-link')).toHaveAttribute('href', /view=assisted.*v=0.1.25/);
});

test('all four landmarks are distinguishable in the stage and profiles preserve the complete flight route', async ({ page }) => {
  await page.goto('/?mode=flight');
  const result = await page.evaluate(async () => {
    const { createStage } = await import('/src/stage.js');
    const { projectEdgeTarget } = await import('/src/visibility.js');
    const a = createStage(document.createElement('canvas'), { visibility: 'assisted' });
    const b = createStage(document.createElement('canvas'), { visibility: 'classic' });
    a.resize(390, 844, 1); b.resize(390, 844, 1);
    const landmarks = a.getStatus().landmarks;
    const snapshot = s => JSON.stringify([s.position, s.orientation, s.velocity, s.speed, s.throttle, s.craftQuaternion, s.targetLocal]);
    a.launchFlight(); b.launchFlight();
    const before = snapshot(a.getStatus()); a.setVisibility('classic');
    let equal = before === snapshot(a.getStatus()); a.setVisibility('assisted');
    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
    const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
    let s = a.getStatus(), steps = 0, sawExit = false, finiteMarkers = true;
    for (; steps < 2400 && !s.complete && !s.grounded; steps++) {
      const d = { x: s.targetPosition.x - s.position.x, y: s.targetPosition.y - s.position.y, z: s.targetPosition.z - s.position.z };
      const bearing = wrap(Math.atan2(d.x, -d.z) - Math.atan2(s.velocity.x, -s.velocity.z));
      const pitch = clamp(Math.atan2(d.y, Math.hypot(d.x, d.z)), -.25, .25);
      const input = { mode: 'flight', pitchRate: clamp((pitch - s.pitch) * 1.5, -.5, .5), bankAngle: clamp(bearing * 1.4, -40 * Math.PI / 180, 40 * Math.PI / 180), throttle: clamp(.5 + (10 - s.speed) * .3 + s.pitch * .8, .15, 1) };
      if (steps === 100) { a.setVisibility('classic'); b.setVisibility('assisted'); }
      a.update(.1, input); b.update(.1, input); s = a.getStatus(); equal &&= snapshot(s) === snapshot(b.getStatus());
      sawExit ||= s.targetLabel === '出口';
      const marker = projectEdgeTarget({ target: s.targetLocal, width: 390, height: 844, verticalFov: s.fieldOfView.vertical, bounds: { left: 62, top: 170, right: 328, bottom: 500 } });
      finiteMarkers &&= [marker.x, marker.y, marker.rotation].every(Number.isFinite);
    }
    const out = { equal, complete: s.complete, collected: s.collected, landmarks, steps, sawExit, finiteMarkers };
    a.dispose(); b.dispose(); return out;
  });
  expect(result.landmarks).toHaveLength(4);
  expect(new Set(result.landmarks.map(l => l.color)).size).toBe(4);
  expect(new Set(result.landmarks.map(l => l.shape)).size).toBe(4);
  expect(result.equal).toBe(true); expect(result.complete).toBe(true);
  expect(result.collected).toBe(3); expect(result.sawExit).toBe(true); expect(result.finiteMarkers).toBe(true);
});

test('edge goal stays trackable behind the craft across phone sizes and disappears on return', async ({ page }) => {
  await startSensor(page);
  await page.screenshot({ path: 'test-results/v016-landmark-north.png' });
  await turnTo(page, .98);
  await page.screenshot({ path: 'test-results/v016-landmark-east.png' });
  await turnTo(page, 3.08);
  await expect(page.locator('#app')).toHaveAttribute('data-edge-behind', 'true');
  await expect(page.locator('#target-direction')).toHaveText('後ろ');
  await expect(page.locator('#edge-label')).toHaveText('光 1');
  for (const size of [{ width: 390, height: 844 }, { width: 360, height: 640 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(size);
    await expect(page.locator('#target-edge-marker')).toBeVisible();
    await expect(page.locator('#target-edge-marker')).toBeInViewport();
    await page.waitForTimeout(150);
    await clearMarker(page);
    await page.screenshot({ path: `test-results/v016-behind-${size.width}.png` });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await turnTo(page, -.98);
  await page.screenshot({ path: 'test-results/v016-landmark-west.png' });
  await turnTo(page, 0);
  await expect(page.locator('#target-edge-marker')).toBeHidden();
  await expect(page.locator('#app')).toHaveAttribute('data-edge-status', 'onscreen');
});

test('upper and lower off-screen goals point in the correct direction', async ({ page }) => {
  await startSensor(page);
  await sensor(page, { alpha: 328, beta: 0, gamma: 0 });
  await expect.poll(() => data(page, 'flight-pitch'), { intervals: [50] }).toBeGreaterThan(.65);
  await sensor(page, { alpha: 0, beta: 0, gamma: 0 });
  await expect(page.locator('#target-edge-marker')).toBeVisible();
  await expect(page.locator('#edge-detail')).toContainText('下');
  await clearMarker(page);
  await sensor(page, { alpha: 32, beta: 0, gamma: 0 });
  await expect.poll(() => data(page, 'flight-pitch'), { intervals: [50] }).toBeLessThan(-.5);
  await sensor(page, { alpha: 0, beta: 0, gamma: 0 });
  await expect(page.locator('#edge-detail')).toContainText('上');
  await clearMarker(page);
});

test('collecting the first light updates the edge marker to the next goal', async ({ page }) => {
  await startSensor(page, 'flight');
  await expect(page.locator('#collection-count')).toHaveText('1', { timeout: 9000 });
  await expect(page.locator('#target-label')).toHaveText('光 2');
  await expect(page.locator('#target-edge-marker')).toBeVisible();
  await expect(page.locator('#edge-label')).toHaveText('光 2');
  await clearMarker(page);
  await page.getByRole('button', { name: '一時停止', exact: true }).click();
  await expect(page.locator('#target-edge-marker')).toBeHidden();
});

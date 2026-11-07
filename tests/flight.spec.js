import { test, expect } from '@playwright/test';

test.use({ hasTouch: true });
const angle = (page, axis, value) => page.locator(`#practice-${axis}`).evaluate((el, value) => { el.value = value; el.dispatchEvent(new Event('input', { bubbles: true })); }, value);
const output = (page, percent) => page.locator('#throttle-input').evaluate((el, value) => { el.value = value; el.dispatchEvent(new Event('input', { bubbles: true })); }, percent);
const speed = page => page.locator('#speed-value').textContent().then(Number);
const data = (page, key) => page.locator('#app').getAttribute(`data-${key}`).then(Number);
const sensor = (page, sample) => page.evaluate(sample => window.dispatchEvent(Object.assign(new Event('deviceorientation'), sample)), sample);
async function practice(page) {
  await page.goto('/?mode=flight&steer=tilt&pitch=rate');
  await page.getByRole('button', { name: '画面で操縦（スマホ傾きは無効）', exact: true }).click();
  await expect(page.locator('#app')).toHaveAttribute('data-play-mode', 'flight');
  await expect(page.locator('#throttle-value')).toHaveText('50%');
  await expect.poll(() => speed(page)).toBeGreaterThan(5.5);
}
async function fakeFlight(page) {
  await page.addInitScript(() => {
    class Orientation extends Event { static requestPermission() { return Promise.resolve('granted'); } }
    class Motion extends Event { static requestPermission() { return Promise.resolve('granted'); } }
    Object.defineProperty(window, 'DeviceOrientationEvent', { value: Orientation, configurable: true });
    Object.defineProperty(window, 'DeviceMotionEvent', { value: Motion, configurable: true });
  });
  await page.goto('/?mode=flight&steer=tilt&pitch=rate');
  await page.getByRole('button', { name: 'スマホの傾きで始める', exact: true }).click();
  await expect(page.locator('#app')).toHaveAttribute('data-phase', 'waiting');
  expect(await speed(page)).toBe(0);
  await expect(page.locator('#throttle-input')).toBeDisabled();
  await page.evaluate(() => {
    const neutral = () => window.dispatchEvent(Object.assign(new Event('deviceorientation'), { alpha: 0, beta: 0, gamma: 0 }));
    neutral(); window.calibrationPulse = setInterval(neutral, 50);
    window.heartbeat = setInterval(() => window.dispatchEvent(Object.assign(new Event('devicemotion'), { rotationRate: { alpha: 0, beta: 0, gamma: 0 } })), 100);
  });
  await page.getByRole('button', { name: 'この持ち方で飛ぶ', exact: true }).click();
  await expect(page.locator('#app')).toHaveAttribute('data-phase', 'running');
  await page.evaluate(() => clearInterval(window.calibrationPulse));
  await expect(page.locator('#throttle-value')).toHaveText('50%');
}

test('flight screen throttle accepts a touch, retains output after release, and speeds up', async ({ page }) => {
  await practice(page);
  const slider = page.getByRole('slider', { name: 'エンジン出力', exact: true });
  const rect = await slider.boundingBox();
  expect(rect.height).toBeGreaterThanOrEqual(44);
  await slider.tap({ position: { x: rect.width * 0.85, y: rect.height / 2 } });
  await expect.poll(() => slider.inputValue().then(Number)).toBeGreaterThan(75);
  const selected = await slider.inputValue();
  await page.waitForTimeout(300);
  expect(await slider.inputValue()).toBe(selected);
  await expect.poll(() => speed(page)).toBeGreaterThan(6.2);
});

test('nose up climbs while slowing and nose down descends while gaining speed at the same output', async ({ page }) => {
  await practice(page);
  await angle(page, 'pitch', 20);
  await expect.poll(() => data(page, 'flight-pitch')).toBeGreaterThan(0.12);
  await angle(page, 'pitch', 0);
  await expect.poll(() => data(page, 'vertical-speed')).toBeGreaterThan(0.15);
  await expect.poll(() => speed(page)).toBeLessThan(5.9);
  expect(Number(await page.locator('#altitude-value').textContent())).toBeGreaterThan(7);
  const climbSpeed = await speed(page);
  await angle(page, 'pitch', -20);
  await expect.poll(() => data(page, 'flight-pitch')).toBeLessThan(-0.12);
  await angle(page, 'pitch', 0);
  await expect.poll(() => data(page, 'vertical-speed')).toBeLessThan(-0.15);
  await expect.poll(() => speed(page)).toBeGreaterThan(climbSpeed);
  await expect(page.locator('#throttle-value')).toHaveText('50%');
});

test('flight bank turns scenery and banks the drawn craft in the turn direction', async ({ page }) => {
  await practice(page);
  await angle(page, 'steer', 20);
  await expect.poll(() => data(page, 'bank')).toBeGreaterThan(0.2);
  await expect.poll(() => data(page, 'heading')).toBeGreaterThan(0.04);
  const pose = JSON.parse(await page.locator('#app').getAttribute('data-craft-quaternion'));
  expect(pose.y).toBeCloseTo(0, 5);
  expect(pose.z).toBeLessThan(0);
  await page.screenshot({ path: 'test-results/flight-bank-mobile.png' });
  await angle(page, 'steer', 0);
  await expect.poll(() => data(page, 'bank')).toBeLessThan(0.02);
  await angle(page, 'steer', -20);
  await expect.poll(() => data(page, 'yaw-rate')).toBeLessThan(0);
});

test('zero engine power glides and descends; pause stops everything and resume explicitly relaunches', async ({ page }) => {
  await practice(page);
  await output(page, 0);
  await expect(page.locator('#throttle-value')).toHaveText('0%');
  expect(await speed(page)).toBeGreaterThan(4);
  await expect.poll(() => speed(page)).toBeLessThan(5.7);
  await expect.poll(() => data(page, 'vertical-speed')).toBeLessThan(-0.1);
  await expect.poll(() => page.locator('#altitude-value').textContent().then(Number)).toBeLessThan(7);
  await page.getByRole('button', { name: '一時停止', exact: true }).click();
  await expect(page.locator('#speed-value')).toHaveText('0.0');
  await expect(page.locator('#throttle-value')).toHaveText('0%');
  await expect(page.locator('#throttle-input')).toBeDisabled();
  const position = await page.locator('#app').getAttribute('data-position');
  await page.waitForTimeout(250);
  expect(await page.locator('#app').getAttribute('data-position')).toBe(position);
  await page.getByRole('button', { name: '画面操作を再開する', exact: true }).click();
  await expect(page.locator('#throttle-value')).toHaveText('50%');
  await expect.poll(() => speed(page)).toBeGreaterThan(5.5);
});

test('phone twist does not change flight power or speed in level cruise', async ({ page }) => {
  await practice(page);
  for (const twist of [12, -12, 90, 180]) {
    await angle(page, 'twist', twist);
    await page.waitForTimeout(150);
    await expect(page.locator('#throttle-value')).toHaveText('50%');
    expect(await speed(page)).toBeCloseTo(8, 1);
    expect(await data(page, 'flight-pitch')).toBeCloseTo(0, 5);
  }
  await expect(page.locator('#twist-control-meter')).toBeHidden();
});

test('mode switch resets the stage and preserves twelve-degree exploration acceleration', async ({ page }) => {
  await practice(page);
  await output(page, 85);
  await page.getByRole('button', { name: '一時停止', exact: true }).click();
  await page.getByRole('button', { name: '探索', exact: true }).click();
  await expect(page.locator('#flight-throttle')).toBeHidden();
  await page.getByRole('button', { name: '画面操作を再開する', exact: true }).click();
  await expect(page.locator('#speed-value')).toHaveText('0.0');
  await angle(page, 'pitch', -12);
  await expect.poll(() => speed(page)).toBeGreaterThan(0.5);
  await page.getByRole('button', { name: '一時停止', exact: true }).click();
  await page.getByRole('button', { name: '飛行機', exact: true }).click();
  await page.getByRole('button', { name: '画面操作を再開する', exact: true }).click();
  await expect(page.locator('#throttle-value')).toHaveText('50%');
  await expect.poll(() => speed(page)).toBeGreaterThan(5.5);
});

test('flight controls fit portrait and landscape while keeping the craft center uncovered', async ({ page }) => {
  await page.goto('/?mode=flight&steer=tilt&pitch=rate');
  await expect(page.locator('#control-guide')).toContainText('画面下のスロットル');
  for (const size of [{ width: 390, height: 844 }, { width: 360, height: 640 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(size);
    await expect(page.getByRole('button', { name: 'スマホの傾きで始める', exact: true })).toBeInViewport();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'test-results/flight-intro-mobile.png' });
  await page.getByRole('button', { name: '画面で操縦（スマホ傾きは無効）', exact: true }).click();
  for (const size of [{ width: 390, height: 844 }, { width: 360, height: 640 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(size);
    await expect(page.locator('#throttle-input')).toBeInViewport();
    await expect(page.getByRole('button', { name: '一時停止', exact: true })).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const clear = await page.evaluate(() => {
      const r = document.querySelector('#bottom-panel').getBoundingClientRect();
      return r.top > innerHeight / 2 + 26 || r.left > innerWidth / 2 + 32 || r.right < innerWidth / 2 - 32;
    });
    expect(clear, `${size.width}x${size.height}`).toBe(true);
    await page.screenshot({ path: `test-results/flight-screen-${size.width}.png` });
  }
});

test('flight sensor layout changes preserve power; missing axes stop output until manual restart', async ({ page }) => {
  await fakeFlight(page);
  await output(page, 70);
  await page.evaluate(() => {
    Object.defineProperty(screen.orientation, 'angle', { value: 90, configurable: true });
    screen.orientation.dispatchEvent(new Event('change'));
  });
  await expect(page.locator('#app')).toHaveAttribute('data-phase', 'running');
  await expect(page.locator('#throttle-value')).toHaveText('70%');
  await sensor(page, { alpha: null, beta: 0, gamma: 0 });
  await expect(page.locator('#app')).toHaveAttribute('data-phase', 'paused');
  await expect(page.locator('#speed-value')).toHaveText('0.0');
  await expect(page.locator('#throttle-value')).toHaveText('0%');
  await sensor(page, { alpha: 0, beta: 0, gamma: 0 });
  await page.waitForTimeout(150);
  await expect(page.locator('#app')).toHaveAttribute('data-phase', 'paused');
  await page.getByRole('button', { name: 'この持ち方で再開する', exact: true }).click();
  await expect(page.locator('#throttle-value')).toHaveText('50%');
});

test('leaving during fresh-pose wait cancels flight restart until another manual start', async ({ page }) => {
  await fakeFlight(page);
  await page.getByRole('button', { name: '一時停止', exact: true }).click();
  await page.waitForTimeout(1300);
  await page.getByRole('button', { name: 'この持ち方で再開する', exact: true }).click();
  await expect(page.locator('#app')).toHaveAttribute('data-phase', 'waiting');
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await expect(page.locator('#app')).toHaveAttribute('data-phase', 'paused');
  await sensor(page, { alpha: 0, beta: 0, gamma: 0 });
  await page.waitForTimeout(150);
  await expect(page.locator('#app')).toHaveAttribute('data-phase', 'paused');
  await expect(page.locator('#throttle-value')).toHaveText('0%');
  await page.getByRole('button', { name: 'この持ち方で再開する', exact: true }).click();
  await expect(page.locator('#throttle-value')).toHaveText('50%');
});

test('approaching the ground stops flight and explicit restart resets the route', async ({ page }) => {
  await practice(page);
  await output(page, 0);
  await angle(page, 'pitch', -20);
  await expect(page.locator('#app')).toHaveAttribute('data-phase', 'paused', { timeout: 15000 });
  await expect(page.locator('#app')).toHaveAttribute('data-grounded', 'true');
  await expect(page.locator('#speed-value')).toHaveText('0.0');
  await expect(page.locator('#throttle-value')).toHaveText('0%');
  await page.getByRole('button', { name: '最初から飛び直す', exact: true }).click();
  await expect(page.locator('#app')).toHaveAttribute('data-phase', 'running');
  await expect(page.locator('#app')).toHaveAttribute('data-grounded', 'false');
  await expect(page.locator('#throttle-value')).toHaveText('50%');
  expect(Number(await page.locator('#altitude-value').textContent())).toBe(7);
});

test('compound flight steering adds no unintended roll and a full pitch loop stays continuous', async ({ page }) => {
  await page.goto('/?mode=flight&steer=tilt&pitch=rate');
  const result = await page.evaluate(async () => {
    const { createStage } = await import('/src/stage.js');
    const stage = createStage(document.createElement('canvas'));
    stage.launchFlight();
    let maxRightY = 0;
    for (let i = 0; i < 40; i++) {
      stage.update(.05, { mode: 'flight', pitchRate: .2, bankAngle: .5, throttle: .6 });
      const { orientation: q, bank } = stage.getStatus();
      const s = Math.sin(bank / 2), c = Math.cos(bank / 2);
      const x = q.x * c + q.y * s, y = q.y * c - q.x * s;
      const z = q.z * c + q.w * s, w = q.w * c - q.z * s;
      maxRightY = Math.max(maxRightY, Math.abs(2 * (x * y + z * w)));
    }
    stage.reset(); stage.launchFlight();
    stage.update(1, { mode: 'flight', pitchRate: 2 * Math.PI, throttle: .5 });
    const loop = stage.getStatus();
    stage.update(0, { mode: 'flight', throttle: 1, speed: 100 });
    const stopped = stage.getStatus();
    stage.dispose();
    return { maxRightY, orientation: loop.orientation, grounded: loop.grounded, finite: Object.values(loop.velocity).every(Number.isFinite), stoppedSpeed: stopped.speed, stoppedThrottle: stopped.throttle, stoppedVelocity: stopped.velocity };
  });
  expect(result.maxRightY).toBeLessThan(1e-8);
  expect(Math.abs(result.orientation.w)).toBeCloseTo(1, 6);
  expect(result.grounded).toBe(false);
  expect(result.finite).toBe(true);
  expect(result.stoppedSpeed).toBe(0);
  expect(result.stoppedThrottle).toBe(0);
  expect(result.stoppedVelocity).toEqual({ x: 0, y: 0, z: 0 });
});

test('physical flight reaches all aerial targets and the exit without moving the craft or camera', async ({ page }) => {
  await page.goto('/?mode=flight&steer=tilt&pitch=rate');
  const result = await page.evaluate(async () => {
    const { createStage } = await import('/src/stage.js');
    const stage = createStage(document.createElement('canvas'));
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
    stage.resize(390, 844, 1); stage.launchFlight();
    let state = stage.getStatus(), steps = 0, minimumAltitude = state.altitude;
    for (; steps < 2400 && !state.complete && !state.grounded; steps++) {
      const d = { x: state.targetPosition.x - state.position.x, y: state.targetPosition.y - state.position.y, z: state.targetPosition.z - state.position.z };
      const bearing = wrap(Math.atan2(d.x, -d.z) - Math.atan2(state.velocity.x, -state.velocity.z));
      const desiredPitch = clamp(Math.atan2(d.y, Math.hypot(d.x, d.z)), -.25, .25);
      stage.update(.1, { mode: 'flight', pitchRate: clamp((desiredPitch - state.pitch) * 1.5, -.5, .5), bankAngle: clamp(bearing * 1.4, -40 * Math.PI / 180, 40 * Math.PI / 180), throttle: clamp(.5 + (6 - state.speed) * .3 + state.pitch * .8, .15, 1) });
      state = stage.getStatus(); minimumAltitude = Math.min(minimumAltitude, state.altitude);
    }
    const output = { complete: state.complete, collected: state.collected, grounded: state.grounded, steps, minimumAltitude, fixed: state.craftScreen.x === 195 && state.craftScreen.y === 422 && Object.values(state.cameraPosition).every(v => v === 0) };
    stage.dispose(); return output;
  });
  expect(result.complete, JSON.stringify(result)).toBe(true);
  expect(result.collected).toBe(3);
  expect(result.grounded).toBe(false);
  expect(result.fixed).toBe(true);
});

for (const percent of [50, 100]) test(`restoring level pitch and ${percent}-percent power recovers a real climb-stall before contact`, async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-07T00:00:00Z') });
  await page.goto('/?mode=flight&steer=tilt&pitch=rate');
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
  await page.locator('#practice-button').click();
  await page.clock.runFor(100);
  await angle(page, 'pitch', 25);
  await page.clock.runFor(1500);
  await angle(page, 'pitch', 0);
  await output(page, 0);
  for (let i = 0; i < 120 && await data(page, 'vertical-speed') > -2; i++) await page.clock.runFor(50);
  expect(await data(page, 'flight-pitch')).toBeGreaterThan(.8);
  expect(await data(page, 'vertical-speed')).toBeLessThan(-2);
  const before = JSON.parse(await page.locator('#app').getAttribute('data-position'));
  await output(page, percent);
  await angle(page, 'pitch', -25);
  let assisted = false, minimumHeight = Infinity;
  for (let i = 0; i < 100 && await data(page, 'flight-pitch') > .025; i++) {
    await page.clock.runFor(50);
    assisted ||= await data(page, 'recovery-assist') > .05;
    minimumHeight = Math.min(minimumHeight, await data(page, 'ground-clearance'));
    await expect(page.locator('#app')).toHaveAttribute('data-phase', 'running');
  }
  await angle(page, 'pitch', 0);
  let recovered = false;
  for (let i = 0; i < 180; i++) {
    await page.clock.runFor(50);
    assisted ||= await data(page, 'recovery-assist') > .05;
    minimumHeight = Math.min(minimumHeight, await data(page, 'ground-clearance'));
    await expect(page.locator('#app')).toHaveAttribute('data-phase', 'running');
    if (await data(page, 'vertical-speed') > -.1 && await speed(page) > 4.5) { recovered = true; break; }
  }
  expect(recovered).toBe(true);
  expect(assisted).toBe(true);
  expect(minimumHeight).toBeGreaterThan(0);
  await expect(page.locator('#throttle-value')).toHaveText(`${percent}%`);
  await expect(page.locator('#app')).toHaveAttribute('data-grounded', 'false');
  const after = JSON.parse(await page.locator('#app').getAttribute('data-position'));
  expect(Math.hypot(after.x-before.x, after.z-before.z)).toBeGreaterThan(2);
  await page.screenshot({ path: `test-results/v0112-recovered-${percent}.png` });
});

test('zero airspeed in midair still accepts pitch, bank and engine input', async ({ page }) => {
  await page.goto('/?mode=flight&pitch=rate');
  const result = await page.evaluate(async () => {
    const { createStage } = await import('/src/stage.js');
    const stage = createStage(document.createElement('canvas'));
    stage.update(0, { mode: 'flight' });
    const before = stage.getStatus();
    stage.update(.05, { mode: 'flight', pitchRate: .4, bankAngle: .3, throttle: .5 });
    const after = stage.getStatus();
    stage.dispose(); return { before, after };
  });
  expect(result.before.speed).toBe(0);
  expect(result.after.speed).toBeGreaterThan(.1);
  expect(result.after.pitch).toBeGreaterThan(.01);
  expect(result.after.bank).toBeGreaterThan(0);
  expect(result.after.velocity.z).toBeLessThan(0);
  expect(result.after.recoveryAssist).toBeGreaterThan(0);
  expect(result.after.grounded).toBe(false);
});

import { test, expect } from '@playwright/test';

const angle = (page, axis, value) => page.locator(`#practice-${axis}`).evaluate((el, value) => { el.value = value; el.dispatchEvent(new Event('input', { bubbles: true })); }, value);
const speed = (page) => page.locator('#speed-value').textContent().then(Number);
const data = (page, key) => page.locator('#app').getAttribute(`data-${key}`).then(Number);
async function practice(page) {
  await page.goto('/?mode=flight');
  await page.getByRole('button', { name: '画面操作で試す', exact: true }).click();
  await expect(page.locator('#app')).toHaveAttribute('data-play-mode', 'flight');
  await expect.poll(() => speed(page)).toBeGreaterThan(5.5);
}

test('flight launch and nose up/down use forward speed rather than the accelerator tilt', async ({ page }) => {
  await practice(page);
  await angle(page, 'pitch', 20);
  await expect.poll(() => data(page, 'flight-pitch')).toBeGreaterThan(0.08);
  expect(await speed(page)).toBe(6);
  await angle(page, 'pitch', -20);
  await expect.poll(() => data(page, 'flight-pitch')).toBeLessThan(-0.02);
  expect(await speed(page)).toBe(6);
});

test('flight bank turns the world, eases back, and retains sensor craft compensation', async ({ page }) => {
  await practice(page);
  await angle(page, 'steer', 20);
  await expect.poll(() => data(page, 'bank')).toBeGreaterThan(0.2);
  await expect.poll(() => data(page, 'heading')).toBeGreaterThan(0.04);
  const pose = JSON.parse(await page.locator('#app').getAttribute('data-craft-quaternion'));
  expect(pose.y).toBeCloseTo(-Math.sin(10 * Math.PI / 180), 5);
  await page.screenshot({ path: 'test-results/flight-bank-mobile.png' });
  await angle(page, 'steer', 0);
  await expect.poll(() => data(page, 'bank')).toBeLessThan(0.02);
  await angle(page, 'steer', -20);
  await expect.poll(() => data(page, 'bank')).toBeLessThan(-0.2);
  await expect.poll(() => data(page, 'yaw-rate')).toBeLessThan(0);
});

test('flight throttle coasts and slows to zero; stopped bank does not move or turn', async ({ page }) => {
  await practice(page);
  await angle(page, 'twist', 22);
  await expect.poll(() => speed(page)).toBeGreaterThan(6.5);
  await angle(page, 'twist', 0);
  await expect(page.locator('#motion-state')).toHaveText('速度維持');
  const coast = await speed(page);
  await page.waitForTimeout(200);
  expect(await speed(page)).toBe(coast);
  await page.getByRole('button', { name: '減速', exact: true }).click();
  await expect(page.locator('#speed-value')).toHaveText('0.0');
  await angle(page, 'twist', 0);
  await angle(page, 'steer', 20);
  await expect.poll(() => data(page, 'bank')).toBeGreaterThan(0.2);
  expect(await data(page, 'yaw-rate')).toBe(0);
  const stoppedPosition = await page.locator('#app').getAttribute('data-position');
  const stoppedHeading = await data(page, 'heading');
  await page.waitForTimeout(200);
  expect(await page.locator('#app').getAttribute('data-position')).toBe(stoppedPosition);
  expect(await data(page, 'heading')).toBe(stoppedHeading);
  await page.getByRole('button', { name: '一時停止', exact: true }).click();
  await expect(page.locator('#speed-value')).toHaveText('0.0');
  await page.getByRole('button', { name: '画面操作を再開する', exact: true }).click();
  await expect.poll(() => speed(page)).toBeGreaterThan(5.5);
});

test('mode switching resets the stage and keeps exploration zero-speed behavior', async ({ page }) => {
  await practice(page);
  await page.getByRole('button', { name: '一時停止', exact: true }).click();
  await page.getByRole('button', { name: '探索', exact: true }).click();
  await expect(page.locator('#app')).toHaveAttribute('data-play-mode', 'explore');
  await expect.poll(async () => JSON.parse(await page.locator('#app').getAttribute('data-position'))).toEqual({ x: 0, y: 7, z: 26 });
  await page.getByRole('button', { name: '画面操作を再開する', exact: true }).click();
  await expect(page.locator('#speed-value')).toHaveText('0.0');
  await angle(page, 'pitch', -22);
  await expect.poll(() => speed(page)).toBeGreaterThan(1);
  await page.getByRole('button', { name: '一時停止', exact: true }).click();
  await page.getByRole('button', { name: '飛行機', exact: true }).click();
  await expect(page.locator('#app')).toHaveAttribute('data-play-mode', 'flight');
  await page.getByRole('button', { name: '画面操作を再開する', exact: true }).click();
  await expect.poll(() => speed(page)).toBeGreaterThan(5.5);
});

test('flight onboarding fits phone portrait and landscape and explains the changed controls', async ({ page }) => {
  await page.goto('/?mode=flight');
  await expect(page.getByRole('button', { name: '飛行機', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#control-guide')).toContainText('機首を上下へ向ける');
  for (const size of [{ width: 390, height: 844 }, { width: 360, height: 640 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(size);
    await expect(page.getByRole('button', { name: 'スマホの傾きで始める', exact: true })).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'test-results/flight-intro-mobile.png' });
});

test('sensor flight waits for launch, preserves layout reference, and stops before manual restart', async ({ page }) => {
  await page.addInitScript(() => {
    class Orientation extends Event { static requestPermission() { return Promise.resolve('granted'); } }
    class Motion extends Event { static requestPermission() { return Promise.resolve('granted'); } }
    Object.defineProperty(window, 'DeviceOrientationEvent', { value: Orientation, configurable: true });
    Object.defineProperty(window, 'DeviceMotionEvent', { value: Motion, configurable: true });
  });
  await page.goto('/?mode=flight');
  await page.getByRole('button', { name: 'スマホの傾きで始める', exact: true }).click();
  await expect(page.locator('#app')).toHaveAttribute('data-phase', 'waiting');
  await expect(page.getByRole('button', { name: '探索', exact: true })).toBeDisabled();
  expect(await speed(page)).toBe(0);
  await page.evaluate(() => {
    const neutral = () => window.dispatchEvent(Object.assign(new Event('deviceorientation'), { alpha: 0, beta: 0, gamma: 0 }));
    neutral(); window.calibrationPulse = setInterval(neutral, 50);
  });
  await page.getByRole('button', { name: 'この持ち方で飛ぶ', exact: true }).click();
  await expect.poll(() => speed(page)).toBeGreaterThan(5.5);
  await page.evaluate(() => {
    clearInterval(window.calibrationPulse);
    window.heartbeat = setInterval(() => window.dispatchEvent(Object.assign(new Event('devicemotion'), { rotationRate: { alpha: 0, beta: 0, gamma: 0 } })), 100);
    Object.defineProperty(screen.orientation, 'angle', { value: 90, configurable: true });
    screen.orientation.dispatchEvent(new Event('change'));
  });
  await expect(page.locator('#app')).toHaveAttribute('data-phase', 'running');
  await expect(page.locator('#twist-value')).toHaveText('0°');
  expect(await speed(page)).toBe(6);
  await page.evaluate(() => window.dispatchEvent(Object.assign(new Event('deviceorientation'), { alpha: null, beta: 0, gamma: 0 })));
  await expect(page.locator('#app')).toHaveAttribute('data-phase', 'paused');
  await expect(page.locator('#speed-value')).toHaveText('0.0');
  await page.evaluate(() => window.dispatchEvent(Object.assign(new Event('deviceorientation'), { alpha: 0, beta: 0, gamma: 0 })));
  await page.waitForTimeout(150);
  await expect(page.locator('#app')).toHaveAttribute('data-phase', 'paused');
  await page.getByRole('button', { name: 'この持ち方で再開する', exact: true }).click();
  await expect.poll(() => speed(page)).toBeGreaterThan(5.5);
});

test('leaving during fresh-pose wait cancels flight restart until another manual start', async ({ page }) => {
  await page.addInitScript(() => {
    class Orientation extends Event { static requestPermission() { return Promise.resolve('granted'); } }
    class Motion extends Event { static requestPermission() { return Promise.resolve('granted'); } }
    Object.defineProperty(window, 'DeviceOrientationEvent', { value: Orientation, configurable: true });
    Object.defineProperty(window, 'DeviceMotionEvent', { value: Motion, configurable: true });
  });
  await page.goto('/?mode=flight');
  await page.getByRole('button', { name: 'スマホの傾きで始める', exact: true }).click();
  await page.evaluate(() => {
    const neutral = () => window.dispatchEvent(Object.assign(new Event('deviceorientation'), { alpha: 0, beta: 0, gamma: 0 }));
    neutral(); window.calibrationPulse = setInterval(neutral, 50);
  });
  await page.getByRole('button', { name: 'この持ち方で飛ぶ', exact: true }).click();
  await expect.poll(() => speed(page)).toBeGreaterThan(5.5);
  await page.getByRole('button', { name: '一時停止', exact: true }).click();
  await page.evaluate(() => clearInterval(window.calibrationPulse));
  await page.waitForTimeout(1300);
  await page.getByRole('button', { name: 'この持ち方で再開する', exact: true }).click();
  await expect(page.locator('#app')).toHaveAttribute('data-phase', 'waiting');
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await expect(page.locator('#app')).toHaveAttribute('data-phase', 'paused');
  expect(await speed(page)).toBe(0);
  await page.evaluate(() => window.dispatchEvent(Object.assign(new Event('deviceorientation'), { alpha: 0, beta: 0, gamma: 0 })));
  await page.waitForTimeout(150);
  await expect(page.locator('#app')).toHaveAttribute('data-phase', 'paused');
  expect(await speed(page)).toBe(0);
  await page.getByRole('button', { name: 'この持ち方で再開する', exact: true }).click();
  await expect.poll(() => speed(page)).toBeGreaterThan(5.5);
});

test('flight stage can collect every aerial target and exit using pitch and bank', async ({ page }) => {
  await page.goto('/?mode=flight');
  const result = await page.evaluate(async () => {
    const { createStage } = await import('/src/stage.js');
    const stage = createStage(document.createElement('canvas'));
    stage.resize(390, 844, 1);
    let state = stage.getStatus();
    const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
    let steps = 0;
    for (; steps < 1600 && !state.complete; steps++) {
      const delta = { x: state.targetPosition.x - state.position.x, y: state.targetPosition.y - state.position.y, z: state.targetPosition.z - state.position.z };
      const horizontal = Math.hypot(delta.x, delta.z);
      const bearing = wrap(Math.atan2(delta.x, -delta.z) - state.heading);
      const elevation = Math.atan2(delta.y, horizontal) - state.pitch;
      stage.update(0.12, { mode: 'flight', pitchRate: Math.max(-0.5, Math.min(0.5, elevation * 1.5)), bankAngle: Math.max(-0.6, Math.min(0.6, bearing * 0.7)), speed: Math.abs(bearing) > 0.25 ? 4 : 6 });
      state = stage.getStatus();
    }
    const output = { complete: state.complete, collected: state.collected, position: state.position, distance: state.distance, steps, fixed: state.craftScreen.x === 195 && state.craftScreen.y === 422 && Object.values(state.cameraPosition).every((v) => v === 0) };
    stage.dispose();
    return output;
  });
  expect(result.complete, JSON.stringify(result)).toBe(true);
  expect(result.collected).toBe(3);
  expect(result.fixed).toBe(true);
});

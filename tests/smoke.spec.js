import { test, expect } from '@playwright/test';

const twist = (page, value) => page.locator('#practice-twist').evaluate((el, value) => { el.value = value; el.dispatchEvent(new Event('input', { bubbles: true })); }, value);
const position = (page) => page.locator('#app').getAttribute('data-position').then(JSON.parse);
const sensor = (page, sample) => page.evaluate((sample) => window.dispatchEvent(Object.assign(new Event('deviceorientation'), sample)), sample);

async function fakePermissions(page, permission = 'granted') {
  await page.addInitScript((permission) => {
    class Orientation extends Event { static requestPermission() { return Promise.resolve(permission); } }
    class Motion extends Event { static requestPermission() { return Promise.resolve(permission); } }
    Object.defineProperty(window, 'DeviceOrientationEvent', { value: Orientation, configurable: true });
    Object.defineProperty(window, 'DeviceMotionEvent', { value: Motion, configurable: true });
  }, permission);
}

async function startFakeSensor(page) {
  await fakePermissions(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'スマホの傾きで始める', exact: true }).click();
  await expect(page.locator('#app')).toHaveAttribute('data-phase', 'waiting');
  await page.evaluate(() => {
    const neutral = () => window.dispatchEvent(Object.assign(new Event('deviceorientation'), { alpha: 0, beta: 0, gamma: 0 }));
    neutral();
    window.calibrationPulse = setInterval(neutral, 50);
  });
  await page.getByRole('button', { name: 'この持ち方で始める', exact: true }).click();
  await expect(page.locator('#app')).toHaveAttribute('data-phase', 'running');
  await page.evaluate(() => clearInterval(window.calibrationPulse));
}

test('phone sizes show onboarding and the actual 3D stage without overflow', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  for (const size of [{ width: 390, height: 844 }, { width: 360, height: 640 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(size);
    await expect(page.getByRole('button', { name: 'スマホの傾きで始める', exact: true })).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'test-results/intro-mobile.png' });
  await page.getByRole('button', { name: '画面操作で試す', exact: true }).click();
  await expect(page.locator('#input-mode')).toHaveText('画面操作・センサー未使用');
  await page.screenshot({ path: 'test-results/play-mobile.png' });
  expect(errors).toEqual([]);
});

test('practice advances only with throttle and stops immediately on untwist', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '画面操作で試す', exact: true }).click();
  const start = await position(page);
  await twist(page, 27);
  await expect.poll(() => position(page).then((p) => p.z)).toBeLessThan(start.z - 1);
  await twist(page, 0);
  await expect(page.locator('#speed-value')).toHaveText('0.0');
  const stopped = await position(page);
  await page.waitForTimeout(300);
  expect(await position(page)).toEqual(stopped);
  await page.getByRole('button', { name: '一時停止', exact: true }).click();
  await expect(page.locator('#app')).toHaveAttribute('data-phase', 'paused');
});

test('real event route calibrates, preserves held throttle with heartbeat, and stops on missing axes', async ({ page }) => {
  await startFakeSensor(page);
  await sensor(page, { alpha: 340, beta: 0, gamma: 0 });
  await page.evaluate(() => {
    window.heartbeat = setInterval(() => window.dispatchEvent(Object.assign(new Event('devicemotion'), { rotationRate: { alpha: 0, beta: 0, gamma: 0 } })), 100);
  });
  await page.waitForTimeout(2100);
  await expect(page.locator('#app')).toHaveAttribute('data-phase', 'running');
  expect(Number(await page.locator('#speed-value').textContent())).toBeGreaterThan(0);
  await sensor(page, { alpha: 0, beta: 0, gamma: 0 });
  await expect(page.locator('#speed-value')).toHaveText('0.0');
  await sensor(page, { alpha: null, beta: 0, gamma: 0 });
  await expect(page.locator('#app')).toHaveAttribute('data-phase', 'paused');
  await expect(page.locator('#dialog-description')).toContainText('3方向すべて');
});

test('sensor outage stops motion and denied permission stays out of play', async ({ page }) => {
  await startFakeSensor(page);
  await sensor(page, { alpha: 340, beta: 0, gamma: 0 });
  await expect(page.locator('#app')).toHaveAttribute('data-phase', 'paused', { timeout: 4000 });
  await expect(page.locator('#speed-value')).toHaveText('0.0');
  await fakePermissions(page, 'denied');
  await page.goto('/');
  await page.getByRole('button', { name: 'スマホの傾きで始める', exact: true }).click();
  await expect(page.locator('#app')).toHaveAttribute('data-phase', 'error');
  await expect(page.locator('#error-message')).toContainText('許可されていません');
});

test('motion without fresh orientation cannot keep old forward input alive', async ({ page }) => {
  await startFakeSensor(page);
  await sensor(page, { alpha: 340, beta: 0, gamma: 0 });
  await page.waitForTimeout(500);
  await page.evaluate(() => window.dispatchEvent(Object.assign(new Event('devicemotion'), { rotationRate: { alpha: 15, beta: 0, gamma: 0 } })));
  await expect(page.locator('#app')).toHaveAttribute('data-phase', 'paused');
  await expect(page.locator('#speed-value')).toHaveText('0.0');
  await page.getByRole('button', { name: 'この持ち方で再開する', exact: true }).click();
  await expect(page.locator('#app')).toHaveAttribute('data-phase', 'waiting');
});

test('hidden page pauses and screen change requires a fresh baseline', async ({ page }) => {
  await startFakeSensor(page);
  await page.evaluate(() => screen.orientation.dispatchEvent(new Event('change')));
  await expect(page.locator('#app')).toHaveAttribute('data-phase', 'paused');
  await expect(page.locator('#dialog-description')).toContainText('画面の向き');
  await page.getByRole('button', { name: '画面操作で試す', exact: true }).click();
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { value: true, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  await expect(page.locator('#app')).toHaveAttribute('data-phase', 'paused');
  await expect(page.locator('#dialog-description')).toContainText('画面が隠れた');
});

test('reset cancels a pending baseline timer before the next run', async ({ page }) => {
  await startFakeSensor(page);
  await page.getByRole('button', { name: '一時停止', exact: true }).click();
  await page.waitForTimeout(1300);
  await page.getByRole('button', { name: 'この持ち方で再開する', exact: true }).click();
  await expect(page.locator('#app')).toHaveAttribute('data-phase', 'waiting');
  await page.getByRole('button', { name: '最初からやり直す', exact: true }).click();
  await sensor(page, { alpha: 0, beta: 0, gamma: 0 });
  await page.getByRole('button', { name: 'この持ち方で始める', exact: true }).click();
  await page.evaluate(() => {
    window.heartbeat = setInterval(() => window.dispatchEvent(Object.assign(new Event('devicemotion'), { rotationRate: { alpha: 0, beta: 0, gamma: 0 } })), 100);
  });
  await page.waitForTimeout(6200);
  await expect(page.locator('#app')).toHaveAttribute('data-phase', 'running');
});

test('full stage route collects all targets and exits while camera and craft remain fixed', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const { createStage } = await import('/src/stage.js');
    const canvas = document.createElement('canvas');
    const stage = createStage(canvas);
    stage.resize(390, 844, 1);
    let state = stage.getStatus();
    const initialBearing = state.bearing;
    const initialElevation = state.elevation;
    stage.update(Math.PI / 0.65, { pitchRate: 0.65, yawRate: 0, speed: 0 });
    const halfLoop = stage.getStatus();
    stage.update(Math.PI / 0.65, { pitchRate: 0.65, yawRate: 0, speed: 0 });
    const fullLoop = stage.getStatus();
    const continuousPitch = Math.abs(halfLoop.bearing) > 3 && Math.abs(fullLoop.bearing - initialBearing) < 1e-6 && Math.abs(fullLoop.elevation - initialElevation) < 1e-6;
    stage.reset();
    state = stage.getStatus();
    let fixed = true;
    const start = state.position;
    for (let i = 0; i < 1200 && !state.complete; i++) {
      const turning = Math.abs(state.bearing) > 0.15 || Math.abs(state.elevation) > 0.15;
      stage.update(0.1, { pitchRate: Math.max(-0.65, Math.min(0.65, state.elevation * 2)), yawRate: Math.max(-0.8, Math.min(0.8, state.bearing * 2)), speed: turning ? 0 : 10 });
      state = stage.getStatus();
      fixed &&= state.craftScreen.x === 195 && state.craftScreen.y === 422 && Object.values(state.cameraPosition).every((n) => n === 0);
    }
    const final = { ...state, fixed, start, continuousPitch };
    stage.reset();
    final.reset = stage.getStatus();
    stage.dispose();
    return final;
  });
  expect(result.complete).toBe(true);
  expect(result.collected).toBe(3);
  expect(result.fixed).toBe(true);
  expect(result.continuousPitch).toBe(true);
  expect(result.reset.position).toEqual(result.start);
  expect(result.reset.collected).toBe(0);
});

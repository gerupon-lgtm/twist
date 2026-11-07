import { test, expect } from '@playwright/test';
// This fixture retains the Japanese/legacy display comparison. Default English guidance is covered in guidance/hud-language.spec.js.
test.beforeEach(async({page})=>{await page.addInitScript(value=>{if(!localStorage.getItem('twist.flight-settings.v1'))localStorage.setItem('twist.flight-settings.v1',JSON.stringify(value));},{"hudLanguage": "ja"});});

const setAngle = (page, axis, value) => page.locator(`#practice-${axis}`).evaluate((el, value) => { el.value = value; el.dispatchEvent(new Event('input', { bubbles: true })); }, value);
const speed = (page) => page.locator('#speed-value').textContent().then(Number);
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

async function startFakeSensor(page, mode = 'explore') {
  await fakePermissions(page);
  await page.goto(mode === 'flight' ? '/?mode=flight' : '/');
  await page.getByRole('button', { name: 'スマホの傾きで始める', exact: true }).click();
  await expect(page.locator('#app')).toHaveAttribute('data-phase', 'waiting');
  await page.evaluate(() => {
    const neutral = () => window.dispatchEvent(Object.assign(new Event('deviceorientation'), { alpha: 0, beta: 0, gamma: 0 }));
    neutral();
    window.calibrationPulse = setInterval(neutral, 50);
  });
  await page.getByRole('button', { name: mode === 'flight' ? 'この持ち方で飛ぶ' : 'この持ち方で始める', exact: true }).click();
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
  await page.getByRole('button', { name: '画面で操縦（スマホ傾きは無効）', exact: true }).click();
  await expect(page.locator('#input-mode')).toHaveText('画面操作・センサー未使用');
  await page.screenshot({ path: 'test-results/play-mobile.png' });
  expect(errors).toEqual([]);
});

test('nose down accelerates, neutral keeps speed, nose up brakes to a stop', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '画面で操縦（スマホ傾きは無効）', exact: true }).click();
  const start = await position(page);
  await setAngle(page, 'pitch', -25);
  await expect.poll(() => position(page).then((p) => p.z)).toBeLessThan(start.z - 1);
  await setAngle(page, 'pitch', 0);
  await expect(page.locator('#motion-state')).toHaveText('速度維持');
  const coastingSpeed = await speed(page);
  const coastingPosition = await position(page);
  await page.waitForTimeout(300);
  expect(await speed(page)).toBe(coastingSpeed);
  expect((await position(page)).z).toBeLessThan(coastingPosition.z);
  await setAngle(page, 'pitch', 25);
  await expect(page.locator('#speed-value')).toHaveText('0.0');
  const stopped = await position(page);
  await page.waitForTimeout(300);
  expect(await position(page)).toEqual(stopped);
  await page.getByRole('button', { name: '一時停止', exact: true }).click();
  await expect(page.locator('#app')).toHaveAttribute('data-phase', 'paused');
  await page.getByRole('button', { name: '画面操作を再開する', exact: true }).click();
  await expect(page.locator('#speed-value')).toHaveText('0.0');
});

test('sensor event route accelerates, coasts, brakes, and stops on missing axes', async ({ page }) => {
  await startFakeSensor(page);
  await sensor(page, { alpha: 0, beta: -22, gamma: 0 });
  await page.evaluate(() => {
    window.heartbeat = setInterval(() => window.dispatchEvent(Object.assign(new Event('devicemotion'), { rotationRate: { alpha: 0, beta: 0, gamma: 0 } })), 100);
  });
  await page.waitForTimeout(2100);
  await expect(page.locator('#app')).toHaveAttribute('data-phase', 'running');
  expect(Number(await page.locator('#speed-value').textContent())).toBeGreaterThan(0);
  await sensor(page, { alpha: 0, beta: 0, gamma: 0 });
  await expect(page.locator('#motion-state')).toHaveText('速度維持');
  const coast = await speed(page);
  await page.waitForTimeout(200);
  expect(await speed(page)).toBe(coast);
  await sensor(page, { alpha: 0, beta: 25, gamma: 0 });
  await expect(page.locator('#speed-value')).toHaveText('0.0');
  await sensor(page, { alpha: null, beta: 0, gamma: 0 });
  await expect(page.locator('#app')).toHaveAttribute('data-phase', 'paused');
  await expect(page.locator('#dialog-description')).toContainText('3方向すべて');
});

test('phone rotation is canceled in the craft actually drawn by the stage', async ({ page }) => {
  await startFakeSensor(page);
  await sensor(page, { alpha: 30, beta: 0, gamma: 0 });
  const craft = async () => JSON.parse(await page.locator('#app').getAttribute('data-craft-quaternion'));
  await expect.poll(() => craft().then((q) => q.z)).toBeCloseTo(-Math.sin(Math.PI / 12), 5);
  expect((await craft()).w).toBeCloseTo(Math.cos(Math.PI / 12), 5);
  await sensor(page, { alpha: 0, beta: 0, gamma: -20 });
  await expect.poll(() => craft().then((q) => q.y)).toBeCloseTo(Math.sin(Math.PI / 18), 5);
  expect(await speed(page)).toBe(0);
  await sensor(page, { alpha: 0, beta: 0, gamma: 0 });
  await expect.poll(() => craft().then((q) => q.w)).toBeCloseTo(1, 5);
});

test('layout-only rotation preserves speed and the original craft frame without a twist command', async ({ page }) => {
  await startFakeSensor(page);
  await page.evaluate(() => {
    window.heartbeat = setInterval(() => window.dispatchEvent(Object.assign(new Event('devicemotion'), { rotationRate: { alpha: 0, beta: 0, gamma: 0 } })), 100);
  });
  await sensor(page, { alpha: 0, beta: -22, gamma: 0 });
  await expect.poll(() => speed(page)).toBeGreaterThan(1);
  await sensor(page, { alpha: 0, beta: 0, gamma: 0 });
  await expect(page.locator('#motion-state')).toHaveText('速度維持');
  const coast = await speed(page);
  await page.evaluate(() => {
    Object.defineProperty(screen.orientation, 'angle', { value: 90, configurable: true });
    screen.orientation.dispatchEvent(new Event('change'));
  });
  await expect(page.locator('#app')).toHaveAttribute('data-phase', 'running');
  await expect(page.locator('#twist-value')).toHaveText('0°');
  expect(await speed(page)).toBe(coast);
  await expect.poll(async () => JSON.parse(await page.locator('#app').getAttribute('data-craft-quaternion')).z).toBeCloseTo(Math.sin(Math.PI / 4), 5);
});

test('recentering the controls preserves the original physical craft heading', async ({ page }) => {
  await startFakeSensor(page);
  await sensor(page, { alpha: 30, beta: 0, gamma: 0 });
  await page.getByRole('button', { name: '持ち方を合わせ直す', exact: true }).click();
  await sensor(page, { alpha: 30, beta: 0, gamma: 0 });
  await page.getByRole('button', { name: 'この持ち方で再開する', exact: true }).click();
  await expect(page.locator('#app')).toHaveAttribute('data-phase', 'running');
  await page.waitForTimeout(200);
  await expect.poll(async () => JSON.parse(await page.locator('#app').getAttribute('data-craft-quaternion')).z).toBeCloseTo(-Math.sin(Math.PI / 12), 5);
  await expect(page.locator('#pitch-value')).toHaveText('0°');
  await expect(page.locator('#twist-value')).toHaveText('0°');
  expect(await speed(page)).toBe(0);
});

test('nose-side acceleration and braking work after a physical quarter-turn and display rotation', async ({ page }) => {
  await startFakeSensor(page);
  await page.evaluate(() => {
    window.heartbeat = setInterval(() => window.dispatchEvent(Object.assign(new Event('devicemotion'), { rotationRate: { alpha: 0, beta: 0, gamma: 0 } })), 100);
  });
  await sensor(page, { alpha: 270, beta: 0, gamma: 0 });
  await page.evaluate(() => {
    Object.defineProperty(screen.orientation, 'angle', { value: 270, configurable: true });
    screen.orientation.dispatchEvent(new Event('change'));
  });
  await expect(page.locator('#app')).toHaveAttribute('data-phase', 'running');
  // After a clockwise quarter-turn, the natural device's left edge is the nose side.
  await sensor(page, { alpha: 270, beta: 0, gamma: -22 });
  await expect.poll(() => speed(page)).toBeGreaterThan(1);
  await expect(page.locator('#pitch-value')).toHaveText('-22°');
  await expect(page.locator('#steer-value')).toHaveText('0°');
  await sensor(page, { alpha: 270, beta: 0, gamma: 25 });
  await expect(page.locator('#speed-value')).toHaveText('0.0');
});

test('practice turns the phone first and keyboard and brake stay craft-relative', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '画面で操縦（スマホ傾きは無効）', exact: true }).click();
  await setAngle(page, 'twist', 180);
  // The visible nose is now at the device bottom, so raising the top accelerates.
  await setAngle(page, 'pitch', 22);
  await expect.poll(() => speed(page)).toBeGreaterThan(1);
  await expect(page.locator('#pitch-value')).toHaveText('-22°');
  await page.getByRole('button', { name: 'ブレーキ', exact: true }).click();
  await expect(page.locator('#speed-value')).toHaveText('0.0');
  await setAngle(page, 'pitch', 0);
  await setAngle(page, 'twist', 90);
  await page.keyboard.down('w');
  await expect.poll(() => speed(page)).toBeGreaterThan(1);
  await expect(page.locator('#steer-value')).toHaveText('0°');
  await page.keyboard.up('w');
  await page.keyboard.down('s');
  await expect(page.locator('#speed-value')).toHaveText('0.0');
  await page.keyboard.up('s');
});

test('an edge-on craft keeps its last usable input and recovers without pausing', async ({ page }) => {
  await startFakeSensor(page);
  await sensor(page, { alpha: 0, beta: -22, gamma: 0 });
  await expect.poll(() => speed(page)).toBeGreaterThan(0.5);
  await sensor(page, { alpha: 0, beta: 90, gamma: 0 });
  await expect(page.locator('#app')).toHaveAttribute('data-phase', 'running');
  await expect(page.locator('#app')).toHaveAttribute('data-input-held','true');
  await sensor(page,{alpha:0,beta:0,gamma:0});await expect(page.locator('#app')).toHaveAttribute('data-input-held','false');
});

test('twist turns vertically without accelerating and keyboard follows the new controls', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '画面で操縦（スマホ傾きは無効）', exact: true }).click();
  await setAngle(page, 'twist', 25);
  await page.waitForTimeout(250);
  expect(await speed(page)).toBe(0);
  await page.getByRole('button', { name: '姿勢を戻す', exact: true }).click();
  await page.keyboard.down('w');
  await expect.poll(() => speed(page)).toBeGreaterThan(1);
  await page.keyboard.up('w');
  await expect(page.locator('#motion-state')).toHaveText('速度維持');
  await page.keyboard.down('s');
  await expect(page.locator('#speed-value')).toHaveText('0.0');
  await page.keyboard.up('s');
  await page.keyboard.down('e');
  await expect(page.locator('#twist-value')).toHaveText('22°');
  await page.keyboard.up('e');
});

test('an unchanged valid pose keeps working and denied permission stays out of play', async ({ page }) => {
  await startFakeSensor(page);
  await sensor(page, { alpha: 0, beta: -22, gamma: 0 });
  await page.waitForTimeout(2500);await expect(page.locator('#app')).toHaveAttribute('data-phase', 'running');
  expect(await speed(page)).toBeGreaterThan(0);
  await fakePermissions(page, 'denied');
  await page.goto('/');
  await page.getByRole('button', { name: 'スマホの傾きで始める', exact: true }).click();
  await expect(page.locator('#app')).toHaveAttribute('data-phase', 'error');
  await expect(page.locator('#error-message')).toContainText('許可されていません');
});

test('motion notifications without a changed orientation do not interrupt a held pose', async ({ page }) => {
  await startFakeSensor(page);
  await sensor(page, { alpha: 0, beta: -22, gamma: 0 });
  await page.waitForTimeout(500);
  await page.evaluate(() => window.dispatchEvent(Object.assign(new Event('devicemotion'), { rotationRate: { alpha: 15, beta: 0, gamma: 0 } })));
  await page.waitForTimeout(2000);await expect(page.locator('#app')).toHaveAttribute('data-phase', 'running');
  await page.locator('#pause-button').click();await expect(page.locator('#speed-value')).toHaveText('0.0');
  await page.getByRole('button', { name: 'この持ち方で再開する', exact: true }).click();
  await expect(page.locator('#app')).toHaveAttribute('data-phase', 'waiting');
});

test('hidden page pauses even after a layout change', async ({ page }) => {
  await startFakeSensor(page);
  await page.evaluate(() => screen.orientation.dispatchEvent(new Event('change')));
  await expect(page.locator('#app')).toHaveAttribute('data-phase', 'running');
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

for (const mode of ['explore']) {
  test(`${mode}: twelve degrees fills throttle; returning to neutral coasts, crossing it brakes`, async ({ page }) => {
    await startFakeSensor(page, mode);
    await page.evaluate(() => {
      window.heartbeat = setInterval(() => window.dispatchEvent(Object.assign(new Event('devicemotion'), { rotationRate: { alpha: 0, beta: 0, gamma: 0 } })), 100);
    });
    const throttleAxis = mode === 'flight' ? 'twist' : 'pitch';
    const demand = (value) => sensor(page, mode === 'flight'
      ? { alpha: (360 - value) % 360, beta: 0, gamma: 0 }
      : { alpha: 0, beta: -value, gamma: 0 });
    await demand(12);
    await expect(page.locator('#motion-state')).toHaveText('加速中');
    await expect.poll(() => page.locator(`#${throttleAxis}-meter`).evaluate(el => parseFloat(el.style.width))).toBeGreaterThan(49.9);
    await expect.poll(() => speed(page)).toBeGreaterThan(mode === 'flight' ? 6.5 : 0.5);
    await expect(page.locator('#stop-hint')).toHaveText('加減速は12°で最大');
    await page.screenshot({ path: `test-results/v014-${mode}-throttle.png` });
    let previous = await speed(page);
    for (const value of [9, 6, 2, 0, -1]) {
      await demand(value);
      await page.waitForTimeout(150);
      const current = await speed(page);
      expect(current).toBeGreaterThanOrEqual(previous);
      previous = current;
    }
    await expect(page.locator('#motion-state')).toHaveText('速度維持');
    const coast = await speed(page);
    for (const value of mode === 'flight' ? [-4, 4, 0] : [-2, 2, 0]) {
      await demand(value);
      await expect(page.locator('#motion-state')).toHaveText('速度維持');
      await page.waitForTimeout(150);
      expect(await speed(page)).toBe(coast);
    }
    await demand(-12);
    await expect(page.locator('#motion-state')).toHaveText('ブレーキ');
    await expect.poll(() => page.locator(`#${throttleAxis}-meter`).evaluate(el => parseFloat(el.style.width))).toBeGreaterThan(49.9);
    await expect(page.locator('#speed-value')).toHaveText('0.0');
  });
}

test('all aerial targets and the exit are reachable while the camera and craft center stay fixed', async ({ page }) => {
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
    stage.update(0, { speed: 0, craftQuaternion: { x: 0, y: 0, z: -Math.sin(Math.PI / 8), w: Math.cos(Math.PI / 8) } });
    final.drawnCompensation = stage.getStatus().craftQuaternion;
    stage.reset();
    final.reset = stage.getStatus();
    stage.dispose();
    return final;
  });
  expect(result.complete).toBe(true);
  expect(result.collected).toBe(3);
  expect(result.fixed).toBe(true);
  expect(result.continuousPitch).toBe(true);
  expect(result.drawnCompensation.z).toBeCloseTo(-Math.sin(Math.PI / 8), 6);
  expect(result.reset.position).toEqual(result.start);
  expect(result.reset.collected).toBe(0);
});

import { test, expect } from '@playwright/test';

const data = (page, key) => page.locator('#app').getAttribute(`data-${key}`).then(Number);
const level = page => page.locator('#app').getAttribute('data-ground-level');
const pitch = (page, value) => page.locator('#practice-pitch').evaluate((el, angle) => {
  el.value = String(angle); el.dispatchEvent(new Event('input', { bubbles: true }));
}, value);
const output = (page, value) => page.locator('#throttle-input').evaluate((el, percent) => {
  el.value = String(percent); el.dispatchEvent(new Event('input', { bubbles: true }));
}, value);

async function launch(page, { controlledClock = false } = {}) {
  if (controlledClock) await page.clock.install({ time: new Date('2026-11-07T00:00:00Z') });
  await page.goto('/?mode=flight&pitch=rate');
  if (controlledClock) await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
  await page.locator('#practice-button').click();
  if (controlledClock) await page.clock.runFor(100);
  await expect(page.locator('#app')).toHaveAttribute('data-phase', 'running');
  await expect(page.locator('#app')).toHaveAttribute('data-ground-level', 'clear');
  await expect(page.locator('#throttle-value')).toHaveText('50%');
  await expect(page.locator('#ground-clearance')).toHaveText('地面まで');
  await expect(page.locator('#ground-edge-warning')).toBeHidden();
  expect(await data(page, 'ground-clearance')).toBeCloseTo(14, 1);
}

async function descend(page) {
  await output(page, 0);
  await pitch(page, -12);
}

async function expectLevel(page, expected) {
  await expect.poll(() => level(page), { timeout: 15000, intervals: [50] }).toBe(expected);
  await expect(page.locator('#ground-proximity')).toHaveAttribute('data-level', expected);
}

async function advanceToLevel(page, expected) {
  for (let i = 0; i < 160; i++) {
    await page.clock.runFor(100);
    const current = await level(page);
    if (current === expected) return;
    if (current === 'stopped') throw new Error(`Flight stopped before reaching ${expected}`);
  }
  throw new Error(`Ground warning did not reach ${expected}: ${await level(page)}`);
}

async function expectClearWarningLayout(page) {
  const layout = await page.evaluate(() => {
    const rect = id => document.getElementById(id).getBoundingClientRect();
    const hud = rect('bottom-panel');
    const warning = rect('ground-warning-text');
    const clearance = rect('ground-proximity');
    const marker = rect('target-edge-marker');
    const nav = document.querySelector('.navigation').getBoundingClientRect();
    const craft = { left: innerWidth / 2 - 32, right: innerWidth / 2 + 32,
      top: innerHeight / 2 - 26, bottom: innerHeight / 2 + 26 };
    const overlaps = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    const inside = r => r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight;
    const markerShown = !document.getElementById('target-edge-marker').hidden;
    return {
      warningInside: inside(warning) && warning.left >= hud.left && warning.right <= hud.right,
      clearanceInside: inside(clearance),
      hudLeavesCraft: !overlaps(hud, craft),
      markerClear: !markerShown || (inside(marker) && !overlaps(marker, hud)
        && !overlaps(marker, nav) && !overlaps(marker, craft)),
      frameDoesNotIntercept: getComputedStyle(document.getElementById('ground-edge-warning')).pointerEvents === 'none',
      ratio: Number(getComputedStyle(document.getElementById('ground-height-meter')).getPropertyValue('--clearance-ratio')),
      actualClearance: Number(document.getElementById('app').dataset.groundClearance),
    };
  });
  expect(layout.warningInside).toBe(true);
  expect(layout.clearanceInside).toBe(true);
  expect(layout.hudLeavesCraft).toBe(true);
  expect(layout.markerClear).toBe(true);
  expect(layout.frameDoesNotIntercept).toBe(true);
  expect(layout.ratio).toBeCloseTo(Math.max(0, Math.min(1, layout.actualClearance / 12)), 8);
}

test('actual descent progresses from clear through low and danger to a ground stop, then restarts only on request', async ({ page }) => {
  await launch(page);
  await descend(page);
  await expectLevel(page, 'low');
  await expect(page.locator('#ground-warning-text')).toBeVisible();
  await expect(page.locator('#ground-edge-warning')).toBeVisible();
  await expectLevel(page, 'danger');
  await expect(page.locator('#ground-edge-warning')).toHaveAttribute('data-level', 'danger');
  await expectLevel(page, 'stopped');
  await expect(page.locator('#app')).toHaveAttribute('data-phase', 'paused');
  await expect(page.locator('#altitude-value')).toHaveText('0.0');
  await expect(page.locator('#throttle-value')).toHaveText('0%');
  await expect(page.locator('#speed-value')).toHaveText('0.0');
  await expect(page.locator('#dialog-description')).toContainText('前倒し12°');
  await expect(page.locator('#ground-edge-warning')).toBeHidden();
  const stopped = await page.locator('#app').getAttribute('data-position');
  await page.waitForTimeout(200);
  expect(await page.locator('#app').getAttribute('data-position')).toBe(stopped);
  await page.locator('#start-button').click();
  await expectLevel(page, 'clear');
  await expect(page.locator('#app')).toHaveAttribute('data-phase', 'running');
  await expect(page.locator('#throttle-value')).toHaveText('50%');
  await expect(page.locator('#altitude-value')).toHaveText('14.0');
  await page.locator('#pause-button').click();
  await expect(page.locator('#ground-edge-warning')).toBeHidden();
  await page.locator('#mode-explore').click();
  await expect(page.locator('#app')).toHaveAttribute('data-ground-level', 'hidden');
  await expect(page.locator('#ground-clearance')).toHaveText('高さ');
  await expect(page.locator('#ground-height-meter')).toBeHidden();
  await expect(page.locator('#ground-warning-text')).toBeHidden();
});

test('nose-up descent keeps the ground in view, passes below two metres, and stops only on contact', async ({ page }) => {
  await launch(page, { controlledClock: true });
  await pitch(page, 25);
  await page.locator('#practice-steer').evaluate(el => { el.value = '20'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.clock.runFor(1500);
  await pitch(page, 0);
  await output(page, 0);
  let sawBelowTwo = false, sawGroundView = false;
  for (let i = 0; i < 360; i++) {
    await page.clock.runFor(50);
    const state = await page.locator('#app').evaluate(el => ({
      phase: el.dataset.phase, height: Number(el.dataset.groundClearance),
      pitch: Number(el.dataset.flightPitch), viewPitch: Number(el.dataset.viewPitch ?? el.dataset.flightPitch),
      assistance: Number(el.dataset.viewAssistance), grounded: el.dataset.grounded,
    }));
    if (state.height > 0 && state.height < 2) {
      expect(state.phase).toBe('running');
      expect(state.grounded).toBe('false');
      sawBelowTwo = true;
      await page.screenshot({ path: 'test-results/v0110-nose-up-below-two.png' });
    }
    if (state.height < 5 && state.phase === 'running') {
      expect(state.pitch).toBeGreaterThan(.8);
      expect(state.viewPitch).toBeLessThan(0);
      expect(state.assistance).toBeCloseTo(1, 5);
      sawGroundView = true;
    }
    if (state.phase === 'paused') break;
  }
  expect(sawBelowTwo).toBe(true);
  expect(sawGroundView).toBe(true);
  await expect(page.locator('#app')).toHaveAttribute('data-grounded', 'true');
  await expect(page.locator('#altitude-value')).toHaveText('0.0');
  await expect(page.locator('#dialog-title')).toContainText('接触');
  await page.screenshot({ path: 'test-results/v0110-contact.png' });
});

test('low and danger warnings fit three phone viewports without covering the craft or target marker', async ({ page }) => {
  test.setTimeout(45000);
  // Pause time only to take comparable screenshots. Flight state still comes
  // entirely from the normal output/pitch UI and the real stage simulation.
  await launch(page, { controlledClock: true });
  await descend(page);
  for (const warning of ['low', 'danger']) {
    await advanceToLevel(page, warning);
    for (const size of [{ width: 390, height: 844 }, { width: 360, height: 640 }, { width: 844, height: 390 }]) {
      await page.setViewportSize(size);
      await page.clock.runFor(100);
      await expect(page.locator('#app')).toHaveAttribute('data-ground-level', warning);
      await expect(page.locator('#ground-warning-text')).toBeVisible();
      await expect(page.locator('#ground-edge-warning')).toBeVisible();
      await expect(page.locator('#throttle-input')).toBeInViewport();
      await expect(page.locator('#pause-button')).toBeInViewport();
      await expectClearWarningLayout(page);
      await page.screenshot({ path: `test-results/v018-${warning}-${size.width}x${size.height}.png`, animations: 'disabled' });
    }
  }
});

test('raising the hardware top and restoring engine power can recover a low flight warning', async ({ page }) => {
  await launch(page);
  await descend(page);
  await expectLevel(page, 'low');
  await output(page, 100);
  await pitch(page, 25);
  await expect.poll(() => data(page, 'flight-pitch'), { timeout: 4000, intervals: [50] }).toBeGreaterThan(.18);
  // Return the input to neutral once the nose is raised; do not keep pitching
  // through a full loop while waiting for the climb to restore clearance.
  await pitch(page, 0);
  await expect.poll(() => data(page, 'vertical-speed'), { timeout: 10000, intervals: [100] }).toBeGreaterThan(.1);
  await expectLevel(page, 'clear');
  await expect(page.locator('#app')).toHaveAttribute('data-phase', 'running');
  expect(await data(page, 'ground-clearance')).toBeGreaterThan(5);
  await expect(page.locator('#throttle-value')).toHaveText('100%');
  await expect(page.locator('#ground-edge-warning')).toBeHidden();
});

test('motion diagrams remain scrollable with start controls on short screens and reduced motion disables animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const size of [{ width: 360, height: 640 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(size);
    await page.goto('/?mode=flight&pitch=rate');
    const explanation = page.locator('#motion-explanation');
    await explanation.locator('summary').click();
    await expect(explanation).toHaveAttribute('open', '');
    const captions = explanation.locator('figcaption');
    await expect(captions).toHaveCount(2);
    await expect(captions.nth(0)).toContainText('ひねる');
    await expect(captions.nth(0)).toContainText('左右の端を上げ下げ');
    await expect(captions.nth(1)).toContainText('回す');
    await expect(captions.nth(1)).toContainText('時計回り');
    for (const caption of await captions.all()) {
      await caption.scrollIntoViewIfNeeded();
      await expect(caption).toBeInViewport();
    }
    const animations = await explanation.locator('.motion-handset').evaluateAll(nodes => nodes.map(node => getComputedStyle(node).animationName));
    expect(animations).toEqual(['none', 'none']);
    await page.locator('#start-button').scrollIntoViewIfNeeded();
    await expect(page.locator('#start-button')).toBeInViewport();
    await expect(page.locator('#start-button')).toBeEnabled();
    await expect(explanation).toHaveAttribute('open', '');
  }
});

test('low flight outside the original island still has a rendered floor and ground projection', async ({ page }) => {
  await page.goto('/?mode=flight&pitch=rate');
  const result = await page.evaluate(async () => {
    const { createStage } = await import('/src/stage.js');
    const canvas = document.createElement('canvas');
    canvas.id = 'outside-floor-preview';
    Object.assign(canvas.style, { position: 'fixed', inset: '0', zIndex: '20', width: '100vw', height: '100vh' });
    document.body.append(canvas);
    const stage = createStage(canvas);
    stage.resize(innerWidth, innerHeight, 1);
    stage.update(1, { mode: 'explore', yawRate: Math.PI / 2, speed: 0 });
    stage.update(.5, { mode: 'explore', pitchRate: -Math.PI / 2, speed: 0 });
    stage.update(2, { mode: 'explore', speed: 10 });
    stage.update(.5, { mode: 'explore', pitchRate: Math.PI / 2, speed: 0 });
    stage.update(9, { mode: 'explore', speed: 10 });
    stage.update(8 / 9, { mode: 'explore', pitchRate: -Math.PI / 2, speed: 0 });
    stage.resize(innerWidth, innerHeight, 1);
    const state = stage.getStatus();
    window.disposeFloorPreview = () => { stage.dispose(); canvas.remove(); };
    return { position: state.position, clearance: state.groundClearance, craft: state.craftScreen };
  });
  expect(result.position.x).toBeGreaterThan(90);
  expect(result.position.y).toBe(2);
  expect(result.clearance).toBe(2);
  await expect(page.locator('#outside-floor-preview')).toBeVisible();
  await page.screenshot({ path: 'test-results/v018-outside-floor.png' });
  await page.evaluate(() => window.disposeFloorPreview());
});

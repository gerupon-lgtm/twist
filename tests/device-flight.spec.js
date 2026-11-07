import { test, expect } from '@playwright/test';
import { Euler, Quaternion, Vector3 } from 'three';

const rad = degrees => degrees * Math.PI / 180;
const data = (page, key) => page.locator('#app').getAttribute(`data-${key}`).then(Number);
const position = page => page.locator('#app').getAttribute('data-position').then(JSON.parse);
const output = page => page.locator('#throttle-input').inputValue().then(Number);
const neutralSample = { alpha: 0, beta: 0, gamma: 0 };

// Build physical device poses without using the application's control helpers.
// Turn in the screen plane, then tilt around the phone's own horizontal axes.
function devicePose({ pitch = 0, steer = 0, twist = 0 } = {}, reference = new Quaternion()) {
  const axis = new Vector3(rad(pitch), rad(steer), 0);
  const angle = axis.length();
  const tilt = angle ? new Quaternion().setFromAxisAngle(axis.normalize(), angle) : new Quaternion();
  return reference.clone().multiply(new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), -rad(twist))).multiply(tilt);
}

function rawSample(pose) {
  const euler = new Euler().setFromQuaternion(pose, 'ZXY');
  return { alpha: (euler.z * 180 / Math.PI + 360) % 360,
    beta: euler.x * 180 / Math.PI, gamma: euler.y * 180 / Math.PI };
}

const sensor = (page, pose) => page.evaluate(sample => {
  window.dispatchEvent(Object.assign(new Event('deviceorientation'), sample));
}, rawSample(pose));

async function prepareSensor(page, steering, screenAngle = 0) {
  await page.addInitScript(angle => {
    class Orientation extends Event { static requestPermission() { return Promise.resolve('granted'); } }
    class Motion extends Event { static requestPermission() { return Promise.resolve('granted'); } }
    Object.defineProperty(window, 'DeviceOrientationEvent', { value: Orientation, configurable: true });
    Object.defineProperty(window, 'DeviceMotionEvent', { value: Motion, configurable: true });
    Object.defineProperty(screen.orientation, 'angle', { value: angle, configurable: true });
  }, screenAngle);
  await page.goto(`/?mode=flight${steering ? `&steer=${steering}` : ''}`);
}

async function beginSensor(page) {
  await page.locator('#start-button').click();
  await expect(page.locator('#app')).toHaveAttribute('data-phase', 'waiting');
  for (const steering of ['twist', 'tilt']) await expect(page.locator(`#steering-${steering}`)).toBeDisabled();
  await page.evaluate(sample => {
    const send = () => window.dispatchEvent(Object.assign(new Event('deviceorientation'), sample));
    window.deviceFlightHeartbeat = setInterval(() => window.dispatchEvent(Object.assign(new Event('devicemotion'), {
      rotationRate: { alpha: 0, beta: 0, gamma: 0 },
    })), 100);
    send(); window.deviceFlightCalibration = setInterval(send, 100);
  }, neutralSample);
  await expect(page.locator('#app')).toHaveAttribute('data-phase', 'ready');
  for (const steering of ['twist', 'tilt']) await expect(page.locator(`#steering-${steering}`)).toBeDisabled();
  await page.locator('#start-button').click();
  await expect(page.locator('#app')).toHaveAttribute('data-phase', 'running');
  await page.evaluate(() => clearInterval(window.deviceFlightCalibration));
  await expect(page.locator('#app')).toHaveAttribute('data-control-basis', 'device');
  await expect(page.locator('#throttle-value')).toHaveText('50%');
}

async function startSensor(page, steering = 'tilt', screenAngle = 0) {
  await prepareSensor(page, steering, screenAngle);
  await beginSensor(page);
}

async function expectBankDisplay(page) {
  await expect.poll(async () => {
    const raw = await page.locator('#app').getAttribute('data-craft-quaternion');
    if (!raw) return 0;
    const q = JSON.parse(raw);
    const bank = await data(page, 'bank');
    return Math.abs(new Quaternion(q.x,q.y,q.z,q.w).dot(new Quaternion().setFromAxisAngle(new Vector3(0,0,1),-bank)));
  }).toBeCloseTo(1, 5);
}

test('flight steering defaults to tilt and can change only before launch or while paused without resetting position', async ({ page }) => {
  await prepareSensor(page);
  await expect(page.locator('#app')).toHaveAttribute('data-flight-steering', 'tilt');
  await expect(page.locator('#steering-tilt')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#steering-twist').click();
  await expect(page.locator('#app')).toHaveAttribute('data-flight-steering', 'twist');
  await expect(page).toHaveURL(/[?&]steer=twist(?:&|$)/);
  await beginSensor(page);
  for (const steering of ['tilt', 'twist']) await expect(page.locator(`#steering-${steering}`)).toBeDisabled();
  await expect.poll(() => position(page).then(p => p?.z ?? Infinity)).toBeLessThan(25);
  await page.locator('#pause-button').click();
  await expect(page.locator('#speed-value')).toHaveText('0.0');
  const stopped = await position(page);
  await page.locator('#steering-tilt').click();
  await expect(page.locator('#app')).toHaveAttribute('data-flight-steering', 'tilt');
  await expect(page.locator('#app')).toHaveAttribute('data-phase', 'paused');
  expect(await position(page)).toEqual(stopped);
  await expect(page.locator('#throttle-value')).toHaveText('0%');
  await expect(page).toHaveURL(/[?&]steer=tilt(?:&|$)/);
  const home = new URL(await page.locator('#home-link').getAttribute('href'), 'https://example.test/');
  expect(home.searchParams.get('steer')).toBe('tilt');
  await page.locator('#mode-explore').click();
  await expect(page.locator('#flight-steering-picker')).toBeHidden();
  await page.locator('#practice-button').click();
  await expect(page.locator('#app')).toHaveAttribute('data-control-basis', 'craft');
});

test('lifting or lowering the hardware top keeps the same pitch after quarter and half turns', async ({ page }) => {
  await startSensor(page, 'tilt');
  for (const twist of [0, 90, -90, 180]) {
    for (const pitch of [12, -12]) {
      await sensor(page, devicePose({ pitch, twist }));
      await expect(page.locator('#pitch-value')).toHaveText(`${pitch}°`);
      await expect(page.locator('#steer-value')).toHaveText('0°');
      await expect(page.locator('#app')).toHaveAttribute('data-phase', 'running');
      await expect(page.locator('#throttle-value')).toHaveText('50%');
    }
  }
});

test('twist steering ignores side tilt, including a tilt opposite to the selected turn', async ({ page }) => {
  await startSensor(page, 'twist');
  await sensor(page, devicePose({ steer: 22 }));
  await expect(page.locator('#steer-value')).toHaveText('22°');
  await page.waitForTimeout(200);
  expect(Math.abs(await data(page, 'bank'))).toBeLessThan(.005);
  expect(Math.abs(await data(page, 'heading'))).toBeLessThan(.005);
  await sensor(page, devicePose({ twist: 20, steer: -22 }));
  await expect.poll(() => data(page, 'bank')).toBeGreaterThan(.15);
  await sensor(page, devicePose({ twist: -20, steer: 22 }));
  await expect.poll(() => data(page, 'bank')).toBeLessThan(-.15);
  await expect(page.locator('#throttle-value')).toHaveText('50%');
});

test('tilt steering ignores twist, including a twist opposite to the selected turn', async ({ page }) => {
  await startSensor(page, 'tilt');
  for (const twist of [20, -20]) {
    await sensor(page, devicePose({ twist }));
    await expect(page.locator('#twist-value')).toHaveText(`${twist}°`);
    await page.waitForTimeout(150);
    expect(Math.abs(await data(page, 'bank'))).toBeLessThan(.005);
    expect(Math.abs(await data(page, 'heading'))).toBeLessThan(.005);
  }
  await sensor(page, devicePose({ steer: 20, twist: -20 }));
  await expect.poll(() => data(page, 'bank')).toBeGreaterThan(.15);
  await sensor(page, devicePose({ steer: -20, twist: 20 }));
  await expect.poll(() => data(page, 'bank')).toBeLessThan(-.15);
  await expect(page.locator('#throttle-value')).toHaveText('50%');
});

test('landscape calibration and recenter preserve hardware input while flight drawing follows bank', async ({ page }) => {
  await startSensor(page, 'tilt', 90);
  const pitched = devicePose({ pitch: 12 });
  await sensor(page, pitched);
  await expect(page.locator('#pitch-value')).toHaveText('12°');
  await page.evaluate(() => {
    Object.defineProperty(screen.orientation, 'angle', { value: 270, configurable: true });
    screen.orientation.dispatchEvent(new Event('change'));
  });
  await expect(page.locator('#pitch-value')).toHaveText('12°');
  await expect(page.locator('#steer-value')).toHaveText('0°');
  await expect(page.locator('#app')).toHaveAttribute('data-phase', 'running');
  await expect(page.locator('#throttle-value')).toHaveText('50%');
  await expectBankDisplay(page);
  await page.locator('#recenter-button').click();
  const newNeutral = devicePose({ pitch: 15, twist: 30 });
  await sensor(page, newNeutral);
  await page.locator('#start-button').click();
  await expect(page.locator('#app')).toHaveAttribute('data-phase', 'running');
  for (const axis of ['pitch', 'steer', 'twist']) await expect(page.locator(`#${axis}-value`)).toHaveText('0°');
  await expectBankDisplay(page);
  await sensor(page, devicePose({ pitch: 12 }, newNeutral));
  await expect(page.locator('#pitch-value')).toHaveText('12°');
  await expect(page.locator('#steer-value')).toHaveText('0°');
  await expect(page.locator('#throttle-value')).toHaveText('50%');
});

test('right and left turns bank the drawn craft in the same direction despite opposite phone compensation', async ({ page }) => {
  await startSensor(page, 'tilt');
  for (const sign of [1, -1]) {
    await sensor(page, devicePose({ steer: sign*20, twist: sign*20 }));
    await expect.poll(async()=>sign*await data(page,'bank')).toBeGreaterThan(.15);
    await expect.poll(async()=>{
      const q=JSON.parse(await page.locator('#app').getAttribute('data-craft-quaternion'));
      return sign*2*(q.x*q.y-q.w*q.z);
    }).toBeGreaterThan(.1);
  }
});

test('PC pitch follows the hardware top after turning and steering keys follow the selected axis while Q/E adjust power', async ({ page }) => {
  for (const steering of ['twist', 'tilt']) {
    await page.goto(`/?mode=flight&steer=${steering}&pitch=rate`);
    await page.locator('#practice-button').click();
    await expect(page.locator('#throttle-value')).toHaveText('50%');
    await page.locator('#practice-twist').evaluate(el => { el.value = '90'; el.dispatchEvent(new Event('input', { bubbles: true })); });
    await expect(page.locator('#twist-value')).toHaveText('90°');
    await page.keyboard.down('w');
    await expect(page.locator('#pitch-value')).toHaveText('18°');
    await expect(page.locator('#steer-value')).toHaveText('0°');
    await page.keyboard.up('w');
    await page.keyboard.down('s');
    await expect(page.locator('#pitch-value')).toHaveText('-18°');
    await page.keyboard.up('s');
    await page.keyboard.down('d');
    await expect.poll(() => data(page, 'bank')).toBeGreaterThan(.1);
    await page.keyboard.up('d');
    await page.keyboard.down('a');
    await expect.poll(() => data(page, 'bank')).toBeLessThan(-.1);
    await page.keyboard.up('a');
    await page.keyboard.down('q');
    await expect.poll(() => output(page)).toBeLessThan(50);
    await page.keyboard.up('q');
    const reduced = await output(page);
    await page.waitForTimeout(150);
    expect(await output(page)).toBe(reduced);
    await page.keyboard.down('e');
    await expect.poll(() => output(page)).toBeGreaterThan(reduced);
    await page.keyboard.up('e');
  }
});
test('a held turning pose continues without sensor heartbeats, while invalid readings and hidden pages still pause',async({page})=>{
 await startSensor(page,'tilt');await page.evaluate(()=>{clearInterval(window.deviceFlightHeartbeat);clearInterval(window.deviceFlightCalibration);});
 await sensor(page,devicePose({steer:8}));const start=await data(page,'heading');
 await page.waitForTimeout(4500);await expect(page.locator('#app')).toHaveAttribute('data-phase','running');await expect(page.locator('#app')).toHaveAttribute('data-input','sensor');expect(Math.abs(await data(page,'heading')-start)).toBeGreaterThan(.2);
 await page.evaluate(()=>window.dispatchEvent(Object.assign(new Event('devicemotion'),{rotationRate:{alpha:15,beta:0,gamma:0}})));await page.waitForTimeout(500);await expect(page.locator('#app')).toHaveAttribute('data-phase','running');
 await page.evaluate(()=>window.dispatchEvent(Object.assign(new Event('deviceorientation'),{alpha:null,beta:null,gamma:null})));await expect(page.locator('#app')).toHaveAttribute('data-phase','paused');await expect(page.locator('#dialog-description')).toContainText('読めなくなった');await expect(page.locator('#app')).toHaveAttribute('data-input','sensor');
});

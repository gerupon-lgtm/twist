// Navigating manifest.start_url verifies startup resolution, not physical OS install.
import {test,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {APP_VERSION} from '../src/version.js';
const STEERING_KEY='twist.steering.v1',SETTINGS_KEY='twist.flight-settings.v1';
for(const base of ['/','/twist/'])for(const saved of ['wrist','twist',null])test(`manifest start preserves ${saved??'unconfigured tilt'} at ${base}`,async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(({saved,STEERING_KEY,SETTINGS_KEY})=>{
    if(!/^https?:$/.test(location.protocol))return;
    const nativeSet=Storage.prototype.setItem;
    // Seed once per context, before observing product writes. No init script
    // re-seeds a steering choice on the subsequent manifest-start navigation.
    if(!localStorage.getItem('wrist-pwa-fixture-seeded')){
      nativeSet.call(localStorage,'twist.start-flow.v1',JSON.stringify({tutorialSeen:true,camera:'overlay',inputMethod:'practice'}));
      nativeSet.call(localStorage,'twist.briefing.v1',JSON.stringify({version:1,mode:'off',seen:[]}));
      nativeSet.call(localStorage,'twist.feedback-settings.v1',JSON.stringify({sound:false,bgm:false,vibration:false}));
      nativeSet.call(localStorage,SETTINGS_KEY,JSON.stringify({maxSteerTilt:27,steerTiltDeadzone:2,maxSteerTwist:35,steerTwistDeadzone:7}));
      if(saved!==null)nativeSet.call(localStorage,STEERING_KEY,JSON.stringify({version:1,mode:saved}));
      nativeSet.call(localStorage,'wrist-pwa-fixture-seeded','true');
    }
    window.wristManifestWrites=[];
    Storage.prototype.setItem=function(key,value){if(this===localStorage&&[STEERING_KEY,SETTINGS_KEY].includes(key))window.wristManifestWrites.push({key,value});return nativeSet.call(this,key,value);};
  },{saved,STEERING_KEY,SETTINGS_KEY});
  await page.goto(base);await expect(page.locator('#start-flow-panel')).toHaveAttribute('data-step','title');
  const first=await page.evaluate(async({STEERING_KEY,SETTINGS_KEY})=>{
    const manifestURL=document.querySelector('link[rel=manifest]').href;
    const response=await fetch(manifestURL,{cache:'no-store'});if(!response.ok)throw Error('Manifest '+response.status);
    const manifest=await response.json();return {manifestURL,start:new URL(manifest.start_url,manifestURL).href,
      steeringRaw:localStorage.getItem(STEERING_KEY),settingsRaw:localStorage.getItem(SETTINGS_KEY),writes:window.wristManifestWrites};
  },{STEERING_KEY,SETTINGS_KEY});
  const start=new URL(first.start);expect(start.pathname).toBe(base);expect(start.searchParams.get('steer')).toBeNull();
  expect(Object.fromEntries(start.searchParams)).toMatchObject({mode:'flight',view:'assisted',pitch:'angle',v:APP_VERSION});
  expect(start.searchParams.has('dev')).toBe(false);expect(start.searchParams.has('flow')).toBe(false);expect(first.writes).toEqual([]);
  expect(first.steeringRaw).toBe(saved===null?null:JSON.stringify({version:1,mode:saved}));
  await page.goto(first.start);await expect(page.locator('#start-flow-panel')).toHaveAttribute('data-step','title');
  await expect(page.locator('#app')).toHaveAttribute('data-start-flow','on');await expect(page.locator('#app')).toHaveAttribute('data-flight-steering',saved??'tilt');
  await expect(page.locator('#app')).toHaveAttribute('data-session',/.+/);
  await expect(page.locator('#start-flow-version')).toContainText('v'+APP_VERSION);
  const final=await page.evaluate(async({STEERING_KEY,SETTINGS_KEY})=>{
    const app=document.getElementById('app'),registration=await navigator.serviceWorker.ready;
    return {phase:app.dataset.phase,session:JSON.parse(app.dataset.session),startup:JSON.parse(app.dataset.startup),
      steeringRaw:localStorage.getItem(STEERING_KEY),settingsRaw:localStorage.getItem(SETTINGS_KEY),writes:window.wristManifestWrites,
      worker:{scope:registration.scope,script:registration.active?.scriptURL}};
  },{STEERING_KEY,SETTINGS_KEY});
  expect(final.phase).toBe('intro');expect(final.session.elapsedSeconds).toBe(0);expect(final.startup?.flightStartedAt??null).toBeNull();
  expect(final.steeringRaw).toBe(first.steeringRaw);expect(final.settingsRaw).toBe(first.settingsRaw);expect(final.writes).toEqual([]);
  expect(new URL(final.worker.scope).pathname).toBe(base);expect(new URL(final.worker.script).pathname).toBe(base+'sw.js');expect(new URL(final.worker.script).searchParams.get('v')).toBe(APP_VERSION);expect(errors).toEqual([]);
  const name=`.cache/v${APP_VERSION.replaceAll('.','')}-wrist-pwa-${base==='/'?'root':'twist'}-${saved??'unconfigured'}`;
  await mkdir('.cache',{recursive:true});await page.screenshot({path:name+'.png'});await writeFile(name+'.json',JSON.stringify({start:first.start,first,final,errors,evidence:'built manifest URL + real SW; physical installed-PWA acceptance unconfirmed'},null,2));
});

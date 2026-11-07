import assert from 'node:assert/strict';
import test from 'node:test';
import { isIPhone, isAndroid, iPhoneOrientationNotice, launchMethod, installationAdvice, orientationType, createOrientationGuard } from '../src/device-platform.js';

const iphone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 Version/18.7 Mobile/15E148 Safari/604.1';
test('iPhone advice detects Safari and other iPhone browsers without matching other devices',()=>{
  for(const ua of [iphone,iphone.replace('Version/18.7','CriOS/130.0'),iphone.toLowerCase()]) assert.equal(isIPhone(ua),true);
  for(const ua of ['',null,undefined,{},'Mozilla/5.0 (Linux; Android 16; Pixel 9a)','Mozilla/5.0 (iPad; CPU OS 18_7)','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)']) {
    assert.equal(isIPhone(ua),false);
    assert.equal(iPhoneOrientationNotice({userAgent:ua}),null);
  }
});

test('install advice is device-specific and installed launches suppress it',()=>{
  assert.equal(isAndroid('Mozilla/5.0 (Linux; Android 16; Pixel 9a)'),true);
  assert.equal(isAndroid(iphone),false);
  for(const ua of [null,'iPad','Macintosh','']) assert.equal(isAndroid(ua),false);
  assert.match(installationAdvice({userAgent:iphone}),/共有メニュー.*ホーム画面に追加/);
  assert.equal(installationAdvice({userAgent:iphone,launch:'installed'}),'');
  assert.equal(installationAdvice({userAgent:'Android'}),'');
});
test('launch method uses initial standalone/fullscreen mode, not browser identity',()=>{
  assert.equal(launchMethod(), 'browser');
  assert.equal(launchMethod({standalone:true}),'installed');
  for(const mode of ['standalone','fullscreen','minimal-ui']) assert.equal(launchMethod({displayModes:[mode]}),'installed');
  assert.equal(launchMethod({displayModes:['browser']}),'browser');
});
test('orientation supports exact primary/secondary types and iPhone legacy fallback',()=>{
  for(const type of ['portrait-primary','portrait-secondary','landscape-primary','landscape-secondary']) assert.equal(orientationType({type,legacyAngle:0}),type);
  for(const [legacyAngle,type] of [[0,'portrait-primary'],[90,'landscape-primary'],[-90,'landscape-secondary'],[180,'portrait-secondary'],[270,'landscape-secondary']]) assert.equal(orientationType({legacyAngle}),type);
  assert.equal(orientationType({width:844,height:390}),'landscape');
  assert.equal(orientationType({width:390,height:844}),'portrait');
});
test('rotation hold persists through return until manual restart, including 180 degrees',()=>{
  const guard=createOrientationGuard();
  guard.begin('landscape-primary');
  assert.equal(guard.check('landscape-primary',true),null);
  assert.equal(guard.check('landscape-secondary',true),'changed');
  assert.equal(guard.canResume('landscape-secondary'),false);
  assert.equal(guard.check('portrait-primary',false),'waiting');
  assert.equal(guard.check('landscape-primary',false),'returned');
  assert.equal(guard.canResume('landscape-primary'),true);
  assert.equal(guard.check('landscape-secondary',false),'waiting');
  assert.equal(guard.canResume('landscape-secondary'),false);
  guard.begin('landscape-primary');
  assert.equal(guard.check('landscape-primary',true),null);
  guard.clear();
  assert.equal(guard.canResume('portrait-primary'),true);
});
test('manual pause allows a different orientation without an automatic interruption',()=>{
  const guard=createOrientationGuard();guard.begin('portrait-primary');
  assert.equal(guard.check('landscape-primary',false),null);
  assert.equal(guard.canResume('landscape-primary'),true);
});
test('portrait advice explains the manual lock, while landscape does not promise a landscape lock',()=>{
  const portrait=iPhoneOrientationNotice({userAgent:iphone});
  assert.match(portrait.text,/コントロールセンター/);assert.match(portrait.text,/画面縦向きのロック/);assert.match(portrait.text,/オン/);
  const landscape=iPhoneOrientationNotice({userAgent:iphone,landscape:true});
  assert.match(landscape.text,/縦向き用/);assert.match(landscape.text,/横向き/);assert.match(landscape.text,/開始した向き/);
});

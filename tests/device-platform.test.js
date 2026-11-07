import assert from 'node:assert/strict';
import test from 'node:test';
import { isIPhone, iPhoneOrientationNotice } from '../src/device-platform.js';

const iphone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 Version/18.7 Mobile/15E148 Safari/604.1';
test('iPhone advice detects Safari and other iPhone browsers without matching other devices',()=>{
  for(const ua of [iphone,iphone.replace('Version/18.7','CriOS/130.0'),iphone.toLowerCase()]) assert.equal(isIPhone(ua),true);
  for(const ua of ['',null,undefined,{},'Mozilla/5.0 (Linux; Android 16; Pixel 9a)','Mozilla/5.0 (iPad; CPU OS 18_7)','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)']) {
    assert.equal(isIPhone(ua),false);
    assert.equal(iPhoneOrientationNotice({userAgent:ua}),null);
  }
});
test('portrait advice explains the manual lock, while landscape does not promise a landscape lock',()=>{
  const portrait=iPhoneOrientationNotice({userAgent:iphone});
  assert.match(portrait.text,/コントロールセンター/);assert.match(portrait.text,/画面縦向きのロック/);assert.match(portrait.text,/オン/);
  const landscape=iPhoneOrientationNotice({userAgent:iphone,landscape:true});
  assert.match(landscape.text,/縦向き用/);assert.match(landscape.text,/横向き/);assert.match(landscape.text,/開始した向き/);
});

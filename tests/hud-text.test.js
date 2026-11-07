import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeHudLanguage,hudText,hudTargetLabel,hudHeightDelta,hudDirectionText,hudGroundWarning,hudCockpitWarning,hudStatusLabel,hudObjectiveText,hudCollectedNotice} from '../src/hud-text.js';

test('only explicit Japanese overrides the English default; HUD abbreviations are explicit labels',()=>{
  for(const value of [undefined,null,'en','EN','bad',false,0])assert.equal(normalizeHudLanguage(value),'en');
  assert.equal(normalizeHudLanguage('ja'),'ja');
  for(const [key,en,ja] of [['speed','SPD','速度'],['altitude','ALT','現在高度'],['verticalSpeed','V/S','昇降速度'],['heading','HDG','方位'],['throttle','THR','エンジン出力'],['targetAltitude','TGT ALT','目標'],['flightPath','FPM','進行'],['radarTrack','TRK','進行方向'],['exitOpen','EXIT OPEN','出口開放・黄色と白の門へ'],['flightPathCovered','FPM OBSCURED','進行方向の印は計器の奥です']]){
    assert.equal(hudText('en',key),en);assert.equal(hudText('ja',key),ja);
  }
  assert.equal(hudText('en','missing'),'');
});

test('stage and radar labels translate at the display boundary, including EXIT, without changing records',()=>{
  const state={targetLabel:'光 2',collected:1,total:3,targetLocal:{x:1,y:2,z:-3}};
  const radar={id:'light-3',kind:'light',number:3,label:'光 3',position:{x:1,y:3,z:0}};
  const record={segments:[{target:'光 2',seconds:3.5}],input:{held:false}};
  const before=JSON.stringify({state,radar,record});
  assert.equal(hudTargetLabel(state,'en'),'TGT 2');assert.equal(hudTargetLabel(state,'ja'),'光 2');
  assert.equal(hudTargetLabel(radar,'en'),'TGT 3');assert.equal(hudTargetLabel(radar,'ja'),'光 3');
  assert.equal(hudTargetLabel({targetLabel:'出口',collected:3,total:3},'en'),'EXIT');
  assert.equal(hudTargetLabel({kind:'exit',label:'出口'},'ja'),'出口');
  assert.equal(hudTargetLabel({collected:0,total:3},'en'),'TGT 1');
  for(const input of [null,{}, {number:NaN}, {number:Infinity}, {number:-1}, {targetLabel:'未確認'}])assert.equal(hudTargetLabel(input,'en'),'TGT');
  hudObjectiveText(state,'en');hudCollectedNotice(state,'en');hudDirectionText(state,'en');
  assert.equal(JSON.stringify({state,radar,record}),before);
});

test('signed height uses arrows with finite values, a neutral band, and the existing Japanese phrases',()=>{
  assert.equal(hudHeightDelta(6,'en'),'▲ +6.0m');assert.equal(hudHeightDelta(-6,'en'),'▼ −6.0m');
  assert.equal(hudHeightDelta(11,'en',{digits:0}),'▲ +11m');assert.equal(hudHeightDelta(-.049,'en'),'ALT OK');
  assert.equal(hudHeightDelta(0,'ja'),'高さ同じ');assert.equal(hudHeightDelta(6,'ja'),'▲上に6.0m');
  assert.equal(hudHeightDelta(-6,'ja'),'▼下に6.0m');assert.equal(hudHeightDelta(0,'ja',{equal:'高さOK'}),'高さOK');
  for(const value of [null,undefined,NaN,Infinity,-Infinity,'6'])assert.equal(hudHeightDelta(value,'en'),'—');
  assert.equal(hudHeightDelta(6,'en',{digits:Infinity}),'▲ +6.0m');
});

test('English direction supplements the existing rotating arrow using only height triangles',()=>{
  for(const bearing of [-Math.PI,-2,-.3,0,.3,2,Math.PI]){
    assert.equal(hudDirectionText({bearing,elevation:.5},'en'),'▲');
    assert.equal(hudDirectionText({bearing,elevation:-.5},'en'),'▼');
    assert.equal(hudDirectionText({bearing,elevation:0},'en'),'');
  }
  assert.equal(hudDirectionText({bearing:Math.PI,elevation:.5},'ja',{assisted:true}),'後ろ・上');
  assert.equal(hudDirectionText({bearing:-2,elevation:-.5},'ja'),'左の後ろ・下');
  assert.equal(hudDirectionText({bearing:NaN,elevation:Infinity},'en'),'');
});

test('live warnings and notices use aviation terms while Japanese records and source status text stay unchanged',()=>{
  assert.equal(hudGroundWarning('clear','en'),'');assert.equal(hudGroundWarning('low','en'),'TERRAIN');
  assert.equal(hudGroundWarning('danger','en'),'PULL UP');assert.equal(hudGroundWarning('unknown','en'),'ALT —');
  assert.equal(hudGroundWarning('low','ja'),'低空に注意');
  assert.equal(hudCockpitWarning({}, {level:'clear'},'en'),'NOSE ┼　FPM ⊙');
  assert.equal(hudCockpitWarning({recoveryAssist:1}, {level:'danger'},'en'),'PULL UP / STALL');
  assert.equal(hudCockpitWarning({inputHeld:true}, {level:'clear'},'en'),'INPUT HOLD');
  assert.equal(hudCockpitWarning({grounded:true}, {level:'stopped'},'ja'),'地面に接触・停止');
  const japaneseMotion='上昇中';assert.equal(hudStatusLabel(japaneseMotion,'en'),'CLIMB');assert.equal(japaneseMotion,'上昇中');
  assert.equal(hudStatusLabel(japaneseMotion,'ja'),'上昇中');
  assert.equal(hudObjectiveText({collected:1,total:3},'en'),'TGT 1/3 → EXIT');
  assert.equal(hudObjectiveText({collected:3,total:3},'en'),'EXIT OPEN');
  assert.equal(hudCollectedNotice({collected:1,total:3},'en'),'TGT COLLECTED · 2 REM');
  assert.equal(hudCollectedNotice({collected:3,total:3},'ja'),'3つの光がそろいました。出口へ向かいましょう。');
});

test('Japanese and English HUD copy follows five and eight light totals without changing source labels',()=>{
  for(const total of [5,8]){
    const state={total,collected:total-1,targetLabel:`光 ${total}`},before=JSON.stringify(state);
    assert.equal(hudTargetLabel(state,'en'),`TGT ${total}`);
    assert.equal(hudTargetLabel(state,'ja'),`光 ${total}`);
    assert.equal(hudObjectiveText(state,'ja'),`${total}つの光を集めて、出口へ`);
    assert.equal(hudObjectiveText(state,'en'),`TGT ${total-1}/${total} → EXIT`);
    assert.equal(hudCollectedNotice(state,'ja'),'光を集めました。あと1つ。');
    assert.equal(hudCollectedNotice({...state,collected:total},'ja'),`${total}つの光がそろいました。出口へ向かいましょう。`);
    assert.equal(hudTargetLabel({...state,collected:total,targetLabel:'出口'},'en'),'EXIT');
    assert.equal(JSON.stringify(state),before);
  }
  assert.equal(hudObjectiveText({total:NaN,collected:Infinity},'ja'),'3つの光を集めて、出口へ');
});

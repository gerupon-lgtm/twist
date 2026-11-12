import {test,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import {APP_VERSION} from '../src/version.js';

test('native audio quiets external effects after Mach 1 but keeps vario, events and SCC/FM music',async({page})=>{
 test.setTimeout(90000);await page.goto('/tests/fixtures/music-offline.html');await page.waitForFunction(()=>window.fixtureReady);
 const rows=[];
 for(const rate of [44100,48000])for(const afterburner of [false,true]){
  const row=await page.evaluate(async({rate,afterburner})=>{
   const {flightFeedback}=await import('/src/feedback/model.js');
   async function render(mach,verticalSpeed=0,event=null){
    const context=new OfflineAudioContext(2,rate*2,rate);await context.audioWorklet.addModule('/src/feedback/audio-worklet.js');
    const node=new AudioWorkletNode(context,'twist-audio',{numberOfInputs:0,numberOfOutputs:1,outputChannelCount:[2]});node.connect(context.destination);
    const settings={sound:true,sfx:true,vario:true,speedSound:true,volume:50};let metrics;
    node.port.onmessage=({data})=>{if(data.type==='metrics')metrics=data;};
    node.port.postMessage({type:'state',settings,model:flightFeedback({mode:'flight',speed:340*mach,altitude:1500,groundClearance:1499,throttle:1,verticalSpeed,afterburner:{active:afterburner,burstSeconds:1},supersonic:{mach}},settings)});
    if(event)node.port.postMessage({type:'event',kind:event,settings});node.port.postMessage({type:'poll'});
    for(let i=0;i<200&&!metrics;i++)await new Promise(r=>setTimeout(r,10));if(!metrics?.active)throw Error('state not received');
    const buffer=await context.startRendering(),samples=buffer.getChannelData(0);let squares=0,peak=0,invalid=0;
    for(const sample of samples){if(!Number.isFinite(sample)){invalid++;continue;}squares+=sample*sample;peak=Math.max(peak,Math.abs(sample));}
    node.disconnect();return {rms:Math.sqrt(squares/samples.length),peak,invalid};
   }
   return {rate,afterburner,before:await render(.99),after:await render(1.01),vario:await render(1.01,5),collect:await render(1.01,0,'collect')};
  },{rate,afterburner});rows.push(row);
  expect(row.after.rms).toBeLessThan(row.before.rms*.12);
  expect(row.vario.rms).toBeGreaterThan(row.after.rms*1.5);expect(row.collect.rms).toBeGreaterThan(row.after.rms*1.5);
  for(const key of ['before','after','vario','collect']){expect(row[key].invalid).toBe(0);expect(row[key].peak).toBeLessThan(1);}
 }
 const music=[];
 for(const engine of ['scc','fm']){
  const a=await page.evaluate(options=>window.renderWholeTrack(options),{id:'ignition',engine,rate:48000,flight:true,sfx:false,speed:330,durationSeconds:2});
  const b=await page.evaluate(options=>window.renderWholeTrack(options),{id:'ignition',engine,rate:48000,flight:true,sfx:false,speed:350,durationSeconds:2});
  expect(a.channels[0].rms).toBeGreaterThan(.001);expect(b.channels[0].sha256).toBe(a.channels[0].sha256);music.push({engine,before:a.channels,after:b.channels});
 }
 await writeFile(`.cache/v${APP_VERSION.replaceAll('.','')}-supersonic-quiet-native.json`,JSON.stringify({version:APP_VERSION,rows,music},null,2));
});

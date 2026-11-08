import {test,expect} from '@playwright/test';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {APP_VERSION} from '../src/version.js';
test.use({screenshot:'off'});
const data=JSON.parse(await readFile('public/music/tracks.json','utf8'));
const ids=Object.entries(data).filter(([,track])=>track&&typeof track.file==='string'&&track.file.endsWith('.mid')).map(([id])=>id);

// Offline AudioWorklet computes the complete score at the real sample rate.
// Real-time UI/permission/cancellation and physical listening are separate checks.
for(const engine of ['scc','fm'])for(const rate of [44100,48000])test(`native whole-score ${engine} at ${rate}Hz retains every track`,async({browser})=>{
  test.setTimeout(360000);expect(ids).toHaveLength(16);const results=[];
  try{
    for(const id of ids){
      const context=await browser.newContext({baseURL:'http://localhost:4173',viewport:{width:390,height:844}});
      try{
        const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
        await page.goto('/tests/fixtures/music-offline.html');await page.waitForFunction(()=>window.fixtureReady===true);
        const volume=engine==='fm'?100:25,bgmVolume=engine==='fm'?100:50;
        const row=await page.evaluate(options=>window.renderWholeTrack(options),{id,engine,rate,volume,bgmVolume});results.push({...row,volume,bgmVolume});
        console.log(JSON.stringify({nativeWholeScore:id,engine,rate,seconds:row.duration,renderMs:row.wallMs,peak:Math.max(...row.channels.map(c=>c.peak))}));
        expect(errors).toEqual([]);expect(row.actualRate).toBe(rate);expect(row.scoreNoteOns).toBeGreaterThan(0);
        expect(row.invalid).toBe(0);expect(row.fmNoteOns).toBe(row.expectedFmNotes);expect(row.synth.fallbacks).toEqual([]);
        if(engine==='scc'&&data[id].parts?.[1]?.sccTimbre){
          expect(row.synth.sccTimbre?.id).toBe(data[id].parts[1].sccTimbre);
          expect(row.synth.sccTimbre.transitions).toBeGreaterThan(0);
          expect(row.synth.sccTimbre.mode).toBe('original');
        }else expect(row.synth.sccTimbre).toBeUndefined();
        expect(row.preparation.time).toBe(0);expect(row.preparation.metrics.musicSchedule.pending).toBeGreaterThan(0);
        expect(row.metrics).not.toBeNull();
        expect(row.metrics.fm.overflows).toBe(0);expect(row.metrics.fm.invalidEvents).toBe(0);
        expect(row.metrics.fm.noteOns).toBe(row.fmNoteOns);expect(row.metrics.fm.activeVoices).toBe(0);
        expect(row.metrics.fm.releasingVoices).toBe(0);expect(row.metrics.fm.pending).toBe(0);
        expect(row.metrics.fm.maximumVoices).toBeLessThanOrEqual(row.synth.requiredVoices);
        if(row.expectedFmNotes>0)expect(row.metrics.fm.prePostPeak).toBeGreaterThan(0);
        for(const channel of row.channels){expect(channel.peak).toBeGreaterThan(.00001);expect(channel.peak).toBeLessThanOrEqual(1);expect(channel.fullScale).toBe(0);expect(channel.tailPeak).toBeLessThan(.0001);}
      }finally{await context.close();}
    }
  }finally{
    await mkdir('.cache',{recursive:true});await writeFile(`.cache/v${APP_VERSION.replaceAll('.','')}-native-whole-${engine}-${rate}.json`,JSON.stringify({engine,rate,expectedIds:ids,results,complete:results.length===ids.length},null,2));
  }
});

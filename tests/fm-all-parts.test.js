import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateTrack,prepareScore} from '../src/music/score.js';
import {createMusicSynth} from '../src/music/music-synth.js';
import {FM_PRESETS,fmPartStatus} from '../src/music/fm-presets.js';
const config=JSON.parse(await readFile(new URL('../public/music/tracks.json',import.meta.url),'utf8'));
test('FM mode routes every non-drum note of all sixteen songs to FM, including the bass',async()=>{
  for(const id of config.catalog.preview){
    const track=validateTrack(config[id]),score=prepareScore(await readFile(new URL('../public/music/'+track.file,import.meta.url)),track);
    const fm=[],scc=[],synth=createMusicSynth({track,trackId:id,score,engine:'fm',clock:{sampleRate:48000,event:e=>fm.push(e)},scc:{handle:e=>scc.push(e),resetControllers(){},allNotesOff(){}}});
    for(const e of score.events)synth.handle(e);
    const notes=events=>events.filter(e=>e.type==='noteOn'&&e.velocity>0);
    assert.equal(notes(scc).filter(e=>e.channel!==9).length,0,id+' melodic SCC note leak');
    assert.equal(notes(fm.filter(e=>e.kind==='fm').map(e=>e.event)).length,notes(score.events).filter(e=>e.channel!==9).length,id+' all melodic notes');
    assert.equal(notes(scc).length,notes(score.events).filter(e=>e.channel===9).length,id+' drums unchanged');
    assert.deepEqual(synth.snapshot().fallbacks,[],id);
  }
});
test('bass has a dedicated FM voice and authored guitar leads use the distortion preset',()=>{
  assert.equal(fmPartStatus({role:'bass',fmPreset:null}).preset,'bass');
  assert.ok(FM_PRESETS['distortion-guitar']);
  const guitars=config.catalog.preview.filter(id=>config[id].parts['1']?.sccTimbre==='distortion-guitar-v1');assert.equal(guitars.length,6);
  for(const id of guitars)assert.equal(fmPartStatus(config[id].parts['1']).preset,'distortion-guitar',id);
});

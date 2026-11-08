import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {generateMusic,generatedTracks} from '../tools/generate-music.mjs';
import {parseSmf} from '../src/vendor/scc/midi/smf.js';
import {flightTrackSets,trackForFlight} from '../src/music/playlist.js';
import {createMusicPlayer} from '../src/music/player.js';
const files=generateMusic(),config=generatedTracks();
test('the four preceding compositions remain byte-for-byte reproducible',()=>{
  const hashes={flight:'dea1e94bb504968a84630f5aed6a2d8b216e0673eb7128e0fa641908552810ad',flight2:'571ab6d1d3431b72125b377261c191409bb58c5f314f17c6b8518f2b65ce19b1',clear:'55e66ba5786464bafac92dd33c0b0b0b1fc06f7845f161f81a165689f3cba4a2','flight-legacy':'483c0cb83048fe680fa80db340fb8bd033b7ae1d3a8fbcb708e70b005ed842f3'};
  for(const [id,hash]of Object.entries(hashes))assert.equal(createHash('sha256').update(files[id]).digest('hex'),hash,id);
});
test('new E-minor brave track drives all 48 bars, uses note envelopes and stays within five SCC voices',()=>{
  const song=parseSmf(files.brave),barSeconds=Math.round(60000000/170)/1e6*4;
  assert.ok(Math.abs(song.duration-67.764672)<1e-7);assert.equal(song.duration,config.brave.loop.end);
  const active=new Set();let max=0;
  for(const e of song.events){if(e.channel===9)continue;const key=e.channel+':'+e.note;if(e.type==='noteOn')active.add(key);if(e.type==='noteOff')active.delete(key);max=Math.max(max,active.size);}
  assert.equal(max,5);
  for(let bar=0;bar<48;bar++) {
    const notes=song.events.filter(e=>e.type==='noteOn'&&e.time>=bar*barSeconds-1e-7&&e.time<(bar+1)*barSeconds-1e-7);
    assert.equal(notes.filter(e=>e.channel===3).length,16);assert.ok(notes.some(e=>e.channel===0));assert.ok(notes.filter(e=>e.channel===9).length>=22);
  }
  assert.ok(song.events.some(e=>e.type==='cc'&&e.controller===7&&e.value<100));
  assert.ok(song.events.some(e=>e.type==='noteOn'&&e.channel===0&&e.note===67)); // E-minor third, G.
});
test('optional sets preserve old configs, validate entries and select each new alternative by leg',()=>{
  assert.deepEqual(flightTrackSets({flight:{}}),{current:['flight']});
  const sets=flightTrackSets(config);assert.deepEqual(sets.brave,['brave']);assert.deepEqual([1,2,3,4,5,6,7,8,9,10,11].map(n=>trackForFlight(sets.all,n)),['flight','flight2','brave','rock','steel','horizon','storm','ignition','advance','overdrive','flight']);
  assert.deepEqual(flightTrackSets({...config,flightPlaylist:['comparison']}).current,['comparison']);
  for(const value of [[],null,{brave:['missing']},{other:['flight']}])assert.throws(()=>flightTrackSets({...config,flightSets:value}));
});
test('group switching stops the former song and a missing brave file falls back to existing songs',async t=>{
  for(const missing of [false,true]){
    const audio={stopMusic(){},setMusicGain(){},configure(){},waitForReady:async()=>true,resume:async()=>{},suspendIfIdle(){},musicClock:{now:()=>0,setScheduleTime(){},write(){}}};
    const fetchFile=async url=>String(url).includes('tracks.json')?{ok:true,json:async()=>config}:{ok:!missing||!String(url).includes('brave.mid'),arrayBuffer:async()=>files[new URL(url).pathname.split('/').pop().replace('.mid','')]};
    const p=createMusicPlayer(audio,{fetchFile,base:new URL('https://example.test/music/')});t.after(()=>p.stop());
    p.setSettings({sound:true,bgm:true,musicSet:'current'});await p.play('flight');assert.equal(p.snapshot().trackId,'flight');
    p.setSettings({sound:true,bgm:true,musicSet:'brave'});assert.equal(p.snapshot().playing,false);await p.play('flight');assert.equal(p.snapshot().trackId,missing?'flight':'brave');
  }
});

import test from 'node:test';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {readFile} from 'node:fs/promises';
import {generateMusic,generatedTracks} from '../tools/generate-music.mjs';import {parseSmf} from '../src/vendor/scc/midi/smf.js';
const files=generateMusic(),config=generatedTracks();
test('rock addition keeps all five preceding generated MIDI files byte-for-byte',async()=>{
 const hashes=JSON.parse(await readFile(new URL('./fixtures/music-v0122-sha256.json',import.meta.url)));
 for(const [id,hash]of Object.entries(hashes))assert.equal(createHash('sha256').update(files[id]).digest('hex'),hash,id);
});
test('rock lead is sparser, expressive, 156 BPM and 73.84608 seconds within five SCC voices',()=>{
 const score=parseSmf(files.rock),brave=parseSmf(files.brave),notes=s=>s.events.filter(e=>e.type==='noteOn');
 assert.ok(Math.abs(score.duration-73.84608)<1e-7);assert.equal(score.duration,config.rock.loop.end);
 assert.ok(notes(score).filter(e=>e.channel===0).length<notes(brave).filter(e=>e.channel===0).length*.85);
 assert.equal(notes(score).filter(e=>e.channel===3).length,48*8);
 assert.ok(score.events.some(e=>e.type.toLowerCase().includes('bend')));
 const active=new Set();let peak=0;for(const e of score.events){if(e.channel===9)continue;const key=e.channel+':'+e.note;if(e.type==='noteOn')active.add(key);if(e.type==='noteOff')active.delete(key);peak=Math.max(peak,active.size);}assert.equal(peak,5);
});

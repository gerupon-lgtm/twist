import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,readdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,sep} from 'node:path';
import {createHash} from 'node:crypto';
import {parseSmf} from '../src/vendor/scc/midi/smf.js';
import {CLEAR_JINGLES,generateClearJingles,generatedClearTracks,PROTECTED_MIDI_FILES} from '../tools/clear-jingles.mjs';
import {checkClearJingles,writeClearJingles} from '../tools/generate-clear-jingles.mjs';

const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const ids=['clear-ignition','clear-advance','clear-overdrive'];
const baseline={
 'rock.mid':'09d4e38b877b891eaa5548d7c7de265b21776d8fd1870f0ee00a8ae323cd201c',
 'brave.mid':'c0d9c7154868510d703884beeb80d9ce701795c51051cc3151977f25ded5b7f6',
 'flight.mid':'dea1e94bb504968a84630f5aed6a2d8b216e0673eb7128e0fa641908552810ad',
 'flight2.mid':'571ab6d1d3431b72125b377261c191409bb58c5f314f17c6b8518f2b65ce19b1',
 'steel.mid':'17f21d2aa0134aadbacd29802a20ba5c7c74ea6c65528ea54cd129d1e98f5e63',
 'horizon.mid':'46f42efb7f43694c48a2b939f70691c27a81d3455bf1c6f3c6363570b1fd305f',
 'storm.mid':'e842f44ac3d0c3d71bc1c8ef6d1155379f51f2fd495a0e72a7fe019402451a22',
 'ignition.mid':'24278c137bab189d01a0fe55d82379ff47634f30b85502bd8ebf1bee79c20c60',
 'advance.mid':'89020bfacefae0e94182931dc6747691dba2a339b85494fa6d0e81512e69cc29',
 'overdrive.mid':'5a9d73ad7113fc79b0453326c7d6ac4ae63b381864d912171e1ecdd7be34ac69',
 'afterburner.mid':'8da876bdc0741f92a8cb92a634378207f460100d85a79802383069ec2542b8e6',
 'clear.mid':'55e66ba5786464bafac92dd33c0b0b0b1fc06f7845f161f81a165689f3cba4a2',
 'flight-legacy.mid':'483c0cb83048fe680fa80db340fb8bd033b7ae1d3a8fbcb708e70b005ed842f3',
};
function noteAudit(song){
 const active=new Map();let peakMelodic=0,peakDrums=0,lastOff=0,ons=0,offs=0;
 for(const event of song.events){
  if(!['noteOn','noteOff'].includes(event.type))continue;
  const key=event.channel+':'+event.note;
  if(event.type==='noteOn'){ons++;active.set(key,(active.get(key)??0)+1);}
  else{offs++;assert.ok(active.get(key)>0,'unmatched noteOff '+key);const count=active.get(key)-1;if(count)active.set(key,count);else active.delete(key);lastOff=Math.max(lastOff,event.time);}
  peakMelodic=Math.max(peakMelodic,[...active].filter(([key])=>!key.startsWith('9:')).reduce((sum,[,n])=>sum+n,0));
  peakDrums=Math.max(peakDrums,[...active].filter(([key])=>key.startsWith('9:')).reduce((sum,[,n])=>sum+n,0));
 }
 assert.equal(active.size,0,'MIDI must end with paired noteOff, not just all-notes-off');assert.equal(ons,offs);
 return {ons,offs,peakMelodic,peakDrums,lastOff};
}

test('three independently authored two-bar themes have distinct sparse lead shapes and reproducible bytes',()=>{
 assert.deepEqual(CLEAR_JINGLES.map(song=>song.id),ids);
 const first=generateClearJingles(),again=generateClearJingles();assert.deepEqual(Object.keys(first),ids);
 const signatures=[];
 for(const song of CLEAR_JINGLES){
  assert.equal(song.beats,8);assert.ok(song.notes.filter(note=>note.channel===1).length<=7);
  signatures.push(JSON.stringify(song.notes.filter(note=>note.channel===1).map(note=>[note.beat,note.pitch,note.length])));
  assert.equal(hash(first[song.id]),hash(again[song.id]));assert.ok(Object.isFrozen(song));
 }
 assert.equal(new Set(signatures).size,3);assert.equal(new Set(Object.values(first).map(hash)).size,3);
});

test('new SMFs retain exact eight-beat cleanup, paired notes, four melodic voices and audible release room',()=>{
 const files=generateClearJingles();
 for(const composition of CLEAR_JINGLES){
  const song=parseSmf(files[composition.id]),audit=noteAudit(song),beatSeconds=Math.round(60e6/composition.bpm)/1e6;
  assert.equal(song.format,1);assert.equal(song.division,480);assert.equal(song.title,composition.midiTitle);
  assert.ok(Math.abs(song.duration-8*beatSeconds)<1e-9);assert.ok(song.duration>2.7&&song.duration<3.4);
  assert.ok(audit.peakMelodic<=4);assert.ok(audit.peakDrums<=2);assert.ok(song.duration-audit.lastOff>=.2,'room beyond the agreed .1-second FM release');
  for(const channel of [0,1,2,3,9])assert.ok(song.events.some(event=>event.type==='cc'&&event.channel===channel&&event.controller===123&&Math.abs(event.time-song.duration)<1e-9));
 }
});

test('new metadata uses explicit lead/chords presets and leaves bass and drums outside FM',()=>{
 const tracks=generatedClearTracks();assert.deepEqual(Object.keys(tracks),ids);
 for(const [id,track]of Object.entries(tracks)){
  assert.equal(track.file,id+'.mid');assert.equal(track.loop,undefined);
  assert.deepEqual(Object.fromEntries(Object.entries(track.parts).map(([ch,part])=>[ch,[part.role,part.fmPreset]])),{
   1:['lead','lead'],2:['chords','chords'],3:['bass','bass'],4:['chords','chords'],10:['drums',null],
  });
 }
});

test('published33 preserves the thirteen originals while only the six authorized current leads may change',async()=>{
 assert.deepEqual([...PROTECTED_MIDI_FILES].sort(),Object.keys(baseline).sort());
 const arranged=new Set(['rock.mid','steel.mid','horizon.mid','storm.mid','ignition.mid','overdrive.mid']);
 for(const [file,expected]of Object.entries(baseline)){
  assert.equal(hash(await readFile(new URL('../public/versions/0.1.33/music/'+file,import.meta.url))),expected,'published33 '+file);
  if(!arranged.has(file))assert.equal(hash(await readFile(new URL('../public/music/'+file,import.meta.url))),expected,'current untouched '+file);
 }
 for(const id of ids)assert.equal(hash(await readFile(new URL('../public/music/'+id+'.mid',import.meta.url))),hash(await readFile(new URL('../public/versions/0.1.33/music/'+id+'.mid',import.meta.url))),id);
});

test('dedicated writer touches only three allowlisted filenames and check never repairs an edited file',async()=>{
 const tempRoot=resolve(tmpdir()),directory=await mkdtemp(join(tempRoot,'twist-clear-jingles-'));
 try{
  for(const [i,file]of PROTECTED_MIDI_FILES.entries())await writeFile(join(directory,file),Buffer.from('untouched-'+i));
  const before=await Promise.all(PROTECTED_MIDI_FILES.map(async file=>[file,hash(await readFile(join(directory,file)))]));
  const written=await writeClearJingles(directory);assert.equal(written.protectedUnchanged,true);assert.equal(written.files.length,3);
  assert.equal((await checkClearJingles(directory)).matches,true);
  const edited=join(directory,'clear-ignition.mid'),bytes=await readFile(edited);bytes[bytes.length-1]^=1;await writeFile(edited,bytes);
  const checked=await checkClearJingles(directory);assert.equal(checked.matches,false);assert.equal(hash(await readFile(edited)),hash(bytes));
  for(const [file,expected]of before)assert.equal(hash(await readFile(join(directory,file))),expected,file);
  assert.equal((await readdir(directory)).length,16);
 }finally{
  const target=resolve(directory);assert.ok(target.startsWith(tempRoot+sep)&&target.split(sep).at(-1).startsWith('twist-clear-jingles-'));
  await rm(target,{recursive:true,force:true});
 }
});

test('all sixteen public files have complete role mappings and balanced actual note data',async()=>{
 const config=JSON.parse(await readFile(new URL('../public/music/tracks.json',import.meta.url),'utf8'));
 const entries=Object.entries(config).filter(([,track])=>track?.file);assert.equal(entries.length,16);
 for(const [id,track]of entries){
  const song=parseSmf(await readFile(new URL('../public/music/'+track.file,import.meta.url)));const audit=noteAudit(song);assert.ok(audit.ons>0,id);assert.ok(audit.peakMelodic<=5,id);
  for(const event of song.events.filter(event=>event.type==='noteOn')){
   const part=track.parts[event.channel+1];assert.ok(part,id+' channel '+(event.channel+1));
   assert.ok(['lead','chords','bass','drums'].includes(part.role));assert.equal(part.fmPreset,['overdrive','ignition'].includes(id)&&event.channel===0?'minimoog-lead':id==='overdrive'&&event.channel===1?'pipe-organ':part.role==='drums'?null:part.sccTimbre==='distortion-guitar-v1'?'distortion-guitar':part.role);
   assert.equal(part.role==='drums',event.channel===9);
  }
 }
});

test('catalog separates adopted seven from sixteen individual previews and preserves the clear/AB/comparison purposes',async()=>{
 const config=JSON.parse(await readFile(new URL('../public/music/tracks.json',import.meta.url),'utf8'));
 assert.deepEqual(config.catalog.flight,['rock','steel','horizon','storm','ignition','advance','overdrive']);
 assert.deepEqual(config.catalog.clear,['clear',...ids]);assert.equal(config.catalog.afterburner,'afterburner');assert.equal(config.catalog.comparison,'comparison');
 assert.equal(config.catalog.preview.length,16);assert.equal(new Set(config.catalog.preview).size,16);
 assert.deepEqual([...config.catalog.preview].sort(),Object.entries(config).filter(([,track])=>track?.file).map(([id])=>id).sort());
 assert.deepEqual(config.flightPlaylist,['flight','flight2']);assert.deepEqual(config.flightSets.newrock,['steel','horizon','storm']);assert.deepEqual(config.flightSets.proposals,['ignition','advance','overdrive']);
});

test('role augmentation preserves every legacy field and uses the actual song-specific bass channels',async()=>{
 const config=JSON.parse(await readFile(new URL('../public/music/tracks.json',import.meta.url),'utf8'));
 for(const id of ['flight','flight2','brave','rock','steel','horizon','storm','ignition','advance','overdrive'])assert.deepEqual(Object.entries(config[id].parts).filter(([,part])=>part.role==='bass').map(([channel])=>channel),['4']);
 for(const id of ['clear','comparison'])assert.deepEqual(Object.entries(config[id].parts).filter(([,part])=>part.role==='bass').map(([channel])=>channel),['3']);
 assert.equal(config.clear.parts[4].role,'lead');assert.equal(config['clear-ignition'].parts[4].role,'chords');
 delete config.catalog;for(const id of ids)delete config[id];
 const guitarIds=new Set(['rock','steel','horizon','storm','ignition','overdrive']);
 for(const [id,track]of Object.entries(config).filter(([,track])=>track?.file))for(const [channel,part]of Object.entries(track.parts)){
  if(part.sccTimbre!==undefined){assert.ok(guitarIds.has(id)&&channel==='1');assert.equal(part.sccTimbre,'distortion-guitar-v1');delete part.sccTimbre;}
  if(part.fmVolume!==undefined){assert.equal(id,'overdrive');assert.equal(channel,'2');assert.equal(part.fmVolume,90);delete part.fmVolume;}
  if(part.fmTranspose!==undefined){assert.equal(id,'overdrive');assert.equal(channel,'1');assert.equal(part.fmTranspose,-12);delete part.fmTranspose;}
  delete part.role;delete part.fmPreset;
 }
 assert.equal(hash(JSON.stringify(config)),'dc574a85d916ee3684a0e62a39cee3690bde97306bdbb495bdcb3bebb3833c66');
});

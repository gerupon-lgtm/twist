import test from 'node:test';
import assert from 'node:assert/strict';
import { generateMusic,generatedTracks } from '../tools/generate-music.mjs';
import { parseSmf } from '../src/vendor/scc/midi/smf.js';
import { flightTrackOrder,trackForFlight } from '../src/music/playlist.js';
import { createMusicPlayer } from '../src/music/player.js';
const files=generateMusic(),config=generatedTracks();

test('both original hard tracks last 60-90 seconds, use 150-170 BPM and no more than five SCC voices',()=>{
  for(const [id,bpm]of [['flight',160],['flight2',168]]) {
    const bytes=files[id],song=parseSmf(bytes);
    assert.ok(song.duration>=60&&song.duration<=90);
    const tempo=Buffer.from([255,81,3,...[16,8,0].map(shift=>(Math.round(60000000/bpm)>>shift)&255)]);
    assert.ok(bytes.includes(tempo));
    assert.ok(Math.abs(song.duration-config[id].loop.end)<.000001);
    let peak=0;const active=new Set(),channels=new Set();
    for(const e of song.events) {
      if(e.type==='noteOn')channels.add(e.channel);
      if(e.channel===9)continue;
      const key=e.channel+':'+e.note;
      if(e.type==='noteOn')active.add(key);if(e.type==='noteOff')active.delete(key);peak=Math.max(peak,active.size);
    }
    assert.ok(peak<=5&&peak===5);assert.deepEqual([...channels].sort((a,b)=>a-b),[0,1,2,3,4,9]);
  }
  assert.notEqual(Buffer.compare(files.flight,files.flight2),0);
  assert.ok(parseSmf(files.clear).duration<=4);
});
test('sections change melodic rhythm and drum density, with a quiet break and boundary fills',()=>{
  const song=parseSmf(files.flight),barSeconds=1.5;
  const noteOns=song.events.filter(e=>e.type==='noteOn');
  const count=(channel,from,to)=>noteOns.filter(e=>e.channel===channel&&e.time>=from*barSeconds&&e.time<to*barSeconds).length;
  assert.ok(count(0,24,40)/16>=count(0,40,48)/8*2);
  assert.ok(count(9,24,25)>count(9,4,5));
  assert.ok(count(9,15,16)>count(9,14,15));
  const rhythms=new Set(Array.from({length:12},(_,i)=>noteOns.filter(e=>e.channel===0&&e.time>=(i+4)*barSeconds&&e.time<(i+5)*barSeconds).map(e=>(e.time/barSeconds-i-4).toFixed(3)).join(',')));
  assert.ok(rhythms.size>=4);
});
test('playlist is backward compatible and chooses by flight leg, never by pause count',()=>{
  assert.deepEqual(flightTrackOrder({flight:{}}),['flight']);
  const order=flightTrackOrder(config);assert.deepEqual([1,1,2,2,3].map(n=>trackForFlight(order,n)),['flight','flight','flight2','flight2','flight']);
  for(const n of [0,-2,NaN,Infinity])assert.equal(trackForFlight(order,n),'flight');
  assert.equal(trackForFlight([],1),null);
  for(const value of [[],['clear'],['missing'],['../flight'],'flight'])assert.throws(()=>flightTrackOrder({...config,flightPlaylist:value}));
});
function setup(missing){
  const audio={stopMusic(){},setMusicGain(){},configure(){},waitForReady:async()=>true,resume:async()=>{},suspendIfIdle(){},musicClock:{now:()=>0,setScheduleTime(){},write(){}}};
  const fetchFile=async url=>{
    if(String(url).includes('tracks.json'))return{ok:true,json:async()=>config};
    const id=new URL(url).pathname.split('/').pop().replace('.mid','');
    return {ok:id!==missing,arrayBuffer:async()=>files[id]};
  };
  const player=createMusicPlayer(audio,{fetchFile,base:new URL('https://example.test/music/')});player.setSettings({sound:true,bgm:true,sfx:true});return player;
}
test('player alternates the selected track at leg boundaries and records both played names',async t=>{
  const player=setup();t.after(()=>player.stop());
  for(const [leg,title]of [[1,config.flight.title],[1,config.flight.title],[2,config.flight2.title],[3,config.flight.title]]) {
    player.stop();player.setFlightNumber(leg);assert.equal(await player.play('flight'),'played');assert.equal(player.snapshot().track,title);
  }
  assert.deepEqual(player.snapshot().playedTracks,[config.flight.title,config.flight2.title]);
});
test('missing alternate leaves the usable flight and goal songs available',async t=>{
  const player=setup('flight2');t.after(()=>player.stop());player.setFlightNumber(2);
  assert.equal(await player.play('flight'),'played');assert.equal(player.snapshot().track,config.flight.title);
  assert.equal(await player.play('clear'),'played');assert.equal(player.snapshot().track,config.clear.title);
});

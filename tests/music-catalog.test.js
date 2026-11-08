import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as catalogApi from '../src/music/catalog.js';
const {createMusicCatalog,resolveFlightRequest}=catalogApi;

function config(){
  const flight=['rock','steel','horizon','storm','ignition','advance','overdrive'];
  const clear=['clear','clear-ignition','clear-advance','clear-overdrive'];
  const preview=['flight','flight2','brave',...flight,...clear,'afterburner','comparison'];
  return {catalog:{flight,preview,clear,afterburner:'afterburner',comparison:'comparison'},
    flightPlaylist:['flight','flight2'],flightSets:{newrock:['steel','horizon','storm'],proposals:['ignition','advance','overdrive'],all:preview.slice(0,10)},
    ...Object.fromEntries(preview.map(id=>[id,{file:id+'.mid',title:'title '+id,parts:{1:{waveform:0,volume:80,role:'lead',fmPreset:'fm-lead'}}}]))};
}
test('roles retain every individual preview and old collection order without allowing them into game flight',()=>{
  const data=config(),before=JSON.stringify(data),catalog=createMusicCatalog(data);
  assert.deepEqual(catalog.flightIds,['rock','steel','horizon','storm','ignition','advance','overdrive']);
  assert.equal(catalog.previewIds.length,16);assert.equal(catalog.preloadIds.length,16);
  assert.deepEqual(catalog.clearIds,['clear','clear-ignition','clear-advance','clear-overdrive']);
  assert.equal(catalog.afterburnerId,'afterburner');assert.equal(catalog.comparisonId,'comparison');
  assert.deepEqual(resolveFlightRequest('current',catalog),catalog.flightIds);
  assert.deepEqual(resolveFlightRequest('all',catalog),catalog.flightIds);
  assert.deepEqual(resolveFlightRequest('proposals',catalog),['ignition','advance','overdrive']);
  for(const id of ['flight','flight2','brave','clear-advance','afterburner','comparison'])assert.deepEqual(resolveFlightRequest(id,catalog),catalog.flightIds,id);
  assert.equal(catalog.byId.rock.parts[1].fmPreset,'fm-lead');assert.equal(JSON.stringify(data),before);
});

test('old custom configurations have an explicit adapter and never promote an undeclared song into flight',()=>{
  assert.equal(typeof catalogApi.createLegacyMusicCatalog,'function');
  const original={flight:{file:'flight.mid',title:'Old authored song',parts:{}},clear:{file:'clear.mid',title:'Old clear',parts:{}},other:{file:'other.mid',title:'Other preview',parts:{}}};
  const catalog=catalogApi.createLegacyMusicCatalog(original);
  assert.equal(catalog.legacy,true);assert.deepEqual(catalog.flightIds,['flight']);assert.deepEqual(resolveFlightRequest('other',catalog),['flight']);
  assert.ok(catalog.previewIds.includes('other'));assert.throws(()=>createMusicCatalog(original),/catalog roles/i);
});

test('URL preview suggestions cannot replace a saved flight request, including clear, AB and comparison',()=>{
  const catalog=createMusicCatalog(config());
  for(const id of ['flight','flight2','brave','clear','clear-advance','afterburner','comparison'])assert.deepEqual(catalogApi.resolveMusicQuery(new URLSearchParams({music:id}),catalog),{flightRequest:null,previewRequest:id,previewOnly:true});
  assert.deepEqual(catalogApi.resolveMusicQuery(new URLSearchParams({music:'rock'}),catalog),{flightRequest:'rock',previewRequest:'rock',previewOnly:false});
  assert.deepEqual(catalogApi.resolveMusicQuery(new URLSearchParams({music:'proposals'}),catalog),{flightRequest:'proposals',previewRequest:'ignition',previewOnly:false});
  for(const music of ['../rock.mid','https://example.com/x.mid','__proto__','unknown'])assert.deepEqual(catalogApi.resolveMusicQuery(new URLSearchParams({music}),catalog),{flightRequest:null,previewRequest:null,previewOnly:false});
});

test('every preview is exact and an old collection only chooses its initial individual song',()=>{
  const catalog=createMusicCatalog(config());
  for(const id of catalog.previewIds)assert.equal(catalogApi.resolvePreviewRequest(id,catalog),id);
  assert.equal(catalogApi.resolvePreviewRequest('current',catalog),'flight');assert.equal(catalogApi.resolvePreviewRequest('proposals',catalog),'ignition');
  assert.equal(catalogApi.resolvePreviewRequest('unknown',catalog,{fallback:'clear-advance'}),'clear-advance');
  assert.equal(catalogApi.resolvePreviewRequest({},catalog),'rock');
  assert.equal(catalogApi.resolveFlightSelection('current',catalog).fallbackReason,'preview-only');
  assert.equal(catalogApi.resolveFlightSelection('all',catalog).fallbackReason,'filtered-legacy');
  const mutable=catalogApi.resolveFlightRequest('rock',catalog);mutable[0]='brave';assert.equal(catalog.flightIds[0],'rock');
});

test('malformed declarations, missing songs and remote files fail instead of widening flight permission',()=>{
  for(const mutate of [data=>delete data.catalog,data=>{data.catalog=null;},data=>data.catalog.flight.push('rock'),data=>delete data.rock,
    data=>{data.rock.file='../rock.mid';},data=>{data.rock.file='https://example.com/rock.mid';},data=>data.catalog.flight.push('clear'),data=>data.catalog.preview.pop()]){
    const data=config();mutate(data);assert.throws(()=>createMusicCatalog(data));
  }
  assert.throws(()=>catalogApi.createLegacyMusicCatalog({...config(),catalog:null}));
});

test('authored production metadata declares seven game tracks and all sixteen individual previews',()=>{
  const data=JSON.parse(readFileSync(new URL('../public/music/tracks.json',import.meta.url),'utf8')),catalog=createMusicCatalog(data);
  assert.deepEqual(catalog.flightIds,['rock','steel','horizon','storm','ignition','advance','overdrive']);
  assert.equal(catalog.previewIds.length,16);assert.equal(new Set(catalog.preloadIds).size,16);
  assert.deepEqual(catalog.clearIds,['clear','clear-ignition','clear-advance','clear-overdrive']);
  for(const id of ['flight','flight2','brave'])assert.ok(!catalog.flightIds.includes(id)&&catalog.previewIds.includes(id));
});

test('catalog path checks retain old relative Unicode and nested MID files while refusing unsafe paths',()=>{
  for(const file of ['日本語.mid','clips/日本語.mid','sub/flying-track.mid']){
    const data=config();data.rock.file=file;assert.equal(createMusicCatalog(data).byId.rock.file,file);
    const legacy={flight:{file,parts:{}}};assert.equal(catalogApi.createLegacyMusicCatalog(legacy).byId.flight.file,file);
  }
  for(const file of ['../x.mid','sub/../x.mid','/x.mid','https://example.com/x.mid','x.mid?raw=1','x.mid#tag','sub\\x.mid','x.midi']){
    const data=config();data.rock.file=file;assert.throws(()=>createMusicCatalog(data),file);
  }
});

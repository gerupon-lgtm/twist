const validId=value=>typeof value==='string'&&/^[a-z][a-z0-9_-]{0,47}$/i.test(value);
function ids(value,name){
  if(!Array.isArray(value)||!value.length||value.length>32||value.some(id=>!validId(id))||new Set(value).size!==value.length)throw new TypeError(`Invalid music ${name}`);
  return [...value];
}
function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
function tracksById(config,names){
  const result=Object.create(null);
  for(const id of names){
    const track=Object.hasOwn(config,id)?config[id]:null;
    // Keep the same relative MID path boundary as validateTrack, including
    // existing Unicode names and subdirectories. Player also checks the URL base.
    if(!track||typeof track.file!=='string'||!track.file.endsWith('.mid')||/[:?#\\]/.test(track.file)||track.file.startsWith('/')||track.file.split('/').includes('..'))throw new TypeError(`Invalid catalog track: ${id}`);
    result[id]=structuredClone({...track,title:typeof track.title==='string'?track.title:track.file});
  }
  return result;
}

/** Roles come only from the authored catalog; no DOM, audio or storage is used. */
export function createMusicCatalog(config){
  if(!config?.catalog||typeof config.catalog!=='object')throw new TypeError('Music catalog roles required');
  const roles=config.catalog,flightIds=ids(roles.flight,'flight'),previewIds=ids(roles.preview,'preview'),clearIds=ids(roles.clear,'clear');
  const afterburnerId=roles.afterburner,comparisonId=roles.comparison;
  if(!validId(afterburnerId)||!validId(comparisonId)||afterburnerId===comparisonId)throw new TypeError('Invalid special music roles');
  const nonFlight=[...clearIds,afterburnerId,comparisonId];
  if(new Set(nonFlight).size!==nonFlight.length||flightIds.some(id=>nonFlight.includes(id)))throw new TypeError('Music roles overlap');
  const preloadIds=[...new Set([...previewIds,...flightIds,...nonFlight])];
  if(preloadIds.some(id=>!previewIds.includes(id)))throw new TypeError('Every music role needs an individual preview');
  const byId=tracksById(config,preloadIds);
  for(const [id,track]of Object.entries(config))if(track&&typeof track==='object'&&typeof track.file==='string'&&!previewIds.includes(id))throw new TypeError(`Track has no preview role: ${id}`);
  const legacySets=Object.create(null);
  const original={...(config.flightPlaylist?{current:config.flightPlaylist}:{}),...(config.flightSets??{})};
  for(const [name,list]of Object.entries(original)){
    if(!validId(name))throw new TypeError('Invalid legacy music set');
    legacySets[name]=ids(list,'legacy set');
    if(legacySets[name].some(id=>!Object.hasOwn(byId,id)))throw new TypeError('Unknown legacy music track');
  }
  return freeze({byId,flightIds,previewIds,clearIds,afterburnerId,comparisonId,preloadIds,legacySets,legacy:false});
}

/** Explicit compatibility for old authored configs without a catalog field. */
export function createLegacyMusicCatalog(config){
  if(!config||typeof config!=='object'||Object.hasOwn(config,'catalog'))throw new TypeError('Legacy music config without catalog required');
  const legacySets=Object.create(null);
  for(const [name,list]of Object.entries({...config.flightSets,current:config.flightPlaylist??['flight']})){
    if(!validId(name))throw new TypeError('Invalid legacy music set');legacySets[name]=ids(list,'legacy set');
  }
  const flightIds=[...new Set(Object.values(legacySets).flat())];
  const previewIds=Object.entries(config).filter(([,track])=>track&&typeof track==='object'&&typeof track.file==='string').map(([id])=>id);
  if(previewIds.some(id=>!validId(id))||flightIds.some(id=>!previewIds.includes(id)))throw new TypeError('Unknown legacy music track');
  const byId=tracksById(config,previewIds),clearIds=Object.hasOwn(byId,'clear')?['clear']:[],afterburnerId=Object.hasOwn(byId,'afterburner')?'afterburner':null,comparisonId=Object.hasOwn(byId,'comparison')?'comparison':null;
  if(flightIds.some(id=>clearIds.includes(id)||id===afterburnerId||id===comparisonId))throw new TypeError('Legacy flight contains a special track');
  return freeze({byId,flightIds,previewIds,clearIds,afterburnerId,comparisonId,preloadIds:[...previewIds],legacySets,legacy:true});
}

/** An old request is retained for explanation; actual flight IDs are allowlisted. */
export function resolveFlightSelection(value,catalog){
  const requested=typeof value==='string'?value:null;
  if(catalog.flightIds.includes(requested))return {requested,ids:[requested],fallbackReason:null};
  if(Object.hasOwn(catalog.legacySets,requested)){
    const original=catalog.legacySets[requested],selected=original.filter(id=>catalog.flightIds.includes(id));
    return {requested,ids:selected.length?selected:[...catalog.flightIds],fallbackReason:!selected.length?'preview-only':selected.length!==original.length?'filtered-legacy':null};
  }
  return {requested,ids:[...catalog.flightIds],fallbackReason:catalog.previewIds.includes(requested)?'preview-only':requested===null?'default':'unknown'};
}
export function resolveFlightRequest(value,catalog){return resolveFlightSelection(value,catalog).ids;}

/** Legacy collections pick one initial preview; a preview never becomes a queue. */
export function resolvePreviewRequest(value,catalog,{fallback}={}){
  if(typeof value!=='string')value=null;
  if(catalog.previewIds.includes(value))return value;
  if(Object.hasOwn(catalog.legacySets,value)){
    const first=catalog.legacySets[value].find(id=>catalog.previewIds.includes(id));if(first)return first;
  }
  return catalog.previewIds.includes(fallback)?fallback:catalog.flightIds[0];
}

/** A preview-only URL can suggest a preview without replacing a saved game set. */
export function resolveMusicQuery(searchParams,catalog){
  const value=searchParams?.get?.('music');
  if(catalog.previewIds.includes(value)&&!catalog.flightIds.includes(value))return {flightRequest:null,previewRequest:value,previewOnly:true};
  if(catalog.flightIds.includes(value)||Object.hasOwn(catalog.legacySets,value))return {flightRequest:value,previewRequest:resolvePreviewRequest(value,catalog),previewOnly:false};
  return {flightRequest:null,previewRequest:null,previewOnly:false};
}

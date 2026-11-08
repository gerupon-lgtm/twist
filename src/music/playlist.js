/** Old single-track configs remain valid; the optional order names existing track objects. */
export function flightTrackOrder(config) {
  const ids=config.flightPlaylist??['flight'];
  if(!Array.isArray(ids)||ids.length<1||ids.length>16||ids.some(id=>typeof id!=='string'||!/^[a-z][a-z0-9_-]{0,31}$/i.test(id)||id==='clear'||id==='afterburner'||!Object.hasOwn(config,id))) throw Error('Invalid flight playlist');
  return [...new Set(ids)];
}
/** Optional groups leave the original flightPlaylist and older author MIDI configs valid. */
export function flightTrackSets(config) {
  const current=flightTrackOrder(config);
  if(config.flightSets===undefined)return {current};
  if(!config.flightSets||typeof config.flightSets!=='object'||Array.isArray(config.flightSets))throw Error('Invalid flight sets');
  return Object.fromEntries(Object.entries(config.flightSets).map(([key,ids])=>{
    if(!['brave','rock','steel','horizon','storm','newrock','ignition','advance','overdrive','proposals','all'].includes(key))throw Error('Invalid flight set');
    return [key,flightTrackOrder({...config,flightPlaylist:ids})];
  }).concat([['current',current]]));
}
export function trackForFlight(ids,flightNumber=1) {
  if(!ids.length)return null;
  const leg=Number.isFinite(flightNumber)?Math.max(1,Math.floor(flightNumber)):1;
  return ids[(leg-1)%ids.length];
}

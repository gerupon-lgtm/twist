/** Old single-track configs remain valid; the optional order names existing track objects. */
export function flightTrackOrder(config) {
  const ids=config.flightPlaylist??['flight'];
  if(!Array.isArray(ids)||ids.length<1||ids.length>8||ids.some(id=>typeof id!=='string'||!/^[a-z][a-z0-9_-]{0,31}$/i.test(id)||id==='clear'||!Object.hasOwn(config,id))) throw Error('Invalid flight playlist');
  return [...new Set(ids)];
}
export function trackForFlight(ids,flightNumber=1) {
  if(!ids.length)return null;
  const leg=Number.isFinite(flightNumber)?Math.max(1,Math.floor(flightNumber)):1;
  return ids[(leg-1)%ids.length];
}

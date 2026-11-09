import {AFTERBURNER_TUNING} from './afterburner.js';

/** Game-scale forces. The ordinary profile is unchanged. */
export const FLIGHT_MODEL=Object.freeze({
  cruiseSpeed:10,defaultThrottle:.5,gravity:3,maxThrust:1.8,cruiseDrag:.9,maxSpeed:30,
  maxLift:9,stallStart:20*Math.PI/180,stallEnd:70*Math.PI/180,
  recoveryThrust:5.4,recoveryTurnRate:2.5,maxRecoveryAcceleration:12,
  maxTimeStep:.05,integrationStep:1/120,
});
export const NORMAL_FLIGHT_PROFILE=Object.freeze({id:'normal-flight-v1',model:FLIGHT_MODEL,
  afterburnerMaxSpeed:AFTERBURNER_TUNING.maxSpeed,afterburnerThrust:AFTERBURNER_TUNING.extraThrust,
  unlimitedAfterburner:false,turnGravity:null});
export const SIERRA50_FLIGHT_PROFILE=Object.freeze({id:'sierra50-fast-v1',
  model:Object.freeze({...FLIGHT_MODEL,cruiseSpeed:25,maxSpeed:60}),
  afterburnerMaxSpeed:75,afterburnerThrust:AFTERBURNER_TUNING.extraThrust,
  unlimitedAfterburner:true,turnGravity:15});
export const courseFlightProfile=course=>course?.id==='sierra50'?SIERRA50_FLIGHT_PROFILE:NORMAL_FLIGHT_PROFILE;
/** Only known course profiles can alter the force integration. */
export const resolveFlightProfile=profile=>profile?.id===SIERRA50_FLIGHT_PROFILE.id?SIERRA50_FLIGHT_PROFILE:NORMAL_FLIGHT_PROFILE;
export function courseFlightMetadata(course){
  const profile=courseFlightProfile(course);if(profile===NORMAL_FLIGHT_PROFILE)return null;
  return {id:profile.id,startSpeed:profile.model.cruiseSpeed,levelFullThrottleSpeed:profile.model.cruiseSpeed*Math.sqrt(profile.model.maxThrust/profile.model.cruiseDrag),
    drySpeedLimit:profile.model.maxSpeed,afterburnerSpeedLimit:profile.afterburnerMaxSpeed,
    unlimitedAfterburner:profile.unlimitedAfterburner,turnGravity:profile.turnGravity};
}

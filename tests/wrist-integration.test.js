import test from 'node:test';
import assert from 'node:assert/strict';
import {flightCommands} from '../src/flight-input.js';
import {flightRates} from '../src/controls.js';
import {DEFAULT_FLIGHT_SETTINGS,normalizeFlightSettings,loadFlightSettings,saveFlightSettings} from '../src/flight-settings.js';
import {flightReport} from '../src/flight-session.js';
import {supersonicIntent} from '../src/supersonic/intent.js';
import {readSteeringChoice,saveSteeringChoice,STEERING_PREFERENCE_KEY,inactiveSteeringSettings,preserveWristPose,createWristRecord,WRIST_SENSITIVITY_PRESETS} from '../src/wrist-input.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-12,`${a} vs ${b}`);
const store=raw=>{const data=new Map(Object.entries(raw??{})),writes=[];return {data,writes,getItem:key=>data.get(key)??null,setItem:(key,value)=>{writes.push({key,value});data.set(key,value);}};};

test('old numeric settings load without saving or changing tilt/twist values',()=>{
  const raw={maxSteerTilt:27,steerTiltDeadzone:2,maxSteerTwist:35,steerTwistDeadzone:7};
  const s=store({'twist.flight-settings.v1':JSON.stringify(raw)}),before=s.getItem('twist.flight-settings.v1');
  const values=loadFlightSettings(s);for(const [key,value]of Object.entries(raw))assert.equal(values[key],value);
  assert.equal(values.maxSteerWrist,25);assert.equal(values.steerWristDeadzone,3);assert.equal(s.writes.length,0);assert.equal(s.getItem('twist.flight-settings.v1'),before);
  saveFlightSettings(s,{...values,maxSteerWrist:18});assert.equal(JSON.parse(s.getItem('twist.flight-settings.v1')).maxSteerTilt,27);
});
test('URL wins only for this visit and explicit selection is the sole persistence boundary',()=>{
  for(const old of ['tilt','twist']){const s=store({[STEERING_PREFERENCE_KEY]:JSON.stringify({version:1,mode:old})});
    assert.equal(readSteeringChoice(s,'wrist').mode,'wrist');assert.equal(readSteeringChoice(s,null).mode,old);assert.equal(s.writes.length,0);
    assert.equal(saveSteeringChoice(s,'wrist'),true);assert.equal(readSteeringChoice(s,null).mode,'wrist');assert.equal(s.writes.length,1);}
  assert.equal(saveSteeringChoice(store(),'unknown'),false);assert.equal(readSteeringChoice({getItem(){throw Error();}}).mode,'tilt');
  assert.equal(saveSteeringChoice({setItem(){throw Error();}},'wrist'),false);
});
test('tilt and twist commands remain the original numbers in rate and angle branches',()=>{
  const cfg=normalizeFlightSettings({maxBank:30,steerCurve:1.4});
  for(const mode of ['tilt','twist'])for(const pitch of [-30,-7,0,11,30])for(const turn of [-60,-17,0,14,60]){
    const a={pitch,steer:turn,twist:turn,wrist:99},before=JSON.stringify(a),expected=flightRates(a,1,mode,cfg);
    assert.deepEqual(flightCommands(a,{steering:mode,pitchMode:'rate',settings:cfg}),expected);
    near(flightCommands(a,{steering:mode,pitchMode:'angle',settings:cfg,currentPitch:.1,dt:.02}).bankAngle,expected.bankAngle);assert.equal(JSON.stringify(a),before);
  }
});
test('wrist feeds the same curve once into normal and Sonic bank while pitch and AB signs agree',()=>{
  const settings=normalizeFlightSettings({maxBank:30,steerCurve:2}),angles={pitch:-14,wristPitch:-14,wrist:14,steer:-30,twist:0};
  const normal=flightCommands(angles,{steering:'wrist',pitchMode:'rate',settings});near(normal.bankAngle,.25*Math.PI/6);
  const sonic=supersonicIntent(angles,{steering:'wrist',normalSettings:settings});near(sonic.bankDemand,.25);assert.ok(sonic.pitchDemandRadians<0);assert.equal(sonic.autoAfterburner.pitchInputDegrees,-14);
  for(const value of Object.values(normal))assert.ok(Number.isFinite(value));for(const value of Object.values(WRIST_SENSITIVITY_PRESETS))assert.ok(value>=5&&value<=40);
});
test('new inactive lists contain both unselected pairs; explore marks all six unused',()=>{
  for(const mode of ['tilt','twist','wrist']){const keys=inactiveSteeringSettings(mode);assert.equal(keys.length,4);const report=flightReport({steer:mode,pitch:'angle',settings:DEFAULT_FLIGHT_SETTINGS});assert.ok(keys.every(key=>report.inactiveSettings.includes(key)));}
  const explore=flightReport({steer:'wrist',mode:'explore',pitch:'angle'});for(const key of ['maxSteerTilt','maxSteerTwist','maxSteerWrist','steerTiltDeadzone','steerTwistDeadzone','steerWristDeadzone'])assert.ok(explore.inactiveSettings.includes(key));
});
test('invalid wrist holds the last finite command and legacy twist without a new pause or mode switch',()=>{
  const old={wrist:12,wristPitch:-7,twist:8,steer:2};const held=preserveWristPose(old,{valid:false,reason:'swing-twist-singularity'});
  assert.equal(held.held,true);assert.equal(held.wrist,12);assert.equal(held.pitch,-7);assert.equal(held.twist,8);
  const fresh=preserveWristPose(null,{valid:false});for(const key of ['wrist','wristPitch','pitch','steer','twist'])assert.equal(fresh[key],0);
});
test('wrist range is per calibration, reset per attempt, source truthful and report deeply independent',()=>{
  const record=createWristRecord(),r={valid:true,holdInclinationDegrees:45,axisWorld:{x:0,y:1,z:0}};
  record.calibrate(r,'sensor');for(const wrist of [-5,10])record.add({wrist,valid:true});record.add({wrist:80,held:true});
  assert.equal(record.snapshot().angleRangeDegrees,15);record.calibrate(r,'virtual-practice');record.add({wrist:2,valid:true});
  const snapshot=record.snapshot(),report=flightReport({steer:'wrist',input:{wrist:snapshot}});snapshot.calibrations[0].calibration.axisWorld.y=8;
  assert.equal(report.input.wrist.calibrations[0].calibration.axisWorld.y,1);assert.equal(report.input.wrist.calibrations[0].angleRangeDegrees,15);assert.equal(report.input.wrist.angleRangeDegrees,0);assert.equal(report.input.wrist.source,'virtual-practice');
  record.reset();assert.equal(record.snapshot().calibrations.length,0);assert.equal(record.snapshot().calibration,null);
});

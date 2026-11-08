import test from 'node:test';
import assert from 'node:assert/strict';
import {flightReport,copyableFlightReport} from '../src/flight-session.js';

test('speedfeel records are copied independently and unfinished course time remains null',()=>{
  const segments=[{id:'start-light1',seconds:2,closestDistance:3.2,nearMisses:1,nearMissRadius:15}],approaches=[{closestDistance:3.2,nearMisses:1,nearMissRadius:15}],
    abStraights=[{id:'easy-final',length:270,usedAfterburner:true,afterburnerSeconds:2.3}],passbys={count:4},courseTime={seconds:null,bestSeconds:45.2,mode:'flight',courseKey:'flight:easy:12345678'};
  const report=flightReport({mode:'flight',view:'classic',segments,approaches,abStraights,passbys,courseTime});
  assert.ok(report.inactiveSettings.includes('groundPatternStrength'));assert.equal(report.courseTime.seconds,null);
  segments[0].nearMisses=99;approaches[0].closestDistance=99;abStraights[0].afterburnerSeconds=99;passbys.count=99;courseTime.bestSeconds=99;
  const copy=JSON.parse(copyableFlightReport(report));assert.equal(copy.segments[0].nearMisses,1);assert.equal(copy.approaches[0].closestDistance,3.2);assert.equal(copy.abStraights[0].afterburnerSeconds,2.3);assert.equal(copy.passbys.count,4);assert.equal(copy.courseTime.bestSeconds,45.2);
  assert.equal(flightReport({mode:'explore',view:'assisted'}).inactiveSettings.includes('groundPatternStrength'),false);
});

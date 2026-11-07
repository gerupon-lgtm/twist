import test from 'node:test';import assert from 'node:assert/strict';
import {FLIGHT_SETTING_FIELDS,DEFAULT_FLIGHT_SETTINGS,normalizeFlightSettings,resetFlightSetting} from '../src/flight-settings.js';
import {FEEDBACK_FIELDS} from '../src/feedback/settings.js';
import {changedSettings,initialSettingText} from '../src/setting-differences.js';
import {FLIGHT_HELP,FEEDBACK_HELP} from '../src/settings-help.js';
test('changed settings use normalized saved values including booleans and automatic FOV',()=>{
 assert.deepEqual(changedSettings(FLIGHT_SETTING_FIELDS,DEFAULT_FLIGHT_SETTINGS),[]);
 assert.deepEqual(changedSettings(FLIGHT_SETTING_FIELDS,normalizeFlightSettings({maxPitch:25,cockpitFov:60,targetHeightGuide:false})),['maxPitch','cockpitFov','targetHeightGuide']);
 assert.equal(initialSettingText(FLIGHT_SETTING_FIELDS.cockpitFov),'自動');assert.equal(initialSettingText(FLIGHT_SETTING_FIELDS.targetHeightGuide),'オン');
});
test('one-field defaults preserve other tuning and reject unknown setting names',()=>{
 const values=normalizeFlightSettings({maxPitch:25,maxBank:20,cockpitFov:60});const reset=resetFlightSetting(values,'maxPitch');assert.equal(reset.maxPitch,15);assert.equal(reset.maxBank,20);assert.equal(reset.cockpitFov,60);
 assert.deepEqual(resetFlightSetting(values,'not-a-setting'),values);assert.equal(resetFlightSetting(values,'cockpitFov').cockpitFov,0);
});
test('each control and feedback field has a readable explanation',()=>{
 for(const key of Object.keys(FLIGHT_SETTING_FIELDS))assert.ok(FLIGHT_HELP[key]?.length>12,key);
 for(const key of Object.keys(FEEDBACK_FIELDS))assert.ok(FEEDBACK_HELP[key]?.length>12,key);
});

import {convertSpeed,normalizeSpeedUnit} from './speed-units.js';
import { APP_VERSION } from './version.js';
import { FLIGHT_SETTING_FIELDS, DEFAULT_FLIGHT_SETTINGS, normalizeFlightSettings, loadFlightSettings, saveFlightSettings,resetFlightSetting } from './flight-settings.js';
import { flightReport, copyableFlightReport } from './flight-session.js';
import { computeFieldOfView } from './visibility.js';
import { createRangeEditor } from './range-editor.js';
import { FLIGHT_HELP,SETTINGS_TROUBLES } from './settings-help.js';
import { initialSettingText } from './setting-differences.js';
import {formatCourseTime} from './course-bests.js';

const $ = id => document.getElementById(id);
const describeSettings = report => Object.entries(FLIGHT_SETTING_FIELDS)
  .map(([key, field]) => `${field.label} ${field.options?field.options[report.settings[key]]:typeof field.initial==='boolean'?(report.settings[key]?'オン':'オフ'):field.auto && report.settings[key]===0 ? '自動' : report.settings[key]+field.unit}${report.inactiveSettings.includes(key) ? '（未使用）' : ''}`).join(' / ');

export function createFlightPanel(getModes) {
  let storage;
  try { storage = window.localStorage; } catch { /* Defaults also work without storage access. */ }
  let settings = loadFlightSettings(storage);
  let result = null;
  const rangeEditors={};let beforeReset=null;
  const fovAuto=document.createElement('input');fovAuto.type='checkbox';fovAuto.id='cockpit-fov-auto';
  for (const [key, field] of Object.entries(FLIGHT_SETTING_FIELDS)) {
    const label = document.createElement('label');
    label.htmlFor = `setting-${key}`;
    label.dataset.settingKey = key;
    const caption = document.createElement('span'); caption.textContent = field.label;
    const value = document.createElement('output'); value.id = `setting-value-${key}`;
    value.htmlFor = label.htmlFor;
    const input = document.createElement(field.options?'select':'input');
    if(field.options){input.id=label.htmlFor;for(const [id,text]of Object.entries(field.options)){const option=document.createElement('option');option.value=id;option.textContent=text;input.append(option);}}
    else if(typeof field.initial==='boolean')Object.assign(input,{type:'checkbox',id:label.htmlFor});
    else Object.assign(input, { type: 'range', id: label.htmlFor, min: field.min, max: field.max, step: field.step });
    label.append(caption, value, input); $('flight-settings-fields').append(label);
    input.value=settings[key];
    if(input.type==='range')rangeEditors[key]=createRangeEditor(input,{name:field.label,unit:field.unit,initial:field.initial,
      ...(key==='cockpitFov'?{
        readValue:()=>settings.cockpitFov,
        restoreValue:value=>{settings={...settings,cockpitFov:value};persist();},
        formatValue:value=>value===0?'自動':`${value}°`,
        canUndo:()=>getModes().mode==='flight'&&getModes().camera==='cockpit',
        isRestorable:value=>value===0||(value>=field.min&&value<=field.max),
      }:{}),onReset:()=>{
      settings=resetFlightSetting(settings,key);persist();
    }});
    if(key==='cockpitFov') {
      const autoLabel=document.createElement('label');autoLabel.className='cockpit-fov-auto';autoLabel.dataset.settingKey=key;
      autoLabel.append(fovAuto,document.createTextNode('視野を自動計算する'));$('flight-settings-fields').append(autoLabel);
    }
    input.addEventListener('input', () => {
      settings = normalizeFlightSettings({ ...settings, [key]: field.options?input.value:input.type==='checkbox'?input.checked:Number(input.value) });
      persist();
    });
    const help=document.createElement('small');help.textContent=FLIGHT_HELP[key];help.className='setting-explanation';help.id=`setting-help-${key}`;input.setAttribute('aria-describedby',help.id);
    const initial=document.createElement('small');initial.className='setting-initial';initial.id=`setting-initial-${key}`;label.append(help,initial);
    if(input.type==='checkbox'||field.options){
      const reset=document.createElement('button');reset.type='button';reset.className='setting-checkbox-reset';reset.textContent='この項目だけ初期値へ';reset.dataset.checkboxReset=key;reset.addEventListener('click',()=>{settings=resetFlightSetting(settings,key);persist();});label.append(reset);
    }
  }
  function refreshLayout() {
    const modes=getModes(),maximum=computeFieldOfView(innerWidth,innerHeight,modes.view).vertical;
    const input=$('setting-cockpitFov');input.max=String(Math.floor(maximum*10)/10);
    input.value=String(settings.cockpitFov===0?maximum:Math.min(maximum,settings.cockpitFov));
    fovAuto.checked=settings.cockpitFov===0;
    const inactive=modes.mode!=='flight'||modes.camera!=='cockpit';
    fovAuto.disabled=inactive;input.disabled=inactive||fovAuto.checked;
    $('setting-ladderRange').disabled=inactive;
    $('setting-targetHeightGuide').disabled=modes.view!=='assisted';
    $('setting-streakAmount').disabled=modes.view!=='assisted';
    $('setting-groundPatternStrength').disabled=modes.view!=='assisted';
    $('setting-autoAfterburnerAngle').disabled=modes.mode!=='flight'||!settings.autoAfterburner;
    $('setting-value-cockpitFov').textContent=fovAuto.checked?`自動（${maximum.toFixed(1)}°）`:`${Math.min(maximum,settings.cockpitFov).toFixed(1)}°`;
    for(const editor of Object.values(rangeEditors))editor.sync();
  }
  fovAuto.addEventListener('change',()=>{
    rangeEditors.cockpitFov.remember();
    settings={...settings,cockpitFov:fovAuto.checked?0:Math.floor(computeFieldOfView(innerWidth,innerHeight,getModes().view).vertical*10)/10};persist();
  });
  function refresh() {
    for (const [key, field] of Object.entries(FLIGHT_SETTING_FIELDS)) {
      if(typeof field.initial==='boolean')$(`setting-${key}`).checked=settings[key];else $(`setting-${key}`).value = settings[key];
      $(`setting-value-${key}`).textContent = typeof field.initial==='boolean'||field.options?'':`${settings[key]}${field.unit}`;
      const different=settings[key]!==field.initial,initial=$(`setting-initial-${key}`);initial.hidden=!different;initial.textContent=`● 初期値 ${initialSettingText(field)}`;
      $(`setting-${key}`).closest('label').dataset.changed=String(different);
      const reset=document.querySelector(`[data-checkbox-reset="${key}"]`);if(reset)reset.hidden=!different;
    }
    refreshLayout();
  }
  function refreshTroubles(){
    const modes=getModes(),list=$('settings-troubles-list');list.replaceChildren();
    for(const item of SETTINGS_TROUBLES){
      if((item.flight||item.angle||item.fixed||item.cockpit)&&modes.mode!=='flight'||item.angle&&modes.pitch!=='angle'||item.fixed&&modes.display!=='fixed'||item.cockpit&&modes.camera!=='cockpit'||item.assisted&&modes.view!=='assisted')continue;
      const key=item.key==='steerMaximum'?(modes.steer==='twist'?'maxSteerTwist':'maxSteerTilt'):item.key;
      const button=document.createElement('button');button.type='button';button.textContent=item.label;button.dataset.jumpSetting=key;
      button.addEventListener('click',()=>{
        const input=$(`setting-${key}`),row=input.closest('label');
        for(let parent=row.parentElement;parent&&parent!==$('flight-settings-fields');parent=parent.parentElement)if(parent.tagName==='DETAILS')parent.open=true;
        for(const previous of document.querySelectorAll('.setting-highlight'))previous.classList.remove('setting-highlight');
        row.classList.add('setting-highlight');row.scrollIntoView({block:'center',behavior:'instant'});
        if(key==='cockpitFov'&&input.disabled)fovAuto.focus({preventScroll:true});else input.focus({preventScroll:true});
      });list.append(button);
    }
  }
  function persist() {
    const saved = saveFlightSettings(storage, settings);
    $('settings-status').textContent = saved ? 'このブラウザーに保存しました。' : '保存できません。この画面を開いている間だけ使えます。';
    refresh();
  }
  async function copy(report, prefix) {
    const text = copyableFlightReport(report);
    const output = $(`${prefix}-copy-text`), status = $(`${prefix}-copy-status`);
    try {
      await navigator.clipboard.writeText(text);
      status.textContent = 'コピーしました。'; output.hidden = true;
    } catch {
      output.value = text; output.hidden = false; output.focus(); output.select();
      status.textContent = '自動コピーできません。下の文字列を選択してコピーしてください。';
    }
  }
  $('settings-reset').addEventListener('click', () => {
    beforeReset={...settings};$('settings-undo-reset').hidden=false;
    settings = getModes().mode === 'explore'
      ? { ...settings, radarRange: DEFAULT_FLIGHT_SETTINGS.radarRange, targetHeightGuide: true, hudLanguage:'en',speedUnit:DEFAULT_FLIGHT_SETTINGS.speedUnit,streakAmount:DEFAULT_FLIGHT_SETTINGS.streakAmount,groundPatternStrength:DEFAULT_FLIGHT_SETTINGS.groundPatternStrength }
      : { ...DEFAULT_FLIGHT_SETTINGS };
    persist();
  });
  $('settings-undo-reset').addEventListener('click',()=>{if(beforeReset){settings=beforeReset;beforeReset=null;persist();$('settings-undo-reset').hidden=true;}});
  $('settings-copy').addEventListener('click', () => copy(flightReport({ version: APP_VERSION, ...getModes(), settings, result: result?.result }), 'settings'));
  $('result-copy').addEventListener('click', () => { if (result) copy(result, 'result'); });
  refresh();
  return {
    getSettings: () => settings,
    setSetting(key,value){if(!Object.hasOwn(FLIGHT_SETTING_FIELDS,key))return;settings=normalizeFlightSettings({...settings,[key]:value});persist();},
    refreshLayout:()=>{refreshLayout();refreshTroubles();},
    report: (stats, outcome, lastLeg) => flightReport({ version: APP_VERSION, ...getModes(), settings, stats, lastLeg, result: outcome }),
    showResult(report) {
      result = report;
      $('flight-result').hidden = !report;
      $('result-copy-text').hidden = true; $('result-copy-status').textContent = '';
      if (!report) return;
      const stats=report.stats??{elapsedSeconds:0,groundContacts:0,recoverySeconds:0};
      const flight=report.mode==='flight';$('result-flight-stats').hidden=!flight;
      $('result-title').textContent=flight?'今回の飛行記録':'今回の探索記録';$('flight-result').setAttribute('aria-label',$('result-title').textContent);
      const timing=report.courseTime;
      $('result-course-time').textContent=Number.isFinite(timing?.seconds)?formatCourseTime(timing.seconds):'未完了';
      $('result-best-time').textContent=formatCourseTime(timing?.bestSeconds);
      $('result-best-status').textContent=timing?.newBest?timing.saved===false?'自己ベスト更新（この画面内のみ）':'自己ベスト更新':Number.isFinite(timing?.bestSeconds)?'このコース・遊び方の記録':'クリアすると自己ベストを保存します。';
      $('result-record-note').textContent=flight?'合計は飛び直しも含み、最後の1回は飛び直しで区切ります。一時停止では区切りません。設定は到着・接地時点の値です。':'コース時間は一時停止を除きます。自己ベストは探索モードの記録として、この端末に保存します。';
      const discovery=report.exitDiscovery;
      $('result-exit-discovery').textContent=!discovery?.opened?'出口未開放':discovery.firstVisibleSeconds===null?'未表示':`${discovery.firstVisibleSeconds.toFixed(1)}秒`;
      const last = report.lastLeg || stats;
      $('result-legs').textContent = `${stats.legs || 1}回`;
      $('result-last-elapsed').textContent = `${last.elapsedSeconds.toFixed(1)}秒`;
      $('result-last-contacts').textContent = `${last.groundContacts}回`;
      $('result-last-recovery').textContent = `${last.recoverySeconds.toFixed(1)}秒`;
      $('result-elapsed').textContent = `${stats.elapsedSeconds.toFixed(1)}秒`;
      $('result-contacts').textContent = `${stats.groundContacts}回`;
      $('result-recovery').textContent = `${stats.recoverySeconds.toFixed(1)}秒`;
      $('result-outcome').textContent = report.result === 'clear' ? 'クリア' : '墜落';
      $('result-modes').textContent = `pitch=${report.pitch} / steer=${report.steer} / display=${report.display} / camera=${report.camera}`;
      $('result-settings').textContent = describeSettings(report);
      const ab=report.afterburner,unit=normalizeSpeedUnit(report.settings.speedUnit);$('result-afterburner').hidden=!ab;
      $('result-afterburner').textContent=ab?`AB ${ab.uses}回・${ab.seconds.toFixed(1)}秒 / ゲージ獲得 ${ab.earned.toFixed(1)} / 最高速 ${convertSpeed(ab.maxSpeed,unit).toFixed(1)} ${unit}`:'';
      $('result-segments').replaceChildren(...(report.segments??[]).map(segment=>{
        const row=document.createElement('div');row.dataset.segmentId=segment.id;
        const label=document.createElement('dt');label.textContent=segment.label;
        const value=document.createElement('dd');value.textContent=segment.seconds===null?'未完了':`${segment.seconds.toFixed(1)}秒`;row.append(label,value);return row;
      }));
      $('result-approaches').replaceChildren(...(report.segments??[]).map(segment=>{
        const row=document.createElement('div');row.dataset.approachId=segment.id;
        const label=document.createElement('dt');label.textContent=segment.label;
        const value=document.createElement('dd');value.textContent=`最接近 ${Number.isFinite(segment.closestDistance)?segment.closestDistance.toFixed(1)+'m':'未到達'} / 近くの未取得通過 ${segment.nearMisses??0}回`;row.append(label,value);return row;
      }));
      $('result-straights-heading').hidden=!flight||!report.abStraights?.length;
      $('result-straights').hidden=!flight||!report.abStraights?.length;
      $('result-straights').replaceChildren(...(flight?report.abStraights??[]:[]).map((lane,index)=>{
        const row=document.createElement('div');row.dataset.straightId=lane.id;
        const label=document.createElement('dt');label.textContent=`直線${index+1}（${Math.round(lane.length)}m）`;
        const value=document.createElement('dd');value.textContent=lane.usedAfterburner?`AB ${lane.afterburnerSeconds.toFixed(2)}秒`:'AB未使用';row.append(label,value);return row;
      }));
      $('result-target-views').replaceChildren(...(report.targetViews??[]).map((segment,i)=>{
        const row=document.createElement('div');row.dataset.targetViewId=segment.id;
        const label=document.createElement('dt');label.textContent=report.segments?.find(item=>item.id===segment.id)?.label??`区間${i+1}`;
        const value=document.createElement('dd');value.textContent=segment.firstVisibleSeconds===null?'未表示':`${segment.firstVisibleSeconds.toFixed(1)}秒`;row.append(label,value);return row;
      }));
    },
    setPhase(phase, mode) {
      $('flight-adjustments').hidden = phase !== 'paused';
      const inactiveSteering = getModes().steer === 'twist' ? ['maxSteerTilt','steerTiltDeadzone'] : ['maxSteerTwist','steerTwistDeadzone'];
      for (const label of $('flight-settings-fields').querySelectorAll('label[data-setting-key]')) label.hidden = (mode !== 'flight' && !['radarRange','targetHeightGuide','hudLanguage','speedUnit','streakAmount','groundPatternStrength'].includes(label.dataset.settingKey))
        || inactiveSteering.includes(label.dataset.settingKey);
      $('setting-chaseTimeConstant').disabled = mode !== 'flight' || getModes().camera !== 'chase';
      refreshLayout();
      refreshTroubles();
      $('flight-settings-help').hidden = mode !== 'flight';
      $('settings-reset').textContent = mode === 'flight' ? '操縦をすべて初期値へ' : '目印をすべて初期値へ';
      $('adjustment-scope-note').textContent = mode === 'flight'
        ? '機首と旋回の入力角度を別々に調整します。選んだ旋回方式の項目だけ表示します。'
        : 'レーダー・目標高度・速度単位・流線・地面の模様を調整します。探索の操縦には影響しません。';
      if (phase !== 'paused') $('flight-adjustments').open = false;
      if (['running','intro','waiting','ready'].includes(phase)) this.showResult(null);
    },
  };
}

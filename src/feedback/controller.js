import { loadFeedbackSettings, saveFeedbackSettings, normalizeFeedbackSettings, FEEDBACK_FIELDS } from './settings.js';
import { createGameAudio } from './audio.js';
import { flightFeedback } from './model.js';
import { createHaptics } from './haptics.js';
import { createSensorJitter } from './jitter.js';
import { isIPhone } from '../device-platform.js';
import { createMusicPlayer } from '../music/player.js';
import { createRangeEditor } from '../range-editor.js';
import { changedSettings,initialSettingText } from '../setting-differences.js';
import { FEEDBACK_HELP } from '../settings-help.js';
import {createSonicEventConsumer} from './supersonic-model.js';

export function createFeedbackController(){
  let storage;try{storage=localStorage;}catch{/* Defaults work without storage. */}
  let settings=loadFeedbackSettings(storage),active=false,lastAudio=0,lastAfterburner=null,lastModel=null;
  let previewAudio=null,previewMusic=null,previewIntent=false,previewGeneration=0,previewMessage='',previewClosing=Promise.resolve();
  const query=new URL(location.href).searchParams.get('music');
  if(Object.hasOwn(FEEDBACK_FIELDS.musicSet.options,query))settings={...settings,musicSet:query};
  let frames=0,frameSum=0,frameMax=0;
  const audio=createGameAudio(),jitter=createSensorJitter();
  const music=createMusicPlayer(audio);music.setSettings(settings);
  const sonicEvents=createSonicEventConsumer();
  const supported=!isIPhone(navigator.userAgent)&&typeof navigator.vibrate==='function';
  const haptics=createHaptics(supported?navigator.vibrate.bind(navigator):null);
  const fields=document.getElementById('feedback-settings-fields');
  const rangeEditors={};
  for(const [key,field] of Object.entries(FEEDBACK_FIELDS)){
    const label=document.createElement('label');label.htmlFor=`feedback-${key}`;
    const caption=document.createElement('span');caption.textContent=field.label;
    const input=document.createElement(field.options?'select':'input');input.id=label.htmlFor;
    const output=document.createElement('output');output.htmlFor=input.id;
    if(field.options)for(const [value,text]of Object.entries(field.options))input.add(new Option(text,value));
    else input.type=typeof field.initial==='boolean'?'checkbox':'range';
    if(input.type==='range')Object.assign(input,{min:field.min,max:field.max,step:field.step});
    label.dataset.feedbackSetting=key;label.append(caption,output,input);fields.append(label);
    input.value=settings[key];
    if(input.type==='range')rangeEditors[key]=createRangeEditor(input,{name:field.label,unit:field.unit,initial:field.initial});
    const help=document.createElement('small');help.className='setting-explanation';help.textContent=FEEDBACK_HELP[key];help.id=`feedback-help-${key}`;input.setAttribute('aria-describedby',help.id);
    const initial=document.createElement('small');initial.dataset.feedbackInitial=key;initial.className='setting-initial';label.append(help,initial);
    if(field.group==='vibration')label.hidden=!supported;
    input.addEventListener('input',()=>{
      settings=normalizeFeedbackSettings({...settings,[key]:field.options?input.value:input.type==='checkbox'?input.checked:Number(input.value)});
      if(key==='musicSet'){
        const url=new URL(location.href);url.searchParams.set('music',settings.musicSet);history.replaceState(null,'',url);
        const home=document.getElementById('home-link'),link=new URL(home.href);link.searchParams.set('music',settings.musicSet);home.href=link.href;
      }
      if(field.group==='vibration')jitter.reset();
      haptics.stop();audio.configure(settings);music.setSettings(settings);
      if(!settings.sound)audio.stop();else if(active){audio.start();void music.play('flight');}
      if(previewIntent){
        if(!settings.sound)stopPreview();
        else {previewAudio?.configure(previewSettings());previewMusic?.setSettings(previewSettings());if(key==='musicSet')void playPreview();}
      }
      document.getElementById('feedback-save-status').textContent=saveFeedbackSettings(storage,settings)?'このブラウザーに保存しました。':'保存できません。この画面を開いている間だけ使います。';
      refresh();
    });
  }
  document.getElementById('vibration-support').textContent=supported?'振動は端末・ブラウザーの設定によって使えないことがあります。':'この端末ではゲームの振動を利用できません。音と表示でお知らせします。';
  const previewControls=document.createElement('div');previewControls.className='music-preview-controls';
  const previewStart=document.createElement('button');previewStart.type='button';previewStart.id='music-preview-start';previewStart.textContent='▶ 試聴';
  const previewStop=document.createElement('button');previewStop.type='button';previewStop.id='music-preview-stop';previewStop.textContent='■ 停止';
  const previewTitle=document.createElement('span');previewTitle.id='music-preview-title';
  const previewStatus=document.createElement('small');previewStatus.id='music-preview-status';previewStatus.setAttribute('role','status');
  previewControls.append(previewStart,previewStop,previewTitle,previewStatus);fields.querySelector('[data-feedback-setting="musicSet"]').after(previewControls);
  previewStart.addEventListener('click',()=>{void playPreview();});previewStop.addEventListener('click',stopPreview);
  const adjustments=document.getElementById('flight-adjustments');adjustments.addEventListener('toggle',()=>{if(!adjustments.open)stopPreview();});
  function previewSettings(){return {...settings,bgm:true,sfx:false,abMusic:false};}
  function refreshPreview(){
    const snapshot=previewMusic?.snapshot();previewStart.disabled=!settings.sound||active;previewStop.disabled=!previewIntent;
    previewTitle.textContent=snapshot?.playing?`試聴中：${snapshot.track}`:'';
    previewStatus.textContent=!settings.sound?'試聴は「音」をオンにすると使えます。':previewMessage||'飛行を再開せず、選んだ曲の先頭を試聴します。';
    previewControls.dataset.playing=String(Boolean(snapshot?.playing));previewControls.dataset.status=snapshot?.status??'idle';
    previewControls.dataset.music=JSON.stringify(snapshot??{playing:false});
    previewControls.dataset.audio=JSON.stringify(previewAudio?.snapshot()??{contextState:'none',workletReady:false});
  }
  function stopPreview(){
    previewGeneration++;previewIntent=false;previewMessage='';
    previewMusic?.stop();previewAudio?.stop();if(previewAudio)previewClosing=previewAudio.dispose();previewMusic=null;previewAudio=null;refreshPreview();
  }
  async function playPreview(){
    if(active||!settings.sound||adjustments.hidden||!adjustments.open)return;
    previewIntent=true;const token=++previewGeneration;previewMessage='曲を準備しています。';
    refreshPreview();
    if(!previewAudio){await previewClosing;if(token!==previewGeneration||!previewIntent)return;previewAudio=createGameAudio();previewMusic=createMusicPlayer(previewAudio);}
    const output=previewAudio,player=previewMusic;player.setSettings(previewSettings());player.setFlightNumber(1);refreshPreview();
    if(!output.musicReady())await output.unlock();
    if(token!==previewGeneration||!previewIntent)return;
    const result=await player.play('flight');
    if(token!==previewGeneration||!previewIntent)return;
    previewMessage=result==='played'?'試聴中です。':result==='unavailable'?'曲を試聴できませんでした。':'試聴は停止しています。';refreshPreview();
  }
  function refresh(){
    for(const [key,field]of Object.entries(FEEDBACK_FIELDS)){
      const el=document.getElementById(`feedback-${key}`);if(el.type==='checkbox')el.checked=settings[key];else el.value=settings[key];
      el.closest('label').querySelector('output').textContent=field.options||el.type==='checkbox'?'':`${settings[key]}${field.unit||''}`;
      rangeEditors[key]?.sync();
      const initial=fields.querySelector(`[data-feedback-initial="${key}"]`);initial.hidden=settings[key]===field.initial;initial.textContent=`● 初期値 ${initialSettingText(field)}`;
    }
    refreshPreview();
  }
  refresh();
  return {
    unlock(){stopPreview();haptics.arm();if(settings.sound){void audio.unlock();void music.preload();}},
    countdownAudio(signal){
      if(signal?.type==='cancel'){audio.cancelCountdown(signal.session);return;}
      if(signal?.type==='prepare'){audio.configure(settings);return audio.prepareCountdown(signal.session,settings);}
      if(signal?.type==='tick')return audio.countdownTone(signal.session,signal.number,settings);
      if(signal?.type==='go'&&active)return audio.countdownTone(signal.session,'go',settings);
    },
    start({flightNumber=1}={}){stopPreview();active=true;lastAfterburner=null;lastModel=null;music.setFlightNumber(flightNumber);audio.start();audio.configure(settings);void music.play('flight');},
    stop(){stopPreview();active=false;lastAfterburner=null;lastModel=null;music.stop();audio.stop();haptics.stop();jitter.clearWindow();},
    event(kind){haptics.event(kind,settings,performance.now());
      if(kind==='clear')void music.play('clear').then(result=>{if(result==='unavailable')audio.event(kind,settings);});
      else audio.event(kind,settings);
    },
    passBy(payload){if(active&&settings.sound&&settings.sfx&&settings.passbySound!==false&&!['ground','stall','buffet'].includes(lastModel?.cue))audio.passBy(payload,settings);},
    update(state,angles,inputMode,steering,now,navigation=null){
      const crossings=sonicEvents.consume(state);
      if(!active)return;
      if(inputMode==='sensor')jitter.add(now,angles.pitch,steering==='twist'?angles.twist:angles.steer);
      const model=flightFeedback(state,settings),phase=haptics.update(model,settings,now);
      const cueChanged=lastModel?.cue!==model.cue;lastModel=model;
      music.setAfterburner(state.mode==='flight'&&state.afterburner?.active===true);
      const afterburnerChanged=lastAfterburner!==model.afterburner.active;lastAfterburner=model.afterburner.active;
      if(now-lastAudio>=40||phase?.restarted||afterburnerChanged||cueChanged||crossings.length){audio.update(model,settings,phase,navigation);lastAudio=now;}
      for(const event of crossings){haptics.sonic(event,settings,now,model);audio.sonicTransition(event,settings);}
    },
    frameTiming(ms){if(active&&Number.isFinite(ms)){frames++;frameSum+=ms;frameMax=Math.max(frameMax,ms);}},
    reset(){jitter.reset();music.reset();audio.resetMetrics();sonicEvents.reset();frames=0;frameSum=0;frameMax=0;},
    exitOpened(){if(active)audio.event('exitOpen',settings);},
    report(){return {settings:{...settings},changedSettings:changedSettings(FEEDBACK_FIELDS,settings),vibrationSupported:supported,sensorJitter:jitter.snapshot(),
      audio:audio.snapshot(),music:music.snapshot(),sonicTransitions:sonicEvents.snapshot(),frameCpu:{meanMs:frames?frameSum/frames:0,maxMs:frameMax}};},
    updateDiagnostics(){
      if(!adjustments.hidden)refreshPreview();
      const s=audio.snapshot(),j=jitter.snapshot();
      document.getElementById('feedback-diagnostics').textContent=`入力の揺れ幅（操作も含む）1秒：機首 ${j.window.pitch.toFixed(1)}° / 旋回 ${j.window.steer.toFixed(1)}° ｜ 音源 ${(s.load*100).toFixed(1)}%・最大 ${(s.maxLoad*100).toFixed(1)}% ｜ 描画・操作CPU ${frames?(frameSum/frames).toFixed(1):'0.0'}ms ｜ 曲：${music.snapshot().track||'なし'}`;
      document.getElementById('feedback-diagnostics').dataset.audio=JSON.stringify(s);
      document.getElementById('feedback-diagnostics').dataset.music=JSON.stringify(music.snapshot());
      document.getElementById('feedback-audio-status').textContent=!settings.sound?'音はオフです。':s.status==='ready'?'音源の準備完了':s.status==='idle'?'音は開始ボタンを押した後に準備します。':'この環境では音を開始できません。音なしで遊べます。';
    },
  };
}

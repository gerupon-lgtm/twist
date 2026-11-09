import { loadFeedbackSettings, saveFeedbackSettings, normalizeFeedbackSettings, FEEDBACK_FIELDS,FEEDBACK_SETTINGS_KEY,loadMusicPreviewSettings,saveMusicPreviewSettings,DEFAULT_MUSIC_PREVIEW_TRACK_ID } from './settings.js';
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
import {resolveFlightSelection,resolvePreviewRequest,resolveMusicQuery} from '../music/catalog.js';
import {createLaunchMusicGate} from './launch-music.js';
import {createBriefingAudioBridge} from './briefing-audio-bridge.js';

export function createFeedbackController(){
  let storage;try{storage=localStorage;}catch{/* Defaults work without storage. */}
  let settings=loadFeedbackSettings(storage),active=false,lastAudio=0,lastAfterburner=null,lastModel=null;
  let previewAudio=null,previewMusic=null,previewIntent=false,previewPending=false,previewGeneration=0,previewMessage='',previewClosing=Promise.resolve(),previewStarting=Promise.resolve(),previewClosingActive=false;
  let catalog=null,catalogLoading=null,catalogMessage='',previewTrackId=null,musicSelectionEdited=false;
  const queryParams=new URL(location.href).searchParams,storedPreview=loadMusicPreviewSettings(storage);
  let storedMusicRequest=null;try{const raw=JSON.parse(storage.getItem(FEEDBACK_SETTINGS_KEY));if(typeof raw?.musicSet==='string')storedMusicRequest=raw.musicSet;}catch{/* No saved request to migrate. */}
  let frames=0,frameSum=0,frameMax=0;
  const audio=createGameAudio(),jitter=createSensorJitter();
  const music=createMusicPlayer(audio);music.setSettings(settings);
  const launchMusic=createLaunchMusicGate({play:()=>music.play('flight'),stop:()=>music.stop(),
    isAllowed:()=>active&&!document.hidden&&settings.sound&&settings.bgm&&settings.volume>0});
  const briefingAudio=createBriefingAudioBridge({output:audio,readSettings:()=>settings,isVisible:()=>!document.hidden,isInactive:()=>!active});
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
        musicSelectionEdited=true;
        const url=new URL(location.href);url.searchParams.set('music',settings.musicSet);history.replaceState(null,'',url);
        const home=document.getElementById('home-link'),link=new URL(home.href);link.searchParams.set('music',settings.musicSet);home.href=link.href;
      }
      if(field.group==='vibration')jitter.reset();
      briefingAudio.settingsChanged();haptics.stop();audio.configure(settings);music.setSettings(settings);
      if(settings.sound&&['musicSet','clearTrackId','sound','bgm','sfx','abMusic'].includes(key))void music.warmup();
      if(!settings.sound)audio.stop();else if(active)audio.start();
      if(active)launchMusic.request();
      if(previewIntent){
        if(!settings.sound)stopPreview();
        else {previewAudio?.configure(previewSettings());previewMusic?.setSettings(previewSettings());if(key==='musicEngine')void playPreview();}
      }
      document.getElementById('feedback-save-status').textContent=saveFeedbackSettings(storage,settings)?'このブラウザーに保存しました。':'保存できません。この画面を開いている間だけ使います。';
      refresh();
    });
  }
  document.getElementById('vibration-support').textContent=supported?'振動は端末・ブラウザーの設定によって使えないことがあります。':'この端末ではゲームの振動を利用できません。音と表示でお知らせします。';
  const previewControls=document.createElement('div');previewControls.className='music-preview-controls';
  const previewLabel=document.createElement('label');previewLabel.htmlFor='music-preview-track';
  const previewCaption=document.createElement('span');previewCaption.textContent='個別試聴';
  const previewSelect=document.createElement('select');previewSelect.id='music-preview-track';previewSelect.disabled=true;
  const previewHelp=document.createElement('small');previewHelp.className='setting-explanation';previewHelp.textContent='旧曲・クリア・AB・比較も含め、1曲ずつ試聴できます。飛行中の曲の選択は変わりません。';previewLabel.append(previewCaption,previewSelect,previewHelp);
  const selectionStatus=document.createElement('small');selectionStatus.id='music-flight-selection-status';selectionStatus.className='setting-explanation';selectionStatus.setAttribute('role','status');
  const previewStart=document.createElement('button');previewStart.type='button';previewStart.id='music-preview-start';previewStart.textContent='▶ 試聴';
  const previewStop=document.createElement('button');previewStop.type='button';previewStop.id='music-preview-stop';previewStop.textContent='■ 停止';
  const previewTitle=document.createElement('span');previewTitle.id='music-preview-title';
  const previewStatus=document.createElement('small');previewStatus.id='music-preview-status';previewStatus.setAttribute('role','status');
  previewControls.append(previewStart,previewStop,previewTitle,previewStatus);const musicField=fields.querySelector('[data-feedback-setting="musicSet"]');musicField.append(selectionStatus);musicField.after(previewLabel);previewLabel.after(previewControls);
  previewSelect.addEventListener('input',()=>{
    if(!catalog?.previewIds.includes(previewSelect.value))return;
    previewTrackId=previewSelect.value;
    const saved=saveMusicPreviewSettings(storage,{trackId:previewTrackId},catalog);
    previewMessage=saved?'試聴する曲を保存しました。':'試聴する曲を保存できません。この画面では使えます。';
    if(previewIntent)void playPreview();else refreshPreview();
  });
  previewStart.addEventListener('click',()=>{previewStarting=playPreview();});previewStop.addEventListener('click',stopPreview);
  const adjustments=document.getElementById('flight-adjustments');adjustments.addEventListener('toggle',()=>{if(!adjustments.open)stopPreview();});
  const hidden=()=>{stopPreview();briefingAudio.stop('hidden');launchMusic.stop();audio.cancelCountdown();audio.cancelButtons();};
  document.addEventListener('visibilitychange',()=>{if(document.hidden)hidden();});window.addEventListener('pagehide',hidden);
  const buttonClicks=new WeakMap();
  document.addEventListener('click',event=>{
    const button=event.target.closest?.('button');
    if(!event.isTrusted||!button||button.disabled||!document.getElementById('app').contains(button))return;
    buttonClicks.set(event,{gestureAt:performance.now()});
  },true);
  document.addEventListener('click',event=>{
    const click=buttonClicks.get(event);if(!click)return;
    // Bubble after the button's own action, including mute and stop. Remain in
    // the trusted event; a button disabling itself must still get feedback.
    if(previewIntent){
      const token=previewGeneration;
      const play=()=>{if(token===previewGeneration&&previewIntent&&previewAudio)void previewAudio.buttonClick({...settings},()=>previewIntent,click.gestureAt);};
      if(previewAudio)play();else void previewStarting.then(play);
    }else{
      const play=()=>{if(!previewIntent&&!document.hidden)void audio.buttonClick({...settings},()=>active||music.snapshot().playing,click.gestureAt);};
      if(previewClosingActive)void previewClosing.then(play);else play();
    }
  });
  function previewSettings(){return {...settings,bgm:true,sfx:false,abMusic:false};}
  function previewLabelFor(id){
    const role=catalog.clearIds.includes(id)?'クリア':id===catalog.afterburnerId?'AB追加打楽器':id===catalog.comparisonId?'比較':!catalog.flightIds.includes(id)?'試聴専用':'';
    return catalog.byId[id].title+(role?`（${role}）`:'');
  }
  function refreshSelection(){
    if(!catalog)return;
    const selection=resolveFlightSelection(settings.musicSet,catalog);
    selectionStatus.hidden=!selection.fallbackReason;
    selectionStatus.textContent=selection.fallbackReason==='preview-only'?'以前の曲は個別試聴に残しました。飛行中は採用7曲を順番に再生します。':selection.fallbackReason==='filtered-legacy'?'飛行中は採用曲だけを再生します。旧曲は個別試聴で選べます。':selection.fallbackReason?'曲の指定を使えないため、飛行中は採用7曲を使います。':'';
  }
  async function loadCatalog(){
    if(catalog)return catalog;
    if(!catalogLoading)catalogLoading=music.loadCatalog().then(value=>{
      if(!value){catalogMessage='曲の一覧を読み込めません。試聴ボタンで再試行できます。';return null;}
      catalog=value;catalogMessage='';const query=resolveMusicQuery(queryParams,catalog);
      if(query.flightRequest!==null&&!musicSelectionEdited){
        settings={...settings,musicSet:query.flightRequest};music.setSettings(settings);
        const home=document.getElementById('home-link'),link=new URL(home.href);link.searchParams.set('music',settings.musicSet);home.href=link.href;
        if(active)launchMusic.request();
      }
      const fallback=resolvePreviewRequest(storedMusicRequest,catalog,{fallback:DEFAULT_MUSIC_PREVIEW_TRACK_ID});
      previewTrackId=resolvePreviewRequest(query.previewRequest??storedPreview.trackId??storedMusicRequest,catalog,{fallback});
      previewSelect.replaceChildren(...catalog.previewIds.map(id=>new Option(previewLabelFor(id),id)));previewSelect.disabled=false;previewSelect.value=previewTrackId;
      const clearSelect=document.getElementById('feedback-clearTrackId');for(const option of clearSelect.children)if(catalog.byId[option.value])option.textContent=catalog.byId[option.value].title;
      refresh();return catalog;
    }).catch(()=>{catalogMessage='曲の一覧を読み込めません。試聴ボタンで再試行できます。';return null;}).finally(()=>{catalogLoading=null;refreshPreview();});
    return catalogLoading;
  }
  function refreshPreview(){
    const snapshot=previewMusic?.snapshot();
    if(previewIntent&&!previewPending&&snapshot?.status==='ready'&&!snapshot.playing){previewIntent=false;previewMessage='試聴が終わりました。もう一度聴くときは試聴ボタンを押してください。';}
    previewStart.disabled=!settings.sound||active;previewStop.disabled=!previewIntent;
    previewTitle.textContent=snapshot?.playing?`試聴中：${snapshot.track}`:'';
    previewStatus.textContent=!settings.sound?'試聴は「音」をオンにすると使えます。':previewMessage||catalogMessage||(!catalog?'曲の一覧を準備しています。':'飛行を再開せず、選んだ1曲の先頭を試聴します。');
    previewControls.dataset.playing=String(Boolean(snapshot?.playing));previewControls.dataset.status=snapshot?.status??'idle';
    previewControls.dataset.music=JSON.stringify(snapshot??{playing:false});
    previewControls.dataset.audio=JSON.stringify(previewAudio?.snapshot()??{contextState:'none',workletReady:false});
  }
  function stopPreview(){
    previewGeneration++;previewIntent=false;previewPending=false;previewMessage='';
    previewMusic?.stop();previewAudio?.stop();if(previewAudio){previewClosingActive=true;const closing=previewAudio.dispose().finally(()=>{if(previewClosing===closing)previewClosingActive=false;});previewClosing=closing;}previewMusic=null;previewAudio=null;refreshPreview();
  }
  async function playPreview(){
    if(active||!settings.sound||document.hidden||adjustments.hidden||!adjustments.open)return;
    previewIntent=true;previewPending=true;const token=++previewGeneration;previewMessage='曲を準備しています。';
    refreshPreview();
    audio.cancelButtons();await audio.suspendIfIdle();if(token!==previewGeneration||!previewIntent)return;
    if(!previewAudio){await previewClosing;if(token!==previewGeneration||!previewIntent)return;previewAudio=createGameAudio();previewMusic=createMusicPlayer(previewAudio);}
    const output=previewAudio,player=previewMusic;player.setSettings(previewSettings());refreshPreview();
    // Begin permission/resume from this click before waiting on metadata/MIDI.
    try{
      const unlocking=output.musicReady()?output.resume():output.unlock();
      const [,library]=await Promise.all([unlocking,loadCatalog()]);
      if(token!==previewGeneration||!previewIntent)return;
      if(!library){previewPending=false;stopPreview();previewMessage=catalogMessage;refreshPreview();return;}
      const result=await player.playTrack(previewTrackId,{purpose:'preview'});
      if(token!==previewGeneration||!previewIntent)return;
      previewPending=false;previewMessage=result==='played'?'試聴中です。':result==='unavailable'?'曲を試聴できませんでした。':'試聴は停止しています。';
      if(result!=='played'){previewIntent=false;player.stop();output.stop();}refreshPreview();
    }catch{
      if(token!==previewGeneration)return;stopPreview();previewMessage='曲を試聴できませんでした。';refreshPreview();
    }
  }
  function refresh(){
    for(const [key,field]of Object.entries(FEEDBACK_FIELDS)){
      const el=document.getElementById(`feedback-${key}`);if(el.type==='checkbox')el.checked=settings[key];else el.value=field.options&&!Object.hasOwn(field.options,settings[key])?field.initial:settings[key];
      el.closest('label').querySelector('output').textContent=field.options||el.type==='checkbox'?'':`${settings[key]}${field.unit||''}`;
      rangeEditors[key]?.sync();
      const initial=fields.querySelector(`[data-feedback-initial="${key}"]`);initial.hidden=settings[key]===field.initial;initial.textContent=`● 初期値 ${initialSettingText(field)}`;
    }
    refreshSelection();refreshPreview();
  }
  refresh();void loadCatalog();
  return {
    unlock(){stopPreview();haptics.arm();if(settings.sound){void audio.unlock();void music.warmup();}},
    briefingAudio(signal){if(signal?.type==='arm')return briefingAudio.arm();if(signal?.type==='cancel'){briefingAudio.stop(signal.reason);return;}briefingAudio.signal(signal);},
    countdownAudio(signal){
      if(signal?.type==='cancel'){launchMusic.cancelSession(signal.session);audio.cancelCountdown(signal.session);return;}
      if(signal?.type==='prepare'){briefingAudio.stop('countdown');launchMusic.prepare(signal.session);audio.configure(settings);return audio.prepareCountdown(signal.session,settings);}
      if(signal?.type==='tick')return audio.countdownTone(signal.session,signal.number,settings);
      if(signal?.type==='go'&&active){const played=audio.countdownTone(signal.session,'go',settings);
        launchMusic.go(signal.session,{played,completion:played?audio.waitForCountdownEnd(signal.session):null});return played;}
    },
    start({flightNumber=1}={}){stopPreview();briefingAudio.stop('flight');active=true;lastAfterburner=null;lastModel=null;music.setFlightNumber(flightNumber);void music.warmup();audio.start();audio.configure(settings);launchMusic.start();},
    stop(){stopPreview();briefingAudio.stop('stop');active=false;lastAfterburner=null;lastModel=null;launchMusic.stop();audio.stop();haptics.stop();jitter.clearWindow();},
    event(kind){briefingAudio.stop('event');haptics.event(kind,settings,performance.now());
      if(kind==='clear'){launchMusic.stop();void music.play('clear').then(result=>{if(result==='unavailable')audio.event(kind,settings);});}
      else audio.event(kind,settings);
    },
    passBy(payload){if(active&&settings.sound&&settings.sfx&&settings.passbySound!==false&&!['ground','stall','buffet'].includes(lastModel?.cue))audio.passBy(payload,settings);},
    update(state,angles,inputMode,steering,now,navigation=null){
      const crossings=sonicEvents.consume(state);
      if(!active)return;
      if(inputMode==='sensor')jitter.add(now,angles.pitch,state.mode==='flight'&&steering==='wrist'?angles.wrist:steering==='twist'?angles.twist:angles.steer);
      const model=flightFeedback(state,settings),phase=haptics.update(model,settings,now);
      const cueChanged=lastModel?.cue!==model.cue;lastModel=model;
      music.setAfterburner(state.mode==='flight'&&state.afterburner?.active===true);
      const afterburnerChanged=lastAfterburner!==model.afterburner.active;lastAfterburner=model.afterburner.active;
      if(now-lastAudio>=40||phase?.restarted||afterburnerChanged||cueChanged||crossings.length){audio.update(model,settings,phase,navigation);lastAudio=now;}
      for(const event of crossings){haptics.sonic(event,settings,now,model);audio.sonicTransition(event,settings);}
    },
    frameTiming(ms){if(active&&Number.isFinite(ms)){frames++;frameSum+=ms;frameMax=Math.max(frameMax,ms);}},
    reset(){briefingAudio.stop('reset');launchMusic.stop();jitter.reset();music.reset();audio.resetMetrics();sonicEvents.reset();frames=0;frameSum=0;frameMax=0;},
    exitOpened(){if(active)audio.event('exitOpen',settings);},
    report(){return {settings:{...settings},changedSettings:changedSettings(FEEDBACK_FIELDS,settings),vibrationSupported:supported,sensorJitter:jitter.snapshot(),
      audio:audio.snapshot(),music:music.snapshot(),launchMusic:launchMusic.snapshot(),briefingAudio:briefingAudio.snapshot(),sonicTransitions:sonicEvents.snapshot(),frameCpu:{meanMs:frames?frameSum/frames:0,maxMs:frameMax}};},
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

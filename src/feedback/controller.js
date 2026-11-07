import { loadFeedbackSettings, saveFeedbackSettings, normalizeFeedbackSettings, FEEDBACK_FIELDS } from './settings.js';
import { createGameAudio } from './audio.js';
import { flightFeedback } from './model.js';
import { createHaptics } from './haptics.js';
import { createSensorJitter } from './jitter.js';
import { isIPhone } from '../device-platform.js';

export function createFeedbackController(){
  let storage;try{storage=localStorage;}catch{/* Defaults work without storage. */}
  let settings=loadFeedbackSettings(storage),active=false,lastAudio=0;
  let frames=0,frameSum=0,frameMax=0;
  const audio=createGameAudio(),jitter=createSensorJitter();
  const supported=!isIPhone(navigator.userAgent)&&typeof navigator.vibrate==='function';
  const haptics=createHaptics(supported?navigator.vibrate.bind(navigator):null);
  const fields=document.getElementById('feedback-settings-fields');
  for(const [key,field] of Object.entries(FEEDBACK_FIELDS)){
    const label=document.createElement('label');label.htmlFor=`feedback-${key}`;
    const caption=document.createElement('span');caption.textContent=field.label;
    const input=document.createElement('input');input.id=label.htmlFor;
    const output=document.createElement('output');output.htmlFor=input.id;
    input.type=typeof field.initial==='boolean'?'checkbox':'range';
    if(input.type==='range')Object.assign(input,{min:field.min,max:field.max,step:field.step});
    label.dataset.feedbackSetting=key;label.append(caption,output,input);fields.append(label);
    if(['vibration','vibrationScale','engineVibration'].includes(key))label.hidden=!supported;
    input.addEventListener('input',()=>{
      settings=normalizeFeedbackSettings({...settings,[key]:input.type==='checkbox'?input.checked:Number(input.value)});
      if(['vibration','vibrationScale','engineVibration'].includes(key))jitter.reset();
      haptics.stop();if(!settings.sound||!settings.sfx)audio.stop();else if(active)audio.start();
      document.getElementById('feedback-save-status').textContent=saveFeedbackSettings(storage,settings)?'このブラウザーに保存しました。':'保存できません。この画面を開いている間だけ使います。';
      refresh();
    });
  }
  document.getElementById('vibration-support').textContent=supported?'振動は端末・ブラウザーの設定によって使えないことがあります。':'この端末ではゲームの振動を利用できません。音と表示でお知らせします。';
  function refresh(){
    for(const [key,field]of Object.entries(FEEDBACK_FIELDS)){
      const el=document.getElementById(`feedback-${key}`);if(el.type==='checkbox')el.checked=settings[key];else el.value=settings[key];
      el.previousElementSibling.textContent=el.type==='checkbox'?'':`${settings[key]}${field.unit||''}`;
    }
  }
  refresh();
  return {
    unlock(){haptics.arm();if(settings.sound)void audio.unlock();},
    start(){active=true;audio.start();},
    stop(){active=false;audio.stop();haptics.stop();jitter.clearWindow();},
    event(kind){haptics.event(kind,settings,performance.now());audio.event(kind,settings);},
    update(state,angles,inputMode,steering,now){
      if(!active)return;
      if(inputMode==='sensor')jitter.add(now,angles.pitch,steering==='twist'?angles.twist:angles.steer);
      const model=flightFeedback(state,settings);haptics.update(model,settings,now);
      if(now-lastAudio>=40){audio.update(model,settings);lastAudio=now;}
    },
    frameTiming(ms){if(active&&Number.isFinite(ms)){frames++;frameSum+=ms;frameMax=Math.max(frameMax,ms);}},
    reset(){jitter.reset();frames=0;frameSum=0;frameMax=0;},
    report(){return {settings:{...settings},vibrationSupported:supported,sensorJitter:jitter.snapshot(),
      audio:audio.snapshot(),frameCpu:{meanMs:frames?frameSum/frames:0,maxMs:frameMax}};},
    updateDiagnostics(){
      const s=audio.snapshot(),j=jitter.snapshot();
      document.getElementById('feedback-diagnostics').textContent=`入力の揺れ幅（操作も含む）1秒：機首 ${j.window.pitch.toFixed(1)}° / 旋回 ${j.window.steer.toFixed(1)}° ｜ 音源 ${(s.load*100).toFixed(1)}%・最大 ${(s.maxLoad*100).toFixed(1)}% ｜ 描画・操作CPU ${frames?(frameSum/frames).toFixed(1):'0.0'}ms`;
      document.getElementById('feedback-diagnostics').dataset.audio=JSON.stringify(s);
      document.getElementById('feedback-audio-status').textContent=s.status==='ready'?'音源の準備完了':s.status==='idle'?'音は開始ボタンを押した後に準備します。':'この環境では音を開始できません。音なしで遊べます。';
    },
  };
}

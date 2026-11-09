import './supersonic-panel.css';
import {SUPERSONIC_SETTING_FIELDS,loadSupersonicSettings,saveSupersonicSettings} from './supersonic/settings.js';
import {createRangeEditor} from './range-editor.js';
import {createSonicEventConsumer} from './feedback/supersonic-model.js';
import {viewportInsets} from './viewport-insets.js';
export {formatSupersonicAltitude} from './supersonic-presentation.js';

const labels={maxG:'最大G',fuelMode:'ABの燃料',pitchGain:'高速空域の機首の効き',radarRange:'高速空域のレーダー範囲'};
const units={maxG:'G',pitchGain:'倍',radarRange:'m'};
const changeText=(el,text)=>{if(el.textContent!==text)el.textContent=text;};
const visible=el=>el&&!el.hasAttribute('hidden')&&el.getClientRects().length>0;

export function createSupersonicPanel({storage,onChange=()=>{},settingsHost}={}){
  const app=document.getElementById('app');
  if(storage===undefined)try{storage=localStorage;}catch{/* Defaults remain available. */}
  let settings=loadSupersonicSettings(storage),active=false,courseOwned=false,effective=null,noticeUntil=0,notice='',lastState=null;
  const events=createSonicEventConsumer(),editors=new Map();
  const fields=document.createElement('fieldset');fields.id='supersonic-settings';fields.className='supersonic-settings';fields.hidden=true;
  const legend=document.createElement('legend');legend.textContent='高速空域（試作）の設定';
  const help=document.createElement('p');help.textContent='最大G・燃料・機首の効きは、次の新しい飛行から適用します。レーダー範囲だけ今の表示に反映します。';
  const effectiveText=document.createElement('p');effectiveText.id='supersonic-effective-settings';
  const saveText=document.createElement('p');saveText.id='supersonic-save-status';saveText.setAttribute('role','status');
  fields.append(legend,help,effectiveText);
  for(const field of SUPERSONIC_SETTING_FIELDS){
    const label=document.createElement('label');label.htmlFor=`supersonic-${field.key}`;
    const caption=document.createElement('span');caption.textContent=labels[field.key];
    const input=document.createElement(field.type==='select'?'select':'input');input.id=label.htmlFor;
    if(field.type==='select')for(const option of field.options)input.add(new Option(option.value==='unlimited'?'無制限':'ゲージ制',option.value));
    else Object.assign(input,{type:'range',min:field.min,max:field.max,step:field.step});
    input.value=String(settings[field.key]);
    const output=document.createElement('output');output.htmlFor=input.id;
    const render=()=>{output.textContent=field.type==='select'?'':`${settings[field.key]}${units[field.key]??''}`;};render();
    label.append(caption,output,input);fields.append(label);
    input.addEventListener('input',()=>{
      const result=saveSupersonicSettings(storage,{...settings,[field.key]:field.type==='select'?input.value:Number(input.value)});
      settings=result.settings;render();saveText.textContent=result.saved?'このブラウザーに保存しました。':'保存できません。この画面を開いている間だけ使います。';
      refreshEffective();onChange({...settings},{key:field.key,saved:result.saved});
    });
    if(field.type!=='select')editors.set(field.key,createRangeEditor(input,{name:labels[field.key],unit:units[field.key],initial:field.defaultValue}));
  }
  fields.append(saveText);(settingsHost??document.getElementById('flight-adjustments')??app).append(fields);
  const courseNote=document.createElement('fieldset');courseNote.id='sierra10-settings';courseNote.hidden=true;courseNote.className='supersonic-settings';
  courseNote.innerHTML='<legend>シエラ1/10・亜音速の設定</legend><p>初速150m/s・通常推力の水平終速250m/s・AB上限300m/s・最大9G。燃料はゲージ制です。高速空域の保存設定は変えません。</p>';
  fields.after(courseNote);
  const hud=document.createElement('section');hud.id='supersonic-hud';hud.className='supersonic-hud';hud.hidden=true;hud.setAttribute('aria-label','SUPERSONIC FLIGHT');
  const card=document.createElement('div');card.id='supersonic-mach-g';card.className='supersonic-mach-g';
  const mach=document.createElement('strong');mach.id='supersonic-mach';
  const g=document.createElement('span');g.id='supersonic-g';
  const status=document.createElement('small');status.id='supersonic-transition-notice';status.setAttribute('role','status');
  card.append(mach,g,status);hud.append(card);app.append(hud);
  function refreshEffective(){
    const describe=value=>`${value.maxG}G・${value.fuelMode==='unlimited'?'燃料無制限':'燃料ゲージ'}・機首${value.pitchGain}倍`;
    changeText(effectiveText,effective?`現在の飛行：${describe(effective)}。次の新しい飛行：${describe(settings)}。`:`次の新しい飛行：${describe(settings)}。`);
  }
  refreshEffective();
  function getObstacleRects(){
    if(!visible(hud)||!visible(card))return [];
    const r=card.getBoundingClientRect();return [{id:card.id,left:r.left,right:r.right,top:r.top,bottom:r.bottom}];
  }
  function observeEvents(state,{phase,now=0}={}){
    const crossings=events.consume(state);
    if(!active||!state?.supersonic||phase!=='running'){noticeUntil=0;notice='';return;}
    for(const event of crossings){notice=event.direction==='up'?'SUPERSONIC':'SUBSONIC';noticeUntil=now+1100;}
  }
  function updateState(state,{phase,camera='overlay',now=0,hudLanguage='en'}={}){
    observeEvents(state,{phase,now});const sonic=state?.supersonic;
    if(sonic?.effectiveSettings){effective={...sonic.effectiveSettings};refreshEffective();}
    const running=active&&Boolean(sonic)&&phase==='running';hud.hidden=!running;
    if(!running){noticeUntil=0;notice='';return;}
    if(now>=noticeUntil){noticeUntil=0;notice='';}
    changeText(mach,Number.isFinite(sonic.mach)?`M ${sonic.mach.toFixed(2)}`:'M —');
    changeText(g,Number.isFinite(sonic.gLoad)?`G ${sonic.gLoad.toFixed(1)}`:'G —');
    const maxG=sonic.effectiveSettings?.maxG??sonic.maxG;
    changeText(status,now<noticeUntil?notice:Number.isFinite(maxG)?`MAX ${maxG.toFixed(1)} G`:'MAX —');
    card.dataset.camera=camera;card.dataset.transition=now<noticeUntil?notice.toLowerCase():'';
    card.setAttribute('aria-label',hudLanguage==='ja'?`マッハ ${Number.isFinite(sonic.mach)?sonic.mach.toFixed(2):'不明'}、現在G ${Number.isFinite(sonic.gLoad)?sonic.gLoad.toFixed(1):'不明'}`:`${mach.textContent}, ${g.textContent}`);
    const safe=viewportInsets(),source=document.getElementById(camera==='cockpit'?'cockpit-speed':'flight-essential-speed');
    const r=source?.getBoundingClientRect(),wide=innerWidth>=600&&innerHeight<=500;
    let left=safe.left+12,top=160;
    if(r&&r.width){
      if(camera==='cockpit'){left=wide?r.right+8:r.left;top=wide?r.top:r.top-66;}
      else {left=r.left;top=r.bottom+6;}
    }
    Object.assign(card.style,{left:`${left}px`,top:`${top}px`});
    lastState={mach:sonic.mach,gLoad:sonic.gLoad,maxG,phase,camera};
  }
  return {
    setCourse(course){courseOwned=course?.id==='sierra10';hud.setAttribute('aria-label',courseOwned?'SUBSONIC FLIGHT':'SUPERSONIC FLIGHT');fields.hidden=!active||courseOwned;courseNote.hidden=!active||!courseOwned;},
    setActive(value){active=value===true;fields.hidden=!active||courseOwned;courseNote.hidden=!active||!courseOwned;if(!active){hud.hidden=true;noticeUntil=0;notice='';}},
    getSettings:()=>({...settings}),observeEvents,updateState,getObstacleRects,
    snapshot:()=>({active,settings:{...settings},effectiveSettings:effective?{...effective}:null,readings:lastState?{...lastState}:null,events:events.snapshot(),notice:noticeUntil?notice:null}),
    dispose(){fields.remove();courseNote.remove();hud.remove();editors.clear();},
  };
}

import './start-flow.css';
import {APP_VERSION} from './version.js';

const $=id=>document.getElementById(id);
const cameraNames={overlay:'外から',chase:'後方',cockpit:'操縦席'};
const slides=[
  {title:'上辺を起こすと、上昇',text:'スマホを楽な角度で持ち、画面の上辺を少し起こします。前へ倒すと下降します。',kind:'pitch'},
  {title:'左右の端を下げて、旋回',text:'右端を下げると右へ、左端を下げると左へ。スマホを中立へ戻すと、翼も水平へ戻ります。',kind:'bank'},
  {title:'出力を上げて、直線を飛ぶ',text:'下の出力を横に動かして加速。ゲージがあれば、右端の先の110%でABが使えます。100%に戻すと解除します。',kind:'throttle'},
];
const button=(id,action,label,kind='secondary')=>`<button id="${id}" class="flow-button flow-button-${kind}" type="button" data-flow-action="${action}">${label}</button>`;
const titleIcon=kind=>`<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${kind==='settings'?'<path d="M5 6h14M5 12h14M5 18h14"/><circle cx="9" cy="6" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="10" cy="18" r="2"/>':'<path d="M12 6c-3-2-6-2-9-1v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1Zm0 0v14"/>'}</svg>`;
const titleTarget=(x,y)=>`<g class="flow-title-target" transform="translate(${x} ${y})"><circle class="flow-target-halo" r="17"/><path d="M0-11 11 0 0 11-11 0Z"/><path class="flow-target-core" d="M-4 0H4M0-4V4"/></g>`;
const cameraPicker=id=>`<div id="${id}" class="flow-camera-picker" role="group" aria-label="視点">${Object.entries(cameraNames).map(([value,label])=>`<button type="button" data-flow-action="camera-select" data-flow-value="${value}" aria-pressed="false">${label}</button>`).join('')}</div>`;
const phoneDiagram=kind=>`<svg class="flow-tutorial-diagram" viewBox="0 0 260 160" aria-hidden="true"><path class="flow-diagram-horizon" d="M22 120H238"/><g class="flow-phone flow-phone-${kind}"><rect x="91" y="24" width="78" height="116" rx="12"/><rect x="99" y="37" width="62" height="82" rx="4"/><path d="M119 30H141M123 130H137"/></g>${kind==='pitch'?'<path class="flow-diagram-arrow" d="M52 105V52m-13 15 13-15 13 15M208 55v53m-13-15 13 15 13-15"/>':kind==='bank'?'<path class="flow-diagram-arrow" d="M39 50v56m-12-15 12 15 12-15M221 108V52m-12 15 12-15 12 15"/>':'<path class="flow-diagram-arrow" d="M39 76H221m-15-12 15 12-15 12"/><circle class="flow-diagram-knob" cx="192" cy="76" r="12"/>'}</svg>`;

/** Screen rendering only. The caller owns permissions, persistence and flight. */
export function createStartFlowPanel({enabled=true,dev=false,onAction=()=>{}}={}){
  if(!enabled)return {show(){},hide(){},setCourses(){},setSettings(){},refreshPlayControls(){},get element(){return null;}};
  const app=$('app');
  const aircraftImage=new URL('./menu-aircraft.webp',document.baseURI);aircraftImage.searchParams.set('v',APP_VERSION);
  app.dataset.startFlow='on';
  const root=document.createElement('section');root.id='start-flow-panel';root.className='start-flow-panel';root.hidden=true;
  root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.dataset.step='title';
  root.innerHTML=`
    <section class="flow-screen flow-title" data-flow-screen="title" aria-labelledby="start-flow-title-heading" hidden>
      <div class="flow-title-art" aria-hidden="true"><svg class="flow-title-route" viewBox="0 0 420 320"><path class="flow-route" d="M-12 291 102 225 78 134 239 73 361 113 431 21"/>${titleTarget(102,225)}${titleTarget(78,134)}${titleTarget(239,73)}<g class="flow-exit"><path class="flow-exit-depth" d="M343 137V92h36v45l-6-6V101h-24v30Z"/><path d="M343 137V92h36v45M349 131V101h24v30"/><path class="flow-exit-threshold" d="M339 139h44"/></g></svg><img class="flow-title-aircraft" src="${aircraftImage.href}" alt="" width="768" height="768" decoding="async" draggable="false"></div>
      <div class="flow-title-copy"><h1 id="start-flow-title-heading">TWIST <span>VECTOR</span></h1><p>Tilt to Play.</p></div>
      <div class="flow-title-actions">${button('start-flow-start','start','はじめる','primary')}<div class="flow-inline-actions">${button('start-flow-title-settings','settings',titleIcon('settings')+'<span>設定</span>','text')}${button('start-flow-title-help','help',titleIcon('help')+'<span>遊び方</span>','text')}</div></div>
      <footer class="flow-title-credit"><span class="flow-author-signature">SIKUMI LAB</span><small id="start-flow-version"></small></footer>
      <div id="start-flow-title-platform" class="flow-platform"></div>
    </section>
    <section class="flow-screen flow-tutorial" data-flow-screen="tutorial" aria-labelledby="start-flow-tutorial-title" hidden>
      <header class="flow-screen-header"><p id="start-flow-tutorial-count" class="flow-step-count"></p>${button('start-flow-tutorial-skip','tutorial-skip','スキップ','text')}</header>
      <div id="start-flow-tutorial-picture"></div><h2 id="start-flow-tutorial-title"></h2><p id="start-flow-tutorial-text" class="flow-description"></p>
      <footer class="flow-screen-footer">${button('start-flow-tutorial-back','tutorial-back','戻る')}${button('start-flow-tutorial-next','tutorial-next','次へ','primary')}</footer>
    </section>
    <section class="flow-screen flow-courses" data-flow-screen="courses" aria-labelledby="start-flow-courses-title" hidden>
      <header class="flow-screen-header"><h2 id="start-flow-courses-title">コースを選ぶ</h2>${button('start-flow-course-settings','settings','設定','text')}</header>
      <div class="flow-course-stage"><section id="start-flow-selected-course" class="flow-selected-course" aria-labelledby="start-flow-selected-course-name"><h3 id="start-flow-selected-course-name"></h3><div id="start-flow-course-preview" class="flow-selected-route" aria-hidden="true"></div><p id="start-flow-selected-course-detail"></p><p id="start-flow-selected-course-best"></p></section><div id="start-flow-course-cards" class="flow-course-cards" role="group" aria-label="コース"></div></div>
      ${cameraPicker('start-flow-course-camera')}
      <footer class="flow-screen-footer">${button('start-flow-courses-back','title','タイトルへ','text')}${button('start-flow-course-start','course-start','このコースへ','primary')}</footer>
    </section>
    <section class="flow-screen flow-pose" data-flow-screen="pose" aria-labelledby="start-flow-pose-title" hidden>
      <div class="flow-pose-symbol" aria-hidden="true">${phoneDiagram('pitch')}</div><h2 id="start-flow-pose-title">楽な持ち方で構える</h2>
      <p id="start-flow-pose-description" class="flow-description">スマホを見やすい角度で持ち、ボタンを押してください。</p><p id="start-flow-pose-note" class="flow-note"></p><p id="start-flow-pose-error" class="flow-error" role="alert" hidden></p><div id="start-flow-pose-platform" class="flow-platform"></div>
      <footer class="flow-pose-actions">${button('start-flow-hold','hold','この持ち方で始める','primary')}${button('start-flow-pose-settings','settings','操作の方法を設定する','text')}${button('start-flow-pose-back','courses','コース選択へ','text')}</footer>
    </section>
    <section class="flow-screen flow-countdown" data-flow-screen="countdown" aria-labelledby="start-flow-countdown-title" hidden><h2 id="start-flow-countdown-title">そのまま、構えて</h2><output id="start-flow-countdown" aria-live="polite">3</output><p id="start-flow-countdown-note">まもなく飛行を始めます。</p>${button('start-flow-countdown-cancel','countdown-cancel','戻る','text')}</section>
    <section class="flow-screen flow-pause" data-flow-screen="pause" aria-labelledby="start-flow-pause-title" hidden><h2 id="start-flow-pause-title">ひと休み</h2><p id="start-flow-pause-description" class="flow-description"></p><div class="flow-pause-actions">${button('start-flow-resume','resume','再開','primary')}${button('start-flow-recenter','recenter','持ち方を合わせ直す')}${button('start-flow-map','map','地図を見る')}${button('start-flow-pause-settings','settings','設定')}</div>${cameraPicker('start-flow-pause-camera')}<div id="start-flow-pause-platform" class="flow-platform"></div>${button('start-flow-course-exit','course-exit','コース選択へ','text')}</section>
    <section class="flow-screen flow-settings" data-flow-screen="settings" aria-labelledby="start-flow-settings-title" hidden><header class="flow-screen-header"><h2 id="start-flow-settings-title">設定</h2>${button('start-flow-settings-close','settings-close','閉じる')}</header><div id="start-flow-settings-body" class="flow-settings-body"><div id="start-flow-settings-extra" class="flow-settings-extra"></div><div id="start-flow-adjustments-host"></div><details id="start-flow-input-history" class="flow-settings-group"><summary>画面操作の値・履歴</summary><p class="flow-note">飛行中と同じ入力の値です。履歴と初期値をここで確認できます。</p></details><details id="start-flow-record-details" class="flow-settings-group"><summary>今回の詳しい記録</summary><div id="start-flow-record-host"></div></details><div id="start-flow-settings-platform" class="flow-platform"></div></div></section>
    <section class="flow-screen flow-result" data-flow-screen="result" aria-labelledby="start-flow-result-title" hidden><h2 id="start-flow-result-title">おつかれさまでした</h2><p id="start-flow-result-description" class="flow-description"></p><div id="start-flow-result-summary" class="flow-result-summary"></div><footer class="flow-result-actions">${button('start-flow-retry','retry','もう一度','primary')}${button('start-flow-result-courses','course-exit','コース選択へ')}<div id="start-flow-result-copy-host"></div>${button('start-flow-result-details','settings','詳しい記録・設定','text')}</footer></section>
    <section class="flow-screen flow-confirm" data-flow-screen="confirm-exit" aria-labelledby="start-flow-confirm-title" hidden><h2 id="start-flow-confirm-title">飛行を終えますか？</h2><p class="flow-description">今の飛行を終えて、コース選択へ戻ります。</p><footer class="flow-screen-footer">${button('start-flow-confirm-cancel','confirm-cancel','飛行へ戻る')}${button('start-flow-confirm-exit','confirm-course-exit','コース選択へ','primary')}</footer></section>`;
  app.append(root);
  $('start-flow-result-details').dataset.flowValue='records';
  const view=document.createElement('button');view.id='start-flow-view-button';view.className='start-flow-view-button';view.type='button';view.hidden=true;view.dataset.flowAction='camera-cycle';view.textContent='視点';view.setAttribute('aria-label','視点を切り替える');app.append(view);
  let settings={camera:'overlay',inputMethod:'sensor',briefingMode:'every',mode:'flight',steering:'tilt'},cards=[],step='',selectedCourseId=null,renderedCourse=null,renderedPreviewCourse=null,renderedPreviewWidth=null,renderedPreviewHeight=null;
  const move=(id,host)=>{const element=$(id);if(element&&host)host.append(element);return element;};
  const text=(id,value)=>{if(value!==undefined&&$(id).textContent!==String(value))$(id).textContent=String(value);};

  // Move existing objects, preserving their listeners, IDs and persisted values.
  move('flight-adjustments',$('start-flow-adjustments-host'));
  const records=move('flight-result',$('start-flow-record-host'));
  const readings=records?.querySelector('.result-readings');if(readings)$('start-flow-result-summary').append(readings);
  $('result-course-time')?.closest('div')?.classList.add('flow-result-current');$('result-best-time')?.closest('div')?.classList.add('flow-result-best');
  const outcome=$('result-outcome');if(outcome)$('start-flow-result-summary').prepend(outcome);
  move('result-best-status',$('start-flow-result-summary'));
  for(const id of ['result-copy','result-copy-status','result-copy-text'])move(id,$('start-flow-result-copy-host'));
  for(const id of ['installation-advice','install-button','update-notice'])move(id,$('start-flow-title-platform'));
  for(const id of ['release-screen-button','installed-screen-advice'])move(id,$('start-flow-settings-platform'));
  move('orientation-notice',$('start-flow-pose-platform'));

  const extra=$('start-flow-settings-extra');
  extra.innerHTML=`<label class="flow-setting-select" for="start-flow-input-method">操作の方法<select id="start-flow-input-method"><option value="sensor">スマホの傾き</option><option value="practice">画面で操縦</option></select></label><p class="flow-note">スマホの傾きが使えない場合は、「画面で操縦」を選べます。</p><label class="flow-setting-select" for="start-flow-briefing-mode">開始前の地図<select id="start-flow-briefing-mode"><option value="every">毎回表示する</option><option value="first">コースごとに初回だけ</option><option value="off">表示しない</option></select></label>`;
  const fields=$('flight-settings-fields');
  const hudLayoutRow=$('setting-hudLayout')?.closest('label');if(hudLayoutRow){hudLayoutRow.classList.add('flow-setting-select');extra.append(hudLayoutRow);}
  const basic=document.createElement('details'),advanced=document.createElement('details'),verification=document.createElement('details');
  for(const [element,label]of [[basic,'① 基本の操縦'],[advanced,'② 詳しい設定'],[verification,'④ 検証用の表示・操作']]){element.className='flow-settings-group';const summary=document.createElement('summary');summary.textContent=label;element.append(summary);}
  basic.open=true;
  const basicKeys=new Set(['deadzone','maxTilt','maxPitch','timeConstant','maxSteerTilt','steerTiltDeadzone','maxSteerTwist','steerTwistDeadzone','maxSteerWrist','steerWristDeadzone','steerCurve','maxBank','turnGravity']);
  for(const row of [...fields.querySelectorAll(':scope > label')]) (basicKeys.has(row.dataset.settingKey)?basic:advanced).append(row);
  fields.append(basic,advanced);
  move('flight-steering-picker',basic);move('wrist-sensitivity-presets',basic);move('flight-display-picker',advanced);
  move('flight-pitch-picker',verification);const oldView=$('view-assisted')?.closest('.view-picker');if(oldView)verification.append(oldView);
  move('motion-explanation',verification);
  const devModes=$('mode-explore')?.closest('.mode-picker');if(devModes){devModes.dataset.flowDevOnly='true';verification.append(devModes);}
  const oldCourse=$('course-picker');if(oldCourse){oldCourse.dataset.flowDevOnly='true';verification.append(oldCourse);}
  const oldCamera=move('flight-camera-picker',advanced);if(oldCamera)oldCamera.dataset.flowLegacyPicker='true';
  const feedback=$('feedback-settings-fields')?.closest('fieldset');if(feedback){const sound=document.createElement('details');sound.className='flow-settings-group';const summary=document.createElement('summary');summary.textContent='③ 音と振動';sound.append(summary,feedback);fields.after(sound);sound.after(verification);}
  const radar=$('radar-upgrade-notice');const radarRow=$('setting-radarRange')?.closest('label');if(radar&&radarRow)radarRow.after(radar);
  root.querySelectorAll('[data-flow-dev-only]').forEach(element=>element.hidden=!dev);
  // The details remain available in settings; active input rows keep values and +/-.
  for(const input of ['practice-pitch','practice-steer','practice-twist'].map($)){
    const row=input?.closest('label');if(!row)continue;
    row.dataset.flowInput=input.id.replace('practice-','');
    if(row.firstChild?.nodeType===3){const caption=document.createElement('span');caption.className='flow-practice-label';row.firstChild.replaceWith(caption);caption.textContent=input.id==='practice-pitch'?'上辺の傾き':input.id==='practice-steer'?'右辺の傾き':'回し角度';}
    const history=row.querySelector('.range-history');if(history){const group=document.createElement('section');group.className='flow-input-history-row';const heading=document.createElement('h3');heading.textContent=row.firstChild.textContent.trim();group.append(heading,history);$('start-flow-input-history').append(group);}
    const value=document.createElement('output');value.className='flow-practice-value';value.htmlFor=input.id;
    const update=()=>{value.textContent=`${Number(input.value)}°`;};input.addEventListener('input',update);input.addEventListener('change',update);row.append(value);update();
  }
  const playActions=document.createElement('div');playActions.className='flow-play-actions';const toolbar=$('pause-button')?.closest('.toolbar'),footer=$('practice-neutral')?.closest('.practice-footer');if(toolbar)playActions.append(toolbar);if(footer)playActions.append(footer);$('bottom-panel').append(playActions);

  const dispatch=event=>{const target=event.target.closest('[data-flow-action]');if(!target||target.disabled)return;const action=target.dataset.flowAction;onAction(action,target.dataset.flowValue??target.dataset.courseId);};
  root.addEventListener('click',dispatch);view.addEventListener('click',dispatch);
  $('start-flow-input-method').addEventListener('change',event=>onAction('input-method',event.target.value));
  $('start-flow-briefing-mode').addEventListener('change',event=>onAction('briefing-mode',event.target.value));
  root.addEventListener('keydown',event=>{if(event.key!=='Escape')return;if(step==='settings')onAction('settings-close');else if(step==='confirm-exit')onAction('confirm-cancel');});
  function refreshPlayControls(){
    app.dataset.flowInputMethod=settings.inputMethod;
    app.dataset.flowSteering=settings.steering??'tilt';
    const steerCaption=$('practice-steer')?.closest('label')?.querySelector('.flow-practice-label');
    if(steerCaption)steerCaption.textContent=settings.mode==='flight'&&settings.steering==='wrist'?'手首の回転（仮想）':'右辺の傾き';
    app.dataset.flowCamera=settings.camera;
    for(const input of ['practice-pitch','practice-steer','practice-twist'].map($))if(input){const value=input.closest('label')?.querySelector('.flow-practice-value');if(value)value.textContent=`${Number(input.value)}°`;}
    if(!view.hidden){
      const left=$('recenter-button').getBoundingClientRect(),right=$('help-button').getBoundingClientRect(),pause=$('pause-button').getBoundingClientRect();
      const available=right.left-left.right-16;let width=Math.min(88,Math.max(44,available)),x=Math.max(left.right+8,Math.min(innerWidth/2-width/2,right.left-8-width)),y=pause.top+pause.height/2-22;
      if(available<44){
        width=88;
        if(innerWidth>=600&&innerHeight<=500){const practice=$('practice-panel').getBoundingClientRect(),panel=$('bottom-panel').getBoundingClientRect();x=(practice.right+panel.left-width)/2;}
        else{const throttle=$('flight-throttle').getBoundingClientRect();x=throttle.left+(throttle.width-width)/2;y=pause.top-52;}
      }
      Object.assign(view.style,{left:x+'px',top:y+'px',width:width+'px'});view.dataset.compact=String(width<70);
    }
  }
  function setSettings(data={}){
    settings={...settings,...data};if(data.playMode)settings.mode=data.playMode;
    if(data.selectedCourseId!==undefined)selectedCourseId=data.selectedCourseId;else if(data.courseId!==undefined)selectedCourseId=data.courseId;
    if(settings.inputMethod==='screen')settings.inputMethod='practice';
    $('start-flow-input-method').value=settings.inputMethod;
    $('start-flow-briefing-mode').value=settings.briefingMode;
    root.querySelectorAll('[data-flow-action="camera-select"]').forEach(element=>element.setAttribute('aria-pressed',String(element.dataset.flowValue===settings.camera)));
    const cameraName=cameraNames[settings.camera]??cameraNames.overlay;
    if(view.dataset.camera!==settings.camera){view.innerHTML='<span class="flow-view-copy"><small>視点</small><strong></strong></span>';view.querySelector('strong').textContent=cameraName;view.dataset.camera=settings.camera;}
    view.setAttribute('aria-label',settings.camera==='chase'?'操縦席視点へ切り替える':'後方視点へ切り替える');
    view.hidden=step!=='play'||settings.mode==='explore'||settings.camera==='overlay';
    const pauseCamera=$('start-flow-pause-camera');pauseCamera.hidden=settings.camera==='overlay';pauseCamera.querySelector('[data-flow-value=overlay]').hidden=true;
    $('start-flow-course-cards').querySelectorAll('[data-course-id]').forEach(element=>element.setAttribute('aria-pressed',String(element.dataset.courseId===selectedCourseId)));
    if(step==='courses')renderSelectedCourse();
    refreshPlayControls();
  }
  const courseDetail=card=>card.detail??`光${card.targetCount??''}個${card.timeHint?` · ${card.timeHint}`:''}`;
  function courseBest(card){
    const value=String(card.bestLabel??(Number.isFinite(card.bestSeconds)?`${card.bestSeconds.toFixed(1)}秒`:'まだ記録なし'));
    return value.startsWith('自己ベスト')?value:`自己ベスト ${value}`;
  }
  function renderSelectedCourse(){
    const card=cards.find(item=>item.id===selectedCourseId)??cards[0],section=$('start-flow-selected-course');section.hidden=!card;
    if(!card)return;
    if(renderedCourse!==card){
      renderedCourse=card;section.dataset.selectedCourseId=card.id;text('start-flow-selected-course-name',card.name);text('start-flow-selected-course-detail',courseDetail(card));text('start-flow-selected-course-best',courseBest(card));
    }
    const picture=$('start-flow-course-preview'),box=picture.getBoundingClientRect(),width=Math.round(box.width),height=Math.round(box.height);
    const factory=typeof card.createPreviewSVG==='function'&&Number.isFinite(width)&&Number.isFinite(height)&&width>22&&height>22;
    const renderedWidth=factory?width:null,renderedHeight=factory?height:null;
    if(renderedPreviewCourse===card&&renderedPreviewWidth===renderedWidth&&renderedPreviewHeight===renderedHeight)return;
    let preview=card.previewSvg??card.previewSVG,mode='fallback';
    if(factory){try{const value=card.createPreviewSVG({width,height});if(typeof value==='string'||value?.cloneNode){preview=value;mode='factory';}}catch{/* Existing SVG remains usable if an optional renderer fails. */}}
    renderedPreviewCourse=card;renderedPreviewWidth=renderedWidth;renderedPreviewHeight=renderedHeight;picture.replaceChildren();
    if(typeof preview==='string')picture.innerHTML=preview;else if(preview?.cloneNode)picture.append(preview.cloneNode(true));
    picture.dataset.previewMode=mode;if(mode==='factory'){picture.dataset.previewWidth=String(width);picture.dataset.previewHeight=String(height);}else{delete picture.dataset.previewWidth;delete picture.dataset.previewHeight;}
  }
  function setCourses(value=[]){
    cards=Array.isArray(value)?value:[];renderedCourse=null;const list=$('start-flow-course-cards'),focusedCourse=list.contains(document.activeElement)?document.activeElement.dataset.courseId:null;let replacementFocus=null;list.replaceChildren();list.dataset.courseCount=String(cards.length);
    for(const card of cards){
      const element=document.createElement('button');element.type='button';element.className='flow-course-card';element.dataset.flowAction='course-select';element.dataset.courseId=card.id;element.setAttribute('aria-pressed',String(card.id===selectedCourseId));
      const description=document.createElement('span');description.className='flow-course-description';
      const [label,...remainder]=card.choiceLabel?[card.choiceLabel,card.choiceDetail??'']:String(card.name).split('・'),title=document.createElement('strong');title.textContent=label;
      const hint=document.createElement('span');hint.textContent=remainder.join('・')||(card.detail?String(card.detail).split(' · ')[0]:`${card.targetCount??''}個の目標`);
      element.setAttribute('aria-label',`${card.name}。${courseDetail(card)}。${courseBest(card)}`);description.append(title,hint);element.append(description);list.append(element);
      if(card.id===focusedCourse)replacementFocus=element;
    }
    renderSelectedCourse();
    replacementFocus?.focus({preventScroll:true});
  }
  function show(next,data={}){
    const changed=step!==next;step=next;root.dataset.step=next;app.dataset.startStep=next;
    setSettings(data);
    if(next!=='settings'&&$('flight-adjustments').open)$('flight-adjustments').open=false;
    if(next==='play'||next==='briefing'){root.hidden=true;view.hidden=next!=='play'||settings.mode==='explore'||settings.camera==='overlay';if(next==='play'&&changed&&settings.inputMethod==='practice')$('practice-panel').open=true;refreshPlayControls();return;}
    root.hidden=false;view.hidden=true;
    for(const element of root.querySelectorAll('[data-flow-screen]'))element.hidden=element.dataset.flowScreen!==next;
    if(next==='courses')renderSelectedCourse();
    const screen=root.querySelector(`[data-flow-screen="${next}"]`);if(screen?.getAttribute('aria-labelledby'))root.setAttribute('aria-labelledby',screen.getAttribute('aria-labelledby'));
    if(next==='title'){text('start-flow-version',data.version?`v${String(data.version).replace(/^v/,'')}`:document.querySelector('.version b')?.textContent??'');$('start-flow-start').disabled=Boolean(data.loading||data.disabled);text('start-flow-start',data.loading?'準備しています…':'はじめる');}
    if(next==='tutorial'){
      const index=Math.max(0,Math.min(2,data.slide??data.index??0)),slide=index===1&&settings.steering==='wrist'?{title:'手首を回して、旋回',text:'楽な持ち方を中立に合わせます。手首を右へ回すと右旋回、戻すと翼が水平へ。前腕の方向はスマホの持ち方から推定します。',kind:'bank'}:index===1&&settings.steering==='twist'?{title:'水平のまま回して、旋回',text:'時計回りに回すと右へ、反時計回りなら左へ。中立へ戻すと、翼も水平へ戻ります。',kind:'bank'}:slides[index];root.dataset.slide=String(index);text('start-flow-tutorial-count',`${index+1} / 3`);text('start-flow-tutorial-title',slide.title);text('start-flow-tutorial-text',slide.text);$('start-flow-tutorial-picture').innerHTML=phoneDiagram(slide.kind);$('start-flow-tutorial-back').disabled=index===0;text('start-flow-tutorial-next',index===2?'コースを選ぶ':'次へ');
    }
    if(next==='pose'){
      text('start-flow-pose-title',data.title??'楽な持ち方で構える');text('start-flow-pose-description',data.description??(settings.inputMethod==='practice'?'画面の入力で操縦します。準備ができたら始めましょう。':'スマホを見やすい角度で持ち、ボタンを押してください。'));
      text('start-flow-pose-note',data.note??'');text('start-flow-pose-error',data.error??'');$('start-flow-pose-error').hidden=!data.error;$('start-flow-hold').disabled=Boolean(data.disabled||data.loading);text('start-flow-hold',data.loading?'準備しています…':data.buttonLabel??(settings.inputMethod==='practice'?'画面操作で始める':'この持ち方で始める'));
    }
    if(next==='countdown'){
      const number=data.number??3,preparing=number==='…';
      text('start-flow-countdown',number);$('start-flow-countdown').setAttribute('aria-label',preparing?'開始準備中':String(number));
      text('start-flow-countdown-title',preparing?'開始の準備をしています':'そのまま、構えて');
      text('start-flow-countdown-note',preparing?'少しお待ちください。そのまま構えてください。':'まもなく飛行を始めます。');
    }
    if(next==='pause'){text('start-flow-pause-description',data.description??'飛行と時間は止まっています。');for(const id of ['release-screen-button','installed-screen-advice','update-notice'])move(id,$('start-flow-pause-platform'));}
    if(next==='title')move('update-notice',$('start-flow-title-platform'));
    if(next==='settings'){
      const adjustments=$('flight-adjustments');adjustments.hidden=false;adjustments.open=true;for(const id of ['release-screen-button','installed-screen-advice'])move(id,$('start-flow-settings-platform'));
      if(data.section==='records')$('start-flow-record-details').open=true;
    }
    if(next==='result'){screen.dataset.newBest=String(data.newBest===true);text('start-flow-result-title',data.title??($('result-outcome').textContent==='clear'?'コースクリア':$('result-outcome').textContent==='クリア'?'コースクリア':$('result-outcome').textContent==='墜落'?'地面に接触しました':'おつかれさまでした'));text('start-flow-result-description',data.description??cards.find(card=>card.id===selectedCourseId)?.name??'今回の記録です。');}
    if(changed){const focus=screen?.querySelector('.flow-button-primary')??screen?.querySelector('button');focus?.focus({preventScroll:true});}
  }
  if(typeof ResizeObserver==='function'){
    const observer=new ResizeObserver(()=>{if(step==='courses')renderSelectedCourse();});observer.observe($('start-flow-course-preview'));
  }
  return {show,hide(){show('play');},setCourses,setSettings,refreshPlayControls,get element(){return root;}};
}

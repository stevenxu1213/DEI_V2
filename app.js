'use strict';
(() => {
 const M=window.BelongState, KEY='belong-learning-v3';
 const screens=Array.from(document.querySelectorAll('.screen[data-screen]'));
 const screenById=new Map(screens.map(s=>[s.dataset.screen,s]));
 const originals=new Map(screens.map(s=>[s.dataset.screen,s.innerHTML]));
 const at=(scope,id)=>scope.querySelector('[data-node-id="'+id+'"]');
 const content=s=>s.querySelector('main');
 const label=e=>e.textContent.trim();
 const normalize=s=>s.replace(/^[A-C]\s+/,'').replace(/[’‘]/g,"'").replace(/\s+/g,' ').trim();
 const questions=Array.from({length:8},(_,i)=>{
  const variants=screens.filter(s=>s.dataset.title.startsWith('Q'+(i+1)));
  const base=variants.find(s=>s.dataset.title.startsWith('Q'+(i+1)+' ·'));
  const choices=Array.from(base.querySelectorAll('.answer-option')).map(e=>({html:e.outerHTML,text:label(e)}));
  const review=Array.from(content(screenById.get('16:385')).children).filter(e=>e.querySelectorAll('p').length===3)[i];
  const expected=review.children[1].textContent.split(' · ').slice(1).join(' · ');
  const correct=choices.findIndex(c=>normalize(c.text)===normalize(expected));
  if(correct!==0)throw new Error('The answer key must be verified against the existing answer review: question '+(i+1));
  return {base:base.dataset.screen,selected:variants.find(s=>s.dataset.title.startsWith('Q'+(i+1)+'selected')).dataset.screen,done:variants.find(s=>s.dataset.title.startsWith('Q'+(i+1)+'done')).dataset.screen,choices,prompt:base.querySelector('blockquote').lastElementChild.textContent,expected};
 });
 const quizLookup=new Map();questions.forEach((q,i)=>['base','selected','done'].forEach(kind=>quizLookup.set(q[kind],{i,kind})));
 const roles={normal:['16:509','16:524','16:548','16:572','16:596','16:609','16:623','16:638','16:656'],below:['19:520','19:535','19:559','19:583','19:607','19:620','19:634','19:649','19:667']};
 const roleLookup=new Map();for(const [branch,ids]of Object.entries(roles))ids.forEach((id,phase)=>roleLookup.set(id,{branch,phase}));
 const videoIds=new Set(['14:73','14:90','14:111']);
 const safeStatic=new Set(['13:2','13:35','14:17','14:31','14:45','14:59']);
 const resultIds=new Set(['16:369','16:385','16:430','16:480','16:495','19:744']);
 let state;try{state=M.restore(JSON.parse(localStorage.getItem(KEY)||'null'));}catch{state=M.fresh();}
 let quizScroll=null;
 let current=null,preview=false,retryRoute=null,lastVideoTime=state.video.time,lastTick=performance.now(),lastVideoSave=0;
 const player=document.createElement('video');player.className='learning-video';player.controls=true;player.preload='metadata';player.playsInline=true;player.src='assets/video.mp4';player.setAttribute('aria-label','Basic DEI learning video');player.setAttribute('controlsList','nodownload');
 const parking=document.createElement('div');parking.hidden=true;parking.append(player);document.body.append(parking);
 const time=t=>{const n=Math.max(0,Math.round(Number(t)||0));return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');};
 const percent=n=>String(Number((n/8*100).toFixed(1)))+'%';
 const quizResult=()=>state.correction.done?(M.passed(state)?'16:480':'16:495'):(M.firstScore(state)>=7?'16:430':'16:369');
 const roleIds=()=>M.passed(state)?roles.normal:roles.below;
 const roleTurn=()=>Math.min(2,Math.max(0,state.responses.findIndex(x=>!x)));
 const roleResume=()=>state.responses.every(Boolean)?roleIds()[7]:roleIds()[roleTurn()+1];
 function persist(){try{localStorage.setItem(KEY,JSON.stringify(state));return true;}catch{return false;}}
 function captureVideo(){if(!preview&&Number.isFinite(player.duration)){state.video.time=player.currentTime;state.video.duration=player.duration;} }
 function stageResume(){
  if(M.complete(state))return '16:670';
  if(state.practiceComplete&&state.coachAcknowledged&&M.quizDone(state))return M.passed(state)?'16:670':'16:687';
  if(!state.video.completed)return state.video.time>0?'14:90':'14:73';
  if(!M.quizDone(state)){const i=state.answers.findIndex(a=>a===null);return state.selections[i]===null?questions[i].base:questions[i].selected;}
  if(state.correction.started&&!state.correction.done)return '16:445';
  if(M.firstScore(state)<7&&!state.correction.done)return '16:369';
  if(state.responses.some(Boolean)||state.roleReturn)return roleResume();
  return quizResult();
 }
 function storedResume(){if(M.complete(state))return '16:670';if(state.practiceComplete&&state.coachAcknowledged&&M.quizDone(state))return '16:687';const id=state.resume;return screenById.has(id)&&!['14:144','14:160','14:130','16:700'].includes(id)?id:stageResume();}
 function active(id){return videoIds.has(id)||quizLookup.has(id)||resultIds.has(id)||roleLookup.has(id)||['16:445','16:463'].includes(id);}
 function guard(id){
  if(state.pendingSaveRoute&&id!=='14:160')return '14:160';
  if(!screenById.has(id))return '13:2';
  const qi=quizLookup.get(id),role=roleLookup.get(id);
  if(id==='14:111'&&!state.video.completed)return state.video.time>0?'14:90':'14:73';
  if(qi||resultIds.has(id)||['16:445','16:463'].includes(id)||role){
   if(!state.video.completed)return state.video.time>0?'14:90':'14:73';
  }
  if(qi){const first=state.answers.findIndex(a=>a===null);if(first===-1)return quizResult();if(qi.i>first||state.answers[qi.i]!==null)return state.selections[first]===null?questions[first].base:questions[first].selected;return state.selections[qi.i]===null?questions[qi.i].base:questions[qi.i].selected;}
  if(resultIds.has(id)||['16:445','16:463'].includes(id)||role){if(!M.quizDone(state))return stageResume();}
  if(id==='16:430'&&(M.firstScore(state)<7||state.correction.done))return quizResult();
  if(id==='19:744'&&M.firstScore(state)<7)return '16:385';
  if(id==='16:369'&&(M.firstScore(state)>=7||state.correction.done))return quizResult();
  if(['16:445','16:463'].includes(id)){if(state.correction.done)return M.passed(state)?'16:480':'16:495';if(!state.correction.started)return M.firstScore(state)>=7?'16:430':'16:385';return id;}
  if(id==='16:480'&&!state.correction.done)return stageResume();
  if(id==='16:495'&&(!state.correction.done||M.passed(state)))return quizResult();
  if(role&&M.firstScore(state)<7&&!state.correction.done)return state.correction.started?'16:445':'16:369';
  if(role){const list=roleIds();if(role.phase>=1&&role.phase<=3){const first=state.responses.findIndex(x=>!x);if(state.responses[role.phase-1]||first!==-1&&role.phase>first+1)return first===-1?list[7]:list[first+1];}if([4,7,8].includes(role.phase)&&!state.responses.every(Boolean))return roleResume();return list[role.phase];}
  if(id==='16:670'&&!M.complete(state))return state.practiceComplete&&state.coachAcknowledged&&!M.passed(state)?'16:687':stageResume();
  if(id==='16:687'&&!(state.practiceComplete&&state.coachAcknowledged))return stageResume();
  if(id==='16:687'&&M.complete(state))return '16:670';
  if(id==='16:700'&&!state.interrupted)return stageResume();
  if(['16:715','16:729'].includes(id)&&!state.interrupted&&!(state.practiceComplete&&state.coachAcknowledged))return stageResume();
  return id;
 }
 function text(id,value,s=screenById.get(current)){const e=at(s,id);if(e)e.textContent=value;}
 function selectedStyle(options,selection,locked=false){options.forEach((el,i)=>{el.classList.add('live-option');el.classList.toggle('is-selected',i===selection);el.setAttribute('aria-checked',String(i===selection));el.setAttribute('role','radio');if(el.tagName==='BUTTON')el.disabled=locked;el.setAttribute('aria-disabled',String(locked));el.dataset.choice=i;});}
 function liveQuiz(s,qi){const options=Array.from(s.querySelectorAll('.answer-option'));selectedStyle(options,state.answers[qi.i]??state.selections[qi.i],state.answers[qi.i]!==null);const status=content(s).children[2];status.textContent=`Question ${qi.i+1} of 8  ·  ${M.submitted(state)} submitted  ·  Sound on`;status.dataset.quizStatus='true';const bar=s.querySelector('[role="progressbar"]');bar.setAttribute('aria-valuenow',M.submitted(state));bar.firstElementChild.style.width=(M.submitted(state)/8*100)+'%';for(const b of s.querySelectorAll('button.action'))if(label(b)==='Submit answer'){b.classList.add('live-submit');b.disabled=state.selections[qi.i]===null||state.answers[qi.i]!==null;}}
 function renderCorrection(s){const c=state.correction,questionIndex=c.targets[c.cursor];if(questionIndex===undefined)return;const q=questions[questionIndex],main=content(s);main.querySelector('h1').textContent=`Correction round · ${c.cursor+1} of ${c.targets.length}`;main.children[2].textContent=q.prompt;const oldOptions=Array.from(main.querySelectorAll('.answer-option'));const group=document.createElement('div');group.className='correction-options';group.setAttribute('role','radiogroup');group.setAttribute('aria-label','Correction answer');for(const choice of q.choices){const template=document.createElement('template');template.innerHTML=choice.html;const source=template.content.firstElementChild;const option=document.createElement('button');option.type='button';option.className=source.className;option.innerHTML=source.innerHTML;for(const child of option.querySelectorAll('[data-node-id]'))child.removeAttribute('data-node-id');group.append(option);}oldOptions[0].before(group);oldOptions.forEach(e=>e.remove());selectedStyle(Array.from(group.children),c.selection);const b=Array.from(main.querySelectorAll('.action')).find(b=>/Submit correction|Finish correction round/.test(label(b)));b.classList.add('live-submit');b.disabled=c.selection===null;b.dataset.correctionSubmit='true';b.querySelector('p').textContent=c.cursor===c.targets.length-1?'Finish correction round':'Submit correction';}
 function renderReview(s){const cards=Array.from(content(s).children).filter(e=>e.querySelectorAll('p').length===3);cards.forEach((card,i)=>{card.children[1].textContent=(state.answers[i]===0?'Correct':'Needs review')+' · '+questions[i].expected;const choice=document.createElement('p');choice.className='submitted-choice';choice.setAttribute('aria-label','Submitted answer');choice.textContent=questions[i].choices[state.answers[i]].text;card.append(choice);});}
 function dynamicResults(s){const first=M.firstScore(state),final=M.finalScore(state),missed=8-first,points=M.xp(state);
  if(current==='16:369')text('16:379',`${first} / 8 correct · ${percent(first)}\n${points} XP earned from your first attempt.\nReview your answers, then correct the ${missed} missed question${missed===1?'':'s'}.`,s);
  if(current==='16:430')text('16:440',`${first} / 8 correct · ${percent(first)}\n${points} XP · Quiz target achieved.\nComplete the role play and coach review to finish the course.`,s);
  if(current==='16:480')text('16:490',`First attempt: ${first} / 8 (${percent(first)})\nAfter correction: ${final} / 8 (${percent(final)})\nXP remains ${points}. You are ready for role play.`,s);
  if(current==='16:495')text('16:505',`First attempt: ${first} / 8 (${percent(first)})\n${state.correction.done?`After correction: ${final} / 8 (${percent(final)}) · Target not reached`:'Target not reached'}\nYou can still complete the role play and return to the survey.`,s);
  if(['16:385','19:744'].includes(current))renderReview(s);
  if(current==='14:31'&&M.complete(state)){const original=screenById.get('16:670');text('14:41',at(original,'16:680').textContent,s);}
 }
 function prepareFields(s,role){const field=s.querySelector('[data-draft]');if(field){const i=role.phase-1;field.value=state.drafts[i];field.readOnly=Boolean(state.responses[i]);field.setAttribute('aria-describedby',s.querySelector('.response-input p')?.id||'');const send=Array.from(s.querySelectorAll('.action')).find(b=>label(b)==='Send response');if(send)send.disabled=Boolean(state.responses[i]);}
  if(role.phase===8){const transcriptId=role.branch==='normal'?'16:666':'19:672';const maya=roles.normal.slice(1,4).map(id=>screenById.get(id).querySelector('blockquote').lastElementChild.textContent);text(transcriptId,maya.map((line,i)=>`Maya: “${line}”\nYou: “${state.responses[i]}”`).join('\n\n'),s);}}
 function updateVideoText(){const s=screenById.get(current);if(!s||!videoIds.has(current)||preview)return;const clock=time(player.currentTime||state.video.time)+' / '+time(Number.isFinite(player.duration)?player.duration:state.video.duration);if(current==='14:73')text('14:83','Basic DEI · Learning video\n'+clock+'\nFirst viewing: pause and revisit watched sections. Unwatched sections cannot be skipped.',s);if(current==='14:90')text('14:100',clock+'\nVideo pauses when you leave this page. Your watched progress is retained.',s);}
 function render(id,isPreview=false,replace=false){
  const previousY=window.scrollY;const leavingQuiz=quizLookup.has(current);if(leavingQuiz)quizScroll=previousY;
  captureVideo();player.pause();parking.append(player);
  current=id;preview=isPreview;const s=screenById.get(id);s.innerHTML=originals.get(id);
  for(const other of screens)other.hidden=other!==s;
  document.documentElement.dataset.screen=id;document.documentElement.dataset.preview=String(isPreview);
  const hash='#'+id+(isPreview?'?preview=1':'');if(location.hash!==hash)history[replace?'replaceState':'pushState'](null,'',hash);
  document.title='BELONG — '+s.dataset.title.split(' · ').slice(1).join(' · ');
  for(const item of s.querySelector('nav').children){const dest=({'B E L O N G':'13:2',Courses:'13:2',Achievements:'14:31','AI Companion':'14:45','My Learning':'14:59'})[label(item)];if(dest){item.dataset.nav=dest;item.setAttribute('role','link');item.tabIndex=0;item.style.cursor='pointer';}}
  if(!isPreview){const qi=quizLookup.get(id),role=roleLookup.get(id);if(qi)liveQuiz(s,qi);if(['16:445','16:463'].includes(id))renderCorrection(s);dynamicResults(s);if(role)prepareFields(s,role);if(active(id)&&!['16:609','16:623','19:620','19:634'].includes(id))state.resume=id;state.lastRoute=id;persist();}
  if(videoIds.has(id)){const panel=Array.from(content(s).children).find(e=>e.querySelector('h2')?.textContent.includes('BASIC DEI'));if(panel){panel.classList.add('video-panel');panel.prepend(player);}updateVideoText();}
  const h=s.querySelector('h1');if(h)h.tabIndex=-1;
  if(quizLookup.has(id)&&quizScroll!==null){const y=quizScroll;window.scrollTo(0,y);requestAnimationFrame(()=>window.scrollTo(0,y));}
  else if(leavingQuiz&&id==='14:144'){s.style.minHeight=Math.max(innerHeight,previousY+innerHeight)+'px';window.scrollTo(0,previousY);}
  else{if(h)h.focus({preventScroll:true});window.scrollTo(0,0);}
 }
 function go(id,options={}){const isPreview=options.preview??preview;const next=isPreview?id:guard(id);render(next,isPreview,options.replace);}
 function saveAndGo(id){state.pendingSaveRoute=id;retryRoute=id;if(persist()){state.pendingSaveRoute=null;persist();go(id,{preview:false});}else render('14:160',false);}
 function confirmLeave(destination){captureVideo();player.pause();state.returnScreen=current;state.resume=current;state.pendingDestination=destination;saveAndGo('14:144');}
 function enterRole(){state.interrupted=false;saveAndGo(roleIds()[0]);}
 function previewGoto(id){go(id,{preview:true});}
 function survey(){const value=window.BELONG_CONFIG?.surveyReturnUrl;if(!value){go('16:729');return;}let url;try{url=new URL(value);if(!['https:','http:'].includes(url.protocol))throw Error();}catch{go('16:729');return;}captureVideo();if(persist())location.assign(url.href);else{retryRoute='16:715';render('14:160',false);}}
 document.addEventListener('input',event=>{const field=event.target.closest('[data-draft]');if(!field||preview)return;const role=roleLookup.get(current);if(!role||role.phase<1||role.phase>3)return;state.drafts[role.phase-1]=field.value;field.setCustomValidity('');persist();});
 document.addEventListener('keydown',event=>{const nav=event.target.closest('[data-nav]');if(nav&&['Enter',' '].includes(event.key)&&nav.tagName!=='A'){event.preventDefault();nav.click();}});
 document.addEventListener('click',event=>{
  const el=event.target.closest('.answer-option')||event.target.closest('[data-nav],.action,[data-target]');if(!el||!el.closest('.screen:not([hidden])')||el.disabled)return;
  event.preventDefault();const title=label(el),target=el.dataset.target;
  if(preview){if(el.dataset.nav)go(el.dataset.nav,{preview:false});else if(target)go(target,{preview:true});return;}
  if(el.dataset.nav){if(active(current))confirmLeave(el.dataset.nav);else go(el.dataset.nav);return;}
  const qi=quizLookup.get(current),role=roleLookup.get(current);
  if(el.classList.contains('answer-option')){if(qi&&state.answers[qi.i]===null){const options=Array.from(screenById.get(current).querySelectorAll('.answer-option'));state.selections[qi.i]=options.indexOf(el);quizScroll=window.scrollY;if(persist())liveQuiz(screenById.get(current),qi);else{state.pendingSaveRoute=questions[qi.i].selected;retryRoute=questions[qi.i].selected;render('14:160',false);}}else if(['16:445','16:463'].includes(current)){state.correction.selection=Number(el.dataset.choice);if(persist()){const s=screenById.get(current);selectedStyle(Array.from(s.querySelectorAll('.answer-option')),state.correction.selection);s.querySelector('[data-correction-submit]').disabled=false;}else{state.pendingSaveRoute=current;retryRoute=current;render('14:160',false);}}return;}
  if(title.startsWith('Preview ')||title==='Simulate video completion'){if(target)previewGoto(target);return;}
  if(title==='Save and leave'&&current!=='14:144'||title==='Pause and leave'){confirmLeave('14:59');return;}
  if(current==='14:144'){if(title==='Keep learning'){const back=state.returnScreen||storedResume();state.pendingDestination=null;saveAndGo(back);}else if(title==='Save and leave'){const dest=state.pendingDestination||'14:59';state.pendingDestination=null;saveAndGo(dest);}return;}
  if(current==='14:160'&&title==='Retry saving'){const next=retryRoute||state.pendingSaveRoute||storedResume();if(persist()){state.pendingSaveRoute=null;persist();go(next);}return;}
  if(title==='Submit answer'&&qi){if(M.submit(state,qi.i))saveAndGo(qi.i<7?questions[qi.i+1].base:quizResult());return;}
  if((title==='Continue'||title==='View results')&&qi){saveAndGo(qi.i<7?questions[qi.i+1].base:quizResult());return;}
  if(title==='Correct missed questions'){if(M.startCorrection(state)||state.correction.started)saveAndGo(state.correction.done?(M.passed(state)?'16:480':'16:495'):'16:445');return;}
  if(el.dataset.correctionSubmit){if(M.correct(state))saveAndGo(state.correction.done?(M.passed(state)?'16:480':'16:495'):(state.correction.cursor===state.correction.targets.length-1?'16:463':'16:445'));return;}
  if(title==='Resume video'||title==='Continue learning'){saveAndGo(guard(storedResume()));return;}
  if(title==='Start learning'&&current==='13:35'){saveAndGo(guard(storedResume()));return;}
  if(title==='Play video'){if(current!=='14:90')go('14:90');player.play().catch(()=>{});return;}
  if(title==='Start eight questions'){if(state.video.completed)saveAndGo(M.quizDone(state)?quizResult():stageResume());return;}
  if(title==='Rewatch video'){go('14:90');player.currentTime=0;lastVideoTime=0;player.play().catch(()=>{});return;}
  if(title==='Video loading error'){captureVideo();saveAndGo('14:130');return;}
  if(title==='Reload video'){go('14:90');player.load();return;}
  if(title==='Start role play'||title==='Continue to role play'){enterRole();return;}
  if(title==='Start practice'){saveAndGo(roleResume());return;}
  if(title==='Send response'&&role){const i=role.phase-1,field=screenById.get(current).querySelector('textarea');if(!M.responseValid(state.drafts[i])){field.setCustomValidity('Only blank, gibberish or unrelated content prompts resubmission.');field.reportValidity();return;}if(M.send(state,i))saveAndGo(roleIds()[i===2?4:role.phase+1]);return;}
  if(title==='Need a hint?'&&role){state.roleReturn=current;state.hints++;saveAndGo(roleIds()[5]);return;}
  if(title==='Connection error preview'&&role){state.roleReturn=current;state.resume=current;saveAndGo(roleIds()[6]);return;}
  if(title==='Return to conversation'||title==='Retry response'){saveAndGo(state.roleReturn||roleResume());return;}
  if(title==='End attempt'){state.interrupted=true;saveAndGo('16:700');return;}
  if(title==='Try to resume'){state.interrupted=false;saveAndGo(state.roleReturn||storedResume());return;}
  if(title==='Finish practice'){if(state.responses.every(Boolean)){state.practiceComplete=true;state.coachAcknowledged=true;state.interrupted=false;saveAndGo(M.complete(state)?'16:670':'16:687');}return;}
  if(title==='Return to survey'){if(current==='16:715')survey();else saveAndGo('16:715');return;}
  if(title==='Return to survey · demo'){survey();return;}
  if(title==='Try return again'){if(window.BELONG_CONFIG?.surveyReturnUrl)survey();else go('16:715');return;}
  if(target)go(target);
 });
 player.addEventListener('loadedmetadata',()=>{if(!Number.isFinite(player.duration))return;if(!preview){state.video.duration=player.duration;const restore=Math.min(state.video.time,player.duration,state.video.completed?player.duration:state.video.watched);if(restore>0&&Math.abs(player.currentTime-restore)>1)player.currentTime=restore;lastVideoTime=restore;lastTick=performance.now();persist();}updateVideoText();});
 player.addEventListener('seeking',()=>{if(!preview&&!state.video.completed&&player.currentTime>state.video.watched+.7){player.currentTime=Math.max(0,state.video.watched);lastVideoTime=state.video.watched;}});
 player.addEventListener('ratechange',()=>{if(!preview&&!state.video.completed&&player.playbackRate!==1)player.playbackRate=1;});
 player.addEventListener('timeupdate',()=>{if(preview)return;const now=player.currentTime,wall=performance.now(),delta=now-lastVideoTime,elapsed=(wall-lastTick)/1000;if(!player.seeking&&delta>=0&&delta<=Math.max(1.5,elapsed+0.7)&&now<=state.video.watched+1.5)state.video.watched=Math.max(state.video.watched,now);lastVideoTime=now;lastTick=wall;state.video.time=Math.min(now,state.video.completed?now:state.video.watched);updateVideoText();if(wall-lastVideoSave>1000){persist();lastVideoSave=wall;}});
 player.addEventListener('pause',()=>{captureVideo();if(!preview)persist();});
 player.addEventListener('ended',()=>{if(preview||!player.ended||!Number.isFinite(player.duration))return;if(!state.video.completed&&state.video.watched<player.duration-1.5){player.currentTime=state.video.watched;return;}state.video.completed=true;state.video.time=player.duration;state.video.duration=player.duration;state.video.watched=player.duration;saveAndGo('14:111');});
 player.addEventListener('error',()=>{if(player.error&&videoIds.has(current)&&!preview){captureVideo();retryRoute='14:90';render('14:130',false);}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){captureVideo();player.pause();if(!preview)persist();}});
 window.addEventListener('pagehide',()=>{captureVideo();player.pause();if(!preview)persist();});
 function fromHash(){const raw=location.hash.slice(1).split('?'),id=decodeURIComponent(raw[0]||'13:2'),isPreview=new URLSearchParams(raw[1]||'').get('preview')==='1';if(current&&!preview&&active(current)&&safeStatic.has(id)&&id!==current&&!isPreview){state.returnScreen=current;state.resume=current;state.pendingDestination=id;render('14:144',false,true);persist();return;}go(id,{preview:isPreview,replace:true});}
 window.addEventListener('hashchange',fromHash);window.addEventListener('popstate',fromHash);fromHash();
})();

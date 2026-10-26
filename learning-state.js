(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BelongState=api;})(typeof window==='undefined'?globalThis:window,function(){
 'use strict';
 const fresh=()=>({version:3,video:{time:0,duration:0,watched:0,completed:false},selections:Array(8).fill(null),answers:Array(8).fill(null),correction:{started:false,done:false,targets:[],answers:{},cursor:0,selection:null},drafts:['','',''],responses:['','',''],hints:0,coachAcknowledged:false,practiceComplete:false,interrupted:false,resume:'14:73',pendingDestination:null,returnScreen:null,roleReturn:null,pendingSaveRoute:null,lastRoute:'13:2'});
 function restore(value){const s=fresh();if(!value||value.version!==3)return s;Object.assign(s,value);s.video={...fresh().video,...value.video};s.correction={...fresh().correction,...value.correction};for(const k of ['answers','selections'])s[k]=Array.from({length:8},(_,i)=>[0,1,2].includes(value[k]?.[i])?value[k][i]:null);for(const k of ['drafts','responses'])s[k]=Array.from({length:3},(_,i)=>typeof value[k]?.[i]==='string'?value[k][i]:'');return s;}
 const submitted=s=>s.answers.filter(v=>v!==null).length;
 const firstScore=s=>s.answers.reduce((sum,a)=>sum+(a===0?1:0),0);
 const finalScore=s=>s.answers.reduce((sum,a,i)=>sum+((a===0||s.correction.answers[i]===0)?1:0),0);
 const xp=s=>firstScore(s)*10;
 const quizDone=s=>submitted(s)===8;
 const passed=s=>quizDone(s)&&finalScore(s)>=7;
 const complete=s=>s.video.completed&&passed(s)&&s.responses.every(x=>x.trim())&&s.practiceComplete&&s.coachAcknowledged&&!s.interrupted;
 function submit(s,i){if(s.answers[i]!==null||![0,1,2].includes(s.selections[i])||!s.video.completed)return false;s.answers[i]=s.selections[i];return true;}
 function startCorrection(s){if(!quizDone(s)||firstScore(s)>=7||s.correction.started)return false;s.correction={started:true,done:false,targets:s.answers.map((a,i)=>a!==0?i:null).filter(i=>i!==null),answers:{},cursor:0,selection:null};return true;}
 function correct(s){const c=s.correction,i=c.targets[c.cursor];if(!c.started||c.done||i===undefined||![0,1,2].includes(c.selection)||Object.hasOwn(c.answers,i))return false;c.answers[i]=c.selection;c.cursor++;c.selection=null;c.done=c.cursor>=c.targets.length;return true;}
 function responseValid(text){const clean=text.trim(),letters=clean.match(/\p{L}/gu)||[];if(/^(no|ok|okay|yes|好|好的|可以|不|不用|不要)[.!。！]?$/i.test(clean))return true;if(letters.length<3||new Set(letters.map(c=>c.toLowerCase())).size<3||/(.)\1{6}/u.test(clean))return false;if(/^(asdf|qwerty|zxcv|lorem ipsum|test\s*\d*)+$/i.test(clean.replace(/\s/g,'')))return false;const context=/maya|brief|colleague|team|work|help|support|feel|understand|ask|listen|include|abbreviat|question|learn|permission|together|sorry|difficult|training|你好|帮助|支持|同事|团队|感觉|感受|理解|问|听|一起|困难|学习|沟通|可以|会|我們|我們|協助|同事|團隊|幫|支持|感受|理解|問|聽|一起|困難|學習|溝通|可以|會/i;if(!context.test(clean)&&/weather|bitcoin|football|basketball|recipe|pizza|stock market|天气|天氣|比特币|比特幣|足球|篮球|籃球/.test(clean))return false;return true;}
 function send(s,i){if(s.responses[i]||!responseValid(s.drafts[i])||!quizDone(s))return false;s.responses[i]=s.drafts[i].trim();return true;}
 return {fresh,restore,submitted,firstScore,finalScore,xp,quizDone,passed,complete,submit,startCorrection,correct,responseValid,send};
});

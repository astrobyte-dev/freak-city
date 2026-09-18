import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { executeTrial } from '../../src/trial/engine';
import { newTrial, type TrialState } from '../../src/trial/state';
import { writeTrial, readTrial, importTrial } from '../../src/trial/save';

const label = process.env.SABLE_EVAL_LABEL ?? `sable-rerun-${new Date().toISOString().replace(/[:.]/g,'-')}`;
const dir = fileURLToPath(new URL(`./evidence/${label}/`, import.meta.url));
mkdirSync(dir, { recursive: true });
const lastText = (s: TrialState) => s.transcript.at(-1)!.lines.join('\n');
const unchanged = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const barPhoto = ['go shop','take photograph','go bar'];
const disclosed = ['ask Sable about memories','go shop','read photograph','take photograph','read listing','take listing','go bar','show photograph to Sable','show listing to Sable'];
type Case = {name:string, commands:string[], check:(s:TrialState, states:TrialState[])=>boolean, expected:string};
const cases: Case[] = [
 {name:'negative',commands:['ask Sable about complaint',"no it dosen't sound threatening"],check:s=>/less theatrical|not threatening/.test(lastText(s)),expected:'Relevant negative opinion on complaint, no agreement'},
 {name:'positive',commands:['ask Sable about complaint','yes very threatening'],check:s=>/threat|theatrical/.test(lastText(s)),expected:'Relevant positive opinion on complaint'},
 {name:'uncertain',commands:['ask Sable about complaint','maybe yes'],check:(s,h)=>unchanged(s.context,h[0].context)&&s.time===h[0].time,expected:'No agreement, mutation or clock advance'},
 {name:'vessel',commands:['order coffee','take cup','examine cup','take another sip of coffee'],check:s=>s.drink?.location==='player'&&s.drink.remaining===2&&/sip/.test(lastText(s)),expected:'Take, inspect and sip carried coffee leaves two portions'},
 {name:'canonical-sip',commands:['order coffee','take cup','sip coffee'],check:s=>s.drink?.location==='player'&&s.drink.remaining===2,expected:'Canonical sip leaves two portions'},
 {name:'empty-identity',commands:['order coffee','take cup','finish cup','look','inventory'],check:s=>s.drink?.remaining===0&&s.drink.location==='player',expected:'Empty drink record retained; inspect prose separately for vessel naming'},
 {name:'put-down',commands:['order coffee','take cup','put down the cup'],check:s=>s.drink?.location==='bar',expected:'Cup leaves player custody'},
 {name:'refill',commands:['order coffee','finish coffee','ask for another drink','yes ill have another coffee'],check:s=>s.drink?.remaining===3&&!s.transcript.at(-1)!.failed,expected:'Another coffee is served after explicit acceptance'},
 {name:'interrupt',commands:['ask Sable about complaint','look','inventory',"no it dosen't sound threatening"],check:s=>/less theatrical|not threatening/.test(lastText(s)),expected:'Negative reply remains relevant after untimed inspection'},
 {name:'topic-change',commands:['ask Sable about complaint','ask Sable about music','tell me more'],check:s=>s.context?.topic==='music'&&/playlist|music|speakers/.test(lastText(s)),expected:'Follow-up answers music'},
 {name:'offer',commands:[...disclosed,'I could come with you'],check:s=>s.companyOffers.length===1&&!s.completed,expected:'Only an offer recorded'},
 {name:'decline',commands:[...disclosed,"I can't come with you"],check:s=>s.companyOffers.length===0&&s.observations.some(o=>o.subject==='company-declined'),expected:'Decline, no company offer'},
 {name:'uncertain-company',commands:[...disclosed,'I might come with you'],check:(s,h)=>s.companyOffers.length===0&&s.time===h.at(-2)!.time&&unchanged(s.events,h.at(-2)!.events),expected:'Clarification without time/event/offer mutation'},
 {name:'claim',commands:["Sable, I found a photograph of you at the Cat's Cradle closing party"],check:s=>s.observations.some(o=>o.mode==='claim')&&!s.actors.sable.knowledge.includes('trial-photo'),expected:'Claim kept separate from inspection'},
 {name:'give',commands:[...barPhoto,'give photograph to Sable'],check:s=>s.entities['trial-photo'].location==='sable'&&!s.actors.sable.knowledge.includes('trial-photo'),expected:'Custody transfer without inspection'},
 {name:'show',commands:[...barPhoto,'show photograph to Sable'],check:s=>s.entities['trial-photo'].location==='player'&&s.actors.sable.knowledge.includes('trial-photo')&&!s.receipt,expected:'Inspection without transfer or fabricated corroboration'},
 {name:'second-person',commands:['go shop','take photograph','show photograph to Vesper'],check:s=>s.actors.vesper.knowledge.includes('trial-photo')&&!s.actors.sable.knowledge.includes('trial-photo'),expected:'Independent recipient knowledge'},
 {name:'second-vessel',commands:['order coffee','take cup','order tea','inventory'],check:s=>false,expected:'GAP: schema contains one drink slot; both vessels cannot coexist'},
 {name:'pending-save',commands:['order coffee','finish coffee','talk','@save','no','@restore','yes'],check:(s,h)=>!!h[3].context?.question&&unchanged(h[3].context,h[5].context)&&s.drink?.remaining===3,expected:'Real save API restores pending drink offer; yes accepts'},
 {name:'absent-save-event',commands:[...disclosed,'@save','wait ten minutes','@restore','go home','wait ten minutes','rest until tomorrow','rest until tomorrow','rest until tomorrow','rest until tomorrow','go bar','talk privately'],check:(s,h)=>!h[11].decision&&!!s.completed&&!!s.updateAt&&/doctor|notebook|practitioner/.test(lastText(s)),expected:'Restore before decision; off-screen completion and relevant later report'},
 {name:'held-negative',commands:['ask Sable about complaint',"no it doesn't sound threatening"],check:s=>/less theatrical|not threatening/.test(lastText(s)),expected:'Held-back negative paraphrase'},
 {name:'held-sip',commands:['order coffee','have another sip of coffee'],check:s=>s.drink?.remaining===2,expected:'Held-back sip paraphrase'},
 {name:'held-put',commands:['order coffee','take cup','set the cup down'],check:s=>s.drink?.location==='bar',expected:'Held-back put-down paraphrase'},
 {name:'held-followup',commands:['ask Sable about music','what do you mean by that'],check:s=>s.context?.topic==='music'&&/playlist|music|speakers/.test(lastText(s))&&!s.transcript.at(-1)!.failed,expected:'Held-back follow-up paraphrase'},
 {name:'held-refusal',commands:[...disclosed,'I cannot accompany you'],check:s=>s.companyOffers.length===0&&s.observations.some(o=>o.subject==='company-declined'),expected:'Held-back refusal paraphrase'},
 {name:'held-qualified',commands:['ask Sable about complaint','yes but I am not sure'],check:(s,h)=>unchanged(s.context,h[0].context)&&s.time===h[0].time,expected:'Held-back uncertainty preserves pending context'},
 {name:'held-typo',commands:['order coffee','take coffe'],check:s=>s.drink?.location==='player',expected:'Held-back typo'},
];
const results=[];
for (const c of cases) {
 let state=newTrial('Eval','INFORM-COMPARISON');
 const history:TrialState[]=[]; const entries:any[]=[]; const data=new Map<string,string>();
 const storage={getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{data.set(k,v)},removeItem:(k:string)=>{data.delete(k)}};
 for(const command of c.commands){
  const before=structuredClone(state);
  if(command==='@save') {writeTrial(storage,state,'isolated-evaluation');writeFileSync(dir+c.name+'-save.json',data.get('isolated-evaluation')!)}
  else if(command==='@restore') {state=readTrial(storage,'isolated-evaluation').state!;if(!state)throw Error('restore failed')}
  else state=executeTrial(state,command);
  state=importTrial(JSON.stringify(state));
  history.push(structuredClone(state));
  entries.push({command,text:command.startsWith('@')?`Used production save API: ${command}`:lastText(state),before,after:state});
 }
 const pass=c.name==='second-vessel'?null:c.check(state,history);
 results.push({case:c.name,status:pass===null?'gap':pass?'passed':'failed',passed:pass,expected:c.expected,held_back:c.name.startsWith('held-')});
 writeFileSync(dir+c.name+'.json',JSON.stringify(entries,null,2));
 writeFileSync(dir+c.name+'.txt',entries.map(e=>`> ${e.command}\n${e.text}\nSTATE ${JSON.stringify({time:e.after.time,room:e.after.room,drink:e.after.drink,context:e.after.context,knowledge:e.after.actors,photo:e.after.entities['trial-photo'].location,events:e.after.events,decision:e.after.decision,completed:e.after.completed,companyOffers:e.after.companyOffers})}\n`).join('\n'));
 console.log(`${pass===null?'GAP':pass?'PASS':'FAIL'} ${c.name}: ${c.expected}`);
}
writeFileSync(dir+'results.json',JSON.stringify(results,null,2));

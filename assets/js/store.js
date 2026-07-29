import{loadDatabase,saveDatabase,createId}from"./persistence.js";
import{classes,abilities,skills,backgrounds}from"./data/core.js";
import{feats,featureChoiceDefinitions}from"./data/progression.js";
import{spellData}from"./data/spells.js";

const listeners=new Set();
let db=normalizeDatabase(loadDatabase());

function counts(levels=[]){return levels.reduce((out,key)=>(out[key]=(out[key]||0)+1,out),{})}
function featThresholds(key){return[4,8,12,...(key==="fighter"?[6]:[]),...(key==="rogue"?[10]:[])].sort((a,b)=>a-b)}
function allowedFeatCount(build){return Object.entries(counts(build.levels.slice(0,build.targetLevel))).reduce((sum,[key,level])=>sum+featThresholds(key).filter(x=>level>=x).length,0)}
function uniqueAllowed(list,allowed){return[...new Set(Array.isArray(list)?list:[])].filter(x=>allowed.has(x))}
function sanitizeFeatChoices(list=[],limit=Infinity){const seen=new Set();return(Array.isArray(list)?list:[]).slice(0,limit).map(item=>{const choice={type:"none",a1:"str",a2:"str",...(item||{})},type=choice.type;if(!type||type==="none"||feats[type]?.repeatable)return choice;if(seen.has(type))return{...choice,type:"none"};seen.add(type);return choice})}

function defaultBuild(input={}){
  const id=createId();
  return{
    version:7,id,
    name:input.name?.trim()||"未命名构筑",
    identity:{race:input.race||"人类",background:input.background||"sage",armorMode:input.armorMode||"medium"},
    targetLevel:1,
    levels:[input.startClass||"fighter"],
    subclasses:{},
    abilities:{scores:{str:8,dex:8,con:8,int:8,wis:8,cha:8},bonus2:"str",bonus1:"dex"},
    feats:[],
    skills:{class:[],race:"",multiclass:{}},
    expertise:{},
    classChoices:{},
    spellChoices:{},
    updatedAt:Date.now()
  }
}

function normalizeBuild(raw={}){
  const base=defaultBuild(raw);
  const id=typeof raw.id==="string"&&raw.id?raw.id:base.id;
  const target=Math.max(1,Math.min(12,Number(raw.targetLevel)||1));
  const levels=Array.from({length:target},(_,i)=>classes[raw.levels?.[i]]?raw.levels[i]:(classes[raw.levels?.[0]]?raw.levels[0]:base.levels[0]));
  const out={...base,...raw,id,version:7,targetLevel:target,levels};
  out.name=String(raw.name||base.name).slice(0,40);
  out.identity={race:Array.isArray(raw.identity)?base.identity.race:(raw.identity?.race||raw.race||base.identity.race),background:backgrounds[raw.identity?.background||raw.background]?raw.identity?.background||raw.background:base.identity.background,armorMode:["unarmored","light","medium","heavy"].includes(raw.identity?.armorMode||raw.armor)?raw.identity?.armorMode||raw.armor:base.identity.armorMode};
  if(!Array.isArray(out.identity.race)&&typeof out.identity.race!=="string")out.identity.race=base.identity.race;
  out.subclasses={};
  Object.entries(raw.subclasses||{}).forEach(([key,val])=>{if(classes[key]?.subclasses.includes(val))out.subclasses[key]=val});
  out.abilities={scores:{},bonus2:raw.abilities?.bonus2||raw.bonus2||"str",bonus1:raw.abilities?.bonus1||raw.bonus1||"dex"};
  abilities.forEach(a=>{const value=Number(raw.abilities?.scores?.[a.key]??raw.scores?.[a.key]??8);out.abilities.scores[a.key]=Number.isInteger(value)&&value>=8&&value<=15?value:8});
  if(!abilities.some(a=>a.key===out.abilities.bonus2))out.abilities.bonus2="str";
  if(!abilities.some(a=>a.key===out.abilities.bonus1))out.abilities.bonus1="dex";
  out.feats=sanitizeFeatChoices(Array.isArray(raw.feats)?raw.feats.map(item=>typeof item==="string"?{type:feats[item]?item:"none",a1:"str",a2:"str"}:{type:feats[item?.type]?item.type:"none",a1:abilities.some(a=>a.key===item?.a1)?item.a1:"str",a2:abilities.some(a=>a.key===item?.a2)?item.a2:"str"}):[],allowedFeatCount(out));
  const allSkills=new Set(skills.map(x=>x.key));
  out.skills={class:uniqueAllowed(raw.skills?.class||raw.classSkills,allSkills),race:allSkills.has(raw.skills?.race||raw.raceSkill)?raw.skills?.race||raw.raceSkill:"",multiclass:{}};
  Object.entries(raw.skills?.multiclass||raw.multiclassSkills||{}).forEach(([key,list])=>{if(classes[key])out.skills.multiclass[key]=uniqueAllowed(list,allSkills)});
  out.expertise={};Object.entries(raw.expertise||{}).forEach(([slot,key])=>{if(allSkills.has(key))out.expertise[slot]=key});
  out.classChoices={};Object.entries(raw.classChoices||{}).forEach(([id,list])=>{const def=featureChoiceDefinitions.find(x=>x.id===id);if(def){const allowed=new Set(def.options.map(x=>x[0]));out.classChoices[id]=uniqueAllowed(list,allowed)}});
  const spellKeys=new Map(spellData.map(x=>[x.key,x]));
  out.spellChoices={};
  Object.entries(raw.spellChoices||{}).forEach(([source,val])=>{if(!classes[source])return;const legacy=Array.isArray(val?.known)?val.known:[];const cantrips=uniqueAllowed([...(val?.cantrips||[]),...legacy.filter(k=>spellKeys.get(k)?.level===0)],new Set(spellData.filter(x=>x.level===0).map(x=>x.key)));const spells=uniqueAllowed([...(val?.spells||[]),...legacy.filter(k=>spellKeys.get(k)?.level>0)],new Set(spellData.filter(x=>x.level>0).map(x=>x.key)));const prepared=uniqueAllowed(val?.prepared,new Set(spells));out.spellChoices[source]={cantrips,spells,prepared}});
  out.updatedAt=Number(raw.updatedAt)||Date.now();
  pruneBuild(out);
  return out
}

function pruneBuild(build){
  build.levels=build.levels.slice(0,build.targetLevel);while(build.levels.length<build.targetLevel)build.levels.push(build.levels.at(-1)||"fighter");
  const c=counts(build.levels);
  Object.keys(build.subclasses).forEach(key=>{if((c[key]||0)<(classes[key]?.subclassAt||99))delete build.subclasses[key]});
  build.feats=sanitizeFeatChoices(build.feats,allowedFeatCount(build));
  Object.keys(build.spellChoices).forEach(key=>{if(!c[key])delete build.spellChoices[key]});
}
function normalizeDatabase(raw){const result={builds:{},lastBuildId:null};Object.values(raw?.builds||{}).forEach(item=>{const build=normalizeBuild(item);result.builds[build.id]=build});result.lastBuildId=result.builds[raw?.lastBuildId]?raw.lastBuildId:Object.keys(result.builds)[0]||null;return result}
function emit(){listeners.forEach(fn=>fn(getSnapshot()))}
function persist(){saveDatabase(db);emit()}
export function getSnapshot(){return structuredClone(db)}
export function subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn)}
export function getBuild(id){return db.builds[id]||null}
export function getBuilds(){return Object.values(db.builds).sort((a,b)=>b.updatedAt-a.updatedAt)}
export function getLastBuild(){return db.lastBuildId?db.builds[db.lastBuildId]||null:null}
export function createBuild(input){const build=defaultBuild(input);db.builds[build.id]=build;db.lastBuildId=build.id;persist();return build}
export function updateBuild(id,updater){const current=db.builds[id];if(!current)return null;const draft=structuredClone(current);updater(draft);draft.updatedAt=Date.now();pruneBuild(draft);db.builds[id]=draft;db.lastBuildId=id;persist();return draft}
export function setTargetLevel(id,target){return updateBuild(id,b=>{b.targetLevel=Math.max(1,Math.min(12,Number(target)||1))})}
export function setLevelClass(id,index,classKey){if(!classes[classKey])return;return updateBuild(id,b=>{if(index>=0&&index<b.targetLevel)b.levels[index]=classKey})}
export function setSubclass(id,classKey,name){if(!classes[classKey]?.subclasses.includes(name))return;return updateBuild(id,b=>{b.subclasses[classKey]=name})}
export function setAbilityScore(id,key,value){if(!abilities.some(a=>a.key===key))return;return updateBuild(id,b=>{b.abilities.scores[key]=Math.max(8,Math.min(15,Number(value)||8))})}
export function setAbilityBonus(id,slot,key){if(!abilities.some(a=>a.key===key))return;return updateBuild(id,b=>{b.abilities[slot]=key})}
export function setFeatChoice(id,index,type){return updateBuild(id,b=>{const next=feats[type]?type:"none";if(next!=="none"&&!feats[next]?.repeatable&&b.feats.some((item,i)=>i!==index&&item?.type===next))return;while(b.feats.length<=index)b.feats.push({type:"none",a1:"str",a2:"str"});b.feats[index]={...b.feats[index],type:next}})}
export function setFeatAsi(id,index,slot,key){if(!abilities.some(a=>a.key===key))return;return updateBuild(id,b=>{while(b.feats.length<=index)b.feats.push({type:"none",a1:"str",a2:"str"});b.feats[index]={...b.feats[index],type:"asi",[slot]:key}})}
export function toggleSkill(id,source,key,limit){return updateBuild(id,b=>{let list;if(source==="class")list=b.skills.class;else if(source==="race"){b.skills.race=b.skills.race===key?"":key;return}else{const classKey=source.replace("multi-","");list=b.skills.multiclass[classKey]||(b.skills.multiclass[classKey]=[])}const at=list.indexOf(key);if(at>=0)list.splice(at,1);else if(list.length<limit)list.push(key)})}
export function setExpertise(id,slot,key){return updateBuild(id,b=>{if(key)b.expertise[slot]=key;else delete b.expertise[slot]})}
export function toggleClassChoice(id,groupId,key,limit){return updateBuild(id,b=>{const list=b.classChoices[groupId]||(b.classChoices[groupId]=[]);const at=list.indexOf(key);if(at>=0)list.splice(at,1);else if(list.length<limit)list.push(key)})}
export function toggleSpell(id,sourceKey,spellKey){const spell=spellData.find(x=>x.key===spellKey);if(!spell)return;return updateBuild(id,b=>{const choice=b.spellChoices[sourceKey]||(b.spellChoices[sourceKey]={cantrips:[],spells:[],prepared:[]});const list=spell.level===0?choice.cantrips:choice.spells;const at=list.indexOf(spellKey);if(at>=0){list.splice(at,1);choice.prepared=choice.prepared.filter(x=>x!==spellKey)}else list.push(spellKey)})}
export function togglePreparedSpell(id,sourceKey,spellKey,limit=99){return updateBuild(id,b=>{const choice=b.spellChoices[sourceKey]||(b.spellChoices[sourceKey]={cantrips:[],spells:[],prepared:[]});if(!choice.spells.includes(spellKey))choice.spells.push(spellKey);const at=choice.prepared.indexOf(spellKey);if(at>=0)choice.prepared.splice(at,1);else if(choice.prepared.length<limit)choice.prepared.push(spellKey)})}
export function togglePreparedChoice(id,sourceKey,spellKey,limit=99){return updateBuild(id,b=>{const choice=b.spellChoices[sourceKey]||(b.spellChoices[sourceKey]={cantrips:[],spells:[],prepared:[]});const at=choice.prepared.indexOf(spellKey);if(at>=0){choice.prepared.splice(at,1);choice.spells=choice.spells.filter(x=>x!==spellKey)}else if(choice.prepared.length<limit){if(!choice.spells.includes(spellKey))choice.spells.push(spellKey);choice.prepared.push(spellKey)}})}
export function updateIdentity(id,patch){return updateBuild(id,b=>{b.identity={...b.identity,...patch};if(patch.name!==undefined)b.name=String(patch.name).slice(0,40)})}
export function resetBuild(id){const current=getBuild(id);if(!current)return;const fresh=defaultBuild({name:current.name,race:current.identity.race,background:current.identity.background,armorMode:current.identity.armorMode,startClass:current.levels[0]});fresh.id=id;db.builds[id]=fresh;db.lastBuildId=id;persist();return fresh}
export function deleteBuild(id){delete db.builds[id];if(db.lastBuildId===id)db.lastBuildId=Object.keys(db.builds)[0]||null;persist()}
export function exportBuild(id){const build=getBuild(id);return build?structuredClone(build):null}
export function importBuild(raw){const build=normalizeBuild({...raw,id:createId(),name:`${raw?.name||"导入构筑"}`});db.builds[build.id]=build;db.lastBuildId=build.id;persist();return build}

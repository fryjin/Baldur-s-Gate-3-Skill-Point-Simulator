import{loadDatabase,saveDatabase,createId}from"./persistence.js";
import{classes}from"./data/core.js";
const listeners=new Set();
let db=loadDatabase();
function defaultBuild(input={}){const id=createId();return{version:7,id,name:input.name?.trim()||"未命名构筑",identity:{race:input.race||"人类",background:input.background||"sage",armorMode:input.armorMode||"medium"},targetLevel:1,levels:[input.startClass||"fighter"],subclasses:{},abilities:{scores:{str:8,dex:8,con:8,int:8,wis:8,cha:8},bonus2:"str",bonus1:"dex"},feats:[],skills:{},expertise:{},classChoices:{},spellChoices:{},updatedAt:Date.now()}}
function emit(){listeners.forEach(fn=>fn(getSnapshot()))}
function persist(){saveDatabase(db);emit()}
export function getSnapshot(){return structuredClone(db)}
export function subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn)}
export function getBuild(id){return db.builds[id]||null}
export function getLastBuild(){return db.lastBuildId?db.builds[db.lastBuildId]||null:null}
export function createBuild(input){const build=defaultBuild(input);db.builds[build.id]=build;db.lastBuildId=build.id;persist();return build}
export function updateBuild(id,updater){const current=db.builds[id];if(!current)return null;const draft=structuredClone(current);updater(draft);draft.updatedAt=Date.now();db.builds[id]=draft;db.lastBuildId=id;persist();return draft}
export function setTargetLevel(id,target){return updateBuild(id,b=>{const next=Math.max(1,Math.min(12,Number(target)||1));b.targetLevel=next;if(b.levels.length>next)b.levels=b.levels.slice(0,next);while(b.levels.length<next)b.levels.push(b.levels.at(-1)||"fighter")})}
export function setLevelClass(id,index,classKey){if(!classes[classKey])return;return updateBuild(id,b=>{if(index<0||index>=b.targetLevel)return;b.levels[index]=classKey})}
export function toggleSpell(id,sourceKey,spellKey,mode="known"){return updateBuild(id,b=>{const choice=b.spellChoices[sourceKey]||{known:[],prepared:[]};const list=mode==="prepared"?choice.prepared:choice.known;const at=list.indexOf(spellKey);if(at>=0)list.splice(at,1);else list.push(spellKey);b.spellChoices[sourceKey]=choice})}

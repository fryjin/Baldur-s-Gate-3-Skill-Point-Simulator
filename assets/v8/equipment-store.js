import{equipmentSlots}from'./equipment-catalog.js';
const KEY='bg3-planner-v8-equipment';
const emptyChapters=()=>({1:{},2:{},3:{}});
function read(){try{return JSON.parse(localStorage.getItem(KEY)||'{"version":2,"builds":{}}')}catch{return{version:2,builds:{}}}}
function write(db){db.version=2;localStorage.setItem(KEY,JSON.stringify(db))}
function migrate(raw={}){
  const chapters={...emptyChapters(),...(raw.chapters||{})};
  for(const act of[1,2,3]){
    const c={...(chapters[act]||{})};
    if('ranged'in c&&!('rangedMain'in c)){c.rangedMain=c.ranged;delete c.ranged}
    for(const key of Object.keys(c))if(!equipmentSlots.includes(key))delete c[key];chapters[act]=c
  }
  return{act:[1,2,3].includes(Number(raw.act))?Number(raw.act):1,slot:equipmentSlots.includes(raw.slot)?raw.slot:'armor',chapters,updatedAt:raw.updatedAt||0}
}
export function loadEquipmentState(buildId){const db=read();return migrate(db.builds?.[buildId]||{})}
export function saveEquipmentState(buildId,state){const db=read();db.builds=db.builds||{};db.builds[buildId]={...migrate(state),updatedAt:Date.now()};write(db)}
export function clearEquipmentState(buildId){const db=read();if(db.builds)delete db.builds[buildId];write(db)}
export function chapterLoadout(state,act){const out={};for(let n=1;n<=act;n++)for(const[slot,value]of Object.entries(state.chapters?.[n]||{})){if(value)out[slot]=value;else delete out[slot]}return out}
export function finalLoadout(state){return chapterLoadout(state,3)}
export function applyChapterLoadout(state,act,nextLoadout){
  const prev=act>1?chapterLoadout(state,act-1):{},changes={};
  const all=new Set([...Object.keys(prev),...Object.keys(nextLoadout||{})]);
  for(const slot of all){const before=prev[slot]||null,after=nextLoadout?.[slot]||null;if(before!==after)changes[slot]=after}
  state.chapters[act]=changes;return state
}
export function setChapterItem(state,act,slot,id){const loadout=chapterLoadout(state,act);if(id)loadout[slot]=id;else delete loadout[slot];return applyChapterLoadout(state,act,loadout)}
export function replaceChapterLoadout(state,act,loadout){return applyChapterLoadout(state,act,loadout)}
export function equipmentExportForBuild(buildId){const state=loadEquipmentState(buildId);return{version:2,chapters:state.chapters,finalLoadout:finalLoadout(state)}}

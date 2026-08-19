const KEY='bg3-planner-v8-equipment';
const emptyChapters=()=>({1:{},2:{},3:{}});

function read(){try{return JSON.parse(localStorage.getItem(KEY)||'{"builds":{}}')}catch{return{builds:{}}}}
function write(db){localStorage.setItem(KEY,JSON.stringify(db))}
export function loadEquipmentState(buildId){const db=read();const raw=db.builds?.[buildId]||{};return{act:[1,2,3].includes(raw.act)?raw.act:1,slot:raw.slot||'armor',chapters:{...emptyChapters(),...(raw.chapters||{})}}}
export function saveEquipmentState(buildId,state){const db=read();db.builds=db.builds||{};db.builds[buildId]={act:state.act,slot:state.slot,chapters:state.chapters,updatedAt:Date.now()};write(db)}
export function clearEquipmentState(buildId){const db=read();if(db.builds)delete db.builds[buildId];write(db)}
export function chapterLoadout(state,act){const out={};for(let n=1;n<=act;n++)for(const[slot,value]of Object.entries(state.chapters?.[n]||{})){if(value)out[slot]=value;else delete out[slot]}return out}
export function finalLoadout(state){return chapterLoadout(state,3)}
export function setChapterItem(state,act,slot,id){state.chapters[act]=state.chapters[act]||{};state.chapters[act][slot]=id||null;return state}

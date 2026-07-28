const KEY="bg3-planner-v7";
export function loadDatabase(){try{return JSON.parse(localStorage.getItem(KEY)||'{"builds":{},"lastBuildId":null}')}catch{return{builds:{},lastBuildId:null}}}
export function saveDatabase(db){localStorage.setItem(KEY,JSON.stringify(db))}
export function createId(){return `build_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`}

const listeners=new Set();
export function parseRoute(hash=location.hash){const clean=(hash||"#/home").replace(/^#\/?/,"");const p=clean.split("/").filter(Boolean);if(!p.length||p[0]==="home")return{view:"home"};if(p[0]==="build")return{view:"build",id:p[1],step:p[2]||"level"};if(p[0]==="character")return{view:"character",id:p[1]};if(p[0]==="library")return{view:"library",section:p[1]||"spells"};return{view:"home"}}
export function navigate(path){location.hash=path.startsWith("#")?path:`#${path}`}
export function subscribeRoute(fn){listeners.add(fn);return()=>listeners.delete(fn)}
window.addEventListener("hashchange",()=>listeners.forEach(fn=>fn(parseRoute())));

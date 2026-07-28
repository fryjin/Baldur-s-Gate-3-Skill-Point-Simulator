import{classes,classMeta}from"./data/core.js";
import{spellData}from"./data/spells.js";
export function classCounts(build){return build.levels.slice(0,build.targetLevel).reduce((out,key)=>(out[key]=(out[key]||0)+1,out),{})}
export function routeBreakdown(build){return Object.entries(classCounts(build)).map(([key,n])=>`${classes[key].name} ${n}`).join(" / ")||"尚未规划"}
export function proficiencyBonus(build){return 2+Math.floor((build.targetLevel-1)/4)}
export function featThresholds(classKey){return[4,8,12,...(classKey==="fighter"?[6]:[]),...(classKey==="rogue"?[10]:[])].sort((a,b)=>a-b)}
export function featSlots(build){const out=[];for(const[key,level]of Object.entries(classCounts(build)))for(const at of featThresholds(key))if(level>=at)out.push({classKey:key,at});return out}
export function levelClassLevel(build,index){const key=build.levels[index];if(!key)return 0;return build.levels.slice(0,index+1).filter(x=>x===key).length}
export function levelUnlocks(build,index){const key=build.levels[index],level=levelClassLevel(build,index);if(!key)return[];const out=[];if(level===1)out.push(`${classes[key].name} 1级能力`);if(level===classes[key].subclassAt)out.push("选择子职业");if(featThresholds(key).includes(level))out.push("专长或属性提升");if(classes[key].casting&&level===1)out.push("施法能力");if([5,11].includes(level))out.push("核心职业成长节点");return out}
export function maxSpellLevel(classKey,level){if(classKey==="warlock")return Math.min(5,Math.ceil(level/2));if(["paladin","ranger"].includes(classKey))return level<2?0:Math.min(3,Math.ceil(level/4));return Math.min(6,Math.ceil(level/2))}
export function spellMode(classKey){if(classKey==="wizard")return"spellbook";if(["cleric","druid","paladin"].includes(classKey))return"prepared";if(classKey==="warlock")return"pact";return"known"}
export function spellSources(build){return Object.entries(classCounts(build)).filter(([key,level])=>classes[key].casting&&(!["paladin","ranger"].includes(key)||level>=2)).map(([key,level])=>({key,level,name:classes[key].name,ability:classes[key].casting,mode:spellMode(key),maxLevel:maxSpellLevel(key,level),role:classMeta[key]?.role||""}))}
export function spellsForSource(source,query="",levelFilter="all"){const q=query.trim().toLowerCase();return spellData.filter(sp=>sp.classes.includes(source.key)&&sp.level<=source.maxLevel&&(levelFilter==="all"||sp.level===Number(levelFilter))&&(!q||`${sp.name} ${sp.en} ${sp.desc}`.toLowerCase().includes(q)))}
export function spellChoice(build,sourceKey){return build.spellChoices[sourceKey]||{known:[],prepared:[]}}
export function levelImpactText(build){return `${build.targetLevel}级时，熟练加值为 +${proficiencyBonus(build)}，当前路线解锁 ${featSlots(build).length} 个专长节点。`}

import{spellSources,spellChoice}from"./selectors.js";
export function stepIssues(build,step){const issues=[];if(step==="route"&&build.levels.slice(0,build.targetLevel).some(x=>!x))issues.push("仍有等级没有选择职业");if(step==="spells"){for(const src of spellSources(build)){const c=spellChoice(build,src.key);if(!c.known.length)issues.push(`${src.name}尚未选择任何戏法或法术`)}}return issues}

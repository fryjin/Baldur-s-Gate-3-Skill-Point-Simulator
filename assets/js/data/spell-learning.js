import{spellData}from"./spells.js";

const TOTALS={
  sorcerer:[0,2,3,4,5,6,7,8,9,10,11,12,13],
  bard:[0,4,5,6,7,8,9,10,11,12,13,14,15],
  warlock:[0,2,3,4,5,6,7,8,9,10,11,12,13],
  ranger:[0,0,2,3,3,4,4,5,5,6,6,7,7],
  fighter:[0,0,0,3,4,4,4,5,6,6,7,8,8],
  rogue:[0,0,0,3,4,4,4,5,6,6,7,8,8]
};
const PREPARED=new Set(["cleric","druid","paladin"]);
const REPLACEABLE=new Set(["sorcerer","bard","warlock","ranger","fighter","rogue"]);
const labelFor=source=>source.mode==="spellbook"?"法术书":source.mode==="pact"?"契约已知":source.mode==="known"?"已知法术":"准备法术";
const spellByKey=key=>spellData.find(item=>item.key===key);
const clampLevel=level=>Math.max(0,Math.min(12,Number(level)||0));

export function learningMode(source){
  if(!source||PREPARED.has(source.key)||source.mode==="prepared")return"prepared";
  if(source.key==="wizard"||source.mode==="spellbook")return"spellbook";
  return"known"
}
export function classMaxSpellLevel(key,level){
  level=clampLevel(level);
  if(key==="warlock")return Math.min(5,Math.ceil(level/2));
  if(key==="ranger")return level<2?0:Math.min(3,Math.ceil(level/4));
  if(key==="fighter"||key==="rogue")return level<3?0:level>=7?2:1;
  return Math.min(6,Math.ceil(level/2))
}
export function learningTotal(source,level=source?.level){
  level=clampLevel(level);
  if(!source||learningMode(source)==="prepared")return 0;
  if(source.key==="wizard")return level?6+Math.max(0,level-1)*2:0;
  return(TOTALS[source.key]||[])[level]||0
}
export function learningPlan(source){
  if(!source||learningMode(source)==="prepared")return[];
  const out=[];
  for(let level=1;level<=source.level;level++){
    const current=learningTotal(source,level),previous=learningTotal(source,level-1),count=Math.max(0,current-previous);
    if(!count)continue;
    const maxSpellLevel=classMaxSpellLevel(source.key,level);
    if(!maxSpellLevel)continue;
    out.push({
      id:`${source.key}-learn-${level}`,
      sourceKey:source.key,
      classLevel:level,
      count,
      maxSpellLevel,
      type:level===(source.key==="ranger"?2:(source.key==="fighter"||source.key==="rogue")?3:1)?"initial":"level-up",
      title:`${source.name}${level}级`,
      label:level===1||count>1?`学习 ${count} 个法术`:`新增 1 个法术`
    })
  }
  return out
}
export function replacementPlan(source){
  if(!source||!REPLACEABLE.has(source.key))return[];
  const first=source.key==="ranger"?2:(source.key==="fighter"||source.key==="rogue")?3:1;
  const out=[];
  for(let level=first+1;level<=source.level;level++)out.push({id:`${source.key}-replace-${level}`,sourceKey:source.key,classLevel:level,maxSpellLevel:classMaxSpellLevel(source.key,level),title:`${source.name}${level}级`,optional:true});
  return out
}
export function emptyLearningState(source){
  const slots=learningPlan(source).flatMap(node=>Array.from({length:node.count},(_,slotIndex)=>({id:`${node.id}-${slotIndex+1}`,nodeId:node.id,classLevel:node.classLevel,maxSpellLevel:node.maxSpellLevel,slotIndex,spellKey:"",history:[]})));
  return{version:1,sourceKey:source.key,mode:learningMode(source),slots,replacements:[],unassigned:[],updatedAt:Date.now()}
}
function effectiveMax(slot,state){
  let max=slot.maxSpellLevel;
  for(const item of state.replacements||[])if(item.slotId===slot.id)max=Math.max(max,item.maxSpellLevel||0);
  return max
}
function selectedSpellKeys(choice){return[...(choice?.spells||[])].filter(key=>spellByKey(key)?.level>0)}
export function migrateLearningState(existing,source,choice){
  const base=emptyLearningState(source),selected=selectedSpellKeys(choice),selectedSet=new Set(selected),used=new Set();
  if(existing?.version===1&&Array.isArray(existing.slots)){
    const old=new Map(existing.slots.map(slot=>[slot.id,slot]));
    base.replacements=Array.isArray(existing.replacements)?existing.replacements.filter(item=>replacementPlan(source).some(node=>node.classLevel===item.classLevel)):[];
    for(const slot of base.slots){
      const prior=old.get(slot.id),key=prior?.spellKey;
      if(key&&selectedSet.has(key)&&!used.has(key)&&spellByKey(key)?.level<=effectiveMax(slot,{...base,replacements:base.replacements})){
        slot.spellKey=key;slot.history=Array.isArray(prior.history)?prior.history:[];used.add(key)
      }
    }
  }
  const remaining=selected.filter(key=>!used.has(key)).sort((a,b)=>(spellByKey(b)?.level||0)-(spellByKey(a)?.level||0));
  const open=()=>base.slots.filter(slot=>!slot.spellKey);
  for(const key of[...remaining]){
    const level=spellByKey(key)?.level||0;
    const slot=open().filter(item=>item.maxSpellLevel>=level).sort((a,b)=>a.maxSpellLevel-b.maxSpellLevel||a.classLevel-b.classLevel)[0];
    if(slot){slot.spellKey=key;used.add(key);remaining.splice(remaining.indexOf(key),1)}
  }
  const replacementNodes=replacementPlan(source).filter(node=>!base.replacements.some(item=>item.classLevel===node.classLevel));
  for(const key of[...remaining]){
    const level=spellByKey(key)?.level||0;
    const node=replacementNodes.filter(item=>item.maxSpellLevel>=level).sort((a,b)=>a.maxSpellLevel-b.maxSpellLevel||a.classLevel-b.classLevel)[0];
    const slot=open()[0];
    if(!node||!slot)continue;
    slot.spellKey=key;slot.history.push({classLevel:node.classLevel,from:"",to:key,migrated:true});
    base.replacements.push({classLevel:node.classLevel,slotId:slot.id,from:"",to:key,maxSpellLevel:node.maxSpellLevel,migrated:true});
    replacementNodes.splice(replacementNodes.indexOf(node),1);used.add(key);remaining.splice(remaining.indexOf(key),1)
  }
  base.unassigned=remaining;base.updatedAt=Date.now();return base
}
export function nodeProgress(state,node){
  const slots=state?.slots?.filter(slot=>slot.nodeId===node.id)||[];
  return{selected:slots.filter(slot=>slot.spellKey).length,total:slots.length,complete:slots.length>0&&slots.every(slot=>slot.spellKey)}
}
export function activeNodeForState(source,state,preferred=""){
  const plan=learningPlan(source);
  if(preferred&&plan.some(node=>node.id===preferred))return plan.find(node=>node.id===preferred);
  return plan.find(node=>!nodeProgress(state,node).complete)||plan.at(-1)||null
}
export function assignToNode(state,node,spellKey){
  const spell=spellByKey(spellKey);if(!spell||spell.level<1||spell.level>node.maxSpellLevel)return{ok:false,reason:`当前学习节点最高只能选择 ${node.maxSpellLevel} 环法术。`};
  if(state.slots.some(slot=>slot.spellKey===spellKey))return{ok:false,reason:"该法术已经在其他学习节点中。"};
  const slot=state.slots.find(item=>item.nodeId===node.id&&!item.spellKey);if(!slot)return{ok:false,reason:`${node.title}的学习名额已经用完。`};
  slot.spellKey=spellKey;state.unassigned=(state.unassigned||[]).filter(key=>key!==spellKey);state.updatedAt=Date.now();return{ok:true,slot}
}
export function removeLearnedSpell(state,spellKey){
  const slot=state.slots.find(item=>item.spellKey===spellKey);if(slot)slot.spellKey="";
  state.unassigned=(state.unassigned||[]).filter(key=>key!==spellKey);state.updatedAt=Date.now();return slot||null
}
export function replaceLearnedSpell(state,source,classLevel,slotId,newSpellKey){
  const node=replacementPlan(source).find(item=>item.classLevel===Number(classLevel));
  if(!node)return{ok:false,reason:"当前等级没有可用的替换节点。"};
  if(state.replacements.some(item=>item.classLevel===node.classLevel))return{ok:false,reason:`${node.title}的替换机会已经使用。`};
  const spell=spellByKey(newSpellKey),slot=state.slots.find(item=>item.id===slotId);
  if(!slot?.spellKey)return{ok:false,reason:"请先选择要替换的已知法术。"};
  if(!spell||spell.level<1||spell.level>node.maxSpellLevel)return{ok:false,reason:`${node.title}最高只能替换为 ${node.maxSpellLevel} 环法术。`};
  if(state.slots.some(item=>item.spellKey===newSpellKey))return{ok:false,reason:"该法术已经学会。"};
  const from=slot.spellKey;slot.spellKey=newSpellKey;slot.history.push({classLevel:node.classLevel,from,to:newSpellKey});
  state.replacements.push({classLevel:node.classLevel,slotId:slot.id,from,to:newSpellKey,maxSpellLevel:node.maxSpellLevel});state.updatedAt=Date.now();return{ok:true,from,to:newSpellKey,slot}
}
export function learningValidation(source,state,choice){
  if(learningMode(source)==="prepared")return{valid:true,issues:[]};
  const issues=[],selected=new Set(selectedSpellKeys(choice)),assigned=state?.slots?.map(slot=>slot.spellKey).filter(Boolean)||[];
  for(const node of learningPlan(source)){const progress=nodeProgress(state,node);if(progress.selected<progress.total)issues.push(`${node.title}还需学习 ${progress.total-progress.selected} 个法术`)}
  for(const key of assigned)if(!selected.has(key))issues.push(`${spellByKey(key)?.name||key}存在学习记录但不在当前法术列表中`);
  for(const key of selected)if(!assigned.includes(key))issues.push(`${spellByKey(key)?.name||key}没有合法的学习等级`);
  for(const key of state?.unassigned||[])issues.push(`${spellByKey(key)?.name||key}无法分配到合法学习节点`);
  return{valid:issues.length===0,issues}
}
export function learningRingCounts(state){
  const out={};for(const slot of state?.slots||[]){const level=spellByKey(slot.spellKey)?.level||0;if(level)out[level]=(out[level]||0)+1}return out
}
export function learningSummary(source,state){
  const total=state?.slots?.filter(slot=>slot.spellKey).length||0,limit=state?.slots?.length||0,rings=learningRingCounts(state);
  return{total,limit,rings,text:Object.entries(rings).map(([level,count])=>`${level}环 ${count}`).join(" · ")||"尚未学习",label:labelFor(source)}
}
export function spellName(key){return spellByKey(key)?.name||key}

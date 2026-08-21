const at=(table,level)=>table[Math.max(0,Math.min(12,Number(level)||0))]||0;

const FULL_SLOTS=[[],[2],[3],[4,2],[4,3],[4,3,2],[4,3,3],[4,3,3,1],[4,3,3,2],[4,3,3,3,1],[4,3,3,3,2],[4,3,3,3,2,1],[4,3,3,3,2,1]];
const HALF_SLOTS=[[],[],[2],[3],[3],[4,2],[4,2],[4,3],[4,3],[4,3,2],[4,3,2],[4,3,3],[4,3,3]];
const THIRD_SLOTS=[[],[],[],[2],[3],[3],[3],[4,2],[4,2],[4,2],[4,3],[4,3],[4,3]];
const PACT_SLOTS=[null,{level:1,count:1},{level:1,count:2},{level:2,count:2},{level:2,count:2},{level:3,count:2},{level:3,count:2},{level:4,count:2},{level:4,count:2},{level:5,count:2},{level:5,count:2},{level:5,count:3},{level:5,count:3}];

const CANTRIPS={
  wizard:[0,3,3,3,4,4,4,4,4,4,5,5,5],
  sorcerer:[0,4,4,4,5,5,5,5,5,5,6,6,6],
  bard:[0,2,2,2,3,3,3,3,3,3,4,4,4],
  cleric:[0,3,3,3,4,4,4,4,4,4,5,5,5],
  druid:[0,2,2,2,3,3,3,3,3,3,4,4,4],
  warlock:[0,2,2,2,3,3,3,3,3,3,4,4,4]
};

const KNOWN={
  sorcerer:[0,2,3,4,5,6,7,8,9,10,11,12,13],
  bard:[0,4,5,6,7,8,9,10,11,12,13,14,15],
  warlock:[0,2,3,4,5,6,7,8,9,10,11,12,13],
  ranger:[0,0,2,3,3,4,4,5,5,6,6,7,7],
  fighter:[0,0,0,3,4,4,4,5,6,6,7,8,8],
  rogue:[0,0,0,3,4,4,4,5,6,6,7,8,8]
};

const FULL_CASTERS=new Set(['wizard','sorcerer','bard','cleric','druid']);
const HALF_CASTERS=new Set(['paladin','ranger']);
const THIRD_CASTERS=new Set(['fighter','rogue']);

export function cantripLimit(source){return at(CANTRIPS[source.key]||[],source.level)}
export function cantripPlan(source){
  if(!source)return[];
  const out=[];let previous=0;
  for(let level=1;level<=source.level;level++){
    const current=cantripLimit({...source,level}),count=Math.max(0,current-previous);
    if(count)out.push({classLevel:level,count,total:current});
    previous=current
  }
  return out
}
export function learnedLimit(source){
  if(source.key==='wizard')return 6+Math.max(0,source.level-1)*2;
  return at(KNOWN[source.key]||[],source.level)
}
export function preparedLimit(source,abilityModifier){
  if(source.mode==='spellbook'||source.mode==='prepared')return Math.max(1,source.level+abilityModifier);
  return 0
}
export function sharedCasterLevel(build,subclasses={}){
  const counts=(build.levels||[]).slice(0,build.targetLevel||0).reduce((out,key)=>(out[key]=(out[key]||0)+1,out),{});
  let level=0;
  for(const[key,n]of Object.entries(counts)){
    if(FULL_CASTERS.has(key))level+=n;
    else if(HALF_CASTERS.has(key))level+=Math.floor(n/2);
    else if(key==='fighter'&&subclasses.fighter==='奥法骑士')level+=Math.floor(n/3);
    else if(key==='rogue'&&subclasses.rogue==='诡术师')level+=Math.floor(n/3);
  }
  return Math.max(0,Math.min(12,level))
}
export function slotProfile(build,source,allSources=[]){
  if(source.mode==='pact'){
    const pact=PACT_SLOTS[Math.max(1,Math.min(12,source.level))]||{level:1,count:1};
    return{kind:'pact',slots:Array.from({length:pact.level},(_,i)=>i===pact.level-1?pact.count:0),pact}
  }
  const nonPact=allSources.filter(item=>item.mode!=='pact');
  if(nonPact.length>1){
    const level=sharedCasterLevel(build,build.subclasses||{});
    return{kind:'shared',slots:FULL_SLOTS[level]||[],casterLevel:level}
  }
  if(FULL_CASTERS.has(source.key))return{kind:'class',slots:FULL_SLOTS[source.level]||[]};
  if(HALF_CASTERS.has(source.key))return{kind:'class',slots:HALF_SLOTS[source.level]||[]};
  if(THIRD_CASTERS.has(source.key))return{kind:'class',slots:THIRD_SLOTS[source.level]||[]};
  return{kind:'class',slots:[]}
}
export function spellRuleSummary(build,source,allSources,abilityModifier){
  const cantrips=cantripLimit(source),prepared=preparedLimit(source,abilityModifier),learned=learnedLimit(source),slot=slotProfile(build,source,allSources);
  const selectionLabel=source.mode==='spellbook'?'法术书':source.mode==='prepared'?'准备':source.mode==='pact'?'已知（契约）':'已知';
  return{cantrips,prepared,learned,slot,selectionLabel,maxLevel:source.maxLevel}
}
export function ringCounts(keys,spellData){
  const map={};
  for(const key of keys||[]){const level=spellData.find(item=>item.key===key)?.level||0;if(level>0)map[level]=(map[level]||0)+1}
  return map
}
export function slotText(profile){
  if(profile.kind==='pact')return`${profile.pact.count}个${profile.pact.level}环契约位`;
  return profile.slots.map((count,index)=>count?`${index+1}环 ${count}`:'').filter(Boolean).join(' · ')||'无可用法术位'
}

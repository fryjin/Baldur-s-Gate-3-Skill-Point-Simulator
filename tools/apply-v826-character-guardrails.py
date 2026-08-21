#!/usr/bin/env python3
from pathlib import Path
import subprocess, shutil

ROOT=Path(__file__).resolve().parents[1]
FILES={
  "selectors":ROOT/"assets/js/selectors.js",
  "store":ROOT/"assets/js/store.js",
  "learning":ROOT/"assets/js/data/spell-learning.js",
  "progression":ROOT/"assets/js/data/spell-progression.js",
  "editor":ROOT/"assets/v8/character-editor.js",
  "v82":ROOT/"assets/v8/v82.js",
  "html":ROOT/"v8.html",
}
EXPECTED={
  "selectors":"1706fb7f47592d22d99537e61f9ae5f4f13aa3e7",
  "store":"85f0d38b365b9e95551347ccb2a15ff8bb7a296c",
  "learning":"20db29b4e86f86ce3358f7b4e6ac48322265726d",
  "progression":"d0f9c7fce915b95f816963af303f9ea8b742789a",
  "editor":"c02577cf6202bea9cd929d1a0aa4299681cf54b5",
  "v82":"76a141ac5a70e0cd0fa5e68ac562925655e6e4fb",
  "html":"2fad951428938f3b2597486716937942fa729011",
}

def blob(path):
    try:return subprocess.check_output(["git","hash-object",str(path)],cwd=ROOT,text=True).strip()
    except Exception:return ""

def must_replace(text,old,new,label):
    if old not in text:
        raise RuntimeError(f"{label}: expected source block not found")
    return text.replace(old,new,1)

def main():
    if "V8.2.6" in FILES["v82"].read_text(encoding="utf-8") and "v826.css" in FILES["html"].read_text(encoding="utf-8"):
        print("V8.2.6 Character Guardrails already applied.")
        return 0
    for key,path in FILES.items():
        if not path.exists():
            print("ERROR missing",path);return 2
        current=blob(path)
        if current and current!=EXPECTED[key]:
            print("ERROR baseline mismatch:",key)
            print("current:",current)
            print("expected:",EXPECTED[key])
            print("No file changed.")
            return 3

    originals={k:p.read_text(encoding="utf-8") for k,p in FILES.items()}
    try:
        s=originals["selectors"]
        s=must_replace(s,
            'import{spellData}from"./data/spells.js";',
            'import{spellData}from"./data/spells.js";\nimport{POINT_BUY_BUDGET,POINT_BUY_COSTS,pointBuyUsedScores}from"./data/point-buy.js";\nimport{learningMode,migrateLearningState,learningIntegrityIssues}from"./data/spell-learning.js";',
            "selectors imports")
        s=must_replace(s,
            'export const pointCosts={8:0,9:1,10:2,11:3,12:4,13:5,14:7,15:9};',
            'export const pointCosts=POINT_BUY_COSTS;\nexport const pointBuyBudget=POINT_BUY_BUDGET;',
            "point cost source")
        s=must_replace(s,
            'export function usedPointBuy(build){return abilities.reduce((sum,a)=>sum+(pointCosts[build.abilities.scores[a.key]]??0),0)}',
            'export function usedPointBuy(build){return pointBuyUsedScores(build.abilities.scores)}',
            "usedPointBuy")

        start=s.index('export function validationIssues(build){')
        end=s.index('\nexport function levelImpactText(build)',start)
        new_validation='''export function validationIssues(build){const issues=[];const used=usedPointBuy(build);if(used!==pointBuyBudget)issues.push({step:"abilities",severity:used>pointBuyBudget?"error":"warn",message:used>pointBuyBudget?`点购超出 ${used-pointBuyBudget} 点`:`点购还剩 ${pointBuyBudget-used} 点`});if(build.abilities.bonus1===build.abilities.bonus2)issues.push({step:"abilities",severity:"error",message:"创建加值 +2 与 +1 不能放在同一属性"});progressionNodes(build).filter(x=>!x.complete).forEach(node=>issues.push({step:"progression",severity:"warn",message:`${node.label}：${node.title}` }));skillStages(build).filter(stage=>stage.selected.length<stage.limit).forEach(stage=>issues.push({step:"skills",severity:"warn",message:`${stage.title}还需选择 ${stage.limit-stage.selected.length} 项`}));activeFeatureGroups(build).filter(group=>group.selected.length<group.limit).forEach(group=>issues.push({step:"features",severity:"warn",message:`${classes[group.classKey].name} · ${group.title}还需选择 ${group.limit-group.selected.length} 项`}));spellSources(build).forEach(src=>{const choice=spellChoice(build,src.key),limit=spellLimits(build,src);if(choice.cantrips.length>limit.cantrips)issues.push({step:"spells",severity:"error",message:`${src.name}戏法超出上限 ${choice.cantrips.length-limit.cantrips} 个`});else if(choice.cantrips.length<limit.cantrips)issues.push({step:"spells",severity:"warn",message:`${src.name}还可选择 ${limit.cantrips-choice.cantrips.length} 个戏法`});if(src.mode==="prepared"){if(choice.prepared.length>limit.prepared)issues.push({step:"spells",severity:"error",message:`${src.name}准备法术超出上限 ${choice.prepared.length-limit.prepared} 个`});else if(choice.prepared.length<limit.prepared)issues.push({step:"spells",severity:"warn",message:`${src.name}还可准备 ${limit.prepared-choice.prepared.length} 个法术`})}else{if(choice.spells.length>limit.spells)issues.push({step:"spells",severity:"error",message:`${src.name}${limit.spellLabel}超出上限 ${choice.spells.length-limit.spells} 个`});else if(choice.spells.length<limit.spells)issues.push({step:"spells",severity:"warn",message:`${src.name}${limit.spellLabel}还差 ${limit.spells-choice.spells.length} 个法术`});if(src.mode==="spellbook"){if(choice.prepared.length>limit.prepared)issues.push({step:"spells",severity:"error",message:`${src.name}准备法术超出上限 ${choice.prepared.length-limit.prepared} 个`});else if(choice.prepared.length<limit.prepared)issues.push({step:"spells",severity:"warn",message:`${src.name}还可准备 ${limit.prepared-choice.prepared.length} 个法术`})}if(learningMode(src)!=="prepared"){const state=migrateLearningState(build.spellLearning?.[src.key],src,choice);learningIntegrityIssues(src,state,choice).forEach(message=>issues.push({step:"spells",severity:"error",message:`${src.name}：${message}`}))}}});return issues}'''
        s=s[:start]+new_validation+s[end:]
        FILES["selectors"].write_text(s,encoding="utf-8")

        s=originals["store"]
        s=must_replace(s,
            'import{spellData}from"./data/spells.js";',
            'import{spellData}from"./data/spells.js";\nimport{canSetPointBuyScore}from"./data/point-buy.js";',
            "store import")
        s=must_replace(s,
            'export function setAbilityScore(id,key,value){if(!abilities.some(a=>a.key===key))return;return updateBuild(id,b=>{b.abilities.scores[key]=Math.max(8,Math.min(15,Number(value)||8))})}',
            'export function setAbilityScore(id,key,value){if(!abilities.some(a=>a.key===key))return;return updateBuild(id,b=>{const next=Math.max(8,Math.min(15,Number(value)||8));if(canSetPointBuyScore(b.abilities.scores,key,next))b.abilities.scores[key]=next})}',
            "ability hard guard")
        s=must_replace(s,
            'export function toggleSpell(id,sourceKey,spellKey){const spell=spellData.find(x=>x.key===spellKey);if(!spell)return;return updateBuild(id,b=>{const choice=b.spellChoices[sourceKey]||(b.spellChoices[sourceKey]={cantrips:[],spells:[],prepared:[]});const list=spell.level===0?choice.cantrips:choice.spells;const at=list.indexOf(spellKey);if(at>=0){list.splice(at,1);choice.prepared=choice.prepared.filter(x=>x!==spellKey)}else list.push(spellKey)})}',
            'export function toggleSpell(id,sourceKey,spellKey,limit=99){const spell=spellData.find(x=>x.key===spellKey);if(!spell)return;return updateBuild(id,b=>{const choice=b.spellChoices[sourceKey]||(b.spellChoices[sourceKey]={cantrips:[],spells:[],prepared:[]});const list=spell.level===0?choice.cantrips:choice.spells;const at=list.indexOf(spellKey);if(at>=0){list.splice(at,1);choice.prepared=choice.prepared.filter(x=>x!==spellKey)}else if(list.length<limit)list.push(spellKey)})}',
            "toggleSpell hard limit")
        FILES["store"].write_text(s,encoding="utf-8")

        s=originals["progression"]
        s=must_replace(s,
            'export function cantripLimit(source){return at(CANTRIPS[source.key]||[],source.level)}',
            '''export function cantripLimit(source){return at(CANTRIPS[source.key]||[],source.level)}
export function cantripPlan(source){
  if(!source)return[];
  const out=[];let previous=0;
  for(let level=1;level<=source.level;level++){
    const current=cantripLimit({...source,level}),count=Math.max(0,current-previous);
    if(count)out.push({classLevel:level,count,total:current});
    previous=current
  }
  return out
}''',
            "cantrip plan")
        FILES["progression"].write_text(s,encoding="utf-8")

        s=originals["learning"]
        s=must_replace(s,
            'base.replacements=Array.isArray(existing.replacements)?existing.replacements.filter(item=>replacementPlan(source).some(node=>node.classLevel===item.classLevel)):[];',
            'base.replacements=Array.isArray(existing.replacements)?existing.replacements.filter(item=>!item.migrated&&replacementPlan(source).some(node=>node.classLevel===item.classLevel)):[];',
            "drop synthetic replacements")
        start=s.index('  const replacementNodes=replacementPlan(source)')
        end=s.index('  base.unassigned=remaining;base.updatedAt=Date.now();return base',start)
        s=s[:start]+'  // Do not invent replacement history for legacy high-ring selections.\n'+s[end:]
        s=must_replace(s,
            '''export function activeNodeForState(source,state,preferred=""){
  const plan=learningPlan(source);
  if(preferred&&plan.some(node=>node.id===preferred))return plan.find(node=>node.id===preferred);
  return plan.find(node=>!nodeProgress(state,node).complete)||plan.at(-1)||null
}''',
            '''export function activeNodeForState(source,state,preferred=""){
  const plan=learningPlan(source),open=plan.find(node=>!nodeProgress(state,node).complete);
  if(open)return open;
  if(preferred&&plan.some(node=>node.id===preferred))return plan.find(node=>node.id===preferred);
  return plan.at(-1)||null
}''',
            "sequential active node")
        s=must_replace(s,
            '''export function assignToNode(state,node,spellKey){
  const spell=spellByKey(spellKey);if(!spell||spell.level<1||spell.level>node.maxSpellLevel)return{ok:false,reason:`当前学习节点最高只能选择 ${node.maxSpellLevel} 环法术。`};
  if(state.slots.some(slot=>slot.spellKey===spellKey))return{ok:false,reason:"该法术已经在其他学习节点中。"};
  const slot=state.slots.find(item=>item.nodeId===node.id&&!item.spellKey);if(!slot)return{ok:false,reason:`${node.title}的学习名额已经用完。`};
  slot.spellKey=spellKey;state.unassigned=(state.unassigned||[]).filter(key=>key!==spellKey);state.updatedAt=Date.now();return{ok:true,slot}
}''',
            '''export function assignToNode(state,node,spellKey){
  const earlierOpen=state.slots.some(slot=>slot.classLevel<node.classLevel&&!slot.spellKey);
  if(earlierOpen)return{ok:false,reason:"请先完成更早等级的法术学习名额。"};
  const spell=spellByKey(spellKey);if(!spell||spell.level<1||spell.level>node.maxSpellLevel)return{ok:false,reason:`当前学习节点最高只能选择 ${node.maxSpellLevel} 环法术。`};
  if(state.slots.some(slot=>slot.spellKey===spellKey))return{ok:false,reason:"该法术已经在其他学习节点中。"};
  const slot=state.slots.find(item=>item.nodeId===node.id&&!item.spellKey);if(!slot)return{ok:false,reason:`${node.title}的学习名额已经用完。`};
  slot.spellKey=spellKey;state.unassigned=(state.unassigned||[]).filter(key=>key!==spellKey);state.updatedAt=Date.now();return{ok:true,slot}
}''',
            "chronological assignment")
        start=s.index('export function learningValidation(source,state,choice){')
        end=s.index('\nexport function learningRingCounts(state)',start)
        new_lv='''export function learningIntegrityIssues(source,state,choice){
  if(learningMode(source)==="prepared")return[];
  const issues=[],selected=new Set(selectedSpellKeys(choice)),assigned=state?.slots?.map(slot=>slot.spellKey).filter(Boolean)||[];
  for(const key of assigned)if(!selected.has(key))issues.push(`${spellByKey(key)?.name||key}存在学习记录但不在当前法术列表中`);
  for(const key of selected)if(!assigned.includes(key))issues.push(`${spellByKey(key)?.name||key}没有合法的学习等级`);
  for(const key of state?.unassigned||[])if(!issues.some(x=>x.startsWith(spellByKey(key)?.name||key)))issues.push(`${spellByKey(key)?.name||key}无法分配到合法学习节点`);
  return issues
}
export function learningValidation(source,state,choice){
  if(learningMode(source)==="prepared")return{valid:true,issues:[]};
  const issues=[];
  for(const node of learningPlan(source)){const progress=nodeProgress(state,node);if(progress.selected<progress.total)issues.push(`${node.title}还需学习 ${progress.total-progress.selected} 个法术`)}
  issues.push(...learningIntegrityIssues(source,state,choice));
  return{valid:issues.length===0,issues}
}'''
        s=s[:start]+new_lv+s[end:]
        FILES["learning"].write_text(s,encoding="utf-8")

        s=originals["editor"]
        s=must_replace(s,
            'activeFeatureGroups,spellSources,spellChoice,spellLimits,spellsForSource,featSlots,levelClassLevel',
            'activeFeatureGroups,spellSources,spellChoice,spellLimits,spellsForSource,featSlots,levelClassLevel,pointBuyBudget',
            "editor point budget import")
        s=must_replace(s,
            '''  learningMode,learningPlan,migrateLearningState,nodeProgress,activeNodeForState,assignToNode,removeLearnedSpell,
  replacementPlan,replaceLearnedSpell
}from'../js/data/spell-learning.js';''',
            '''  learningMode,learningPlan,migrateLearningState,nodeProgress,activeNodeForState,assignToNode,removeLearnedSpell,
  replacementPlan,replaceLearnedSpell,learningSummary
}from'../js/data/spell-learning.js';
import{cantripPlan}from'../js/data/spell-progression.js';''',
            "editor learning imports")

        start=s.index('function abilitiesStep(build){')
        end=s.index('\nfunction skillsStep(build,ui){',start)
        new_abilities=r'''function abilitiesStep(build){
  const used=usedPointBuy(build),scores=build.abilities.scores,remaining=pointBuyBudget-used;
  return`${stepHead('CHARACTER · 04','初始属性与属性提升',`使用 ${pointBuyBudget} 点点购完成初始属性；达到预算后无法继续提高属性。创建加值 +2 / +1 不能放在同一属性。`,`<strong>${used}<small>/${pointBuyBudget}</small></strong>`)}
  <div class="v82-pointbar"><span>点购使用</span><div><i style="width:${Math.min(100,used/pointBuyBudget*100)}%"></i></div><b class="${used===pointBuyBudget?'ok':used>pointBuyBudget?'bad':''}">${used}/${pointBuyBudget}</b></div>
  <div class="v82-ability-editor">${abilities.map(a=>{const v=scores[a.key],nextCost=v<15?(pointCosts[v+1]-pointCosts[v]):Infinity,canRaise=v<15&&used+nextCost<=pointBuyBudget;return`<div class="v82-ability-row"><div><b>${a.name}</b><small>${a.code}</small></div><button data-ability="${a.key}" data-ability-delta="-1" ${v<=8?'disabled':''}>−</button><strong>${v}</strong><button data-ability="${a.key}" data-ability-delta="1" ${canRaise?'':'disabled'} title="${canRaise?`提高到 ${v+1} 需要 ${nextCost} 点`:`剩余点数不足以提高到 ${Math.min(15,v+1)}`}">＋</button><span>成本 ${pointCosts[v]??'—'}${v<15?` · 下一级 +${nextCost}`:''}</span></div>`}).join('')}</div>
  <div class="v826-pointbuy-note ${remaining<0?'bad':''}"><span>${remaining>=0?`剩余 <b>${remaining}</b> 点。加号会根据下一档成本自动锁定。`:`当前旧数据已超出预算 <b>${-remaining}</b> 点，请先降低属性。`}</span><small>单项范围 8–15；14、15 的点购成本更高。</small></div>
  <div class="v82-form-grid two v82-bonus-box"><label><span>创建加值 +2</span><select data-bonus="bonus2">${abilities.map(a=>opt(a.key,a.name,build.abilities.bonus2)).join('')}</select></label><label><span>创建加值 +1</span><select data-bonus="bonus1">${abilities.map(a=>opt(a.key,a.name,build.abilities.bonus1)).join('')}</select></label></div>`
}
'''
        s=s[:start]+new_abilities+s[end:]

        start=s.index('function spellCard(sp,source,choice,ui,state,activeNode){')
        end=s.index('\nfunction spellInspector',start)
        new_card=r'''function spellCard(sp,source,choice,ui,state,activeNode,limits){
  const selected=spellSelected(choice,source,sp),prepared=choice.prepared.includes(sp.key),progress=state&&activeNode?nodeProgress(state,activeNode):null;
  const ringLocked=sp.level>0&&state&&activeNode&&!selected&&sp.level>activeNode.maxSpellLevel;
  const nodeFull=sp.level>0&&state&&activeNode&&!selected&&Boolean(progress?.complete);
  const knownFull=sp.level>0&&state&&!selected&&choice.spells.length>=limits.spells;
  const cantripFull=sp.level===0&&!selected&&choice.cantrips.length>=limits.cantrips;
  const preparedFull=sp.level>0&&source.mode==='prepared'&&!selected&&choice.prepared.length>=limits.prepared;
  const locked=ringLocked||nodeFull||knownFull||cantripFull||preparedFull;
  const reason=ringLocked?`当前节点最高 ${activeNode.maxSpellLevel} 环`:nodeFull?'当前等级学习名额已满':knownFull?`${source.mode==='spellbook'?'法术书':'已知法术'}总名额已满`:cantripFull?'戏法名额已满':preparedFull?'准备法术名额已满':'';
  const prepareLocked=source.mode==='spellbook'&&sp.level>0&&selected&&!prepared&&choice.prepared.length>=limits.prepared;
  const action=selected?(source.mode==='prepared'&&sp.level>0?'取消准备':'移除'):(source.mode==='prepared'&&sp.level>0?'准备':'选择');
  return`<article class="v82-spell-card ${selected?'selected':''} ${prepared?'prepared':''} ${locked?'locked':''}"><button class="v82-spell-open" data-spell-detail="${sp.key}">${spellImageTag(sp,'v82-spell-image')}<div><div class="v82-spell-title"><b>${esc(sp.name)}</b>${selected?'<i>已选</i>':''}</div><small>${esc(spellMeta(sp))}</small><p>${esc(sp.desc)}</p></div></button><div class="v82-spell-actions">${reason&&!selected?`<small class="v826-spell-lock">${esc(reason)}</small>`:''}${source.mode==='spellbook'&&sp.level>0&&selected?`<button data-spell-prepare="${sp.key}" class="${prepared?'active':''}" ${prepareLocked?'disabled':''}>${prepared?'取消准备':prepareLocked?'准备已满':'准备'}</button>`:''}<button data-spell-toggle="${sp.key}" ${locked?'disabled':''}>${action}</button></div></article>`
}'''
        s=s[:start]+new_card+s[end:]

        start=s.index('function spellsStep(build,ui){')
        end=s.index('\nfunction reviewStep(build){',start)
        new_step=r'''function spellsStep(build,ui){
  const sources=spellSources(build);if(!sources.length)return`${stepHead('CHARACTER · 07','戏法与法术','当前职业路线没有施法能力。')}<div class="v82-empty">没有法术步骤；可以直接进入人物确认。</div>`;
  const source=sources.find(x=>x.key===ui.spellSource)||sources[0];ui.spellSource=source.key;
  const choice=spellChoice(build,source.key),limits=spellLimits(build,source),mode=learningMode(source),state=mode==='prepared'?null:learningState(build,source),plan=state?learningPlan(source):[],preferred=ui.spellNode?.[source.key],activeNode=state?activeNodeForState(source,state,preferred):null;if(activeNode){ui.spellNode=ui.spellNode||{};ui.spellNode[source.key]=activeNode.id}
  const query=ui.spellQuery||'',level=ui.spellLevel??'all';let list=spellsForSource(source,query,level);
  const detail=spellData.find(x=>x.key===ui.spellDetail&&x.classes.includes(source.key))||list[0]||null;
  const count2=source.mode==='prepared'?choice.prepared.length:choice.spells.length,label2=source.mode==='spellbook'?'升级法术书':source.mode==='prepared'?'准备':'已知';
  const cantripGrowth=cantripPlan(source),cantripGrowthText=cantripGrowth.map(x=>`${x.classLevel}级 ${x.classLevel===1?x.count:'+'+x.count}`).join(' · ')||'当前职业无戏法';
  const p=state&&activeNode?nodeProgress(state,activeNode):null,nodeRemain=p?Math.max(0,p.total-p.selected):0,learned=state?learningSummary(source,state):null;
  const nodeRing=activeNode?`1–${activeNode.maxSpellLevel}环`:`1–${source.maxLevel}环`,quotaTotal=source.mode==='prepared'?limits.prepared:limits.spells;
  const ruleNote=source.mode==='prepared'
    ?`准备法术<strong>没有每环固定配额</strong>：在当前最高 ${source.maxLevel} 环范围内任意组合，但准备总数不能超过 ${limits.prepared}。法术位数量不是准备数量。`
    :source.mode==='spellbook'
      ?`升级获得的法术书必须<strong>按职业等级节点逐级加入</strong>；当前节点只有自己的新增名额和最高环阶。准备法术另受 ${limits.prepared} 个上限约束。`
      :`已知法术<strong>没有每环固定配额</strong>：必须按职业等级逐级学习。当前节点只能使用本级新增名额，且不能选择高于当级解锁的环阶。`;
  return`${stepHead('CHARACTER · 07','戏法与法术','先完成戏法总额，再按职业等级逐级处理法术学习/准备；高环法术会受当前学习节点硬限制。',`<strong>${choice.cantrips.length}<small>/${limits.cantrips} 戏法</small></strong>`)}
  <div class="v82-spell-toolbar"><select data-spell-source>${sources.map(s=>sourceOption(s,source.key)).join('')}</select><div class="v82-spell-counts"><span>戏法 <b>${choice.cantrips.length}/${limits.cantrips}</b></span><span>${label2} <b>${count2}/${quotaTotal}</b></span>${source.mode==='spellbook'?`<span>准备 <b>${choice.prepared.length}/${limits.prepared}</b></span>`:''}</div></div>
  <div class="v826-spell-rules">
    <div class="v826-spell-rule"><span>当前职业等级</span><b>${esc(source.name)} ${source.level}级</b><small>当前最高 ${source.maxLevel} 环</small></div>
    <div class="v826-spell-rule"><span>戏法名额</span><b>${choice.cantrips.length} / ${limits.cantrips}</b><small>${esc(cantripGrowthText)}</small></div>
    <div class="v826-spell-rule"><span>${esc(label2)}名额</span><b>${count2} / ${quotaTotal}</b><small>${state?`已学环阶：${esc(learned?.text||'尚未学习')}`:`可准备 1–${source.maxLevel} 环`}</small></div>
    <div class="v826-spell-rule"><span>${state?'当前学习节点':'准备规则'}</span><b>${state?esc(activeNode?.title||'已完成'):`总上限 ${limits.prepared}`}</b><small>${state&&activeNode?`本级新增 ${p?.total||0} · 剩余 ${nodeRemain} · 可选 ${nodeRing}`:`最高 ${source.maxLevel} 环内任意组合`}</small></div>
    <p class="v826-spell-rule-note">${ruleNote}</p>
  </div>
  ${state?`<div class="v82-learning-strip"><div class="v82-current-learning"><span>按顺序学习 · 当前节点</span><b>${esc(activeNode?.title||'—')}</b><small class="${nodeRemain?'v826-learning-warning':''}">${activeNode?`${p.selected}/${p.total} · 本级新增 ${p.total} 个 · 剩余 ${nodeRemain} 个 · 最高 ${activeNode.maxSpellLevel} 环`:''}</small></div><div class="v82-learning-nodes">${plan.map(n=>{const np=nodeProgress(state,n),isActive=n.id===activeNode?.id;return`<button ${isActive?'':'disabled'} class="${isActive?'active':''} ${np.complete?'complete':''}" title="${esc(n.title)}：新增 ${n.count} 个，最高 ${n.maxSpellLevel} 环"><b>${n.classLevel}</b><small>${np.selected}/${np.total} · ≤${n.maxSpellLevel}环</small></button>`}).join('')}</div>${replacementPlan(source).length?'<button class="secondary" data-open-replace>替换法术</button>':''}</div>`:''}
  <div class="v82-spell-search"><input data-spell-search placeholder="搜索法术名称、英文名或效果" value="${esc(query)}"><div>${['all',0,1,2,3,4,5,6].filter(v=>v==='all'||Number(v)<=source.maxLevel).map(v=>{const ringLocked=state&&activeNode&&v!=='all'&&Number(v)>0&&Number(v)>activeNode.maxSpellLevel;return`<button data-spell-level="${v}" class="${String(level)===String(v)?'active':''} ${ringLocked?'v826-ring-locked':''}">${v==='all'?'全部':v===0?'戏法':v+'环'}</button>`}).join('')}</div></div>
  <div class="v82-spell-workspace"><div class="v82-spell-list">${list.length?list.map(sp=>spellCard(sp,source,choice,ui,state,activeNode,limits)).join(''):'<div class="v82-empty">当前筛选没有法术。</div>'}</div>${spellInspector(detail,source,choice)}</div>`
}
'''
        s=s[:start]+new_step+s[end:]

        s=must_replace(s,
            "document.querySelectorAll('[data-spell-prepare]').forEach(btn=>btn.onclick=e=>{e.stopPropagation();const source=spellSources(build).find(x=>x.key===ui.spellSource)||spellSources(build)[0],limits=spellLimits(build,source);togglePreparedSpell(build.id,source.key,btn.dataset.spellPrepare,limits.prepared)});",
            "document.querySelectorAll('[data-spell-prepare]').forEach(btn=>btn.onclick=e=>{e.stopPropagation();if(btn.disabled)return;const source=spellSources(build).find(x=>x.key===ui.spellSource)||spellSources(build)[0],limits=spellLimits(build,source),choice=spellChoice(build,source.key),key=btn.dataset.spellPrepare;if(!choice.prepared.includes(key)&&choice.prepared.length>=limits.prepared)return alert('准备法术已达上限。');togglePreparedSpell(build.id,source.key,key,limits.prepared)});",
            "prepare guard")
        s=must_replace(s,
            "if(sp.level===0){if(!choice.cantrips.includes(sp.key)&&choice.cantrips.length>=limits.cantrips)return alert('戏法选择已达上限。');return toggleSpell(build.id,source.key,sp.key)}",
            "if(sp.level===0){if(!choice.cantrips.includes(sp.key)&&choice.cantrips.length>=limits.cantrips)return alert('戏法选择已达上限。');return toggleSpell(build.id,source.key,sp.key,limits.cantrips)}",
            "cantrip guard")
        s=must_replace(s,
            "if(source.mode==='prepared')return togglePreparedChoice(build.id,source.key,sp.key,limits.prepared);",
            "if(source.mode==='prepared'){if(!choice.prepared.includes(sp.key)&&choice.prepared.length>=limits.prepared)return alert('准备法术已达上限。');return togglePreparedChoice(build.id,source.key,sp.key,limits.prepared);}",
            "prepared guard")
        FILES["editor"].write_text(s,encoding="utf-8")

        FILES["v82"].write_text(originals["v82"].replace("V8.2.5","V8.2.6").replace("version:'8.2.5'","version:'8.2.6'"),encoding="utf-8")
        h=originals["html"].replace("V8.2.5","V8.2.6")
        anchor='  <link rel="stylesheet" href="./assets/v8/v824.css">'
        if anchor not in h:raise RuntimeError("v824.css anchor not found")
        h=h.replace(anchor,anchor+'\n  <link rel="stylesheet" href="./assets/v8/v826.css">',1)
        FILES["html"].write_text(h,encoding="utf-8")

        if shutil.which("node"):
            for p in [ROOT/"assets/js/data/point-buy.js",FILES["selectors"],FILES["store"],FILES["learning"],FILES["progression"],FILES["editor"],FILES["v82"]]:
                subprocess.check_call(["node","--check",str(p)],cwd=ROOT)

    except Exception:
        for key,text in originals.items():
            FILES[key].write_text(text,encoding="utf-8")
        raise

    print("Applied V8.2.6 Character Rule Guardrails.")
    print("Hard limits: 27-point buy, cantrip/prepared totals, chronological known-spell learning nodes.")
    print("UI: explicit cantrip totals, per-level learning quota, max ring and rule explanation.")
    return 0

if __name__=="__main__":
    raise SystemExit(main())

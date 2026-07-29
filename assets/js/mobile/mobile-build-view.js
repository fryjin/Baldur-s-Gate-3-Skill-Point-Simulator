import{abilities,classes,classMeta,skills as skillCatalog}from"../data/core.js";
import{feats,featDetails,subclassDescriptions,skillDescriptions,skillGlyphs}from"../data/progression.js";
import{setTargetLevel,setLevelClass,setSubclass,setFeatChoice,setFeatAsi,setAbilityScore,setAbilityBonus,toggleSkill,setExpertise,toggleClassChoice,toggleSpell,togglePreparedSpell,togglePreparedChoice,getBuild}from"../store.js";
import{proficiencyBonus,featSlots,levelImpactText,reductionImpacts,routeBreakdown,levelClassLevel,levelUnlocks,progressionNodes,usedPointBuy,finalScores,characterSummary,skillStages,skillBonus,activeFeatureGroups,spellSources,spellsForSource,spellChoice,spellLimits,validationIssues,fmt}from"../selectors.js";
import{spellData}from"../data/spells.js";
import{spellImageTag,bindImageFallbacks}from"../data/spell-assets.js";
import{spellEffectSummary,featureEffectSummary}from"../rules/effects.js";
import{effectFormulaHtml}from"../components/effects-ui.js";
import{openModal,openResponsiveDetail,toast,esc}from"../components/ui.js";
import{mobileShell,bindMobileShell,mobileResultLabel}from"./mobile-shell.js";

const state={routeIndex:0,nodeId:"",skillStageId:"",featureGroupId:"",spellSource:"",spellQuery:"",spellFilter:"all",spellFocus:"",spellLimit:36,scrolls:new Map(),castLevels:new Map()};
const pointCosts={8:0,9:1,10:2,11:3,12:4,13:5,14:7,15:9};

function mount(build,step,content,options={}){
  document.getElementById('app').innerHTML=mobileShell(build,step,content,{...options,result:options.result||mobileResultLabel(build,step)});
  bindMobileShell(build,step,{beforeNext:options.beforeNext});
  bindImageFallbacks();
}
function remember(key,selector='.mobile-build-content'){const el=document.querySelector(selector);if(el)state.scrolls.set(key,{top:el.scrollTop,left:el.scrollLeft})}
function restore(key,selector='.mobile-build-content'){const pos=state.scrolls.get(key);if(!pos)return;requestAnimationFrame(()=>{const el=document.querySelector(selector);if(el){el.scrollTop=pos.top;el.scrollLeft=pos.left}})}
function rememberElement(key,selector){const el=document.querySelector(selector);if(el)state.scrolls.set(key,{top:el.scrollTop,left:el.scrollLeft})}
function restoreElement(key,selector){restore(key,selector)}
function openInfo(html,onReady){const close=openResponsiveDetail(html);setTimeout(()=>{bindImageFallbacks();onReady?.(document.getElementById('overlay-root'),close)});return close}

export function renderMobileBuild(build,step){
  const renderers={level:renderLevel,route:renderRoute,progression:renderProgression,abilities:renderAbilities,skills:renderSkills,features:renderFeatures,spells:renderSpells};
  return(renderers[step]||renderLevel)(build);
}

function renderLevel(build){
  const content=`<div class="m-level-view">
    <div class="m-level-picker" aria-label="目标等级">
      <button data-level="${build.targetLevel-1}" aria-label="降低等级">−</button>
      <div><strong>${build.targetLevel}</strong><span>级</span></div>
      <button data-level="${build.targetLevel+1}" aria-label="提高等级">＋</button>
    </div>
    <p class="m-level-impact">${esc(levelImpactText(build))}</p>
    <section class="m-card"><div class="m-section-head"><b>快速选择</b><small>1–12级</small></div><div class="m-level-grid">${Array.from({length:12},(_,i)=>`<button class="${i+1===build.targetLevel?'selected':''}" data-level="${i+1}">${i+1}</button>`).join('')}</div></section>
    <div class="m-key-facts"><span>熟练加值 <b>+${proficiencyBonus(build)}</b></span><span>成长节点 <b>${featSlots(build).length}</b></span></div>
  </div>`;
  mount(build,'level',content,{title:'目标等级',subtitle:'你想把角色规划到几级？',progress:`${build.targetLevel}级`});
  document.querySelectorAll('[data-level]').forEach(btn=>btn.addEventListener('click',()=>changeLevel(build,Number(btn.dataset.level))));
}
function changeLevel(build,target){
  target=Math.max(1,Math.min(12,target));if(target===build.targetLevel)return;
  if(target>build.targetLevel){setTargetLevel(build.id,target);return}
  const impacts=reductionImpacts(build,target);
  openModal(`<div class="modal-head"><h2>降低到 ${target} 级？</h2><button class="icon-button" data-close>×</button></div><p>以下选择会被移除：</p><div class="impact-confirm-list">${impacts.map(x=>`<div>· ${esc(x)}</div>`).join('')}</div><div class="modal-actions"><button class="ghost-button" data-close>取消</button><button class="primary-button" data-confirm>确认降低</button></div>`,(root,close)=>root.querySelector('[data-confirm]').addEventListener('click',()=>{close();setTargetLevel(build.id,target)}));
}

function renderRoute(build){
  state.routeIndex=Math.max(0,Math.min(build.targetLevel-1,state.routeIndex));
  const index=state.routeIndex,key=build.levels[index],cl=classes[key],classLevel=levelClassLevel(build,index),unlocks=levelUnlocks(build,index);
  const content=`<div class="m-route-view">
    <div class="m-level-nav"><button data-route-shift="-1" ${index===0?'disabled':''}>‹ 第${Math.max(1,index)}级</button><strong>角色第 ${index+1} 级</strong><button data-route-shift="1" ${index===build.targetLevel-1?'disabled':''}>第${Math.min(build.targetLevel,index+2)}级 ›</button></div>
    <div class="m-route-dots">${build.levels.slice(0,build.targetLevel).map((x,i)=>`<button class="${i===index?'active':''}" data-route-index="${i}" aria-label="角色第${i+1}级 ${classes[x].name}">${i+1}</button>`).join('')}</div>
    <section class="m-hero-card"><span>当前职业</span><h2>${esc(cl.name)}</h2><p>${esc(classMeta[key]?.role||'')}</p><div class="m-key-facts"><span>${cl.name}职业 <b>${classLevel}级</b></span><span>子职业 <b>${cl.subclassAt}级解锁</b></span></div><button class="m-wide-action" data-change-class>更换职业</button></section>
    <section class="m-card"><div class="m-section-head"><b>本级获得</b><small>${index+1}/${build.targetLevel}</small></div><div class="m-unlock-list">${(unlocks.length?unlocks:['本级没有必须选择的新内容']).map(x=>`<span>${esc(x)}</span>`).join('')}</div></section>
  </div>`;
  mount(build,'route',content,{title:'逐级职业',subtitle:'逐级选择职业。',progress:`${index+1}/${build.targetLevel}`});
  document.querySelectorAll('[data-route-index]').forEach(btn=>btn.addEventListener('click',()=>{state.routeIndex=Number(btn.dataset.routeIndex);renderRoute(build)}));
  document.querySelectorAll('[data-route-shift]').forEach(btn=>btn.addEventListener('click',()=>{state.routeIndex+=Number(btn.dataset.routeShift);renderRoute(build)}));
  document.querySelector('[data-change-class]')?.addEventListener('click',()=>{rememberElement('route-dots','.m-route-dots');
    const close=openInfo(`<div class="m-sheet-title"><span class="kicker">角色第 ${index+1} 级</span><h2>选择职业</h2><p>本次选择会影响后续升级和解锁。</p></div><div class="m-class-sheet-grid">${Object.entries(classes).map(([k,item])=>`<button class="m-class-sheet-option ${k===key?'selected':''}" data-sheet-class="${k}"><b>${item.name}</b><small>${esc(classMeta[k]?.role||'')}</small>${k===key?'<i>✓</i>':''}</button>`).join('')}</div>`,(root,closeSheet)=>root.querySelectorAll('[data-sheet-class]').forEach(btn=>btn.addEventListener('click',()=>{closeSheet();setLevelClass(build.id,index,btn.dataset.sheetClass)})));
  });
  restoreElement('route-dots','.m-route-dots');
}

function progressionOptionDetail(node,key,build){
  if(node.type==='subclass')return`<div class="m-sheet-title"><span class="kicker">${esc(classes[node.classKey].name)}子职业</span><h2>${esc(key)}</h2></div><p>${esc(subclassDescriptions[key]||'强化该职业的一种专属玩法。')}</p><div class="detail-list"><div class="detail-row"><span>解锁等级</span><b>${node.at}级</b></div><div class="detail-row"><span>当前状态</span><b>${build.subclasses[node.classKey]===key?'已选择':'未选择'}</b></div></div>`;
  const feat=feats[key];return`<div class="m-sheet-title"><span class="kicker">${esc(feat?.category||'专长')}</span><h2>${esc(feat?.name||key)}</h2></div><p>${esc(featDetails[key]||feat?.note||'')}</p><div class="detail-list"><div class="detail-row"><span>来源</span><b>${esc(node.label)}</b></div><div class="detail-row"><span>当前状态</span><b>${build.feats[node.index]?.type===key?'已选择':'未选择'}</b></div></div>`;
}
function renderProgression(build){
  const nodes=progressionNodes(build);if(!nodes.length)return mount(build,'progression','<div class="m-empty">当前路线没有需要处理的升级节点。</div>',{title:'升级节点',subtitle:'当前没有必选内容。'});
  if(!nodes.some(x=>x.id===state.nodeId))state.nodeId=(nodes.find(x=>!x.complete)||nodes[0]).id;
  const node=nodes.find(x=>x.id===state.nodeId)||nodes[0],nodeIndex=nodes.indexOf(node),selected=node.type==='subclass'?build.subclasses[node.classKey]:build.feats[node.index]?.type;
  const used=new Set(build.feats.flatMap((item,i)=>i!==node.index&&item?.type&&item.type!=='none'&&!feats[item.type]?.repeatable?[item.type]:[]));
  const options=node.type==='subclass'?classes[node.classKey].subclasses:Object.keys(feats).filter(key=>feats[key]?.repeatable||key===selected||!used.has(key));
  const content=`<div class="m-progression-view">
    <div class="m-queue-head"><span>节点 ${nodeIndex+1}/${nodes.length}</span><b>${esc(node.label)}</b><small>${nodes.filter(x=>x.complete).length}/${nodes.length} 已完成</small></div>
    <div class="m-node-switcher">${nodes.map((x,i)=>`<button class="${x.id===node.id?'active':''} ${x.complete?'complete':''}" data-node="${x.id}">${i+1}</button>`).join('')}</div>
    <div class="m-option-list">${options.map(key=>{const on=selected===key,name=node.type==='subclass'?key:feats[key]?.name||key,desc=node.type==='subclass'?subclassDescriptions[key]:featDetails[key]||feats[key]?.note;return`<div class="m-choice-row ${on?'selected':''}"><button class="m-choice-main" data-progression-choice="${esc(key)}"><span class="m-choice-glyph">${node.type==='subclass'?'✧':'◆'}</span><div><b>${esc(name)}</b><small>${esc((desc||'').slice(0,72))}</small></div>${on?'<i>✓</i>':''}</button><button class="m-info-button" data-progression-info="${esc(key)}" aria-label="查看${esc(name)}说明">i</button></div>`}).join('')}</div>
    ${node.type==='feat'&&selected==='asi'?`<section class="m-card m-asi-card"><div class="m-section-head"><b>属性提升</b><small>共 2 点</small></div><label>第 1 点<select data-asi="a1">${abilities.map(a=>`<option value="${a.key}" ${build.feats[node.index]?.a1===a.key?'selected':''}>${a.name}</option>`).join('')}</select></label><label>第 2 点<select data-asi="a2">${abilities.map(a=>`<option value="${a.key}" ${build.feats[node.index]?.a2===a.key?'selected':''}>${a.name}</option>`).join('')}</select></label></section>`:''}
  </div>`;
  mount(build,'progression',content,{title:'升级节点',subtitle:'一次完成一个升级选择。',progress:`${nodeIndex+1}/${nodes.length}`,beforeNext:()=>{const latest=getBuild(build.id),next=progressionNodes(latest).find(x=>!x.complete);if(next){state.nodeId=next.id;renderProgression(latest);return{handled:true}}return true}});
  document.querySelectorAll('[data-node]').forEach(btn=>btn.addEventListener('click',()=>{state.nodeId=btn.dataset.node;renderProgression(build)}));
  document.querySelectorAll('[data-progression-choice]').forEach(btn=>btn.addEventListener('click',()=>{remember('progression');rememberElement('progression-tabs','.m-node-switcher');const key=btn.dataset.progressionChoice;if(node.type==='subclass')setSubclass(build.id,node.classKey,key);else setFeatChoice(build.id,node.index,key)}));
  document.querySelectorAll('[data-progression-info]').forEach(btn=>btn.addEventListener('click',()=>openInfo(progressionOptionDetail(node,btn.dataset.progressionInfo,build))));
  document.querySelectorAll('[data-asi]').forEach(select=>select.addEventListener('change',()=>setFeatAsi(build.id,node.index,select.dataset.asi,select.value)));
  restore('progression');restoreElement('progression-tabs','.m-node-switcher');
}

function abilityImpact(build,key){
  const a=abilities.find(x=>x.key===key),scores=finalScores(build),summary=characterSummary(build),related=skillCatalog.filter(x=>x.ability===key).slice(0,5);
  const special=key==='con'?`最大生命 ${summary.hp}`:key==='dex'?`护甲 ${summary.ac} · 先攻 ${fmt(summary.initiative)}`:['int','wis','cha'].includes(key)?`法术 DC ${summary.casting?.ability===key?summary.casting.dc:'—'}`:'近战与运动相关检定';
  return`<div class="m-ability-impact"><div><span>${a.code}</span><h3>${a.name}</h3><p>${special}</p></div><div class="m-related-skills">${related.map(sk=>`<span>${sk.name} <b>${fmt(skillBonus(build,sk.key))}</b></span>`).join('')}</div></div>`;
}
let focusedAbility='str';
function renderAbilities(build){
  const used=usedPointBuy(build),remaining=27-used,scores=finalScores(build);
  const content=`<div class="m-abilities-view">
    <div class="m-points-bar"><span>剩余点数</span><b class="${remaining<0?'error':''}">${remaining}</b><small>已使用 ${used}/27</small></div>
    <div class="m-ability-list">${abilities.map(a=>`<div class="m-ability-item ${focusedAbility===a.key?'active':''}" data-ability-focus="${a.key}"><button data-ability-change="${a.key}" data-delta="-1">−</button><div><b>${a.name}</b><small>${a.code}</small></div><strong>${build.abilities.scores[a.key]}</strong><button data-ability-change="${a.key}" data-delta="1">＋</button><span>最终 ${scores[a.key]} · ${fmt(Math.floor((scores[a.key]-10)/2))}</span></div>`).join('')}</div>
    ${abilityImpact(build,focusedAbility)}
    <section class="m-card m-bonus-card"><div class="m-section-head"><b>角色创建加值</b><small>不能选择同一属性</small></div><label>创建加值 +2<select data-ability-bonus="bonus2">${abilities.map(a=>`<option value="${a.key}" ${build.abilities.bonus2===a.key?'selected':''}>${a.name}</option>`).join('')}</select></label><label>创建加值 +1<select data-ability-bonus="bonus1">${abilities.map(a=>`<option value="${a.key}" ${build.abilities.bonus1===a.key?'selected':''}>${a.name}</option>`).join('')}</select></label></section>
  </div>`;
  mount(build,'abilities',content,{title:'分配属性',subtitle:'用 27 点完成角色创建属性。',progress:`剩余 ${remaining} 点`,beforeNext:()=>validationIssues(getBuild(build.id)).some(x=>x.step==='abilities')?false:true});
  document.querySelectorAll('[data-ability-focus]').forEach(row=>row.addEventListener('click',e=>{if(e.target.closest('[data-ability-change]'))return;focusedAbility=row.dataset.abilityFocus;renderAbilities(build)}));
  document.querySelectorAll('[data-ability-change]').forEach(btn=>btn.addEventListener('click',()=>{focusedAbility=btn.dataset.abilityChange;const current=build.abilities.scores[focusedAbility],next=Math.max(8,Math.min(15,current+Number(btn.dataset.delta)));if(next>current&&used-pointCosts[current]+pointCosts[next]>27){toast('点购点数不足。');return}setAbilityScore(build.id,focusedAbility,next)}));
  document.querySelectorAll('[data-ability-bonus]').forEach(select=>select.addEventListener('change',()=>setAbilityBonus(build.id,select.dataset.abilityBonus,select.value)));
}

function skillInfo(build,key,selected,expert){const sk=skillCatalog.find(x=>x.key===key),ability=abilities.find(x=>x.key===sk.ability);return`<div class="m-sheet-title"><span class="kicker">${ability.code} 技能</span><h2>${esc(sk.name)}</h2></div><p>${esc(skillDescriptions[key]||'')}</p><div class="detail-list"><div class="detail-row"><span>对应属性</span><b>${ability.name}</b></div><div class="detail-row"><span>最终加值</span><b>${fmt(skillBonus(build,key))}</b></div><div class="detail-row"><span>状态</span><b>${expert?'专精':selected?'熟练':'未选择'}</b></div></div>`}
function renderSkills(build){
  const stages=skillStages(build);if(!stages.length)return mount(build,'skills','<div class="m-empty">当前路线没有需要选择的技能。</div>',{title:'擅长技能'});
  if(!stages.some(x=>x.id===state.skillStageId))state.skillStageId=(stages.find(x=>x.selected.length<x.limit)||stages[0]).id;
  const stage=stages.find(x=>x.id===state.skillStageId)||stages[0],stageIndex=stages.indexOf(stage),expertSet=new Set(Object.values(build.expertise||{}));
  const content=`<div class="m-skills-view">
    <div class="m-stage-tabs">${stages.map((x,i)=>`<button class="${x.id===stage.id?'active':''} ${x.selected.length>=x.limit?'complete':''}" data-skill-stage="${x.id}"><span>${i+1}</span><b>${esc(x.title.replace(/^技能专精 · /,''))}</b><small>${x.selected.length}/${x.limit}</small></button>`).join('')}</div>
    <div class="m-stage-current"><span>${esc(stage.title)}</span><b>${stage.kind==='fixed'?'固定获得':`还需 ${Math.max(0,stage.limit-stage.selected.length)} 项`}</b></div>
    <div class="m-skill-grid">${stage.list.map(key=>{const sk=skillCatalog.find(x=>x.key===key),on=stage.selected.includes(key),expert=expertSet.has(key);return`<div class="m-skill-card ${on?'selected':''}"><button class="m-skill-select" data-skill="${key}"><span>${skillGlyphs[key]||'◆'}</span><div><b>${sk.name}</b><small>${abilities.find(a=>a.key===sk.ability).code} · ${fmt(skillBonus(build,key))}</small></div>${on?'<i>✓</i>':''}</button><button class="m-info-button" data-skill-info="${key}">i</button></div>`}).join('')}</div>
  </div>`;
  mount(build,'skills',content,{title:'擅长技能',subtitle:'选择熟练与专精。',progress:`${stageIndex+1}/${stages.length}`,beforeNext:()=>{const latest=getBuild(build.id),next=skillStages(latest).find(x=>x.selected.length<x.limit);if(next){state.skillStageId=next.id;renderSkills(latest);return{handled:true}}return true}});
  document.querySelectorAll('[data-skill-stage]').forEach(btn=>btn.addEventListener('click',()=>{state.skillStageId=btn.dataset.skillStage;renderSkills(build)}));
  document.querySelectorAll('[data-skill]').forEach(btn=>btn.addEventListener('click',()=>{if(stage.kind==='fixed')return;remember('skills');rememberElement('skills-tabs','.m-stage-tabs');const key=btn.dataset.skill;if(stage.kind==='expertise')setExpertise(build.id,stage.slot,stage.selected[0]===key?'':key);else toggleSkill(build.id,stage.id,key,stage.limit)}));
  document.querySelectorAll('[data-skill-info]').forEach(btn=>btn.addEventListener('click',()=>openInfo(skillInfo(build,btn.dataset.skillInfo,stage.selected.includes(btn.dataset.skillInfo),expertSet.has(btn.dataset.skillInfo)))));
  restore('skills');restoreElement('skills-tabs','.m-stage-tabs');
}

function renderFeatures(build){
  const groups=activeFeatureGroups(build);if(!groups.length)return mount(build,'features','<div class="m-empty">当前路线没有需要主动选择的职业能力。</div>',{title:'职业能力'});
  if(!groups.some(x=>x.id===state.featureGroupId))state.featureGroupId=(groups.find(x=>x.selected.length<x.limit)||groups[0]).id;
  const group=groups.find(x=>x.id===state.featureGroupId)||groups[0],index=groups.indexOf(group);
  const content=`<div class="m-features-view">
    <div class="m-stage-tabs">${groups.map((x,i)=>`<button class="${x.id===group.id?'active':''} ${x.selected.length>=x.limit?'complete':''}" data-feature-stage="${x.id}"><span>${i+1}</span><b>${esc(x.title)}</b><small>${x.selected.length}/${x.limit}</small></button>`).join('')}</div>
    <div class="m-stage-current"><span>${esc(classes[group.classKey].name)} · ${esc(group.title)}</span><b>还需 ${Math.max(0,group.limit-group.selected.length)} 项</b></div>
    <div class="m-feature-list">${group.options.map(([key,name,desc])=>{const on=group.selected.includes(key),effect=featureEffectSummary(build,group,key);return`<div class="m-choice-row ${on?'selected':''}"><button class="m-choice-main" data-feature="${key}"><span class="m-choice-glyph">✦</span><div><b>${esc(name)}</b><small>${esc(desc)}</small>${effect?.formula?`<em>${esc(effect.formula)} ${esc(effect.typeInfo?.label||'')}</em>`:''}</div>${on?'<i>✓</i>':''}</button><button class="m-info-button" data-feature-info="${key}">i</button></div>`}).join('')}</div>
  </div>`;
  mount(build,'features',content,{title:'职业能力',subtitle:'逐项完成职业提供的选择。',progress:`${index+1}/${groups.length}`,beforeNext:()=>{const latest=getBuild(build.id),next=activeFeatureGroups(latest).find(x=>x.selected.length<x.limit);if(next){state.featureGroupId=next.id;renderFeatures(latest);return{handled:true}}return true}});
  document.querySelectorAll('[data-feature-stage]').forEach(btn=>btn.addEventListener('click',()=>{state.featureGroupId=btn.dataset.featureStage;renderFeatures(build)}));
  document.querySelectorAll('[data-feature]').forEach(btn=>btn.addEventListener('click',()=>{remember('features');rememberElement('features-tabs','.m-stage-tabs');toggleClassChoice(build.id,group.id,btn.dataset.feature,group.limit)}));
  document.querySelectorAll('[data-feature-info]').forEach(btn=>btn.addEventListener('click',()=>{const key=btn.dataset.featureInfo,option=group.options.find(x=>x[0]===key),effect=featureEffectSummary(build,group,key);openInfo(`<div class="m-sheet-title"><span class="kicker">${esc(classes[group.classKey].name)} · ${esc(group.title)}</span><h2>${esc(option?.[1]||key)}</h2></div><p>${esc(option?.[2]||'')}</p>${effectFormulaHtml(effect)}`)}));
  restore('features');restoreElement('features-tabs','.m-stage-tabs');
}

function isSpellSelected(choice,sp,source){if(sp.level===0)return choice.cantrips.includes(sp.key);if(source.mode==='prepared')return choice.prepared.includes(sp.key);return choice.spells.includes(sp.key)}
function spellAction(source,sp,selected,prepared){if(sp.level===0)return selected?'移出戏法':'选择戏法';if(source.mode==='prepared')return prepared?'取消准备':'准备法术';return selected?'移出选择':'选择法术'}
function applySpell(build,source,sp,limits){if(sp.level>0&&source.mode==='prepared')togglePreparedChoice(build.id,source.key,sp.key,limits.prepared);else toggleSpell(build.id,source.key,sp.key)}
function spellDetail(build,source,sp){
  const choice=spellChoice(build,source.key),selected=isSpellSelected(choice,sp,source),prepared=choice.prepared.includes(sp.key),limits=spellLimits(build,source),cast=Math.max(sp.level,Math.min(source.maxLevel,state.castLevels.get(`${source.key}:${sp.key}`)||sp.level)),effect=spellEffectSummary(build,sp,source,cast);
  return`<div class="m-sheet-title m-spell-sheet-title">${spellImageTag(sp,'m-sheet-spell-image')}<div><span class="kicker">${sp.level?sp.level+'环':'戏法'} · ${esc(sp.school)}</span><h2>${esc(sp.name)}</h2><small>${esc(sp.en)}</small></div></div><p>${esc(sp.desc)}</p>${effectFormulaHtml(effect)}${sp.level>0&&source.maxLevel>sp.level?`<label class="m-cast-level">预览环阶<select data-mobile-cast>${Array.from({length:source.maxLevel-sp.level+1},(_,i)=>sp.level+i).map(x=>`<option value="${x}" ${x===cast?'selected':''}>${x}环</option>`).join('')}</select></label>`:''}<div class="detail-list"><div class="detail-row"><span>动作</span><b>${esc(sp.action)}</b></div><div class="detail-row"><span>距离</span><b>${esc(sp.range)}</b></div><div class="detail-row"><span>持续</span><b>${esc(sp.duration)}</b></div><div class="detail-row"><span>专注</span><b>${sp.concentration?'是':'否'}</b></div></div><button class="m-sheet-primary" data-mobile-spell-action>${spellAction(source,sp,selected,prepared)}</button>${source.mode==='spellbook'&&sp.level>0&&selected?`<button class="m-sheet-secondary" data-mobile-prepare>${prepared?'取消准备':'准备法术'}</button>`:''}`;
}
function renderSpells(build){
  const sources=spellSources(build);if(!sources.length)return mount(build,'spells','<div class="m-empty">当前职业路线没有法术系统。</div>',{title:'选择法术'});
  if(!sources.some(x=>x.key===state.spellSource))state.spellSource=sources[0].key;
  const source=sources.find(x=>x.key===state.spellSource),choice=spellChoice(build,source.key),limits=spellLimits(build,source);
  let list=spellsForSource(source,state.spellQuery,'all');
  if(state.spellFilter==='selected')list=list.filter(sp=>isSpellSelected(choice,sp,source));
  else if(state.spellFilter==='prepared')list=list.filter(sp=>choice.prepared.includes(sp.key));
  else if(state.spellFilter!=='all')list=list.filter(sp=>sp.level===Number(state.spellFilter));
  const filters=['all',0,...Array.from({length:source.maxLevel},(_,i)=>i+1),'selected',...(source.mode==='spellbook'||source.mode==='prepared'?['prepared']:[])];
  const visibleList=list.slice(0,state.spellLimit);
  const content=`<div class="m-spells-view">
    <div class="m-spell-source"><select id="m-spell-source">${sources.map(x=>`<option value="${x.key}" ${x.key===source.key?'selected':''}>${x.name} ${x.level}级</option>`).join('')}</select><small>${source.mode==='spellbook'?'法术书':source.mode==='prepared'?'准备施法':source.mode==='pact'?'契约魔法':'已知法术'} · ${source.ability.toUpperCase()}</small></div>
    <div class="m-spell-counts"><span>戏法 <b>${choice.cantrips.length}/${limits.cantrips}</b></span>${source.mode==='spellbook'?`<span>法术书 <b>${choice.spells.length}/${limits.spells}</b></span><span>准备 <b>${choice.prepared.length}/${limits.prepared}</b></span>`:source.mode==='prepared'?`<span>准备 <b>${choice.prepared.length}/${limits.prepared}</b></span>`:`<span>${limits.spellLabel} <b>${choice.spells.length}/${limits.spells}</b></span>`}</div>
    ${choice.prepared.length?`<div class="m-prepared-row"><span>已准备</span><div>${choice.prepared.map(key=>{const sp=spellData.find(x=>x.key===key);return sp?`<button data-mobile-spell="${sp.key}" aria-label="${esc(sp.name)}">${spellImageTag(sp,'m-prepared-image')}</button>`:''}).join('')}</div></div>`:''}
    <div class="m-spell-sticky"><input id="m-spell-search" value="${esc(state.spellQuery)}" placeholder="搜索法术"><div class="m-filter-scroll">${filters.map(f=>`<button class="${String(f)===String(state.spellFilter)?'active':''}" data-m-filter="${f}">${f==='all'?'全部':f==='selected'?'已选':f==='prepared'?'已准备':f===0?'戏法':f+'环'}</button>`).join('')}</div></div>
    <div class="m-spell-list" id="m-spell-list">${visibleList.length?visibleList.map(sp=>{const selected=isSpellSelected(choice,sp,source),prepared=choice.prepared.includes(sp.key),effect=spellEffectSummary(build,sp,source,sp.level),part=effect?.parts?.[0];return`<button class="m-spell-row ${selected?'selected':''} ${prepared?'prepared':''}" data-mobile-spell="${sp.key}">${spellImageTag(sp,'m-spell-image')}<div><div><b>${esc(sp.name)}</b>${prepared?'<i>已准备</i>':selected?'<i>已选择</i>':''}</div><small>${sp.level?sp.level+'环':'戏法'} · ${esc(sp.school)} · ${esc(sp.action)}</small><p>${esc(sp.desc)}</p>${part?`<em class="damage-${part.typeInfo.css}">${esc(part.formula)} · ${esc(part.typeInfo.label)}</em>`:''}</div><span>›</span></button>`}).join(''):'<div class="m-empty">当前筛选没有结果。</div>'}${list.length>visibleList.length?`<button class="m-load-more" data-load-more>再显示 ${Math.min(36,list.length-visibleList.length)} 项</button>`:''}</div>
  </div>`;
  const selectedCount=choice.cantrips.length+(source.mode==='prepared'?choice.prepared.length:choice.spells.length);
  mount(build,'spells',content,{title:'选择法术',subtitle:'点击法术查看说明并完成选择。',progress:`已选 ${selectedCount}`,beforeNext:()=>validationIssues(getBuild(build.id)).some(x=>x.step==='spells')?false:true});
  document.getElementById('m-spell-source')?.addEventListener('change',e=>{state.spellSource=e.target.value;state.spellFilter='all';state.spellQuery='';state.spellLimit=36;state.scrolls.delete('spells');renderSpells(build)});
  let searchTimer;document.getElementById('m-spell-search')?.addEventListener('input',e=>{clearTimeout(searchTimer);state.spellQuery=e.target.value;state.spellLimit=36;searchTimer=setTimeout(()=>{state.scrolls.delete('spells');renderSpells(getBuild(build.id));requestAnimationFrame(()=>{const input=document.getElementById('m-spell-search');input?.focus?.({preventScroll:true});input?.setSelectionRange?.(state.spellQuery.length,state.spellQuery.length)})},220)});
  document.querySelectorAll('[data-m-filter]').forEach(btn=>btn.addEventListener('click',()=>{state.spellFilter=btn.dataset.mFilter;state.spellLimit=36;state.scrolls.delete('spells');renderSpells(build)}));
  document.querySelectorAll('[data-mobile-spell]').forEach(btn=>btn.addEventListener('click',()=>{remember('spells');rememberElement('spell-filters','.m-filter-scroll');const sp=spellData.find(x=>x.key===btn.dataset.mobileSpell);if(!sp)return;const close=openInfo(spellDetail(build,source,sp),(root,closeSheet)=>{root.querySelector('[data-mobile-spell-action]')?.addEventListener('click',()=>{closeSheet();applySpell(build,source,sp,limits)});root.querySelector('[data-mobile-prepare]')?.addEventListener('click',()=>{closeSheet();togglePreparedSpell(build.id,source.key,sp.key,limits.prepared)});root.querySelector('[data-mobile-cast]')?.addEventListener('change',e=>{state.castLevels.set(`${source.key}:${sp.key}`,Number(e.target.value));closeSheet();setTimeout(()=>{const next=openInfo(spellDetail(getBuild(build.id),source,sp),(r,c)=>{r.querySelector('[data-mobile-spell-action]')?.addEventListener('click',()=>{c();applySpell(getBuild(build.id),source,sp,limits)});r.querySelector('[data-mobile-prepare]')?.addEventListener('click',()=>{c();togglePreparedSpell(build.id,source.key,sp.key,limits.prepared)})})})})})}));
  document.querySelector('[data-load-more]')?.addEventListener('click',()=>{remember('spells');rememberElement('spell-filters','.m-filter-scroll');state.spellLimit+=36;renderSpells(build)});
  restore('spells');restoreElement('spell-filters','.m-filter-scroll');
}

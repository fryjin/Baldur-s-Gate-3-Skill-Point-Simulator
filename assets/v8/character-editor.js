import{
  setTargetLevel,setLevelClass,setSubclass,setAbilityScore,setAbilityBonus,setFeatChoice,setFeatAsi,
  toggleSkill,setExpertise,toggleClassChoice,toggleSpell,togglePreparedSpell,togglePreparedChoice,updateIdentity,updateBuild
}from'../js/store.js';
import{
  abilities,skills,classes,backgrounds,races
}from'../js/data/core.js';
import{feats,featDetails,skillDescriptions,classDescriptions,subclassDescriptions}from'../js/data/progression.js';
import{
  characterSummary,finalScores,fmt,validationIssues,progressionNodes,usedPointBuy,pointCosts,skillStages,skillBonus,
  activeFeatureGroups,spellSources,spellChoice,spellLimits,spellsForSource,featSlots,levelClassLevel
}from'../js/selectors.js';
import{spellData}from'../js/data/spells.js';
import{spellImageTag}from'../js/data/spell-assets.js';
import{buildResourceModel}from'../js/data/resource-model.js';
import{
  learningMode,learningPlan,migrateLearningState,nodeProgress,activeNodeForState,assignToNode,removeLearnedSpell,
  replacementPlan,replaceLearnedSpell
}from'../js/data/spell-learning.js';

const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const abilityMap=Object.fromEntries(abilities.map(x=>[x.key,x]));
const skillMap=Object.fromEntries(skills.map(x=>[x.key,x]));
export const characterSteps=[
  ['level','等级与身份'],['route','职业路线'],['progression','成长节点'],['abilities','属性'],['skills','技能与专精'],['features','职业能力'],['spells','戏法与法术'],['review','人物确认']
];
export const characterStepIndex=key=>Math.max(0,characterSteps.findIndex(x=>x[0]===key));

function statusFor(build,key){const issues=validationIssues(build).filter(x=>x.step===key);return issues.length?`${issues.length}项待处理`:'已完成'}
export function characterSubnav(build,ui){return`<div class="v82-character-subnav">${characterSteps.map(([key,label],i)=>`<button type="button" class="${ui.characterStep===key?'active':''}" data-char-step="${key}"><span>${String(i+1).padStart(2,'0')}</span><b>${label}</b><small>${key==='review'?'汇总确认':statusFor(build,key)}</small></button>`).join('')}</div>`}

function stepHead(kicker,title,desc,right=''){return`<div class="v82-editor-head"><div><span>${kicker}</span><h1>${title}</h1><p>${desc}</p></div>${right}</div>`}
function opt(value,label,selected=''){return`<option value="${esc(value)}" ${value===selected?'selected':''}>${esc(label)}</option>`}
function choiceCard(label,desc,selected,attrs='',meta=''){return`<button type="button" class="v82-choice-card ${selected?'selected':''}" ${attrs}><div><b>${esc(label)}</b>${meta?`<small>${esc(meta)}</small>`:''}</div><p>${esc(desc||'')}</p>${selected?'<i>✓</i>':''}</button>`}

function levelStep(build){
  return`${stepHead('CHARACTER · 01','等级与身份','先定义目标等级、种族与背景；职业路线会依据目标等级生成。',`<strong>${build.targetLevel}<small>/12</small></strong>`)}
  <section class="v82-level-editor"><div class="v82-big-level"><button data-level-delta="-1">−</button><b>${build.targetLevel}</b><button data-level-delta="1">＋</button><span>目标等级</span></div><div class="v82-level-track">${Array.from({length:12},(_,i)=>`<button data-set-level="${i+1}" class="${build.targetLevel===i+1?'active':''}">${i+1}</button>`).join('')}</div></section>
  <section class="v82-form-grid two"><label><span>种族</span><select data-identity="race">${races.map(r=>opt(r,r,build.identity?.race)).join('')}</select></label><label><span>背景</span><select data-identity="background">${Object.entries(backgrounds).map(([k,v])=>opt(k,v.name,build.identity?.background)).join('')}</select></label></section>
  <section class="v82-context-note"><b>当前起始职业</b><span>${classes[build.levels[0]]?.name||'—'} · ${classDescriptions[build.levels[0]]||''}</span></section>`
}

function routeStep(build){
  const counts={};
  return`${stepHead('CHARACTER · 02','逐级职业路线','每一级选择一个职业；兼职后的职业等级、施法进阶与成长节点会即时重算。')}
  <div class="v82-route-grid">${build.levels.slice(0,build.targetLevel).map((key,i)=>{counts[key]=(counts[key]||0)+1;return`<label class="v82-route-level"><span><b>${i+1}</b>角色等级</span><select data-route-index="${i}">${Object.entries(classes).map(([k,v])=>opt(k,v.name,key)).join('')}</select><small>${classes[key]?.name||key} ${counts[key]}级${i===0?' · 起始职业':''}</small></label>`}).join('')}</div>`
}

function progressionStep(build,ui){
  const nodes=progressionNodes(build);if(!nodes.length)return`${stepHead('CHARACTER · 03','成长节点','当前职业路线没有需要手动处理的子职业或专长节点。')}<div class="v82-empty">暂无成长节点。</div>`;
  const idx=Math.max(0,Math.min(Number(ui.progressionIndex)||0,nodes.length-1)),node=nodes[idx];
  let body='';
  if(node.type==='subclass'){
    const cl=classes[node.classKey],selected=build.subclasses[node.classKey];
    body=`<div class="v82-card-grid two">${cl.subclasses.map(name=>choiceCard(name,subclassDescriptions[name]||`${cl.name}子职业`,selected===name,`data-subclass-class="${node.classKey}" data-subclass="${esc(name)}"`,`${cl.name} ${node.at}级`)).join('')}</div>`
  }else{
    const choice=build.feats[node.index]||{type:'none'},selected=choice.type||'none';
    body=`<div class="v82-feat-layout"><div class="v82-card-grid two">${Object.entries(feats).map(([key,f])=>choiceCard(f.name,featDetails[key]||f.note,selected===key,`data-feat-index="${node.index}" data-feat="${key}"`,f.category)).join('')}</div>${selected==='asi'?`<div class="v82-asi-box"><span>属性提升 · 分配两点</span><label>第 1 点<select data-asi-index="${node.index}" data-asi-slot="a1">${abilities.map(a=>opt(a.key,a.name,choice.a1)).join('')}</select></label><label>第 2 点<select data-asi-index="${node.index}" data-asi-slot="a2">${abilities.map(a=>opt(a.key,a.name,choice.a2)).join('')}</select></label></div>`:''}</div>`
  }
  return`${stepHead('CHARACTER · 03','子职业与成长','一次只处理一个成长节点，避免把所有选择同时堆到页面。',`<strong>${idx+1}<small>/${nodes.length}</small></strong>`)}
    <div class="v82-node-switcher">${nodes.map((n,i)=>`<button data-prog-index="${i}" class="${i===idx?'active':''} ${n.complete?'complete':''}"><span>${i+1}</span><b>${esc(n.label)}</b><small>${n.complete?'已完成':n.title}</small></button>`).join('')}</div>
    <div class="v82-current-node"><span>${esc(node.label)}</span><b>${esc(node.title)}</b></div>${body}`
}

function abilitiesStep(build){
  const used=usedPointBuy(build),scores=build.abilities.scores;
  return`${stepHead('CHARACTER · 04','初始属性与属性提升','使用 27 点点购完成初始属性；创建加值 +2 / +1 不能放在同一属性。',`<strong>${used}<small>/27</small></strong>`)}
  <div class="v82-pointbar"><span>点购使用</span><div><i style="width:${Math.min(100,used/27*100)}%"></i></div><b class="${used===27?'ok':used>27?'bad':''}">${used}/27</b></div>
  <div class="v82-ability-editor">${abilities.map(a=>{const v=scores[a.key];return`<div class="v82-ability-row"><div><b>${a.name}</b><small>${a.code}</small></div><button data-ability="${a.key}" data-ability-delta="-1" ${v<=8?'disabled':''}>−</button><strong>${v}</strong><button data-ability="${a.key}" data-ability-delta="1" ${v>=15?'disabled':''}>＋</button><span>成本 ${pointCosts[v]??'—'}</span></div>`}).join('')}</div>
  <div class="v82-form-grid two v82-bonus-box"><label><span>创建加值 +2</span><select data-bonus="bonus2">${abilities.map(a=>opt(a.key,a.name,build.abilities.bonus2)).join('')}</select></label><label><span>创建加值 +1</span><select data-bonus="bonus1">${abilities.map(a=>opt(a.key,a.name,build.abilities.bonus1)).join('')}</select></label></div>`
}

function skillsStep(build,ui){
  const stages=skillStages(build),idx=Math.max(0,Math.min(Number(ui.skillStageIndex)||0,Math.max(0,stages.length-1))),stage=stages[idx];
  if(!stage)return`${stepHead('CHARACTER · 05','技能与专精','当前没有需要处理的技能选择。')}<div class="v82-empty">无需额外选择。</div>`;
  const selected=new Set(stage.selected||[]),fixed=stage.kind==='fixed';
  return`${stepHead('CHARACTER · 05','技能与专精','按来源逐段完成技能熟练与专精；固定来源只展示，不要求重复确认。',`<strong>${stage.selected.length}<small>/${stage.limit}</small></strong>`)}
  <div class="v82-node-switcher">${stages.map((s,i)=>`<button data-skill-stage="${i}" class="${i===idx?'active':''} ${s.selected.length>=s.limit?'complete':''}"><span>${i+1}</span><b>${esc(s.title)}</b><small>${s.selected.length}/${s.limit}</small></button>`).join('')}</div>
  <div class="v82-current-node"><span>${esc(stage.title)}</span><b>${esc(stage.subtitle)}</b></div>
  <div class="v82-skill-grid">${stage.list.map(key=>{const sk=skillMap[key],on=selected.has(key),bonus=skillBonus(build,key);return`<button type="button" class="v82-skill-card ${on?'selected':''}" ${fixed?'disabled':stage.kind==='expertise'?`data-expertise-slot="${stage.slot}" data-skill-key="${key}"`:`data-skill-source="${stage.id}" data-skill-key="${key}" data-skill-limit="${stage.limit}"`}><div><b>${sk?.name||key}</b><small>${sk?abilityMap[sk.ability]?.code:''} · ${fmt(bonus)}</small></div><p>${esc(skillDescriptions[key]||'')}</p>${on?'<i>✓</i>':''}</button>`}).join('')}</div>`
}

function featuresStep(build,ui){
  const groups=activeFeatureGroups(build),idx=Math.max(0,Math.min(Number(ui.featureGroupIndex)||0,Math.max(0,groups.length-1))),group=groups[idx];
  if(!group)return`${stepHead('CHARACTER · 06','职业能力','当前路线没有额外的职业能力选择。')}<div class="v82-empty">无需额外选择。</div>`;
  const selected=new Set(group.selected||[]);
  return`${stepHead('CHARACTER · 06','职业能力','按职业能力组逐项选择；右侧人物摘要会实时更新。',`<strong>${selected.size}<small>/${group.limit}</small></strong>`)}
  <div class="v82-node-switcher">${groups.map((g,i)=>`<button data-feature-group="${i}" class="${i===idx?'active':''} ${g.selected.length>=g.limit?'complete':''}"><span>${i+1}</span><b>${esc(g.title)}</b><small>${g.selected.length}/${g.limit}</small></button>`).join('')}</div>
  <div class="v82-current-node"><span>${classes[group.classKey]?.name||group.classKey}</span><b>${esc(group.title)} · 选择 ${group.limit} 项</b></div>
  <div class="v82-card-grid two">${group.options.map(([key,name,desc])=>choiceCard(name,desc,selected.has(key),`data-feature-group-id="${group.id}" data-feature="${key}" data-feature-limit="${group.limit}"`,selected.has(key)?'已选择':'')).join('')}</div>`
}

function learningState(build,source){return migrateLearningState(build.spellLearning?.[source.key],source,spellChoice(build,source.key))}
function sourceOption(source,current){return opt(source.key,`${source.name} ${source.level}级 · 最高${source.maxLevel}环`,current)}
function spellSelected(choice,source,sp){return sp.level===0?choice.cantrips.includes(sp.key):source.mode==='prepared'?choice.prepared.includes(sp.key):choice.spells.includes(sp.key)}
function spellMeta(sp){return`${sp.level===0?'戏法':sp.level+'环'} · ${sp.school} · ${sp.action||'动作'}`}
function spellCard(sp,source,choice,ui,state,activeNode){
  const selected=spellSelected(choice,source,sp),prepared=choice.prepared.includes(sp.key),locked=sp.level>0&&state&&activeNode&&!selected&&sp.level>activeNode.maxSpellLevel;
  return`<article class="v82-spell-card ${selected?'selected':''} ${prepared?'prepared':''} ${locked?'locked':''}"><button class="v82-spell-open" data-spell-detail="${sp.key}">${spellImageTag(sp,'v82-spell-image')}<div><div class="v82-spell-title"><b>${esc(sp.name)}</b>${selected?'<i>已选</i>':''}</div><small>${esc(spellMeta(sp))}</small><p>${esc(sp.desc)}</p></div></button><div class="v82-spell-actions">${source.mode==='spellbook'&&sp.level>0&&selected?`<button data-spell-prepare="${sp.key}" class="${prepared?'active':''}">${prepared?'取消准备':'准备'}</button>`:''}<button data-spell-toggle="${sp.key}" ${locked?'disabled':''}>${selected?(source.mode==='prepared'&&sp.level>0?'取消准备':'移除'):(source.mode==='prepared'&&sp.level>0?'准备':'选择')}</button></div></article>`
}
function spellInspector(sp,source,choice){if(!sp)return`<div class="v82-spell-inspector empty"><span>当前法术</span><p>选择一个法术查看完整说明。</p></div>`;const selected=spellSelected(choice,source,sp),prepared=choice.prepared.includes(sp.key);return`<aside class="v82-spell-inspector"><div class="v82-inspector-title">${spellImageTag(sp,'v82-spell-image large')}<div><span>${esc(spellMeta(sp))}</span><h2>${esc(sp.name)}</h2><small>${esc(sp.en||'')}</small></div></div><p>${esc(sp.desc)}</p><dl><div><dt>施法</dt><dd>${esc(sp.action||'动作')}</dd></div><div><dt>距离</dt><dd>${esc(sp.range||'—')}</dd></div><div><dt>持续</dt><dd>${esc(sp.duration||'—')}</dd></div><div><dt>专注</dt><dd>${sp.concentration?'是':'否'}</dd></div></dl><div class="v82-inspector-state"><span>当前状态</span><b>${prepared?'已准备':selected?'已选择':'未选择'}</b></div></aside>`}

function spellsStep(build,ui){
  const sources=spellSources(build);if(!sources.length)return`${stepHead('CHARACTER · 07','戏法与法术','当前职业路线没有施法能力。')}<div class="v82-empty">没有法术步骤；可以直接进入人物确认。</div>`;
  const source=sources.find(x=>x.key===ui.spellSource)||sources[0];ui.spellSource=source.key;
  const choice=spellChoice(build,source.key),limits=spellLimits(build,source),mode=learningMode(source),state=mode==='prepared'?null:learningState(build,source),plan=state?learningPlan(source):[],preferred=ui.spellNode?.[source.key],activeNode=state?activeNodeForState(source,state,preferred):null;if(activeNode){ui.spellNode=ui.spellNode||{};ui.spellNode[source.key]=activeNode.id}
  const query=ui.spellQuery||'',level=ui.spellLevel??'all';let list=spellsForSource(source,query,level);
  const detail=spellData.find(x=>x.key===ui.spellDetail&&x.classes.includes(source.key))||list[0]||null;
  const count2=source.mode==='prepared'?choice.prepared.length:choice.spells.length,label2=source.mode==='spellbook'?'法术书':source.mode==='prepared'?'准备':'已知';
  return`${stepHead('CHARACTER · 07','戏法与法术','选择来源后按职业真实学习/准备规则处理；已知法术职业保留逐级学习节点。',`<strong>${choice.cantrips.length}<small>/${limits.cantrips} 戏法</small></strong>`)}
  <div class="v82-spell-toolbar"><select data-spell-source>${sources.map(s=>sourceOption(s,source.key)).join('')}</select><div class="v82-spell-counts"><span>戏法 <b>${choice.cantrips.length}/${limits.cantrips}</b></span><span>${label2} <b>${count2}/${source.mode==='prepared'?limits.prepared:limits.spells}</b></span>${source.mode==='spellbook'?`<span>准备 <b>${choice.prepared.length}/${limits.prepared}</b></span>`:''}</div></div>
  ${state?`<div class="v82-learning-strip"><div class="v82-current-learning"><span>当前学习节点</span><b>${esc(activeNode?.title||'—')}</b><small>${activeNode?`${nodeProgress(state,activeNode).selected}/${nodeProgress(state,activeNode).total} · 最高${activeNode.maxSpellLevel}环`:''}</small></div><div class="v82-learning-nodes">${plan.map(n=>{const p=nodeProgress(state,n);return`<button data-learning-node="${n.id}" class="${n.id===activeNode?.id?'active':''} ${p.complete?'complete':''}">${n.classLevel}<small>${p.selected}/${p.total}</small></button>`}).join('')}</div>${replacementPlan(source).length?'<button class="secondary" data-open-replace>替换法术</button>':''}</div>`:''}
  <div class="v82-spell-search"><input data-spell-search placeholder="搜索法术名称、英文名或效果" value="${esc(query)}"><div>${['all',0,1,2,3,4,5,6].filter(v=>v==='all'||Number(v)<=source.maxLevel).map(v=>`<button data-spell-level="${v}" class="${String(level)===String(v)?'active':''}">${v==='all'?'全部':v===0?'戏法':v+'环'}</button>`).join('')}</div></div>
  <div class="v82-spell-workspace"><div class="v82-spell-list">${list.length?list.map(sp=>spellCard(sp,source,choice,ui,state,activeNode)).join(''):'<div class="v82-empty">当前筛选没有法术。</div>'}</div>${spellInspector(detail,source,choice)}</div>`
}

function reviewStep(build){
  const summary=characterSummary(build),scores=finalScores(build),issues=validationIssues(build),resources=buildResourceModel(build),sources=spellSources(build),featNames=summary.feats||[];
  return`${stepHead('CHARACTER · 08','人物构筑确认','确认人物层以后直接进入装备构筑；仍可随时返回修改人物。',issues.length?`<strong class="bad">${issues.length}<small>项待处理</small></strong>`:'<strong class="ok">✓<small>完整</small></strong>')}
  <section class="v82-review-hero"><div><b>${build.targetLevel}</b><span>等级</span></div><div><h2>${esc(build.name)}</h2><p>${esc(build.identity?.race||'—')} · ${esc(summary.route)}</p><small>${backgrounds[build.identity?.background]?.name||'—'}</small></div><div class="v82-review-combat"><span>生命<b>${summary.hp}</b></span><span>护甲<b>${summary.ac}</b></span><span>先攻<b>${fmt(summary.initiative)}</b></span><span>法术DC<b>${summary.casting?.dc||'—'}</b></span></div></section>
  <div class="v82-review-grid"><section><span>属性</span><div class="v82-score-grid">${abilities.map(a=>`<div><small>${a.name}</small><b>${scores[a.key]}</b></div>`).join('')}</div></section><section><span>专长</span><div class="v8-tag-list">${featNames.length?featNames.map(x=>`<b>${esc(x)}</b>`).join(''):'<small>暂无专长</small>'}</div></section><section><span>职业资源</span><div class="v82-review-list">${resources.map(r=>`<div><b>${esc(r.label)}</b><span>${esc(r.value)} · ${esc(r.recharge||'')}</span></div>`).join('')||'<small>无额外资源</small>'}</div></section><section><span>法术来源</span><div class="v82-review-list">${sources.map(src=>{const c=spellChoice(build,src.key);return`<div><b>${esc(src.name)} ${src.level}级</b><span>戏法${c.cantrips.length} · 法术${c.spells.length} · 准备${c.prepared.length}</span></div>`}).join('')||'<small>无施法来源</small>'}</div></section></div>
  ${issues.length?`<div class="v82-issue-box"><span>仍有待处理</span>${issues.map(i=>`<p>${esc(i.message)}</p>`).join('')}</div>`:'<div class="v82-ready-box">人物构筑已完整，可以开始按章节规划装备。</div>'}`
}

function summaryPane(build,ui){
  const s=characterSummary(build),scores=finalScores(build),issues=validationIssues(build),resources=buildResourceModel(build);
  return`<aside class="v82-character-summary"><div class="v82-summary-head"><span>CURRENT CHARACTER</span><h2>${esc(build.name)}</h2><p>${build.targetLevel}级 · ${esc(s.route)}</p></div><div class="v82-summary-combat"><span>生命<b>${s.hp}</b></span><span>护甲<b>${s.ac}</b></span><span>先攻<b>${fmt(s.initiative)}</b></span><span>DC<b>${s.casting?.dc||'—'}</b></span></div><div class="v82-mini-scores">${abilities.map(a=>`<span>${a.code}<b>${scores[a.key]}</b></span>`).join('')}</div>${resources.length?`<section><span>核心资源</span>${resources.slice(0,4).map(r=>`<div><b>${esc(r.label)}</b><small>${esc(r.entries?.map(x=>`${x.label}${x.value}`).join(' · ')||r.value)} · ${esc(r.recharge||'')}</small></div>`).join('')}</section>`:''}<section><span>当前步骤</span><b>${characterSteps[characterStepIndex(ui.characterStep)]?.[1]||'人物构筑'}</b><small class="${issues.length?'warn':''}">${issues.length?`人物仍有 ${issues.length} 项待处理`:'人物构筑当前完整'}</small></section></aside>`
}

export function renderCharacterEditor(build,ui){
  const step=ui.characterStep||'level';
  const views={level:levelStep,route:routeStep,progression:(b)=>progressionStep(b,ui),abilities:abilitiesStep,skills:(b)=>skillsStep(b,ui),features:(b)=>featuresStep(b,ui),spells:(b)=>spellsStep(b,ui),review:reviewStep};
  return`<main class="v8-main v82-character-stage"><div class="v82-mobile-step"><span>人物构筑</span><select data-char-step-select>${characterSteps.map(([k,l])=>opt(k,l,step)).join('')}</select></div><div class="v82-character-layout"><section class="v82-editor-pane">${(views[step]||levelStep)(build)}${characterFooter(step)}</section>${summaryPane(build,ui)}</div></main>`
}
function characterFooter(step){const idx=characterStepIndex(step),prev=characterSteps[Math.max(0,idx-1)]?.[0],next=characterSteps[Math.min(characterSteps.length-1,idx+1)]?.[0];return`<footer class="v82-editor-footer"><button ${idx===0?'disabled':''} data-char-step="${prev}">上一步</button><span>${idx+1} / ${characterSteps.length} · ${characterSteps[idx]?.[1]}</span>${idx===characterSteps.length-1?'<button class="primary" data-go-equipment>进入装备构筑</button>':`<button class="primary" data-char-step="${next}">下一步</button>`}</footer>`}

function setKnownSpell(build,source,spellKey,ui){
  const choice=spellChoice(build,source.key),current=choice.spells.includes(spellKey),state=learningState(build,source),node=activeNodeForState(source,state,ui.spellNode?.[source.key]);
  if(current){updateBuild(build.id,d=>{const c=d.spellChoices[source.key]||(d.spellChoices[source.key]={cantrips:[],spells:[],prepared:[]});c.spells=c.spells.filter(x=>x!==spellKey);c.prepared=c.prepared.filter(x=>x!==spellKey);const st=migrateLearningState(d.spellLearning?.[source.key],source,c);removeLearnedSpell(st,spellKey);d.spellLearning=d.spellLearning||{};d.spellLearning[source.key]=st});return{ok:true}}
  if(!node)return{ok:false,reason:'没有可用学习节点。'};const result=assignToNode(state,node,spellKey);if(!result.ok)return result;
  updateBuild(build.id,d=>{const c=d.spellChoices[source.key]||(d.spellChoices[source.key]={cantrips:[],spells:[],prepared:[]});if(!c.spells.includes(spellKey))c.spells.push(spellKey);d.spellLearning=d.spellLearning||{};d.spellLearning[source.key]=state});return{ok:true}
}

function openReplacementSheet(build,ui,rerender){
  const source=spellSources(build).find(x=>x.key===ui.spellSource)||spellSources(build)[0];if(!source)return;
  const state=learningState(build,source),plans=replacementPlan(source),used=new Set(state.replacements.map(x=>x.classLevel)),avail=plans.filter(x=>!used.has(x.classLevel)),learned=state.slots.filter(x=>x.spellKey);
  const root=document.getElementById('sheet-root');root.innerHTML=`<div class="v8-sheet-backdrop" data-close><section class="v8-sheet v82-replace-sheet"><button class="v8-sheet-close" data-close>×</button><div></div><div><span class="kicker">SPELL REPLACEMENT</span><h2>替换已知法术</h2><p>替换不会增加已知法术总数。选择升级等级和旧法术，再从允许环阶中选择新法术。</p>${avail.length&&learned.length?`<label>替换等级<select data-replace-level>${avail.map(x=>opt(String(x.classLevel),`${x.title} · 最高${x.maxSpellLevel}环`,String(avail[0].classLevel))).join('')}</select></label><label>移除法术<select data-replace-slot>${learned.map(s=>opt(s.id,spellData.find(x=>x.key===s.spellKey)?.name||s.spellKey,learned[0].id)).join('')}</select></label><label>新法术<select data-replace-new>${spellsForSource(source,'','all').filter(sp=>sp.level>0&&sp.level<=avail[0].maxSpellLevel&&!choiceHas(source,build,sp.key)).map(sp=>opt(sp.key,`${sp.name} · ${sp.level}环`,'')).join('')}</select></label><button class="primary wide" data-replace-confirm>确认替换</button>`:'<div class="v82-empty">当前没有可用替换机会。</div>'}</div></section></div>`;
  root.querySelectorAll('[data-close]').forEach(x=>x.onclick=e=>{if(e.target===x)root.innerHTML=''});
  const levelSel=root.querySelector('[data-replace-level]'),newSel=root.querySelector('[data-replace-new]');
  levelSel?.addEventListener('change',()=>{const node=plans.find(x=>x.classLevel===Number(levelSel.value));newSel.innerHTML=spellsForSource(source,'','all').filter(sp=>sp.level>0&&sp.level<=node.maxSpellLevel&&!choiceHas(source,build,sp.key)).map(sp=>opt(sp.key,`${sp.name} · ${sp.level}环`,'')).join('')});
  root.querySelector('[data-replace-confirm]')?.addEventListener('click',()=>{const classLevel=Number(levelSel.value),slotId=root.querySelector('[data-replace-slot]').value,newKey=newSel.value,st=learningState(build,source),res=replaceLearnedSpell(st,source,classLevel,slotId,newKey);if(!res.ok)return alert(res.reason);updateBuild(build.id,d=>{const c=d.spellChoices[source.key]||(d.spellChoices[source.key]={cantrips:[],spells:[],prepared:[]});c.spells=c.spells.filter(x=>x!==res.from);if(!c.spells.includes(res.to))c.spells.push(res.to);c.prepared=c.prepared.filter(x=>x!==res.from);d.spellLearning=d.spellLearning||{};d.spellLearning[source.key]=st});root.innerHTML='';rerender()})
}
function choiceHas(source,build,key){const c=spellChoice(build,source.key);return c.spells.includes(key)||c.cantrips.includes(key)}

export function bindCharacterEditor(build,ui,{rerender,goEquipment}){
  document.querySelectorAll('[data-char-step]').forEach(btn=>btn.onclick=()=>{if(!btn.disabled){ui.characterStep=btn.dataset.charStep;rerender()}});
  document.querySelector('[data-char-step-select]')?.addEventListener('change',e=>{ui.characterStep=e.target.value;rerender()});
  document.querySelector('[data-go-equipment]')?.addEventListener('click',goEquipment);
  document.querySelectorAll('[data-level-delta]').forEach(btn=>btn.onclick=()=>setTargetLevel(build.id,build.targetLevel+Number(btn.dataset.levelDelta)));
  document.querySelectorAll('[data-set-level]').forEach(btn=>btn.onclick=()=>setTargetLevel(build.id,Number(btn.dataset.setLevel)));
  document.querySelectorAll('[data-identity]').forEach(sel=>sel.onchange=()=>updateIdentity(build.id,{[sel.dataset.identity]:sel.value}));
  document.querySelectorAll('[data-route-index]').forEach(sel=>sel.onchange=()=>setLevelClass(build.id,Number(sel.dataset.routeIndex),sel.value));
  document.querySelectorAll('[data-prog-index]').forEach(btn=>btn.onclick=()=>{ui.progressionIndex=Number(btn.dataset.progIndex);rerender()});
  document.querySelectorAll('[data-subclass]').forEach(btn=>btn.onclick=()=>setSubclass(build.id,btn.dataset.subclassClass,btn.dataset.subclass));
  document.querySelectorAll('[data-feat]').forEach(btn=>btn.onclick=()=>setFeatChoice(build.id,Number(btn.dataset.featIndex),btn.dataset.feat));
  document.querySelectorAll('[data-asi-slot]').forEach(sel=>sel.onchange=()=>setFeatAsi(build.id,Number(sel.dataset.asiIndex),sel.dataset.asiSlot,sel.value));
  document.querySelectorAll('[data-ability-delta]').forEach(btn=>btn.onclick=()=>{const key=btn.dataset.ability,current=build.abilities.scores[key];setAbilityScore(build.id,key,current+Number(btn.dataset.abilityDelta))});
  document.querySelectorAll('[data-bonus]').forEach(sel=>sel.onchange=()=>setAbilityBonus(build.id,sel.dataset.bonus,sel.value));
  document.querySelectorAll('[data-skill-stage]').forEach(btn=>btn.onclick=()=>{ui.skillStageIndex=Number(btn.dataset.skillStage);rerender()});
  document.querySelectorAll('[data-skill-source]').forEach(btn=>btn.onclick=()=>toggleSkill(build.id,btn.dataset.skillSource,btn.dataset.skillKey,Number(btn.dataset.skillLimit)));
  document.querySelectorAll('[data-expertise-slot]').forEach(btn=>btn.onclick=()=>setExpertise(build.id,btn.dataset.expertiseSlot,build.expertise?.[btn.dataset.expertiseSlot]===btn.dataset.skillKey?'':btn.dataset.skillKey));
  document.querySelectorAll('[data-feature-group]').forEach(btn=>btn.onclick=()=>{ui.featureGroupIndex=Number(btn.dataset.featureGroup);rerender()});
  document.querySelectorAll('[data-feature]').forEach(btn=>btn.onclick=()=>toggleClassChoice(build.id,btn.dataset.featureGroupId,btn.dataset.feature,Number(btn.dataset.featureLimit)));
  document.querySelector('[data-spell-source]')?.addEventListener('change',e=>{ui.spellSource=e.target.value;ui.spellDetail=null;rerender()});
  document.querySelectorAll('[data-learning-node]').forEach(btn=>btn.onclick=()=>{ui.spellNode=ui.spellNode||{};ui.spellNode[ui.spellSource]=btn.dataset.learningNode;rerender()});
  document.querySelector('[data-open-replace]')?.addEventListener('click',()=>openReplacementSheet(build,ui,rerender));
  const search=document.querySelector('[data-spell-search]');if(search)search.oninput=()=>{ui.spellQuery=search.value;rerender()};
  document.querySelectorAll('[data-spell-level]').forEach(btn=>btn.onclick=()=>{ui.spellLevel=btn.dataset.spellLevel==='all'?'all':Number(btn.dataset.spellLevel);rerender()});
  document.querySelectorAll('[data-spell-detail]').forEach(btn=>btn.onclick=()=>{ui.spellDetail=btn.dataset.spellDetail;rerender()});
  document.querySelectorAll('[data-spell-prepare]').forEach(btn=>btn.onclick=e=>{e.stopPropagation();const source=spellSources(build).find(x=>x.key===ui.spellSource)||spellSources(build)[0],limits=spellLimits(build,source);togglePreparedSpell(build.id,source.key,btn.dataset.spellPrepare,limits.prepared)});
  document.querySelectorAll('[data-spell-toggle]').forEach(btn=>btn.onclick=()=>{const source=spellSources(build).find(x=>x.key===ui.spellSource)||spellSources(build)[0],sp=spellData.find(x=>x.key===btn.dataset.spellToggle),choice=spellChoice(build,source.key),limits=spellLimits(build,source);if(!sp)return;
    if(sp.level===0){if(!choice.cantrips.includes(sp.key)&&choice.cantrips.length>=limits.cantrips)return alert('戏法选择已达上限。');return toggleSpell(build.id,source.key,sp.key)}
    if(source.mode==='prepared')return togglePreparedChoice(build.id,source.key,sp.key,limits.prepared);
    const res=setKnownSpell(build,source,sp.key,ui);if(!res.ok)alert(res.reason)
  })
}

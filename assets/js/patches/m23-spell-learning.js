import{getBuild,updateBuild,toggleSpell,togglePreparedSpell,togglePreparedChoice}from"../store.js";
import{spellSources,spellChoice,finalScores,mod}from"../selectors.js";
import{spellData}from"../data/spells.js";
import{toast,esc}from"../components/ui.js";
import{spellRuleSummary,ringCounts,slotText}from"../data/spell-progression.js";
import{learningMode,learningPlan,replacementPlan,migrateLearningState,activeNodeForState,nodeProgress,assignToNode,removeLearnedSpell,replaceLearnedSpell,learningValidation,learningSummary,spellName}from"../data/spell-learning.js";

let scheduled=false,applying=false;
const activeNodes=new Map(),replacementModes=new Map(),ensuring=new Set();
const route=()=>{const parts=(location.hash||"").replace(/^#\/?/,"").split("/").filter(Boolean);return parts[0]==="build"?{id:parts[1],step:parts[2]}:null};
const sourceSelect=()=>document.querySelector("#spell-source,#m-spell-source");
const core=state=>JSON.stringify({version:state?.version,sourceKey:state?.sourceKey,mode:state?.mode,slots:state?.slots,replacements:state?.replacements,unassigned:state?.unassigned});
const spellByKey=key=>spellData.find(item=>item.key===key);
function ensureState(build,source,choice){
  if(learningMode(source)==="prepared")return null;
  const existing=build.spellLearning?.[source.key],migrated=migrateLearningState(existing,source,choice);
  if(core(existing)!==core(migrated)&&!ensuring.has(`${build.id}:${source.key}`)){
    const token=`${build.id}:${source.key}`;ensuring.add(token);
    queueMicrotask(()=>updateBuild(build.id,draft=>{draft.spellLearning=draft.spellLearning||{};draft.spellLearning[source.key]=migrated}));
    setTimeout(()=>ensuring.delete(token),0);return null
  }
  return existing||migrated
}
function currentContext(){
  const r=route();if(!r||r.step!=="spells")return null;
  const build=getBuild(r.id);if(!build)return null;
  const sources=spellSources(build),source=sources.find(item=>item.key===sourceSelect()?.value)||sources[0];if(!source)return null;
  const scores=finalScores(build),rules=spellRuleSummary(build,source,sources,mod(scores[source.ability])),choice=spellChoice(build,source.key),state=ensureState(build,source,choice);
  return{build,sources,source,rules,choice,state}
}
function spellFromAction(button){
  const root=button.closest(".mobile-sheet,.decision-inspector-body,.current-option-detail,#overlay-root")||document;
  const name=root.querySelector(".spell-detail-title h2,.m-sheet-title h2")?.textContent.trim();
  return spellData.find(item=>item.name===name)||null
}
const isChosen=(choice,source,spell)=>spell.level===0?choice.cantrips.includes(spell.key):source.mode==="prepared"?choice.prepared.includes(spell.key):choice.spells.includes(spell.key);
function counter(label,current,limit){const over=current>limit;return`<span class="${over?"m22-over-limit":""}">${label} <b>${current}/${limit}</b></span>`}
function renderCounters(ctx){
  const{source,rules,choice}=ctx;let html=counter("戏法",choice.cantrips.length,rules.cantrips);
  if(source.mode==="spellbook")html+=counter("法术书",choice.spells.length,rules.learned)+counter("准备",choice.prepared.length,rules.prepared);
  else if(source.mode==="prepared")html+=counter("准备",choice.prepared.length,rules.prepared);
  else html+=counter(source.mode==="pact"?"已知（契约）":"已知",choice.spells.length,rules.learned);
  document.querySelectorAll(".spell-counts,.m-spell-counts").forEach(el=>{if(el.dataset.m23!==html){el.innerHTML=html;el.dataset.m23=html}})
}
function renderRulePanel(ctx){
  const{source,rules,choice,state}=ctx,summary=state?learningSummary(source,state):null,keys=source.mode==="prepared"?choice.prepared:choice.spells,distribution=ringCounts(keys,spellData),ringText=summary?.text||Object.entries(distribution).map(([level,count])=>`${level}环 ${count}`).join(" · ")||"尚未选择环位法术";
  const modeText=source.mode==="spellbook"?`升级学习 ${rules.learned} 个法术；准备上限 ${rules.prepared}`:source.mode==="prepared"?`自动掌握职业法术；准备上限 ${rules.prepared}`:source.mode==="pact"?`升级学习 ${rules.learned} 个契约法术；始终可用`:`升级学习 ${rules.learned} 个已知法术；始终可用`;
  const signature=`${source.key}|${source.level}|${slotText(rules.slot)}|${ringText}|${modeText}`;
  for(const anchor of[document.querySelector(".spell-counts"),document.querySelector(".m-spell-counts")].filter(Boolean)){
    const parent=anchor.parentElement||anchor,existing=parent.querySelector(":scope > .m22-spell-rules");if(existing?.dataset.signature===signature)continue;
    const panel=existing||document.createElement("section");panel.className="m22-spell-rules";panel.dataset.signature=signature;
    panel.innerHTML=`<div><span>法术位</span><b>${slotText(rules.slot)}</b></div><div><span>${source.mode==="prepared"?"准备分布":"当前学习分布"}</span><b>${ringText}</b></div><p>${modeText}。法术位只表示施放次数；逐级学习节点决定可学习的环阶与数量。</p>`;
    if(!existing)anchor.after(panel)
  }
}
function nodeHtml(source,state,node,active){const p=nodeProgress(state,node);return`<button type="button" class="m23-node ${active?"active":""} ${p.complete?"complete":""}" data-m23-node="${node.id}"><span>${node.classLevel}</span><div><b>${esc(node.title)}</b><small>${p.selected}/${p.total} · 最高${node.maxSpellLevel}环</small></div>${p.complete?"<i>✓</i>":""}</button>`}
function replacementHtml(ctx){
  const{source,state}=ctx,plans=replacementPlan(source),used=new Set((state.replacements||[]).map(item=>item.classLevel)),available=plans.filter(node=>!used.has(node.classLevel));
  if(!plans.length)return"";
  const learned=state.slots.filter(slot=>slot.spellKey),mode=replacementModes.get(source.key);
  return`<details class="m23-replacement"><summary>可选替换 <b>${state.replacements.length}/${plans.length}</b></summary><p>替换不会增加已知总数；每个职业等级最多使用一次。</p>${available.length&&learned.length?`<div class="m23-replace-controls"><label>替换等级<select data-m23-replace-level>${available.map(node=>`<option value="${node.classLevel}">${node.title} · 最高${node.maxSpellLevel}环</option>`).join("")}</select></label><label>移除法术<select data-m23-replace-slot>${learned.map(slot=>`<option value="${slot.id}">${esc(spellName(slot.spellKey))} · 原${slot.classLevel}级学习</option>`).join("")}</select></label><button type="button" data-m23-start-replace>选择替换后的法术</button></div>`:`<span class="m23-muted">当前没有可用替换机会。</span>`}${mode?`<div class="m23-replace-active">正在替换：${esc(spellName(state.slots.find(slot=>slot.id===mode.slotId)?.spellKey||""))} · ${mode.classLevel}级机会 <button type="button" data-m23-cancel-replace>取消</button></div>`:""}</details>`
}
function renderLearningPanel(ctx){
  const existing=document.querySelector(".m23-learning-panel");
  if(!ctx.state||learningMode(ctx.source)==="prepared"){existing?.remove();return}
  const plan=learningPlan(ctx.source),preferred=activeNodes.get(ctx.source.key),active=activeNodeForState(ctx.source,ctx.state,preferred);if(!active)return;
  activeNodes.set(ctx.source.key,active.id);const progress=nodeProgress(ctx.state,active),summary=learningSummary(ctx.source,ctx.state),validation=learningValidation(ctx.source,ctx.state,ctx.choice),replacement=replacementModes.get(ctx.source.key);
  const signature=JSON.stringify({source:ctx.source.key,level:ctx.source.level,active:active.id,slots:ctx.state.slots.map(slot=>[slot.id,slot.spellKey]),replacements:ctx.state.replacements,replacement,issues:validation.issues,mobile:matchMedia("(max-width:767px)").matches});
  const panel=existing||document.createElement("section");panel.className="m23-learning-panel";panel.dataset.source=ctx.source.key;
  if(panel.dataset.signature!==signature){panel.dataset.signature=signature;panel.innerHTML=`<details class="m23-learning-details" ${matchMedia("(min-width:768px)").matches?"open":""}><summary><span>逐级学习</span><b>${summary.total}/${summary.limit} · 当前 ${active.classLevel}级</b></summary><div class="m23-learning-body"><div class="m23-node-grid">${plan.map(node=>nodeHtml(ctx.source,ctx.state,node,node.id===active.id)).join("")}</div><div class="m23-active-node"><div><span>当前节点</span><b>${esc(active.title)} · ${esc(active.label)}</b><small>本节点只能选择 1–${active.maxSpellLevel} 环法术。</small></div><strong>${progress.selected}/${progress.total}</strong></div>${replacementHtml(ctx)}${validation.issues.length?`<div class="m23-learning-warning">${validation.issues.slice(0,4).map(issue=>`<span>${esc(issue)}</span>`).join("")}</div>`:""}</div></details>`}
  if(!existing){const rules=document.querySelector(".spell-layout>.m22-spell-rules,.m19-spell-toolbar>.m22-spell-rules,.m22-spell-rules");if(rules)rules.after(panel);else document.querySelector(".spell-counts,.m-spell-counts")?.after(panel)}
}
function selectedKeys(ctx){return new Set(ctx.choice.spells||[])}
function restrictList(ctx){
  if(!ctx.state)return;const active=activeNodeForState(ctx.source,ctx.state,activeNodes.get(ctx.source.key)),selected=selectedKeys(ctx);if(!active)return;
  document.querySelectorAll("[data-spell],[data-mobile-spell]").forEach(card=>{const key=card.dataset.spell||card.dataset.mobileSpell,spell=spellByKey(key);if(!spell)return;const locked=spell.level>0&&spell.level>active.maxSpellLevel&&!selected.has(key);card.classList.toggle("m23-spell-locked",locked);card.hidden=locked});
  document.querySelectorAll("[data-spell-level],[data-m-filter]").forEach(button=>{const value=button.dataset.spellLevel??button.dataset.mFilter,level=Number(value),locked=Number.isFinite(level)&&level>active.maxSpellLevel;button.disabled=locked;button.classList.toggle("m23-ring-locked",locked)})
}
function actionState(ctx){
  const active=ctx.state&&activeNodeForState(ctx.source,ctx.state,activeNodes.get(ctx.source.key)),replacement=replacementModes.get(ctx.source.key);
  for(const button of document.querySelectorAll("[data-toggle-detail],[data-mobile-spell-action],[data-prepare-detail],[data-mobile-prepare]")){
    const spell=spellFromAction(button);if(!spell)continue;const isPrepare=button.matches("[data-prepare-detail],[data-mobile-prepare]"),prepared=ctx.choice.prepared.includes(spell.key),chosen=isChosen(ctx.choice,ctx.source,spell);let disabled=false,label="";
    if(isPrepare){disabled=!prepared&&ctx.choice.prepared.length>=ctx.rules.prepared;label="准备法术已达上限"}
    else if(spell.level===0){disabled=!chosen&&ctx.choice.cantrips.length>=ctx.rules.cantrips;label="戏法已达上限"}
    else if(ctx.source.mode==="prepared"){disabled=!prepared&&ctx.choice.prepared.length>=ctx.rules.prepared;label="准备法术已达上限"}
    else if(!chosen){
      if(replacement){const node=replacementPlan(ctx.source).find(item=>item.classLevel===replacement.classLevel);disabled=!node||spell.level>node.maxSpellLevel;label=disabled?`替换节点最高${node?.maxSpellLevel||0}环`:`替换为此法术`}
      else{const p=active&&nodeProgress(ctx.state,active);disabled=!active||spell.level>active.maxSpellLevel||p.selected>=p.total;label=!active?"没有可用学习节点":spell.level>active.maxSpellLevel?`当前节点最高${active.maxSpellLevel}环`:`${active.title}名额已满`}
    }
    button.disabled=disabled;button.classList.toggle("m23-limit-disabled",disabled);button.classList.toggle("m23-replace-button",Boolean(replacement&&!chosen&&!disabled));
    if(disabled||replacement&&!chosen){button.dataset.m23Original=button.dataset.m23Original||button.textContent;button.textContent=label}else if(button.dataset.m23Original){button.textContent=button.dataset.m23Original;delete button.dataset.m23Original}
  }
}
function updateSourceNote(ctx){
  const text=ctx.source.mode==="spellbook"?`法术书模式 · ${ctx.source.ability.toUpperCase()}施法 · 按职业等级逐级学习，准备容量独立`:ctx.source.mode==="prepared"?`准备施法模式 · ${ctx.source.ability.toUpperCase()}施法 · 自动掌握职业法术`:ctx.source.mode==="pact"?`契约魔法模式 · ${ctx.source.ability.toUpperCase()}施法 · 按职业等级逐级学习`:`已知法术模式 · ${ctx.source.ability.toUpperCase()}施法 · 按职业等级逐级学习`;
  document.querySelectorAll(".spell-source-note,.m-spell-source small").forEach(el=>{if(el.textContent!==text)el.textContent=text})
}
function apply(){if(applying)return;applying=true;scheduled=false;try{const version=document.querySelector(".brand-copy small");if(version&&version.textContent!=="V7 里程碑 23")version.textContent="V7 里程碑 23";const ctx=currentContext();if(!ctx)return;renderCounters(ctx);renderRulePanel(ctx);if(ctx.state){renderLearningPanel(ctx);restrictList(ctx)}updateSourceNote(ctx);actionState(ctx)}finally{applying=false}}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(apply)}
function mutateLearned(ctx,spell,mode){
  updateBuild(ctx.build.id,draft=>{
    const choice=draft.spellChoices[ctx.source.key]||(draft.spellChoices[ctx.source.key]={cantrips:[],spells:[],prepared:[]});
    const state=migrateLearningState(draft.spellLearning?.[ctx.source.key],ctx.source,choice);draft.spellLearning=draft.spellLearning||{};
    if(mode==="remove"){
      choice.spells=choice.spells.filter(key=>key!==spell.key);choice.prepared=choice.prepared.filter(key=>key!==spell.key);removeLearnedSpell(state,spell.key);if(replacementModes.get(ctx.source.key)?.slotId===state.slots.find(slot=>slot.spellKey===spell.key)?.id)replacementModes.delete(ctx.source.key)
    }else if(mode==="replace"){
      const replacement=replacementModes.get(ctx.source.key),result=replaceLearnedSpell(state,ctx.source,replacement.classLevel,replacement.slotId,spell.key);if(!result.ok){toast(result.reason);return}
      choice.spells=choice.spells.filter(key=>key!==result.from);choice.prepared=choice.prepared.filter(key=>key!==result.from);if(!choice.spells.includes(spell.key))choice.spells.push(spell.key);replacementModes.delete(ctx.source.key)
    }else{
      const node=activeNodeForState(ctx.source,state,activeNodes.get(ctx.source.key)),result=node&&assignToNode(state,node,spell.key);if(!result?.ok){toast(result?.reason||"没有可用学习节点。");return}if(!choice.spells.includes(spell.key))choice.spells.push(spell.key);
      const next=learningPlan(ctx.source).find(item=>!nodeProgress(state,item).complete);activeNodes.set(ctx.source.key,(next||node).id)
    }
    draft.spellLearning[ctx.source.key]=state
  })
}

document.addEventListener("click",event=>{
  const nodeButton=event.target.closest("[data-m23-node]");if(nodeButton){event.preventDefault();activeNodes.set(currentContext()?.source.key,nodeButton.dataset.m23Node);replacementModes.delete(currentContext()?.source.key);schedule();return}
  const startReplace=event.target.closest("[data-m23-start-replace]");if(startReplace){event.preventDefault();const ctx=currentContext(),root=startReplace.closest(".m23-replacement"),classLevel=Number(root?.querySelector("[data-m23-replace-level]")?.value),slotId=root?.querySelector("[data-m23-replace-slot]")?.value;if(ctx&&classLevel&&slotId){replacementModes.set(ctx.source.key,{classLevel,slotId});toast("请选择替换后的法术。");schedule()}return}
  if(event.target.closest("[data-m23-cancel-replace]")){event.preventDefault();const ctx=currentContext();if(ctx)replacementModes.delete(ctx.source.key);schedule();return}
  const action=event.target.closest("[data-toggle-detail],[data-mobile-spell-action],[data-prepare-detail],[data-mobile-prepare]");
  if(action){const ctx=currentContext(),spell=ctx&&spellFromAction(action);if(!ctx||!spell)return;event.preventDefault();event.stopImmediatePropagation();const isPrepare=action.matches("[data-prepare-detail],[data-mobile-prepare]"),prepared=ctx.choice.prepared.includes(spell.key),chosen=isChosen(ctx.choice,ctx.source,spell);
    if(isPrepare){if(!prepared&&ctx.choice.prepared.length>=ctx.rules.prepared){toast("准备法术已达上限。");return}togglePreparedSpell(ctx.build.id,ctx.source.key,spell.key,ctx.rules.prepared)}
    else if(spell.level===0){if(!chosen&&ctx.choice.cantrips.length>=ctx.rules.cantrips){toast("戏法已达上限。");return}toggleSpell(ctx.build.id,ctx.source.key,spell.key)}
    else if(ctx.source.mode==="prepared"){if(!prepared&&ctx.choice.prepared.length>=ctx.rules.prepared){toast("准备法术已达上限。");return}togglePreparedChoice(ctx.build.id,ctx.source.key,spell.key,ctx.rules.prepared)}
    else if(chosen)mutateLearned(ctx,spell,"remove");
    else if(replacementModes.has(ctx.source.key))mutateLearned(ctx,spell,"replace");
    else mutateLearned(ctx,spell,"add");
    action.closest(".mobile-sheet")?.querySelector("[data-close]")?.click();schedule();return
  }
  const next=event.target.closest("[data-next],.mobile-primary-action");if(next){const ctx=currentContext();if(!ctx)return;const messages=[];if(ctx.choice.cantrips.length>ctx.rules.cantrips)messages.push("戏法数量超限");if(ctx.source.mode==="prepared"&&ctx.choice.prepared.length>ctx.rules.prepared)messages.push("准备法术数量超限");if(ctx.state){const result=learningValidation(ctx.source,ctx.state,ctx.choice);messages.push(...result.issues)}if(messages.length){event.preventDefault();event.stopImmediatePropagation();toast(messages[0])}}
},true);

new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener("hashchange",()=>{replacementModes.clear();schedule()});window.addEventListener("resize",schedule,{passive:true});schedule();

import{getBuild}from"../store.js";
import{spellSources}from"../selectors.js";
import{learningMode,learningPlan,nodeProgress,replacementPlan}from"../data/spell-learning.js";

let scheduled=false;
const route=()=>{const p=(location.hash||"").replace(/^#\/?/,"").split("/").filter(Boolean);return p[0]==="build"?{id:p[1],step:p[2]}:null};
const sourceSelect=()=>document.querySelector("#spell-source,#m-spell-source");

function context(){
  const r=route();if(!r||r.step!=="spells")return null;
  const build=getBuild(r.id);if(!build)return null;
  const sources=spellSources(build),source=sources.find(x=>x.key===sourceSelect()?.value)||sources[0];
  if(!source)return null;
  const state=build.spellLearning?.[source.key]||null;
  return{build,source,state}
}

function latestLearningNode(source){
  const plan=learningPlan(source);return plan.length?plan[plan.length-1]:null
}

function replacementAvailableAtLevel(source,node){
  if(!node)return false;
  return replacementPlan(source).some(x=>x.classLevel===node.classLevel)
}

function quotaMarkup(ctx){
  if(!ctx.state||learningMode(ctx.source)==="prepared")return"";
  const node=latestLearningNode(ctx.source);if(!node)return"";
  const p=nodeProgress(ctx.state,node),remaining=Math.max(0,p.total-p.selected),replacement=replacementAvailableAtLevel(ctx.source,node);
  return`<span>本级学习名额</span><b>${ctx.source.name}${node.classLevel}级 · 新增 <strong>${p.total}</strong> 个法术</b><small>已选 ${p.selected}/${p.total} · ${remaining?`还剩 ${remaining} 个 · `:"已完成 · "}最高${node.maxSpellLevel}环${replacement?" · 本级可替换1个":""}</small>`
}

function renderQuota(ctx){
  document.querySelectorAll(".m25-current-level-quota").forEach(el=>{if(!el.closest(".m24-learning-panel"))el.remove()});
  const panel=document.querySelector(".m24-learning-panel");
  if(!panel||!ctx.state||learningMode(ctx.source)==="prepared")return;
  const html=quotaMarkup(ctx);if(!html)return;
  let quota=panel.querySelector(":scope > .m25-current-level-quota");
  if(!quota){quota=document.createElement("div");quota.className="m25-current-level-quota";const head=panel.querySelector(".m24-learning-head");head?.after(quota)}
  if(quota.dataset.html!==html){quota.innerHTML=html;quota.dataset.html=html}
}

function renderResultQuota(ctx){
  for(const result of document.querySelectorAll(".m24-learning-result")){
    let box=result.querySelector(":scope > .m25-result-current-level");
    if(!ctx.state||learningMode(ctx.source)==="prepared"){box?.remove();continue}
    const node=latestLearningNode(ctx.source);if(!node)continue;
    const p=nodeProgress(ctx.state,node),replacement=replacementAvailableAtLevel(ctx.source,node);
    const html=`<span>当前职业等级</span><b>${ctx.source.name}${node.classLevel}级 · 本级新增${p.total}个</b><small>已选 ${p.selected}/${p.total} · 最高${node.maxSpellLevel}环${replacement?" · 可替换1个":""}</small>`;
    if(!box){box=document.createElement("div");box.className="m25-result-current-level";result.querySelector(".m24-result-head")?.after(box)}
    if(box.dataset.html!==html){box.innerHTML=html;box.dataset.html=html}
  }
}

function markCurrentNode(ctx){
  if(!ctx.state)return;
  const latest=latestLearningNode(ctx.source);if(!latest)return;
  document.querySelectorAll(".m24-node").forEach(node=>node.classList.toggle("current-level",node.dataset.m24Node===latest.id));
}

function run(){
  scheduled=false;
  const version=document.querySelector(".brand-copy small");if(version)version.textContent="V7 里程碑 25";
  const ctx=context();if(!ctx)return;
  renderQuota(ctx);renderResultQuota(ctx);markCurrentNode(ctx)
}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(run)}

new MutationObserver(schedule).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:["class","value"]});
window.addEventListener("hashchange",schedule);
window.addEventListener("resize",schedule);
document.addEventListener("change",event=>{if(event.target.matches("#spell-source,#m-spell-source,[data-m24-node-select]"))schedule()});
schedule();

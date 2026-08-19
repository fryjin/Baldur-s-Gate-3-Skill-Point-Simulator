import{getBuild}from"../store.js";
import{buildResourceModel,resourceSignature}from"../data/resource-model.js";
import{esc}from"../components/ui.js";

let pending=false;
const parseRoute=()=>{const p=(location.hash||"").replace(/^#\/?/,"").split("/").filter(Boolean);return p[0]==="build"?{kind:"build",id:p[1],step:p[2]}:p[0]==="character"?{kind:"character",id:p[1]}:null};
const chips=r=>r.entries?.length?`<div class="m26-resource-values">${r.entries.map(x=>`<span><b>${esc(x.label)}</b><strong>${esc(x.value)}</strong></span>`).join("")}</div>`:`<strong class="m26-resource-number">${esc(r.value)}</strong>`;
const card=r=>`<article class="m26-resource-card tone-${esc(r.tone)}" title="${esc([r.detail,r.recharge?`恢复：${r.recharge}`:""].filter(Boolean).join(" · "))}"><span class="m26-resource-glyph">${esc(r.glyph)}</span><div class="m26-resource-copy"><div><b>${esc(r.label)}</b>${r.recharge?`<small>${esc(r.recharge)}恢复</small>`:""}</div>${chips(r)}${r.detail?`<p>${esc(r.detail)}</p>`:""}</div></article>`;
const panel=(resources,{compact=false,title="核心资源"}={})=>`<section class="m26-resource-panel ${compact?"compact":""}"><div class="m26-resource-head"><span>${esc(title)}</span><b>${resources.length}</b></div><div class="m26-resource-grid">${resources.map(card).join("")}</div></section>`;

function renderSpellResources(build,resources){
  const anchor=document.querySelector(".spell-counts,.m-spell-counts");if(!anchor)return;
  const signature=resourceSignature(build);let el=document.querySelector(".m26-spell-resources");
  if(!el){el=document.createElement("div");el.className="m26-spell-resources";anchor.after(el)}
  if(el.dataset.signature===signature)return;el.dataset.signature=signature;el.innerHTML=panel(resources,{title:"施法资源"});
}
function renderCompactResources(build,resources){
  const host=document.querySelector(".compact-build-summary");if(!host)return;
  const signature=resourceSignature(build);let el=host.querySelector(".m26-build-resources");
  if(!el){el=document.createElement("div");el.className="m26-build-resources";const anchor=host.querySelector(".compact-combat");anchor?.after(el)}
  if(el.dataset.signature===signature)return;el.dataset.signature=signature;const show=resources.filter(r=>["spell-slots","pact-slots","sorcery","ki","rage","bardic","channel-divinity","wild-shape","superiority"].includes(r.key)).slice(0,6);el.innerHTML=show.length?panel(show,{compact:true,title:"核心资源"}):"";
}
function renderCharacterResources(build,resources){
  const host=document.querySelector("#sheet-overview");if(!host)return;
  const signature=resourceSignature(build);let el=host.querySelector(".m26-character-resources");
  if(!el){el=document.createElement("div");el.className="m26-character-resources";const scores=host.querySelector(".score-grid.large");scores?.after(el)}
  if(el.dataset.signature===signature)return;el.dataset.signature=signature;el.innerHTML=resources.length?panel(resources,{title:"职业与施法资源"}):"";
}
function renderDecisionResources(resources){
  const cards=document.querySelectorAll(".decision-effect-card");if(!cards.length)return;const sig=JSON.stringify(resources.map(r=>[r.key,r.value,r.entries]));
  for(const host of cards){let el=host.querySelector(".m26-decision-resources");if(!el){el=document.createElement("div");el.className="m26-decision-resources";const subtitle=host.querySelector(".effect-subtitle");subtitle?.after(el)}if(el.dataset.signature===sig)continue;el.dataset.signature=sig;const show=resources.filter(r=>["spell-slots","pact-slots","sorcery"].includes(r.key));el.innerHTML=show.length?panel(show,{compact:true,title:"施法资源"}):""}
}
function render(){pending=false;const version=document.querySelector(".brand-copy small");if(version)version.textContent="V7 里程碑 26";const r=parseRoute();if(!r)return;const build=getBuild(r.id);if(!build)return;const resources=buildResourceModel(build);if(r.kind==="build"){renderCompactResources(build,resources);if(r.step==="spells"){renderSpellResources(build,resources);renderDecisionResources(resources)}}else if(r.kind==="character")renderCharacterResources(build,resources)}
function schedule(){if(pending)return;pending=true;requestAnimationFrame(render)}
new MutationObserver(schedule).observe(document.getElementById("app"),{childList:true,subtree:true});window.addEventListener("hashchange",schedule);schedule();

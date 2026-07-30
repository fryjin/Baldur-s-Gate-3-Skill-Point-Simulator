import{abilities,classes,skills,backgrounds}from"../data/core.js";
import{feats,featDetails,skillDescriptions,skillGlyphs}from"../data/progression.js";
import{spellData}from"../data/spells.js";
import{characterSummary,fmt,spellSources,spellChoice,skillBonus,activeFeatureGroups,mod,proficiencyBonus,validationIssues}from"../selectors.js";
import{spellEffectSummary,featureEffectSummary}from"../rules/effects.js";
import{effectFormulaHtml,featureEffectHtml}from"../components/effects-ui.js";
import{spellImageTag,bindImageFallbacks}from"../data/spell-assets.js";
import{navigate}from"../router.js";
import{lastActiveStep}from"../components/shell.js";
import{esc}from"../components/ui.js";

const armorLabels={unarmored:"无甲",light:"轻甲",medium:"中甲",heavy:"重甲"};
const abilityName=key=>abilities.find(item=>item.key===key)?.name||key;
const spellByKey=key=>spellData.find(item=>item.key===key);
const spellCards=(keys,preparedSet,build,src)=>keys.map(key=>spellByKey(key)).filter(Boolean).map(sp=>{
  const prepared=preparedSet.has(sp.key),effect=spellEffectSummary(build,sp,src,sp.level);
  return`<article class="character-spell-card ${prepared?"prepared":""}">${spellImageTag(sp,"summary-spell-image")}<div><b>${esc(sp.name)}</b><small>${sp.level?`${sp.level}环`:`戏法`} · ${esc(sp.school)}${prepared?" · 已准备":""}</small>${effectFormulaHtml(effect,{compact:true})}</div></article>`
}).join("");

function featLabel(item){
  if(item.type==="asi"){
    const same=item.a1===item.a2;
    return{title:"属性提升",note:same?`${abilityName(item.a1)} +2`:`${abilityName(item.a1)} +1 · ${abilityName(item.a2)} +1`}
  }
  return{title:feats[item.type]?.name||item.type,note:featDetails[item.type]||feats[item.type]?.note||""}
}

const sectionButtons=issues=>[
  ["sheet-overview","◫","总览"],
  ["sheet-skills","✦","技能"],
  ["sheet-growth","⬆","成长"],
  ["sheet-features","⚔","职业能力"],
  ["sheet-spells","✶","法术"],
  ...(issues.length?[["sheet-issues","!","待处理"]]:[])
];

function bindSectionNavigation(){
  const buttons=[...document.querySelectorAll("[data-sheet-target]")];
  const sections=buttons.map(button=>document.getElementById(button.dataset.sheetTarget)).filter(Boolean);
  const setActive=id=>buttons.forEach(button=>button.classList.toggle("active",button.dataset.sheetTarget===id));
  buttons.forEach(button=>button.addEventListener("click",event=>{
    event.preventDefault();
    event.stopPropagation();
    const target=document.getElementById(button.dataset.sheetTarget);
    if(!target)return;
    setActive(target.id);
    target.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"});
  }));
  if(!("IntersectionObserver"in window)){setActive(sections[0]?.id||"");return}
  const observer=new IntersectionObserver(entries=>{
    const visible=entries.filter(entry=>entry.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
    if(visible)setActive(visible.target.id);
  },{root:null,rootMargin:"-22% 0px -62% 0px",threshold:[0,.15,.35,.6]});
  sections.forEach(section=>observer.observe(section));
  setActive(sections[0]?.id||"");
}

export function renderCharacter(build){
  const s=characterSummary(build),pb=proficiencyBonus(build),issues=validationIssues(build);
  const featureGroups=activeFeatureGroups(build).filter(group=>group.selected.length);
  const subclasses=Object.entries(build.subclasses).map(([key,value])=>`${classes[key]?.name||key}：${value}`);
  const selectedFeats=build.feats.filter(item=>item?.type&&item.type!=="none");
  const spellGroups=spellSources(build).map(src=>{
    const choice=spellChoice(build,src.key),preparedSet=new Set(choice.prepared),castMod=mod(s.scores[src.ability]);
    const known=choice.spells.filter(key=>!preparedSet.has(key));
    return{src,choice,preparedSet,known,dc:8+pb+castMod,attack:pb+castMod}
  });
  const identityFacts=[
    ["种族",build.identity.race],
    ["背景",backgrounds[build.identity.background]?.name||build.identity.background],
    ["护甲模拟",armorLabels[build.identity.armorMode]||build.identity.armorMode],
    ["职业路线",s.route],
    ["子职业",subclasses.join(" · ")||"尚未选择"],
    ["熟练加值",fmt(pb)]
  ];
  const combat=[
    ["生命",s.hp],["护甲",s.ac],["先攻",fmt(s.initiative)],["熟练",fmt(pb)],
    ["法术攻击",s.casting?fmt(s.casting.attack):"—"],["法术 DC",s.casting?.dc||"—"]
  ];
  document.getElementById("app").innerHTML=`<main class="character-page">
    <header class="character-topbar"><button type="button" class="ghost-button" data-back-build>返回构筑</button><div><span class="kicker">CHARACTER SHEET</span><strong>${esc(build.name)}</strong></div><button type="button" class="secondary-button" data-edit-build>修改构筑</button></header>
    <div class="character-content">
      <section class="character-identity">
        <div class="character-level-block"><span class="character-level">${build.targetLevel}</span><span>等级</span></div>
        <div class="character-title"><h1>${esc(build.name)}</h1><p>${esc(build.identity.race)} · ${esc(s.route)}</p><small>${esc(subclasses.join(" · ")||"尚未选择子职业")}</small></div>
        <div class="character-combat">${combat.map(([label,value])=>`<div><span>${label}</span><b>${value}</b></div>`).join("")}</div>
      </section>
      <nav class="character-section-nav" aria-label="角色纸章节">
        ${sectionButtons(issues).map(([target,icon,label],index)=>`<button type="button" class="${index===0?"active":""}" data-sheet-target="${target}"><span aria-hidden="true">${icon}</span><b>${label}</b></button>`).join("")}
      </nav>
      <div class="character-dashboard">
        <section class="sheet-card" id="sheet-overview"><div class="sheet-card-head"><h2>角色总览</h2><span>${esc(s.route)}</span></div>
          <div class="score-grid large">${abilities.map(a=>`<div><span>${a.name}</span><b>${s.scores[a.key]}</b><small>${fmt(mod(s.scores[a.key]))}</small></div>`).join("")}</div>
          <div class="identity-facts">${identityFacts.map(([label,value])=>`<div><span>${label}</span><b>${esc(String(value))}</b></div>`).join("")}</div>
        </section>
        <section class="sheet-card" id="sheet-growth"><div class="sheet-card-head"><h2>成长选择</h2><span>${selectedFeats.length} 项</span></div>
          <div class="growth-subclasses"><h3>子职业</h3>${subclasses.length?subclasses.map(item=>`<span class="tag">${esc(item)}</span>`).join(""):'<span class="muted">尚未选择子职业</span>'}</div>
          <div class="growth-feats"><h3>专长与属性提升</h3>${selectedFeats.length?selectedFeats.map(item=>{const data=featLabel(item);return`<article><b>${esc(data.title)}</b><p>${esc(data.note)}</p></article>`}).join(""):'<p class="muted">尚未选择成长项目。</p>'}</div>
        </section>
        <section class="sheet-card sheet-card-wide" id="sheet-skills"><div class="sheet-card-head"><h2>全部技能</h2><span>熟练 ${s.skills.length} · 专精 ${s.expertise.length}</span></div>
          <div class="sheet-skill-grid">${skills.map(skill=>{const expert=s.expertise.includes(skill.key),prof=s.skills.includes(skill.key),status=expert?"专精":prof?"熟练":"未熟练";return`<article class="sheet-skill ${expert?"expert":prof?"proficient":""}" title="${esc(skillDescriptions[skill.key]||"")}"><span class="sheet-skill-glyph">${skillGlyphs[skill.key]||"·"}</span><div><b>${skill.name}</b><small>${abilityName(skill.ability)} · ${status}</small></div><strong>${fmt(skillBonus(build,skill.key))}</strong></article>`}).join("")}</div>
        </section>
        <section class="sheet-card sheet-card-wide" id="sheet-features"><div class="sheet-card-head"><h2>职业能力</h2><span>${featureGroups.reduce((sum,g)=>sum+g.selected.length,0)} 项</span></div>
          <div class="character-feature-groups">${featureGroups.map(group=>`<article><h3>${esc(classes[group.classKey]?.name||group.classKey)} · ${esc(group.title)}</h3>${group.selected.map(key=>{const option=group.options.find(x=>x[0]===key),effect=featureEffectSummary(build,group,key);return`<div class="character-feature-row"><span class="option-glyph">✦</span><div><b>${esc(option?.[1]||key)}</b><p>${esc(option?.[2]||"")}</p>${featureEffectHtml(effect)}</div></div>`}).join("")}</article>`).join("")||'<p class="muted">尚未选择主动职业能力。</p>'}</div>
        </section>
        <section class="sheet-card sheet-card-wide" id="sheet-spells"><div class="sheet-card-head"><h2>戏法与法术</h2><span>${spellGroups.length?`${spellGroups.length} 个施法来源`:"无施法职业"}</span></div>
          <div class="spell-sheet-groups">${spellGroups.map(({src,choice,preparedSet,known,dc,attack})=>`<article class="spell-source-card"><header><div><h3>${esc(src.name)} ${src.level}级</h3><p>${abilityName(src.ability)}施法 · 最高${src.maxLevel}环 · 法术攻击 ${fmt(attack)} · DC ${dc}</p></div><span>${src.mode==="spellbook"?"法术书":src.mode==="prepared"?"准备施法":src.mode==="pact"?"契约魔法":"已知法术"}</span></header>
            <div class="spell-source-section"><h4>戏法 <span>${choice.cantrips.length}</span></h4><div class="character-spell-cards">${spellCards(choice.cantrips,new Set(),build,src)||'<span class="muted">尚未选择</span>'}</div></div>
            ${choice.prepared.length?`<div class="spell-source-section"><h4>已准备 <span>${choice.prepared.length}</span></h4><div class="character-spell-cards">${spellCards(choice.prepared,preparedSet,build,src)}</div></div>`:""}
            ${known.length?`<div class="spell-source-section"><h4>${src.mode==="spellbook"?"法术书其余法术":"已知法术"} <span>${known.length}</span></h4><div class="character-spell-cards">${spellCards(known,preparedSet,build,src)}</div></div>`:""}
          </article>`).join("")||'<p class="muted">当前没有施法职业。</p>'}</div>
        </section>
        ${issues.length?`<section class="sheet-card sheet-card-wide sheet-issues" id="sheet-issues"><div class="sheet-card-head"><h2>待处理项目</h2><span>${issues.length} 项</span></div><div class="character-issue-list">${issues.map(issue=>`<button type="button" data-issue-step="${issue.step}"><span>${esc(issue.message)}</span><b>前往处理 ›</b></button>`).join("")}</div></section>`:""}
      </div>
    </div>
  </main>`;
  bindImageFallbacks();
  bindSectionNavigation();
  document.querySelector("[data-back-build]").addEventListener("click",()=>history.length>1?history.back():navigate(`/build/${build.id}/${lastActiveStep(build)}`));
  document.querySelector("[data-edit-build]").addEventListener("click",()=>navigate(`/build/${build.id}/${lastActiveStep(build)}`));
  document.querySelectorAll("[data-issue-step]").forEach(button=>button.addEventListener("click",()=>navigate(`/build/${build.id}/${button.dataset.issueStep}`)));
}

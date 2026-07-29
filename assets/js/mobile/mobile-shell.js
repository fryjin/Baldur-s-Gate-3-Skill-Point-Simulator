import{activeSteps,stepIndex,adjacentStep,openBuildTools}from"../components/shell.js";
import{routeBreakdown,validationIssues,characterSummary,fmt,proficientSkills,expertiseSkills,activeFeatureGroups,spellSources,spellChoice}from"../selectors.js";
import{navigate}from"../router.js";
import{openResponsiveDetail,toast,esc}from"../components/ui.js";

const names={level:"目标等级",route:"逐级职业",progression:"升级节点",abilities:"分配属性",skills:"擅长技能",features:"职业能力",spells:"选择法术"};
const shortHelp={
  level:"你想把角色规划到几级？",
  route:"逐级选择职业。",
  progression:"完成当前升级节点。",
  abilities:"分配创建属性和成长点数。",
  skills:"选择角色擅长的技能。",
  features:"完成职业提供的主动选择。",
  spells:"选择戏法、法术与准备项。"
};

function resultLabel(build,step){
  const issues=validationIssues(build).filter(x=>x.step===step).length;
  if(step==="skills")return`熟练 ${proficientSkills(build).size} · 专精 ${expertiseSkills(build).size}${issues?` · 还差 ${issues}`:""}`;
  if(step==="features"){const groups=activeFeatureGroups(build);return`已选 ${groups.reduce((n,g)=>n+g.selected.length,0)} 项${issues?` · 还差 ${issues}`:""}`}
  if(step==="spells"){let selected=0,prepared=0;for(const source of spellSources(build)){const choice=spellChoice(build,source.key);selected+=choice.cantrips.length+choice.spells.length;prepared+=choice.prepared.length}return`已选 ${selected} · 已准备 ${prepared}${issues?` · 还差 ${issues}`:""}`}
  const summary=characterSummary(build);
  if(step==="abilities")return`生命 ${summary.hp} · 护甲 ${summary.ac} · 先攻 ${fmt(summary.initiative)}`;
  return`${build.targetLevel}级 · ${routeBreakdown(build)}${issues?` · 还差 ${issues}`:""}`;
}

function statusText(build,key,index,current){
  const issues=validationIssues(build).filter(x=>x.step===key).length;
  if(index<current&&!issues)return"已完成";
  if(index===current)return issues?`还差 ${issues} 项`:"当前步骤";
  return issues?`还差 ${issues} 项`:"稍后设置";
}

export function mobileShell(build,step,content,{title=names[step],subtitle=shortHelp[step],progress="",result=""}={}){
  const steps=activeSteps(build),idx=stepIndex(build,step),isLast=idx===steps.length-1;
  return`<div class="mobile-app-shell">
    <div class="mobile-scene-bg" aria-hidden="true"></div>
    <header class="mobile-app-header">
      <button class="mobile-icon-button" data-mobile-home aria-label="返回首页">‹</button>
      <button class="mobile-step-status" data-mobile-steps>
        <span>${String(idx+1).padStart(2,"0")} / ${String(steps.length).padStart(2,"0")}</span>
        <b>${esc(title)}</b>
        <small>${build.targetLevel}级 · ${esc(routeBreakdown(build))}</small>
      </button>
      <button class="mobile-icon-button" data-mobile-more aria-label="更多设置">•••</button>
    </header>
    <main class="mobile-build-main">
      <section class="mobile-task-head">
        <div>
          <span class="mobile-kicker">STEP ${String(idx+1).padStart(2,"0")}</span>
          <h1>${esc(title)}</h1>
          <p>${esc(subtitle)}</p>
        </div>
        ${progress?`<strong>${esc(progress)}</strong>`:""}
      </section>
      ${result?`<button class="mobile-inline-result" data-mobile-character><span>当前结果</span><b>${esc(result)}</b><i>›</i></button>`:""}
      <section class="mobile-build-content" id="mobile-build-content">${content}</section>
    </main>
    <footer class="mobile-actionbar">
      <button class="mobile-secondary-action" data-mobile-back ${idx===0?"disabled":""}>上一步</button>
      <button class="mobile-character-action" data-mobile-character>构筑结果</button>
      <button class="mobile-primary-action" data-mobile-next>${isLast?"查看结果":"下一步"}</button>
    </footer>
  </div>`;
}

export function bindMobileShell(build,step,{beforeNext}={}){
  const steps=activeSteps(build),idx=stepIndex(build,step),isLast=idx===steps.length-1;
  document.querySelector('[data-mobile-home]')?.addEventListener('click',()=>navigate('/home'));
  document.querySelector('[data-mobile-back]')?.addEventListener('click',()=>navigate(`/build/${build.id}/${adjacentStep(build,step,-1)}`));
  document.querySelector('[data-mobile-next]')?.addEventListener('click',()=>{
    const outcome=beforeNext?.();
    if(outcome&&typeof outcome==='object'&&outcome.handled)return;
    if(outcome===false){toast('先完成当前必选项。');return}
    if(isLast)navigate(`/character/${build.id}`);else navigate(`/build/${build.id}/${adjacentStep(build,step,1)}`);
  });
  document.querySelectorAll('[data-mobile-character]').forEach(btn=>btn.addEventListener('click',()=>navigate(`/character/${build.id}`)));
  document.querySelector('[data-mobile-more]')?.addEventListener('click',()=>openBuildTools(build));
  document.querySelector('[data-mobile-steps]')?.addEventListener('click',()=>{
    const close=openResponsiveDetail(`<div class="mobile-step-sheet"><span class="kicker">BUILD STEPS</span><h2>构筑步骤</h2><div class="mobile-step-list">${steps.map(([key],i)=>`<button class="mobile-step-item ${key===step?'active':''}" data-mobile-step="${key}"><span>${String(i+1).padStart(2,'0')}</span><div><b>${esc(names[key]||key)}</b><small>${esc(statusText(build,key,i,idx))}</small></div><i>${key===step?'●':'›'}</i></button>`).join('')}</div></div>`);
    setTimeout(()=>document.querySelectorAll('[data-mobile-step]').forEach(btn=>btn.addEventListener('click',()=>{close?.();navigate(`/build/${build.id}/${btn.dataset.mobileStep}`)})));
  });
}

export{names as mobileStepNames,resultLabel as mobileResultLabel};

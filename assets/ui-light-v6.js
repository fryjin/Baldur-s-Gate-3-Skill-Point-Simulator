(() => {
  'use strict';
  const d = document;
  const body = d.body;
  if (!body || body.dataset.uiLightV6 === 'ready') return;
  body.dataset.uiLightV6 = 'ready';
  body.classList.add('ui-light-v6');

  const $ = (id) => d.getElementById(id);
  const setText = (node, value) => { if (node && node.textContent !== String(value ?? '')) node.textContent = String(value ?? ''); };
  const firstText = (...selectors) => {
    for (const selector of selectors) {
      const node = selector.startsWith('#') ? $(selector.slice(1)) : d.querySelector(selector);
      const value = node?.textContent?.trim();
      if (value) return value;
    }
    return '';
  };
  const numberFrom = (value, fallback = '1') => (String(value || '').match(/\d+/)?.[0] || fallback);

  const currentSteps = [
    ['abilitiesCard', '初始属性', '完成角色创建时的基础属性'],
    ['targetLevelCard', '目标等级', '确定本次构筑要模拟的等级'],
    ['routeCard', '职业路线', '逐级选择职业并形成成长路线'],
    ['progressionCard', '子职业与成长', '处理子职业、专长与属性提升'],
    ['skillsCard', '技能与专精', '选择熟练项并查看当前技能结果'],
    ['classFeaturesCard', '职业能力', '完成战斗风格与职业能力选择'],
    ['spellsCard', '戏法与法术', '从当前可用法术中完成选择'],
    ['resultReviewCard', '最终构筑', '核对结果与剩余选择']
  ];
  const legacySteps = [
    ['basicCard', '角色基础', '设置身份、种族、背景与护甲'],
    ['abilitiesCard', '初始属性', '完成角色创建时的基础属性'],
    ['levelsCard', '职业路线', '逐级安排职业与子职业'],
    ['skillsCard', '技能与专精', '选择熟练项并查看技能结果'],
    ['spellsCard', '戏法与法术', '完成戏法、法术与准备方案'],
    ['featsCard', '专长与成长', '处理专长和属性提升'],
    ['libraryCard', '资料库', '按需查询完整规则资料']
  ];
  const steps = (($('targetLevelCard') || $('routeCard') || $('progressionCard') || $('resultReviewCard')) ? currentSteps : legacySteps).filter(([id]) => $(id));
  let activeId = d.querySelector('.workspace-step-button.active')?.dataset.workspaceStep || steps[0]?.[0] || '';
  let lastFocus = null;
  let scheduled = false;

  const skillInfo = {
    athletics:['运动','力量','攀爬、跳跃、推拉和对抗力量。','⚒'],
    acrobatics:['体操','敏捷','保持平衡、摆脱控制并完成敏捷动作。','◇'],
    sleight:['巧手','敏捷','开锁、解除陷阱与隐蔽操作。','✦'],
    stealth:['隐匿','敏捷','避开视线、潜行并为偷袭创造机会。','◒'],
    arcana:['奥秘','智力','辨识魔法、法术与奥术现象。','✧'],
    history:['历史','智力','回忆历史事件、人物与文明知识。','⌛'],
    investigation:['调查','智力','分析线索并发现隐藏机制。','⌕'],
    nature:['自然','智力','理解野兽、植物和自然环境。','❧'],
    religion:['宗教','智力','辨识神祇、仪式和宗教传统。','✥'],
    animalHandling:['驯兽','感知','安抚、理解和控制动物。','♞'],
    insight:['洞悉','感知','判断动机、情绪与言语真伪。','◉'],
    medicine:['医药','感知','判断伤势、疾病和身体状态。','✚'],
    perception:['察觉','感知','发现环境中的声音、目标和危险。','✺'],
    survival:['求生','感知','追踪、辨路并应对野外环境。','⌁'],
    deception:['欺瞒','魅力','隐藏真实意图并使谎言可信。','◐'],
    intimidation:['威吓','魅力','通过气势和威胁迫使对方让步。','⚑'],
    performance:['表演','魅力','以音乐、表演或仪态影响他人。','♫'],
    persuasion:['游说','魅力','通过沟通、礼仪和论证说服他人。','☙']
  };
  const skillNameInfo = Object.fromEntries(Object.entries(skillInfo).map(([key, value]) => [value[0], [key, ...value]]));

  function ensureTopbar() {
    let header = $('codexCommand') || d.querySelector('.codex-command');
    if (!header) {
      header = d.createElement('header');
      header.className = 'v6-generated-topbar';
      header.innerHTML = `
        <div class="command-brand"><div class="command-brand-copy"><span class="command-kicker">ADVENTURER'S CODEX</span><h1>博德之门 3 · 构筑规划器</h1></div></div>
        <div class="command-build"><div class="command-build-copy"><span>当前构筑</span><strong id="v6GeneratedName">未命名角色</strong><small id="v6GeneratedRoute">等待规划</small></div></div>
        <div class="command-actions"><button type="button" class="btn primary" id="v6GeneratedSheet">查看角色纸</button></div>`;
      const app = d.querySelector('.app');
      app?.insertBefore(header, app.firstChild);
    }
    if (!header.querySelector('.v6-level-medallion')) {
      const badge = d.createElement('div');
      badge.className = 'v6-level-medallion';
      badge.innerHTML = '<b>1</b><span>当前等级</span>';
      header.insertBefore(badge, header.firstElementChild);
    }
    header.querySelector('#v6GeneratedSheet')?.addEventListener('click', openSheet);
  }

  function ensureStepRail() {
    let rail = $('workspaceStepRail') || d.querySelector('.workspace-step-rail');
    if (!rail) {
      rail = d.createElement('aside');
      rail.className = 'v6-generated-step-rail';
      rail.id = 'v6GeneratedStepRail';
      rail.innerHTML = `<nav class="workspace-step-list">${steps.map(([id, title], index) => `
        <button type="button" class="v6-step-button ${id === activeId ? 'active' : ''}" data-workspace-step="${id}">
          <span class="v6-step-index">${String(index + 1).padStart(2, '0')}</span>
          <span class="v6-step-copy"><strong>${title}</strong><small>等待设置</small></span><span class="v6-step-badge"></span>
        </button>`).join('')}</nav>`;
      d.querySelector('.layout')?.insertBefore(rail, d.querySelector('.layout')?.firstChild || null);
    }
    rail.querySelectorAll('[data-workspace-step]').forEach((button) => {
      if (button.dataset.v6Bound) return;
      button.dataset.v6Bound = 'true';
      button.addEventListener('click', () => activateStep(button.dataset.workspaceStep, true));
    });
  }

  function ensureContext() {
    let context = $('decisionContext') || d.querySelector('.decision-context');
    if (!context) {
      context = d.createElement('section');
      context.className = 'v6-generated-context';
      context.id = 'v6GeneratedContext';
      context.innerHTML = `<div><span class="v6-context-kicker">CURRENT DECISION</span><h2></h2><p></p></div><span class="v6-context-count"></span>`;
      d.querySelector('.main-stack')?.insertBefore(context, d.querySelector('.main-stack')?.firstChild || null);
    }
  }

  function ensureFooter() {
    if (d.querySelector('.v6-footer')) return;
    const footer = d.createElement('div');
    footer.className = 'v6-footer';
    footer.innerHTML = `<button type="button" class="v6-prev">返回上一步</button><button type="button" class="v6-footer-copy"><span>当前步骤</span><b>准备开始</b></button><button type="button" class="v6-next">确认并继续</button>`;
    body.appendChild(footer);
    footer.querySelector('.v6-prev').addEventListener('click', () => navigate(-1));
    footer.querySelector('.v6-next').addEventListener('click', () => navigate(1));
    footer.querySelector('.v6-footer-copy').addEventListener('click', openSheet);
  }

  function ensureSheetControls() {
    if (!d.querySelector('.v6-sheet-backdrop')) {
      const backdrop = d.createElement('div');
      backdrop.className = 'v6-sheet-backdrop';
      backdrop.addEventListener('click', closeSheet);
      body.appendChild(backdrop);
    }
    if (!d.querySelector('.v6-sheet-close')) {
      const close = d.createElement('button');
      close.type = 'button'; close.className = 'v6-sheet-close'; close.setAttribute('aria-label', '关闭角色纸'); close.textContent = '×';
      close.addEventListener('click', closeSheet); body.appendChild(close);
    }
  }

  function ensureMiniSheet() {
    const side = d.querySelector('.side-stack');
    if (!side || side.querySelector('.v6-mini-sheet')) return;
    const sheet = d.createElement('section');
    sheet.className = 'v6-mini-sheet';
    sheet.innerHTML = `
      <div class="v6-mini-identity"><span class="v6-mini-kicker">CURRENT BUILD</span><div class="v6-mini-level"><b data-v6="level">1</b><span>级角色</span></div><div class="v6-mini-route" data-v6="route">等待规划</div><div class="v6-mini-race" data-v6="race"></div></div>
      <div class="v6-mini-abilities" data-v6="abilities"></div>
      <div class="v6-mini-stats"><div class="v6-mini-stat"><span>生命</span><b data-v6="hp">—</b></div><div class="v6-mini-stat"><span>护甲</span><b data-v6="ac">—</b></div><div class="v6-mini-stat"><span>先攻</span><b data-v6="initiative">—</b></div><div class="v6-mini-stat"><span>法术 DC</span><b data-v6="dc">—</b></div></div>
      <div class="v6-mini-impact"><strong>当前选择的影响</strong><span data-v6="impact">选择一个选项后，这里会显示关键结果。</span><button type="button" class="v6-sheet-button">查看完整角色纸</button></div>`;
    side.insertBefore(sheet, side.firstChild);
    sheet.querySelector('.v6-sheet-button').addEventListener('click', openSheet);
  }

  function openSheet(event) {
    lastFocus = event?.currentTarget || d.activeElement;
    body.classList.add('v6-sheet-open');
    d.querySelector('.v6-sheet-close')?.focus();
  }
  function closeSheet() {
    body.classList.remove('v6-sheet-open');
    lastFocus?.focus?.();
  }

  function cardFor(id) { return $(id); }
  function stepIndex() { return Math.max(0, steps.findIndex(([id]) => id === activeId)); }

  function activateStep(id, scroll = false) {
    if (!cardFor(id)) return;
    activeId = id;
    steps.forEach(([stepId]) => cardFor(stepId)?.classList.toggle('v6-active-card', stepId === id));
    d.querySelectorAll('[data-workspace-step]').forEach((button) => button.classList.toggle('active', button.dataset.workspaceStep === id));
    updateContext();
    updateFooter();
    if (id === 'skillsCard') enhanceSkills();
    if (id === 'spellsCard') enhanceSpells();
    if (scroll) d.querySelector('.main-stack')?.scrollTo?.({ top: 0, behavior: 'smooth' });
  }

  function navigate(direction) {
    const index = stepIndex();
    const next = Math.max(0, Math.min(steps.length - 1, index + direction));
    if (next !== index) activateStep(steps[next][0], true);
  }

  function updateContext() {
    const entry = steps.find(([id]) => id === activeId) || steps[0];
    if (!entry) return;
    const [, title, desc] = entry;
    const context = $('decisionContext') || $('v6GeneratedContext');
    if (!context) return;
    const header = cardFor(activeId)?.querySelector('.card-header');
    const sourceTitle = header?.querySelector('h2')?.textContent?.trim() || title;
    const sourceDesc = header?.querySelector('.subtle')?.textContent?.trim() || desc;
    const titleNode = context.querySelector('h2');
    const descNode = context.querySelector('p');
    setText(titleNode, sourceTitle); setText(descNode, sourceDesc);
    const kicker = context.querySelector('.decision-overline,.v6-context-kicker');
    setText(kicker, `STEP ${String(stepIndex() + 1).padStart(2, '0')} · ${title}`);
    const count = context.querySelector('.v6-context-count');
    if (count) setText(count, pendingTextFor(activeId));
  }

  function pendingTextFor(id) {
    const button = d.querySelector(`[data-workspace-step="${id}"]`);
    const status = button?.querySelector('small')?.textContent?.trim() || '';
    if (button?.classList.contains('is-complete')) return '已确认';
    if (/\d+\s*\/\s*\d+/.test(status)) return status;
    if (/待|未|剩余|选择/.test(status)) return status.slice(0, 12);
    return stepIndex() === steps.findIndex(([stepId]) => stepId === id) ? '当前选择' : '';
  }

  function updateFooter() {
    const footer = d.querySelector('.v6-footer');
    if (!footer) return;
    const index = stepIndex();
    const title = steps[index]?.[1] || '构筑';
    const completion = firstText('#decisionCompletion') || pendingTextFor(activeId) || '等待选择';
    setText(footer.querySelector('.v6-footer-copy span'), `${String(index + 1).padStart(2, '0')} / ${String(steps.length).padStart(2, '0')} · ${title}`);
    setText(footer.querySelector('.v6-footer-copy b'), completion);
    footer.querySelector('.v6-prev').disabled = index === 0;
    footer.querySelector('.v6-next').disabled = index === steps.length - 1;
    setText(footer.querySelector('.v6-next'), index === steps.length - 2 ? '查看最终构筑' : '确认并继续');
  }

  function decorateSkillButtons() {
    d.querySelectorAll('.skill-choice').forEach((button) => {
      const key = button.dataset.skill;
      const name = button.textContent.trim().replace(/^✓\s*/, '');
      const info = (key && skillInfo[key]) || skillNameInfo[name]?.slice(1);
      if (info) button.dataset.v6Icon = info[3] || '✦';
    });
  }

  function createDetailPane(kind) {
    const pane = d.createElement('aside');
    pane.className = 'v6-detail-pane';
    pane.dataset.v6Detail = kind;
    pane.innerHTML = `<button type="button" class="v6-detail-close" aria-label="关闭详情">×</button><div class="v6-detail-empty">选择一个${kind === 'spell' ? '法术' : '技能'}，在这里查看核心效果与当前结果。</div>`;
    pane.querySelector('.v6-detail-close').addEventListener('click', () => pane.classList.remove('v6-mobile-open'));
    return pane;
  }

  function ensureChoiceLayout(cardId, kind, nodes) {
    const card = $(cardId), bodyNode = card?.querySelector(':scope > .card-body');
    if (!bodyNode) return null;
    let layout = bodyNode.querySelector(':scope > .v6-choice-layout');
    if (!layout) {
      layout = d.createElement('div'); layout.className = 'v6-choice-layout';
      const list = d.createElement('div'); list.className = 'v6-choice-list';
      const pane = createDetailPane(kind);
      nodes.filter(Boolean).forEach((node) => list.appendChild(node));
      layout.append(list, pane); bodyNode.appendChild(layout);
    }
    return layout;
  }

  function skillBonus(name) {
    const rows = [...d.querySelectorAll('#skillsOverview .skill-result')];
    const row = rows.find((item) => item.querySelector('strong')?.textContent?.trim() === name);
    return row?.querySelector('.skill-result-bonus')?.textContent?.trim() || '—';
  }

  function showSkillDetail(button) {
    const pane = d.querySelector('[data-v6-detail="skill"]');
    if (!pane) return;
    const key = button.dataset.skill;
    const name = button.textContent.trim().replace(/^✓\s*/, '');
    const raw = (key && skillInfo[key]) || skillNameInfo[name]?.slice(1) || [name, '关联属性', '选择该技能后查看当前效果。', '✦'];
    const selected = button.classList.contains('selected');
    pane.innerHTML = `<button type="button" class="v6-detail-close" aria-label="关闭详情">×</button>
      <span class="v6-detail-eyebrow">SKILL</span><h3 class="v6-detail-title">${raw[0]}</h3><div class="v6-detail-subtitle">${raw[1]}技能 · ${selected ? '当前已熟练' : '当前未选择'}</div>
      <div class="v6-detail-copy">${raw[2]}</div><div class="v6-detail-stats"><div class="v6-detail-stat"><span>关联属性</span><b>${raw[1]}</b></div><div class="v6-detail-stat"><span>当前加值</span><b>${skillBonus(raw[0])}</b></div></div>`;
    pane.querySelector('.v6-detail-close').addEventListener('click', () => pane.classList.remove('v6-mobile-open'));
    if (matchMedia('(max-width:900px)').matches) pane.classList.add('v6-mobile-open');
  }

  function enhanceSkills() {
    const sources = $('skillSources'), overview = $('skillsOverview');
    const layout = ensureChoiceLayout('skillsCard', 'skill', [sources, overview]);
    if (!layout) return;
    decorateSkillButtons();
    layout.querySelectorAll('.skill-choice').forEach((button) => {
      if (button.dataset.v6DetailBound) return;
      button.dataset.v6DetailBound = 'true';
      button.addEventListener('click', () => setTimeout(() => {
        decorateSkillButtons();
        const key = button.dataset.skill;
        const fresh = key ? d.querySelector(`.skill-choice[data-skill="${CSS.escape(key)}"]`) : button;
        showSkillDetail(fresh || button);
      }, 40));
      button.addEventListener('mouseenter', () => { if (!matchMedia('(max-width:900px)').matches) showSkillDetail(button); });
    });
  }

  function spellDetailFromCard(card) {
    if (!card) return;
    const pane = d.querySelector('[data-v6-detail="spell"]');
    if (!pane) return;
    const name = card.querySelector('.spell-name')?.textContent?.trim() || '法术';
    const en = card.querySelector('.spell-en')?.textContent?.trim() || '';
    const img = card.querySelector('.spell-thumb')?.getAttribute('src') || '';
    const tags = [...card.querySelectorAll('.spell-tag')].map((tag) => tag.textContent.trim()).filter(Boolean);
    const desc = card.querySelector('.spell-desc')?.childNodes?.[0]?.textContent?.trim() || card.querySelector('.spell-desc')?.textContent?.trim() || '选择该法术后查看其核心效果。';
    const selected = card.classList.contains('selected');
    pane.innerHTML = `<button type="button" class="v6-detail-close" aria-label="关闭详情">×</button><span class="v6-detail-eyebrow">SPELL</span><h3 class="v6-detail-title">${name}</h3><div class="v6-detail-subtitle">${en}${selected ? ' · 当前已选择' : ''}</div>${img ? `<img class="v6-detail-icon" src="${img}" alt="">` : ''}<div class="v6-detail-copy">${desc}</div><div class="v6-detail-stats">${tags.slice(0, 6).map((tag, index) => `<div class="v6-detail-stat"><span>${['类型','学派','动作','状态','参数','标签'][index] || '信息'}</span><b>${tag}</b></div>`).join('')}</div>`;
    pane.querySelector('.v6-detail-close').addEventListener('click', () => pane.classList.remove('v6-mobile-open'));
    if (matchMedia('(max-width:900px)').matches) pane.classList.add('v6-mobile-open');
  }

  function bindSpellCards() {
    d.querySelectorAll('#spellsCard .spell-card').forEach((card) => {
      if (card.dataset.v6DetailBound) return;
      card.dataset.v6DetailBound = 'true';
      card.addEventListener('click', () => setTimeout(() => {
        const key = card.querySelector('[data-spell]')?.dataset.spell;
        const fresh = key ? d.querySelector(`#spellsCard .spell-card [data-spell="${CSS.escape(key)}"]`)?.closest('.spell-card') : card;
        spellDetailFromCard(fresh || card);
      }, 50));
      card.addEventListener('mouseenter', () => { if (!matchMedia('(max-width:900px)').matches) spellDetailFromCard(card); });
    });
  }

  function enhanceSpells() {
    const overview = $('spellOverview'), tabs = $('spellSourceTabs'), planner = $('spellPlanner');
    const layout = ensureChoiceLayout('spellsCard', 'spell', [overview, tabs, planner]);
    if (!layout) return;
    bindSpellCards();
    const first = d.querySelector('#spellsCard .spell-card.selected') || d.querySelector('#spellsCard .spell-card');
    const pane = layout.querySelector('[data-v6-detail="spell"]');
    if (first && pane?.querySelector('.v6-detail-empty')) spellDetailFromCard(first);
  }

  function abilityValues() {
    const values = [];
    d.querySelectorAll('#finalAbilities .final-row').forEach((row) => {
      values.push([row.querySelector('.name')?.textContent?.trim() || '', row.querySelector('.final-score')?.textContent?.trim() || '—']);
    });
    if (!values.length) {
      d.querySelectorAll('#finalBuildResult .result-ability,#finalBuildResult .result-stat').forEach((row) => {
        const label = row.querySelector('span,strong')?.textContent?.trim();
        const score = row.querySelector('b')?.textContent?.trim();
        if (/力量|敏捷|体质|智力|感知|魅力/.test(label || '') && score) values.push([label, score]);
      });
    }
    return values.slice(0, 6);
  }

  function updateMiniSheet() {
    const sheet = d.querySelector('.v6-mini-sheet');
    const level = numberFrom(firstText('#targetLevelValue', '#resultSheetLevel', '#totalLevel', '#railLevel', '#headerLevelLabel'));
    const route = firstText('#headerBuildRoute', '#resultSheetRoute', '#classBreakdown', '#railClass') || '等待规划';
    const identity = firstText('#summaryIdentity');
    setText(d.querySelector('.v6-level-medallion b'), level);
    setText(sheet?.querySelector('[data-v6="level"]'), level);
    setText(sheet?.querySelector('[data-v6="route"]'), route);
    setText(sheet?.querySelector('[data-v6="race"]'), identity.split('·').slice(0, 2).join(' · '));
    setText(sheet?.querySelector('[data-v6="hp"]'), firstText('#hpValue', '[data-live-copy="hpValue"]') || '—');
    setText(sheet?.querySelector('[data-v6="ac"]'), firstText('#acValue', '[data-live-copy="acValue"]') || '—');
    setText(sheet?.querySelector('[data-v6="initiative"]'), firstText('#initiativeValue', '[data-live-copy="initiativeValue"]') || '—');
    setText(sheet?.querySelector('[data-v6="dc"]'), firstText('#spellDC', '[data-live-copy="spellDC"]') || '—');
    setText(sheet?.querySelector('[data-v6="impact"]'), firstText('#resultImpactNote', '#decisionDescription') || steps[stepIndex()]?.[2] || '当前选择会同步更新最终结果。');
    const abilityContainer = sheet?.querySelector('[data-v6="abilities"]');
    const values = abilityValues();
    const html = (values.length ? values : [['力量','—'],['敏捷','—'],['体质','—'],['智力','—'],['感知','—'],['魅力','—']]).map(([name, score]) => `<div class="v6-mini-ability"><span>${name.slice(0,1)}</span><b>${score}</b></div>`).join('');
    if (abilityContainer && abilityContainer.innerHTML !== html) abilityContainer.innerHTML = html;
    setText($('v6GeneratedName'), firstText('#characterName', '#summaryName', '#headerBuildName') || '未命名角色');
    setText($('v6GeneratedRoute'), route);
  }

  function updateStepBadges() {
    d.querySelectorAll('[data-workspace-step]').forEach((button) => {
      const small = button.querySelector('small');
      const text = small?.textContent?.trim() || '';
      const badge = button.querySelector('.v6-step-badge');
      if (!badge) return;
      const match = text.match(/(\d+)\s*\/\s*(\d+)/);
      const pending = match ? Math.max(0, Number(match[2]) - Number(match[1])) : 0;
      setText(badge, button.classList.contains('is-complete') ? '✓' : pending ? pending : '');
    });
  }

  function refreshEnhancements() {
    if (activeId === 'skillsCard' || $('skillsCard')) enhanceSkills();
    if (activeId === 'spellsCard' || $('spellsCard')) enhanceSpells();
    decorateSkillButtons(); bindSpellCards(); updateMiniSheet(); updateStepBadges(); updateContext(); updateFooter();
  }

  function scheduleRefresh() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; refreshEnhancements(); });
  }

  function bindGlobal() {
    d.addEventListener('click', (event) => {
      const step = event.target.closest('[data-workspace-step]');
      if (step) setTimeout(() => activateStep(step.dataset.workspaceStep), 0);
      if (event.target.closest('[data-side-view-trigger="result"]')) openSheet(event);
      if (event.target.closest('.result-drawer-close')) closeSheet();
      if (event.target.closest('#skillsCard,#spellsCard,#progressionCard,#classFeaturesCard,#abilitiesCard,#routeCard,#levelsCard,#featsCard')) setTimeout(scheduleRefresh, 60);
    }, true);
    d.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeSheet();
      if ((event.ctrlKey || event.metaKey) && event.key === 'ArrowLeft') { event.preventDefault(); navigate(-1); }
      if ((event.ctrlKey || event.metaKey) && event.key === 'ArrowRight') { event.preventDefault(); navigate(1); }
    });
    const observer = new MutationObserver(scheduleRefresh);
    observer.observe(d.querySelector('.app') || body, { subtree:true, childList:true, characterData:true, attributes:true, attributeFilter:['class','value'] });
  }

  function init() {
    ensureTopbar(); ensureStepRail(); ensureContext(); ensureFooter(); ensureSheetControls(); ensureMiniSheet();
    steps.forEach(([id]) => $(id)?.classList.remove('v6-active-card'));
    if (!steps.some(([id]) => id === activeId)) activeId = steps[0]?.[0] || '';
    activateStep(activeId);
    enhanceSkills(); enhanceSpells(); bindGlobal(); updateMiniSheet(); updateStepBadges();
    setTimeout(scheduleRefresh, 250); setTimeout(scheduleRefresh, 900);
  }

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', init, { once:true }); else init();
})();

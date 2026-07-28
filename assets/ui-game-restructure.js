(() => {
  'use strict';

  const doc = document;
  const body = doc.body;
  if (!body || body.dataset.uiGameRestructureReady === 'true') return;
  body.dataset.uiGameRestructureReady = 'true';
  body.dataset.uiGameRestructureVersion = '5';
  body.classList.add('ui-game-restructure', 'ui-focus-mode');

  const $ = (id) => doc.getElementById(id);
  const stepButtons = () => [...doc.querySelectorAll('.workspace-step-button[data-workspace-step]')];
  const decisionCards = () => [...doc.querySelectorAll('.main-stack > section.card, .main-stack > section.library-card')];
  const safeText = (node) => node?.textContent?.replace(/\s+/g, ' ').trim() || '';
  const setText = (node, value) => {
    if (node && node.textContent !== String(value)) node.textContent = String(value);
  };
  const setAttr = (node, name, value) => {
    if (!node) return;
    if (value === null || value === undefined || value === false) {
      if (node.hasAttribute(name)) node.removeAttribute(name);
      return;
    }
    if (node.getAttribute(name) !== String(value)) node.setAttribute(name, String(value));
  };

  let syncQueued = false;
  let lastFocusedBeforeSheet = null;
  const previousDashboardStats = new Map();
  function queueSync() {
    if (syncQueued) return;
    syncQueued = true;
    requestAnimationFrame(() => {
      syncQueued = false;
      syncChrome();
    });
  }

  function textOf(...ids) {
    for (const id of ids) {
      const value = safeText($(id));
      if (value) return value;
    }
    return '';
  }

  function currentLevel() {
    const raw = textOf('targetLevelValue', 'railLevel', 'headerLevelLabel');
    const match = raw.match(/\d+/);
    return match ? match[0] : '1';
  }

  function addLevelMedallion() {
    const header = $('codexCommand');
    if (!header || header.querySelector('.ui-game-level')) return;
    const medallion = doc.createElement('div');
    medallion.className = 'ui-game-level';
    medallion.setAttribute('aria-label', '当前角色等级');
    medallion.innerHTML = `<b>${currentLevel()}</b><span>当前等级</span>`;
    header.insertBefore(medallion, header.firstElementChild);
  }

  function addFocusToggle() {
    const actions = doc.querySelector('.command-actions');
    if (!actions || actions.querySelector('.ui-focus-toggle')) return;
    const button = doc.createElement('button');
    button.type = 'button';
    button.className = 'btn ui-focus-toggle';
    button.setAttribute('aria-pressed', 'true');
    button.textContent = '专注模式';
    button.addEventListener('click', () => {
      const focus = body.classList.toggle('ui-focus-mode');
      setAttr(button, 'aria-pressed', focus);
      setText(button, focus ? '专注模式' : '完整信息');
      queueSync();
    });
    actions.insertBefore(button, actions.firstElementChild);
  }

  const secondarySelectors = [
    '.ability-impact-panel', '.ability-progression-note', '.rule-diagnostics-panel',
    '.route-logic-note', '.spell-restriction-note', '.review-library', '.progression-panel'
  ].join(',');

  function addCardDetailToggles() {
    decisionCards().forEach((card) => {
      if (card.dataset.uiDetailToggle === 'true' || !card.querySelector(secondarySelectors)) return;
      const header = card.querySelector('.card-header');
      if (!header) return;
      card.dataset.uiDetailToggle = 'true';
      const button = doc.createElement('button');
      button.type = 'button';
      button.className = 'ui-card-details-toggle';
      button.setAttribute('aria-pressed', 'false');
      button.textContent = '查看详细规则';
      button.addEventListener('click', () => {
        const expanded = card.classList.toggle('ui-show-card-details');
        setAttr(button, 'aria-pressed', expanded);
        setText(button, expanded ? '收起详细规则' : '查看详细规则');
      });
      header.appendChild(button);
    });
  }

  function activeStepIndex() {
    const steps = stepButtons();
    const index = steps.findIndex((button) => button.classList.contains('active'));
    return index >= 0 ? index : 0;
  }

  function markActiveCard() {
    const steps = stepButtons();
    if (!steps.length) return;
    const active = steps[activeStepIndex()] || steps[0];
    const targetId = active.dataset.workspaceStep;
    decisionCards().forEach((card) => card.classList.toggle('ui-active-card', card.id === targetId));
  }

  function scrollDecisionTop() {
    const context = $('decisionContext');
    if (context) context.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function createFooter() {
    if (doc.querySelector('.ui-game-footer')) return;
    const footer = doc.createElement('div');
    footer.className = 'ui-game-footer';
    footer.innerHTML = `
      <button type="button" class="ui-prev" aria-label="上一步">上一步</button>
      <button type="button" class="ui-footer-status" aria-label="打开当前角色纸">
        <span>当前步骤</span><b>准备构筑</b><small>点击查看角色纸</small>
      </button>
      <button type="button" class="ui-next" aria-label="下一步">确认并继续</button>
    `;
    body.appendChild(footer);
    footer.querySelector('.ui-prev').addEventListener('click', () => navigate(-1));
    footer.querySelector('.ui-next').addEventListener('click', () => navigate(1));
    footer.querySelector('.ui-footer-status').addEventListener('click', openCharacterSheet);
  }

  function openCharacterSheet() {
    lastFocusedBeforeSheet = doc.activeElement instanceof HTMLElement ? doc.activeElement : null;
    const trigger = doc.querySelector('[data-side-view-trigger="result"]');
    if (trigger) {
      trigger.click();
      window.setTimeout(() => {
        const panel = $('workspaceResultPanel');
        const backdrop = doc.querySelector('.workspace-backdrop');
        if (window.matchMedia('(max-width: 900px)').matches && panel && !panel.classList.contains('drawer-open')) {
          panel.classList.add('drawer-open');
          backdrop?.classList.add('show');
        }
        if (panel?.classList.contains('drawer-open')) {
          body.classList.add('ui-sheet-open');
          window.setTimeout(() => panel.querySelector('.ui-mobile-sheet-handle')?.focus({ preventScroll: true }), 30);
        }
        queueSync();
      }, 0);
      return;
    }
    const panel = $('workspaceResultPanel');
    const backdrop = doc.querySelector('.workspace-backdrop');
    panel?.classList.add('drawer-open');
    backdrop?.classList.add('show');
    body.classList.add('ui-sheet-open');
    queueSync();
  }

  function navigate(direction) {
    const steps = stepButtons();
    const index = activeStepIndex();
    const next = Math.max(0, Math.min(steps.length - 1, index + direction));
    if (next === index) return;
    steps[next].click();
    queueSync();
    scrollDecisionTop();
  }

  function syncFooter() {
    const footer = doc.querySelector('.ui-game-footer');
    const steps = stepButtons();
    if (!footer || !steps.length) return;
    const index = activeStepIndex();
    const active = steps[index];
    const title = safeText(active.querySelector('strong')) || `步骤 ${index + 1}`;
    const completion = textOf('decisionCompletion') || safeText(active.querySelector('small')) || '等待选择';
    setText(footer.querySelector('.ui-footer-status span'), `${String(index + 1).padStart(2, '0')} / ${String(steps.length).padStart(2, '0')} · ${title}`);
    setText(footer.querySelector('.ui-footer-status b'), completion);
    footer.querySelector('.ui-prev').disabled = index === 0;
    footer.querySelector('.ui-next').disabled = index === steps.length - 1;
    setText(footer.querySelector('.ui-next'), index === steps.length - 2 ? '查看最终构筑' : '确认并继续');
  }

  function syncLevel() {
    setText(doc.querySelector('.ui-game-level b'), currentLevel());
  }

  function syncSelectionAccessibility() {
    doc.querySelectorAll('.skill-choice,.subclass-card,.class-choice-option,.feat-card,.spell-card,.spell-option').forEach((element) => {
      const selected = element.classList.contains('selected') || element.classList.contains('active');
      if (element.tagName === 'BUTTON') setAttr(element, 'aria-pressed', selected);
    });
  }

  const abilityDescriptions = {
    str: ['力量', '近战攻击、运动检定与负重能力'],
    dex: ['敏捷', '护甲等级、先攻、远程攻击与潜行'],
    con: ['体质', '生命值与专注检定的核心属性'],
    int: ['智力', '法师施法、奥秘、历史与调查'],
    wis: ['感知', '察觉、洞悉与牧师／德鲁伊施法'],
    cha: ['魅力', '游说、欺瞒、威吓与魅力施法职业']
  };

  function ensureAbilityInspector() {
    const grid = $('abilityGrid');
    if (!grid || $('uiAbilityInspector')) return;
    const panel = doc.createElement('section');
    panel.id = 'uiAbilityInspector';
    panel.className = 'ui-choice-inspector ui-ability-inspector';
    panel.innerHTML = `
      <div class="ui-inspector-mark" aria-hidden="true">属性</div>
      <div class="ui-inspector-copy"><span>当前属性</span><h3>选择一个属性</h3><p>点击属性卡查看当前值和构筑影响。</p></div>
      <div class="ui-inspector-stats"><div><span>点购</span><b>—</b></div><div><span>最终</span><b>—</b></div><div><span>调整值</span><b>—</b></div></div>
    `;
    grid.insertAdjacentElement('afterend', panel);
    grid.addEventListener('click', (event) => {
      if (event.target.closest('.score-btn')) return;
      const ability = event.target.closest('.ability[data-ability]');
      if (!ability) return;
      grid.dataset.uiActiveAbility = ability.dataset.ability || '';
      syncAbilityInspector();
    });
  }

  function syncAbilityInspector() {
    const grid = $('abilityGrid');
    const panel = $('uiAbilityInspector');
    if (!grid || !panel) return;
    const cards = [...grid.querySelectorAll('.ability[data-ability]')];
    if (!cards.length) return;
    let key = grid.dataset.uiActiveAbility;
    let active = cards.find((card) => card.dataset.ability === key);
    if (!active) {
      active = cards.reduce((best, card) => {
        const score = Number(safeText(card.querySelector('.final')) || safeText(card.querySelector('.score')) || 0);
        const bestScore = Number(safeText(best?.querySelector('.final')) || safeText(best?.querySelector('.score')) || -1);
        return score > bestScore ? card : best;
      }, cards[0]);
      key = active.dataset.ability || 'str';
      grid.dataset.uiActiveAbility = key;
    }
    cards.forEach((card) => card.classList.toggle('ui-selected', card === active));
    const [name, description] = abilityDescriptions[key] || [safeText(active.querySelector('.ability-name')) || '属性', '影响角色检定与战斗数值'];
    const pointBuy = safeText(active.querySelector('.score')) || '—';
    const finalValue = safeText(active.querySelector('.final')) || pointBuy;
    const modifier = safeText(active.querySelector('.mod')) || '—';
    const signature = [key, pointBuy, finalValue, modifier].join('|');
    if (panel.dataset.signature === signature) return;
    panel.dataset.signature = signature;
    setText(panel.querySelector('.ui-inspector-mark'), active.querySelector('.ability-code')?.textContent?.trim() || name.slice(0, 1));
    setText(panel.querySelector('h3'), name);
    setText(panel.querySelector('p'), description);
    const values = panel.querySelectorAll('.ui-inspector-stats b');
    setText(values[0], pointBuy);
    setText(values[1], finalValue);
    setText(values[2], modifier);
  }

  function ensureRouteStage() {
    const grid = $('levelGrid');
    if (!grid || $('uiRouteStage')) return;
    const stage = doc.createElement('section');
    stage.id = 'uiRouteStage';
    stage.className = 'ui-route-stage';
    stage.innerHTML = `
      <div class="ui-route-stage-head">
        <div><span>LEVEL PATH</span><h3>角色升级轨迹</h3><p>点击等级节点查看该级职业与解锁内容。</p></div>
        <div class="ui-route-stage-focus"><b>1</b><span>角色等级</span></div>
      </div>
      <div class="ui-route-strip" role="list" aria-label="逐级职业路线"></div>
      <div class="ui-route-inspector"><div><span>当前等级职业</span><h4>战士</h4></div><p>职业 1 级</p><div class="ui-route-unlocks"></div></div>
    `;
    grid.parentElement?.insertBefore(stage, grid);
    stage.querySelector('.ui-route-strip').addEventListener('click', (event) => {
      const button = event.target.closest('[data-ui-route-index]');
      if (!button) return;
      selectRouteLevel(Number(button.dataset.uiRouteIndex));
    });
    grid.addEventListener('click', (event) => {
      const row = event.target.closest('.route-level-row');
      if (!row) return;
      selectRouteLevel([...grid.children].indexOf(row));
    });
    grid.addEventListener('change', () => queueSync());
  }

  function routeRows() {
    return [...($('levelGrid')?.querySelectorAll('.route-level-row') || [])];
  }

  function selectRouteLevel(index) {
    const rows = routeRows();
    if (!rows.length) return;
    const normalized = Math.max(0, Math.min(rows.length - 1, Number.isFinite(index) ? index : 0));
    $('levelGrid').dataset.uiRouteLevel = String(normalized);
    rows[normalized].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    syncRouteStage();
  }

  function syncRouteStage() {
    const stage = $('uiRouteStage');
    const grid = $('levelGrid');
    if (!stage || !grid) return;
    const rows = routeRows();
    if (!rows.length) return;
    let index = Number(grid.dataset.uiRouteLevel || 0);
    if (!Number.isFinite(index) || index < 0 || index >= rows.length) index = Math.max(0, rows.length - 1);
    grid.dataset.uiRouteLevel = String(index);
    const active = rows[index];
    rows.forEach((row, rowIndex) => row.classList.toggle('ui-route-active', rowIndex === index));

    const strip = stage.querySelector('.ui-route-strip');
    const stripSignature = rows.map((row, rowIndex) => {
      const select = row.querySelector('select');
      const className = select?.selectedOptions?.[0]?.textContent?.trim() || safeText(select) || '职业';
      return `${rowIndex + 1}:${className}`;
    }).join('|');
    if (strip.dataset.signature !== stripSignature) {
      strip.dataset.signature = stripSignature;
      strip.innerHTML = rows.map((row, rowIndex) => {
        const select = row.querySelector('select');
        const className = select?.selectedOptions?.[0]?.textContent?.trim() || '职业';
        return `<button type="button" role="listitem" data-ui-route-index="${rowIndex}" title="${rowIndex + 1}级 · ${className}"><b>${rowIndex + 1}</b><span>${className.slice(0, 4)}</span></button>`;
      }).join('');
    }
    [...strip.children].forEach((button, buttonIndex) => button.classList.toggle('active', buttonIndex === index));

    const selected = active.querySelector('select');
    const className = selected?.selectedOptions?.[0]?.textContent?.trim() || '职业';
    const meta = [...active.querySelectorAll('.route-level-meta span')].map(safeText).filter(Boolean);
    setText(stage.querySelector('.ui-route-stage-focus b'), index + 1);
    setText(stage.querySelector('.ui-route-inspector h4'), className);
    setText(stage.querySelector('.ui-route-inspector p'), meta[0] || `${className}职业等级`);
    const unlocks = stage.querySelector('.ui-route-unlocks');
    const unlockSignature = meta.slice(1).join('|');
    if (unlocks.dataset.signature !== unlockSignature) {
      unlocks.dataset.signature = unlockSignature;
      unlocks.innerHTML = meta.length > 1
        ? meta.slice(1).map((item) => `<span>${item}</span>`).join('')
        : '<span class="muted">本级无额外选择节点</span>';
    }
  }

  const skillIconMap = {
    '运动':'⚔','体操':'◇','巧手':'✦','隐匿':'◒','奥秘':'✧','历史':'⌛','调查':'⌕','自然':'❧','宗教':'✥',
    '驯兽':'♞','洞悉':'◉','医药':'✚','察觉':'☼','生存':'⌁','欺瞒':'♠','威吓':'♜','表演':'♪','游说':'❖'
  };
  const skillAbilityMap = {
    '运动':'力量','体操':'敏捷','巧手':'敏捷','隐匿':'敏捷','奥秘':'智力','历史':'智力','调查':'智力','自然':'智力','宗教':'智力',
    '驯兽':'感知','洞悉':'感知','医药':'感知','察觉':'感知','生存':'感知','欺瞒':'魅力','威吓':'魅力','表演':'魅力','游说':'魅力'
  };

  function skillLabel(button) {
    return button.dataset.uiSkillLabel || safeText(button.querySelector('.ui-skill-name')) || safeText(button).replace(/^✓\s*/, '').trim();
  }

  function decorateSkillChoices() {
    doc.querySelectorAll('.skill-choice').forEach((button) => {
      if (button.dataset.uiSkillReady === 'true') return;
      const raw = safeText(button).replace(/^✓\s*/, '').trim();
      const key = Object.keys(skillIconMap).find((name) => raw.includes(name)) || raw;
      button.dataset.uiSkillReady = 'true';
      button.dataset.uiSkillLabel = key;
      button.innerHTML = `<span class="ui-choice-icon" aria-hidden="true">${skillIconMap[key] || '✦'}</span><span class="ui-skill-name">${key}</span><small>${skillAbilityMap[key] || '技能'}</small>`;
    });
  }

  function ensureSkillStage() {
    const card = $('skillsCard');
    const bodyPanel = card?.querySelector('.card-body');
    if (!card || !bodyPanel) return;
    if (!$('uiSkillStage')) {
      const stage = doc.createElement('section');
      stage.id = 'uiSkillStage';
      stage.className = 'ui-skill-stage';
      stage.innerHTML = `
        <div class="ui-stage-heading">
          <div><span>SKILL PROFICIENCIES</span><h3>技能与专精</h3><p>先看来源，再完成当前可选择的熟练与专精。</p></div>
          <div class="ui-stage-count"><b>0</b><span>已选择</span></div>
        </div>
        <div class="ui-skill-loadout"><strong>当前选择</strong><div class="ui-skill-loadout-list"><span>尚未选择技能</span></div></div>
      `;
      bodyPanel.insertBefore(stage, bodyPanel.firstElementChild);
    }
    if (!$('uiSkillInspector')) {
      const inspector = doc.createElement('section');
      inspector.id = 'uiSkillInspector';
      inspector.className = 'ui-choice-inspector ui-skill-inspector';
      inspector.innerHTML = `
        <div class="ui-inspector-mark" aria-hidden="true">✦</div>
        <div class="ui-inspector-copy"><span>技能详情</span><h3>选择一个技能</h3><p>点击技能卡查看对应属性和当前选择状态。</p></div>
        <div class="ui-skill-inspector-meta"></div>
      `;
      bodyPanel.appendChild(inspector);
    }
    if (card.dataset.uiSkillBound !== 'true') {
      card.dataset.uiSkillBound = 'true';
      card.addEventListener('click', (event) => {
        const button = event.target.closest('.skill-choice');
        if (!button) return;
        card.querySelectorAll('.skill-choice.ui-skill-focused').forEach((item) => item.classList.remove('ui-skill-focused'));
        button.classList.add('ui-skill-focused');
        card.dataset.uiFocusedSkill = skillLabel(button);
        queueSync();
      });
    }
  }

  function syncSkillStage() {
    const card = $('skillsCard');
    const stage = $('uiSkillStage');
    const inspector = $('uiSkillInspector');
    if (!card || !stage || !inspector) return;
    decorateSkillChoices();
    const buttons = [...card.querySelectorAll('.skill-choice')];
    const selected = buttons.filter((button) => button.classList.contains('selected') || button.getAttribute('aria-pressed') === 'true');
    setText(stage.querySelector('.ui-stage-count b'), selected.length);
    setText(stage.querySelector('.ui-stage-count span'), selected.length ? '已选择' : '等待选择');
    stage.querySelector('.ui-stage-count').classList.toggle('complete', selected.length > 0);
    const list = stage.querySelector('.ui-skill-loadout-list');
    const signature = selected.map(skillLabel).join('|');
    if (list.dataset.signature !== signature) {
      list.dataset.signature = signature;
      list.innerHTML = selected.length
        ? selected.map((button) => `<button type="button" data-ui-skill-chip="${skillLabel(button)}"><i>${skillIconMap[skillLabel(button)] || '✦'}</i><span>${skillLabel(button)}</span></button>`).join('')
        : '<span>尚未选择技能</span>';
      list.querySelectorAll('[data-ui-skill-chip]').forEach((chip) => chip.addEventListener('click', () => {
        const target = buttons.find((button) => skillLabel(button) === chip.dataset.uiSkillChip);
        target?.focus();
        target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }));
    }
    const focusedName = card.dataset.uiFocusedSkill;
    const focused = buttons.find((button) => skillLabel(button) === focusedName) || selected[0] || buttons[0];
    if (!focused) return;
    const name = skillLabel(focused);
    const isSelected = focused.classList.contains('selected') || focused.getAttribute('aria-pressed') === 'true';
    setText(inspector.querySelector('.ui-inspector-mark'), skillIconMap[name] || '✦');
    setText(inspector.querySelector('h3'), name);
    setText(inspector.querySelector('p'), `${skillAbilityMap[name] || '对应属性'}相关检定；${isSelected ? '当前已加入构筑。' : '当前尚未选择。'}`);
    inspector.querySelector('.ui-skill-inspector-meta').innerHTML = `<span>${skillAbilityMap[name] || '技能'}</span><span class="${isSelected ? 'selected' : ''}">${isSelected ? '已选择' : '未选择'}</span>`;
  }

  function ensureSpellStage() {
    const card = $('spellsCard');
    const planner = $('spellPlanner');
    if (!card || !planner) return;
    if (!$('uiSpellLoadout')) {
      const loadout = doc.createElement('section');
      loadout.id = 'uiSpellLoadout';
      loadout.className = 'ui-spell-loadout';
      loadout.innerHTML = `
        <div class="ui-spell-loadout-head"><div><span>PREPARED LOADOUT</span><h3>当前已选法术</h3></div><b>0</b></div>
        <div class="ui-spell-loadout-list"><p>选择法术后会在这里形成快速预览。</p></div>
      `;
      const tabs = $('spellSourceTabs');
      if (tabs) tabs.insertAdjacentElement('beforebegin', loadout);
      else planner.insertAdjacentElement('beforebegin', loadout);
    }
    if (!card.querySelector('.ui-spell-view-switch')) {
      const header = card.querySelector('.card-header');
      const view = doc.createElement('div');
      view.className = 'ui-spell-view-switch';
      view.innerHTML = '<button type="button" class="active" data-ui-spell-view="icons">图标</button><button type="button" data-ui-spell-view="details">详情</button>';
      view.addEventListener('click', (event) => {
        const button = event.target.closest('[data-ui-spell-view]');
        if (!button) return;
        const detail = button.dataset.uiSpellView === 'details';
        card.classList.toggle('ui-spell-detail-mode', detail);
        view.querySelectorAll('button').forEach((item) => item.classList.toggle('active', item === button));
      });
      header?.appendChild(view);
    }
    if (!$('uiSpellInspector')) {
      const inspector = doc.createElement('section');
      inspector.id = 'uiSpellInspector';
      inspector.className = 'ui-choice-inspector ui-spell-inspector';
      inspector.innerHTML = `
        <div class="ui-inspector-mark" aria-hidden="true">✦</div>
        <div class="ui-inspector-copy"><span>法术详情</span><h3>选择一个法术</h3><p>点击法术卡查看核心效果与使用条件。</p></div>
        <div class="ui-spell-inspector-meta"></div>
      `;
      planner.insertAdjacentElement('afterend', inspector);
    }
    planner.addEventListener('click', (event) => {
      const spell = event.target.closest('.spell-card,.spell-option,[data-spell-id]');
      if (!spell) return;
      planner.querySelectorAll('.ui-spell-focused').forEach((item) => item.classList.remove('ui-spell-focused'));
      spell.classList.add('ui-spell-focused');
      syncSpellInspector(spell);
    });
  }

  function spellCardName(card) {
    return safeText(card.querySelector('.spell-name,strong,h3,h4')) || safeText(card).slice(0, 36) || '法术';
  }

  function syncSpellInspector(card) {
    const panel = $('uiSpellInspector');
    if (!panel || !card) return;
    const name = spellCardName(card);
    const description = safeText(card.querySelector('.spell-quick-desc,p')) || safeText(card.querySelector('details')) || '查看法术的伤害、控制、专注与施法条件。';
    const image = card.querySelector('img');
    const meta = [...card.querySelectorAll('.spell-tag,.tag,.chip,small')].map(safeText).filter(Boolean).slice(0, 5);
    const signature = [name, description, meta.join('|'), image?.src || ''].join('||');
    if (panel.dataset.signature === signature) return;
    panel.dataset.signature = signature;
    setText(panel.querySelector('h3'), name);
    setText(panel.querySelector('p'), description.slice(0, 180));
    const mark = panel.querySelector('.ui-inspector-mark');
    if (image?.src) mark.innerHTML = `<img src="${image.src}" alt="">`;
    else setText(mark, name.slice(0, 1));
    const metaBox = panel.querySelector('.ui-spell-inspector-meta');
    metaBox.innerHTML = meta.length ? meta.map((item) => `<span>${item}</span>`).join('') : '<span>当前可选法术</span>';
  }

  function syncSpellLoadout() {
    const loadout = $('uiSpellLoadout');
    if (!loadout) return;
    const selected = [...doc.querySelectorAll('#spellsCard .spell-card.selected,#spellsCard .spell-option.selected,#spellsCard [data-spell-id].selected')];
    const unique = [];
    const seen = new Set();
    selected.forEach((card) => {
      const name = spellCardName(card);
      if (!name || seen.has(name)) return;
      seen.add(name);
      unique.push({ name, src: card.querySelector('img')?.src || '' });
    });
    const signature = unique.map((item) => `${item.name}:${item.src}`).join('|');
    if (loadout.dataset.signature === signature) return;
    loadout.dataset.signature = signature;
    setText(loadout.querySelector('.ui-spell-loadout-head b'), unique.length);
    const list = loadout.querySelector('.ui-spell-loadout-list');
    list.innerHTML = unique.length
      ? unique.map((item) => `<div class="ui-loadout-spell">${item.src ? `<img src="${item.src}" alt="">` : `<span>${item.name.slice(0, 1)}</span>`}<b>${item.name}</b></div>`).join('')
      : '<p>选择法术后会在这里形成快速预览。</p>';
  }

  const progressionViewLabels = {
    subclass: ['子职业', '选择职业方向并比较定位差异'],
    feats: ['专长与属性提升', '处理由职业自身等级解锁的成长节点']
  };

  function ensureProgressionStage() {
    const card = $('progressionCard');
    const bodyPanel = card?.querySelector('.card-body');
    if (!card || !bodyPanel) return;
    if (!$('uiProgressionStage')) {
      const stage = doc.createElement('section');
      stage.id = 'uiProgressionStage';
      stage.className = 'ui-progression-stage';
      stage.innerHTML = `
        <div class="ui-stage-heading">
          <div><span>GROWTH DECISIONS</span><h3>成长节点</h3><p>先完成职业方向，再处理专长或属性提升。</p></div>
          <div class="ui-stage-count"><b>0</b><span>待确认</span></div>
        </div>
        <div class="ui-segmented-control" role="tablist" aria-label="成长节点视图">
          <button type="button" class="active" data-ui-progression-view="subclass" role="tab" aria-selected="true">子职业</button>
          <button type="button" data-ui-progression-view="feats" role="tab" aria-selected="false">专长节点</button>
        </div>
        <div class="ui-progression-status"><strong>子职业</strong><span>选择职业方向并比较定位差异</span></div>
      `;
      bodyPanel.insertBefore(stage, bodyPanel.firstElementChild);
      card.dataset.uiProgressionView = 'subclass';
      stage.querySelector('.ui-segmented-control').addEventListener('click', (event) => {
        const button = event.target.closest('[data-ui-progression-view]');
        if (!button) return;
        setProgressionView(button.dataset.uiProgressionView || 'subclass');
        queueSync();
      });
    }
    if (!$('uiProgressionInspector')) {
      const inspector = doc.createElement('section');
      inspector.id = 'uiProgressionInspector';
      inspector.className = 'ui-choice-inspector ui-progression-inspector';
      inspector.innerHTML = `
        <div class="ui-inspector-mark" aria-hidden="true">✦</div>
        <div class="ui-inspector-copy"><span>当前成长选择</span><h3>选择一个子职业或专长</h3><p>点击选项后，这里只展示当前项目的关键信息。</p></div>
        <div class="ui-progress-inspector-meta"></div>
      `;
      bodyPanel.appendChild(inspector);
    }
    if (card.dataset.uiProgressionBound !== 'true') {
      card.dataset.uiProgressionBound = 'true';
      card.addEventListener('click', (event) => {
        const option = event.target.closest('.subclass-card,.feat-row,.feat-card,[data-feat]');
        if (!option || event.target.closest('select,input,button') && !event.target.closest('.subclass-card,.feat-card')) return;
        syncProgressionInspector(option);
      });
      card.addEventListener('change', (event) => {
        const row = event.target.closest('.feat-row');
        if (row) syncProgressionInspector(row);
      });
    }
  }

  function setProgressionView(view) {
    const card = $('progressionCard');
    if (!card) return;
    const normalized = view === 'feats' ? 'feats' : 'subclass';
    card.dataset.uiProgressionView = normalized;
    card.querySelectorAll('[data-ui-progression-view]').forEach((button) => {
      const active = button.dataset.uiProgressionView === normalized;
      button.classList.toggle('active', active);
      setAttr(button, 'aria-selected', active);
    });
    const [title, copy] = progressionViewLabels[normalized];
    setText(card.querySelector('.ui-progression-status strong'), title);
    setText(card.querySelector('.ui-progression-status span'), copy);
  }

  function decorateProgressionOptions() {
    const card = $('progressionCard');
    if (!card) return;
    card.querySelectorAll('.subclass-card').forEach((option) => {
      if (option.querySelector('.ui-option-emblem')) return;
      const title = safeText(option.querySelector('strong')) || '子职业';
      const emblem = doc.createElement('span');
      emblem.className = 'ui-option-emblem';
      emblem.textContent = title.slice(0, 1);
      option.prepend(emblem);
    });
    card.querySelectorAll('.feat-row').forEach((row, index) => {
      if (row.querySelector('.ui-feat-node')) return;
      const origin = safeText(row.querySelector('.feat-origin,.source-detail')) || `成长节点 ${index + 1}`;
      const marker = doc.createElement('div');
      marker.className = 'ui-feat-node';
      marker.innerHTML = `<b>${index + 1}</b><span>${origin.replace(/当前等级已解锁/g, '').trim()}</span>`;
      row.prepend(marker);
    });
  }

  function syncProgressionInspector(option) {
    const panel = $('uiProgressionInspector');
    if (!panel || !option) return;
    const title = safeText(option.querySelector('.subclass-card-title strong,.feat-origin,strong,h3,h4,label')) || '成长选择';
    const description = safeText(option.querySelector('.subclass-desc,.feat-note,p,.source-detail')) || '该选择会同步影响最终构筑结果。';
    const meta = [...option.querySelectorAll('.subclass-role,.subclass-meta-row,.feat-origin,option:checked,select')]
      .map((node) => node.tagName === 'SELECT' ? node.selectedOptions?.[0]?.textContent?.trim() : safeText(node))
      .filter(Boolean).slice(0, 5);
    const signature = [title, description, meta.join('|')].join('||');
    if (panel.dataset.signature === signature) return;
    panel.dataset.signature = signature;
    setText(panel.querySelector('.ui-inspector-mark'), title.slice(0, 1));
    setText(panel.querySelector('h3'), title);
    setText(panel.querySelector('p'), description.slice(0, 180));
    panel.querySelector('.ui-progress-inspector-meta').innerHTML = meta.length
      ? meta.map((item) => `<span>${item}</span>`).join('')
      : '<span>成长节点</span>';
  }

  function syncProgressionStage() {
    const card = $('progressionCard');
    const stage = $('uiProgressionStage');
    if (!card || !stage) return;
    decorateProgressionOptions();
    const subclasses = [...card.querySelectorAll('.subclass-card')];
    const feats = [...card.querySelectorAll('.feat-row')];
    const selectedSubclass = subclasses.filter((item) => item.classList.contains('selected')).length;
    const unresolvedSubclass = subclasses.length && !selectedSubclass ? 1 : 0;
    const unresolvedFeats = feats.filter((row) => {
      const select = row.querySelector('select');
      return select && (!select.value || /选择|请选择|未选择/.test(select.selectedOptions?.[0]?.textContent || ''));
    }).length;
    const pending = unresolvedSubclass + unresolvedFeats;
    setText(stage.querySelector('.ui-stage-count b'), pending);
    stage.querySelector('.ui-stage-count').classList.toggle('complete', pending === 0);
    const view = card.dataset.uiProgressionView || (unresolvedSubclass ? 'subclass' : 'feats');
    setProgressionView(view);
    if (!$('uiProgressionInspector')?.dataset.signature) {
      const initial = subclasses.find((item) => item.classList.contains('selected')) || subclasses[0] || feats[0];
      if (initial) syncProgressionInspector(initial);
    }
  }

  function ensureClassFeatureStage() {
    const card = $('classFeaturesCard');
    const bodyPanel = card?.querySelector('.card-body');
    if (!card || !bodyPanel) return;
    if (!$('uiFeatureStage')) {
      const stage = doc.createElement('section');
      stage.id = 'uiFeatureStage';
      stage.className = 'ui-feature-stage';
      stage.innerHTML = `
        <div class="ui-stage-heading">
          <div><span>CLASS FEATURES</span><h3>职业能力选择</h3><p>优先处理需要主动选择的能力，固定获得内容默认收起。</p></div>
          <div class="ui-stage-count"><b>0 / 0</b><span>已完成</span></div>
        </div>
        <div class="ui-feature-summary-strip">
          <div><span>主动选择</span><b data-ui-feature-required>0</b></div>
          <div><span>已确认</span><b data-ui-feature-selected>0</b></div>
          <button type="button" data-ui-auto-features aria-expanded="false"><span>自动获得能力</span><b data-ui-feature-auto>0</b><small>展开查看</small></button>
        </div>
      `;
      bodyPanel.insertBefore(stage, bodyPanel.firstElementChild);
      stage.querySelector('[data-ui-auto-features]').addEventListener('click', (event) => {
        const expanded = card.classList.toggle('ui-show-auto-features');
        setAttr(event.currentTarget, 'aria-expanded', expanded);
        setText(event.currentTarget.querySelector('small'), expanded ? '收起内容' : '展开查看');
      });
    }
    if (!$('uiFeatureInspector')) {
      const inspector = doc.createElement('section');
      inspector.id = 'uiFeatureInspector';
      inspector.className = 'ui-choice-inspector ui-feature-inspector';
      inspector.innerHTML = `
        <div class="ui-inspector-mark" aria-hidden="true">◆</div>
        <div class="ui-inspector-copy"><span>能力详情</span><h3>选择一个职业能力</h3><p>点击战斗风格、战技、超魔或祈唤查看核心效果。</p></div>
        <div class="ui-feature-inspector-meta"></div>
      `;
      bodyPanel.appendChild(inspector);
    }
    if (card.dataset.uiFeatureBound !== 'true') {
      card.dataset.uiFeatureBound = 'true';
      card.addEventListener('click', (event) => {
        const option = event.target.closest('.class-choice-option,.progression-row');
        if (option) syncFeatureInspector(option);
      });
    }
  }

  function decorateFeatureOptions() {
    const card = $('classFeaturesCard');
    if (!card) return;
    card.querySelectorAll('.class-choice-option').forEach((option) => {
      if (option.querySelector('.ui-option-emblem')) return;
      const title = safeText(option.querySelector('strong')) || '能力';
      const emblem = doc.createElement('span');
      emblem.className = 'ui-option-emblem';
      emblem.textContent = title.replace(/^✓\s*/, '').slice(0, 1);
      option.prepend(emblem);
    });
    card.querySelectorAll('.progression-row').forEach((row) => row.classList.add('ui-auto-feature-row'));
  }

  function syncFeatureInspector(option) {
    const panel = $('uiFeatureInspector');
    if (!panel || !option) return;
    const title = safeText(option.querySelector('strong,.progression-class')) || '职业能力';
    const description = safeText(option.querySelector('span:not(.ui-option-emblem),p,.progression-unlocks')) || '该职业能力已由当前职业路线解锁。';
    const meta = [...option.querySelectorAll('.source-detail,.progression-level,.unlock-chip')].map(safeText).filter(Boolean).slice(0, 5);
    const signature = [title, description, meta.join('|')].join('||');
    if (panel.dataset.signature === signature) return;
    panel.dataset.signature = signature;
    setText(panel.querySelector('.ui-inspector-mark'), title.replace(/^✓\s*/, '').slice(0, 1));
    setText(panel.querySelector('h3'), title.replace(/^✓\s*/, ''));
    setText(panel.querySelector('p'), description.slice(0, 180));
    panel.querySelector('.ui-feature-inspector-meta').innerHTML = meta.length
      ? meta.map((item) => `<span>${item}</span>`).join('')
      : '<span>当前职业路线</span>';
  }

  function syncClassFeatureStage() {
    const card = $('classFeaturesCard');
    const stage = $('uiFeatureStage');
    if (!card || !stage) return;
    decorateFeatureOptions();
    const options = [...card.querySelectorAll('.class-choice-option')];
    const selected = options.filter((item) => item.classList.contains('selected')).length;
    const groups = [...card.querySelectorAll('.class-choice-group')];
    let required = groups.reduce((total, group) => {
      const counter = safeText(group.querySelector('.class-choice-title>span'));
      const match = counter.match(/\/\s*(\d+)/);
      return total + (match ? Number(match[1]) : 1);
    }, 0);
    if (!groups.length) required = options.length ? 1 : 0;
    const auto = card.querySelectorAll('.progression-row').length;
    setText(stage.querySelector('[data-ui-feature-required]'), required);
    setText(stage.querySelector('[data-ui-feature-selected]'), selected);
    setText(stage.querySelector('[data-ui-feature-auto]'), auto);
    setText(stage.querySelector('.ui-stage-count b'), `${selected} / ${required}`);
    setText(stage.querySelector('.ui-stage-count span'), required && selected < required ? '待确认' : '已完成');
    stage.querySelector('.ui-stage-count').classList.toggle('complete', !required || selected >= required);
    if (!$('uiFeatureInspector')?.dataset.signature) {
      const initial = options.find((item) => item.classList.contains('selected')) || options[0] || card.querySelector('.progression-row');
      if (initial) syncFeatureInspector(initial);
    }
  }

  const sheetViews = {
    overview: { label: '总览', keywords: /身份|战斗|核心|属性|专长|子职业|职业构成|基础/ },
    abilities: { label: '能力', keywords: /能力|职业特性|被动|资源|行动|专长|子职业/ },
    skills: { label: '技能', keywords: /技能|熟练|专精/ },
    spells: { label: '法术', keywords: /法术|戏法|法术位|准备/ }
  };

  function ensureCharacterSheetLayers() {
    const card = $('resultCard');
    const bodyPanel = card?.querySelector('.card-body');
    if (!card || !bodyPanel) return;
    if (!$('uiCharacterDashboard')) {
      const dashboard = doc.createElement('section');
      dashboard.id = 'uiCharacterDashboard';
      dashboard.className = 'ui-character-dashboard';
      dashboard.innerHTML = `
        <div class="ui-dashboard-identity"><span>当前构筑</span><h3>未命名角色</h3><p>职业路线</p></div>
        <div class="ui-dashboard-level"><b>1</b><span>等级</span></div>
        <div class="ui-dashboard-stats"></div>
        <div class="ui-dashboard-abilities"></div>
      `;
      bodyPanel.insertBefore(dashboard, bodyPanel.firstElementChild);
    }
    if (!card.querySelector('.ui-sheet-tabs')) {
      const tabs = doc.createElement('div');
      tabs.className = 'ui-sheet-tabs';
      tabs.setAttribute('role', 'tablist');
      tabs.setAttribute('aria-label', '角色纸内容');
      tabs.innerHTML = Object.entries(sheetViews).map(([key, item], index) => `<button type="button" data-ui-sheet-view="${key}" class="${index === 0 ? 'active' : ''}" role="tab" aria-selected="${index === 0}">${item.label}</button>`).join('');
      $('uiCharacterDashboard').insertAdjacentElement('afterend', tabs);
      card.dataset.uiSheetView = 'overview';
      tabs.addEventListener('click', (event) => {
        const button = event.target.closest('[data-ui-sheet-view]');
        if (!button) return;
        setCharacterSheetView(button.dataset.uiSheetView || 'overview');
      });
    }
  }

  function setCharacterSheetView(view) {
    const card = $('resultCard');
    if (!card) return;
    const normalized = sheetViews[view] ? view : 'overview';
    card.dataset.uiSheetView = normalized;
    card.querySelectorAll('[data-ui-sheet-view]').forEach((button) => {
      const active = button.dataset.uiSheetView === normalized;
      button.classList.toggle('active', active);
      setAttr(button, 'aria-selected', active);
    });
    classifyCharacterSheetSections();
  }

  function classifyCharacterSheetSections() {
    const card = $('resultCard');
    if (!card) return;
    const view = card.dataset.uiSheetView || 'overview';
    const sections = [...card.querySelectorAll('.card-body > .result-section')];
    sections.forEach((section) => {
      const title = safeText(section.querySelector('h3'));
      let assigned = 'overview';
      if (sheetViews.skills.keywords.test(title)) assigned = 'skills';
      else if (sheetViews.spells.keywords.test(title)) assigned = 'spells';
      else if (sheetViews.abilities.keywords.test(title)) assigned = 'abilities';
      else if (sheetViews.overview.keywords.test(title)) assigned = 'overview';
      section.dataset.uiSheetSection = assigned;
      section.hidden = assigned !== view;
    });
    const hero = card.querySelector('.card-body > .result-hero');
    if (hero) hero.hidden = view !== 'overview';
  }

  function extractResultStats() {
    const live = [...doc.querySelectorAll('#resultCard .result-live-strip > div')].map((item) => ({
      label: safeText(item.querySelector('span')),
      value: safeText(item.querySelector('b'))
    })).filter((item) => item.label || item.value);
    return live;
  }

  function syncCharacterDashboard() {
    const dashboard = $('uiCharacterDashboard');
    const card = $('resultCard');
    if (!dashboard || !card) return;
    const name = textOf('resultSheetName', 'headerBuildName', 'summaryName') || safeText(card.querySelector('.result-hero h3')) || '未命名角色';
    const route = textOf('resultSheetRoute', 'headerBuildRoute', 'classBreakdown') || safeText(card.querySelector('.result-hero p')) || '职业路线';
    const level = currentLevel();
    const stats = extractResultStats();
    const abilities = [...card.querySelectorAll('.result-ability')].slice(0, 6).map(parseAbilityItem);
    const signature = [name, route, level, stats.map((x) => `${x.label}:${x.value}`).join('|'), abilities.map((x) => `${x.name}:${x.score}`).join('|')].join('||');
    if (dashboard.dataset.signature === signature) return;
    dashboard.dataset.signature = signature;
    setText(dashboard.querySelector('.ui-dashboard-identity h3'), name);
    setText(dashboard.querySelector('.ui-dashboard-identity p'), route);
    setText(dashboard.querySelector('.ui-dashboard-level b'), level);
    const visibleStats = stats.filter((item) => !/等级/.test(item.label)).slice(0, 4);
    const statBox = dashboard.querySelector('.ui-dashboard-stats');
    statBox.innerHTML = visibleStats.map((item) => `<div><span>${item.label}</span><b>${item.value || '—'}</b></div>`).join('');
    animateDashboardChanges(statBox, visibleStats);
    dashboard.querySelector('.ui-dashboard-abilities').innerHTML = abilities.length
      ? abilities.map((item) => `<span><i>${item.name}</i><b>${item.score}</b></span>`).join('')
      : '<span class="ui-dashboard-empty">属性结果将在完成初始属性后显示</span>';
  }

  function ensureFinalReviewStage() {
    const card = $('resultReviewCard');
    const bodyPanel = card?.querySelector('.card-body');
    if (!card || !bodyPanel) return;
    if (!$('uiFinalHero')) {
      const hero = doc.createElement('section');
      hero.id = 'uiFinalHero';
      hero.className = 'ui-final-hero';
      hero.innerHTML = `
        <div class="ui-final-level"><b>1</b><span>最终等级</span></div>
        <div class="ui-final-copy"><span>FINAL BUILD</span><h3>未命名角色</h3><p>职业路线</p><div class="ui-final-completion"><i></i><b>0%</b></div></div>
        <div class="ui-final-key-stats"></div>
        <div class="ui-final-actions"><button type="button" data-ui-final-action="pending">处理遗漏</button><button type="button" data-ui-final-action="copy">复制构筑</button><button type="button" data-ui-final-action="export">导出</button></div>
      `;
      bodyPanel.insertBefore(hero, bodyPanel.firstElementChild);
      hero.addEventListener('click', (event) => {
        const button = event.target.closest('[data-ui-final-action]');
        if (!button) return;
        const action = button.dataset.uiFinalAction;
        if (action === 'copy') $('copySummaryBtn')?.click();
        if (action === 'export') $('exportBtn')?.click();
        if (action === 'pending') {
          const trigger = doc.querySelector('[data-side-view-trigger="check"],.result-tab[data-side-view="check"]');
          trigger?.click();
          openCharacterSheet();
        }
      });
    }
    if (!card.querySelector('.ui-final-section-nav')) {
      const nav = doc.createElement('div');
      nav.className = 'ui-final-section-nav';
      nav.innerHTML = `
        <button type="button" data-ui-final-jump="abilitiesCard">属性</button>
        <button type="button" data-ui-final-jump="progressionCard">成长</button>
        <button type="button" data-ui-final-jump="skillsCard">技能</button>
        <button type="button" data-ui-final-jump="classFeaturesCard">能力</button>
        <button type="button" data-ui-final-jump="spellsCard">法术</button>
      `;
      $('uiFinalHero').insertAdjacentElement('afterend', nav);
      nav.addEventListener('click', (event) => {
        const button = event.target.closest('[data-ui-final-jump]');
        if (!button) return;
        jumpToStep(button.dataset.uiFinalJump);
      });
    }
  }

  function syncFinalReviewStage() {
    const hero = $('uiFinalHero');
    if (!hero) return;
    const name = textOf('resultSheetName', 'headerBuildName', 'summaryName') || '未命名角色';
    const route = textOf('resultSheetRoute', 'headerBuildRoute', 'classBreakdown') || '职业路线';
    const level = currentLevel();
    const completionText = textOf('buildCompletionLabel') || '0%';
    const completion = Math.max(0, Math.min(100, Number((completionText.match(/\d+/) || ['0'])[0])));
    const stats = extractResultStats().filter((item) => !/等级/.test(item.label)).slice(0, 4);
    const signature = [name, route, level, completion, stats.map((x) => `${x.label}:${x.value}`).join('|')].join('||');
    if (hero.dataset.signature === signature) return;
    hero.dataset.signature = signature;
    setText(hero.querySelector('.ui-final-level b'), level);
    setText(hero.querySelector('.ui-final-copy h3'), name);
    setText(hero.querySelector('.ui-final-copy p'), route);
    setText(hero.querySelector('.ui-final-completion b'), `${completion}%`);
    hero.querySelector('.ui-final-completion i').style.width = `${completion}%`;
    hero.querySelector('.ui-final-key-stats').innerHTML = stats.map((item) => `<div><span>${item.label}</span><b>${item.value || '—'}</b></div>`).join('');
    hero.classList.toggle('complete', completion >= 100);
  }

  function jumpToStep(targetId) {
    const button = stepButtons().find((item) => item.dataset.workspaceStep === targetId);
    if (!button) return;
    button.click();
    queueSync();
    scrollDecisionTop();
    window.setTimeout(() => {
      const card = $(targetId);
      const focusTarget = card?.querySelector('button:not([disabled]),select:not([disabled]),input:not([disabled]),.card-header');
      if (focusTarget instanceof HTMLElement) {
        if (!focusTarget.hasAttribute('tabindex') && !/^(BUTTON|SELECT|INPUT)$/.test(focusTarget.tagName)) focusTarget.tabIndex = -1;
        focusTarget.focus({ preventScroll: true });
      }
    }, 260);
  }

  const warningStepMap = [
    [/点购|初始属性|创建加值|属性分配/, 'abilitiesCard'],
    [/目标等级|角色等级/, 'targetLevelCard'],
    [/子职业|专长|属性提升|成长节点/, 'progressionCard'],
    [/技能|专精|熟练技能/, 'skillsCard'],
    [/战斗风格|战技|超魔|祈唤|职业能力|契约/, 'classFeaturesCard'],
    [/法术|戏法|准备法术|法术书|法术位/, 'spellsCard'],
    [/逐级职业|职业路线|兼职/, 'routeCard']
  ];

  function decorateWarnings() {
    const box = $('warnings');
    if (!box) return;
    const items = [...box.children].filter((item) => !item.matches('script,style'));
    items.forEach((item) => {
      if (item.dataset.uiWarningReady === 'true') return;
      const text = safeText(item);
      const match = warningStepMap.find(([pattern]) => pattern.test(text));
      if (!match) return;
      item.dataset.uiWarningReady = 'true';
      item.classList.add('ui-actionable-warning');
      const button = doc.createElement('button');
      button.type = 'button';
      button.className = 'ui-warning-jump';
      button.dataset.uiWarningTarget = match[1];
      button.textContent = '前往处理';
      button.addEventListener('click', () => {
        jumpToStep(match[1]);
        const close = $('resultDrawerClose');
        close?.click();
      });
      item.appendChild(button);
    });
  }

  function ensureMobileSheetHandle() {
    const panel = $('workspaceResultPanel');
    if (!panel || panel.querySelector('.ui-mobile-sheet-handle')) return;
    const handle = doc.createElement('button');
    handle.type = 'button';
    handle.className = 'ui-mobile-sheet-handle';
    handle.setAttribute('aria-label', '收起角色纸');
    handle.innerHTML = '<i></i><span>角色纸</span>';
    panel.insertBefore(handle, panel.firstElementChild);
    handle.addEventListener('click', closeCharacterSheet);
    $('resultDrawerClose')?.addEventListener('click', closeCharacterSheet);
    const backdrop = doc.querySelector('.workspace-backdrop');
    backdrop?.addEventListener('click', closeCharacterSheet);
  }

  function closeCharacterSheet() {
    const wasOpen = $('workspaceResultPanel')?.classList.contains('drawer-open');
    $('workspaceResultPanel')?.classList.remove('drawer-open');
    doc.querySelector('.workspace-backdrop')?.classList.remove('show');
    body.classList.remove('ui-sheet-open');
    if (wasOpen && lastFocusedBeforeSheet instanceof HTMLElement) {
      window.setTimeout(() => lastFocusedBeforeSheet?.focus({ preventScroll: true }), 20);
    }
  }

  function syncMobileSheetState() {
    const panel = $('workspaceResultPanel');
    if (!panel) return;
    body.classList.toggle('ui-sheet-open', panel.classList.contains('drawer-open'));
  }

  function syncMobileResultHint() {
    const footer = doc.querySelector('.ui-game-footer');
    if (!footer) return;
    const pending = textOf('railPending');
    const small = footer.querySelector('.ui-footer-status small');
    setText(small, pending && pending !== '0' ? `点击查看角色纸 · 待处理 ${pending}` : '点击查看角色纸');
  }

  function ensureStepPendingBadges() {
    stepButtons().forEach((button) => {
      if (button.querySelector('.ui-step-state')) return;
      const badge = doc.createElement('span');
      badge.className = 'ui-step-state';
      badge.setAttribute('aria-hidden', 'true');
      button.appendChild(badge);
    });
  }

  function stepPendingValue(button) {
    const status = safeText(button.querySelector('small'));
    const direct = status.match(/(?:待处理|待确认|剩余|还需|未完成)\s*(\d+)/);
    if (direct) return Number(direct[1]);
    const fraction = status.match(/(\d+)\s*\/\s*(\d+)/);
    if (fraction) return Math.max(0, Number(fraction[2]) - Number(fraction[1]));
    if (/完成|已分配|已确认|状态摘要/.test(status)) return 0;
    return null;
  }

  function syncStepPendingBadges() {
    ensureStepPendingBadges();
    stepButtons().forEach((button) => {
      const badge = button.querySelector('.ui-step-state');
      const pending = stepPendingValue(button);
      const complete = button.classList.contains('is-complete') || pending === 0;
      button.classList.toggle('ui-has-pending', Number.isFinite(pending) && pending > 0);
      badge.classList.toggle('complete', complete);
      badge.classList.toggle('pending', Number.isFinite(pending) && pending > 0);
      setText(badge, complete ? '✓' : Number.isFinite(pending) && pending > 0 ? String(pending) : '·');
    });
  }

  function parseAbilityItem(item) {
    const name = safeText(item.querySelector('.result-ability-top strong,.result-ability-top span:first-child,.ability-name'));
    const score = safeText(item.querySelector('.result-ability-top b,.score,.final'));
    if (name || score) return { name: name || '属性', score: score || '—' };
    const text = safeText(item);
    const match = text.match(/(力量|敏捷|体质|智力|感知|魅力|STR|DEX|CON|INT|WIS|CHA)\s*([+-]?\d+)?/i);
    return { name: match?.[1] || text.slice(0, 2) || '属性', score: match?.[2] || text.replace(/\D/g, '').slice(0, 2) || '—' };
  }

  function animateDashboardChanges(container, rows) {
    rows.forEach((row, index) => {
      const key = row.label || `stat-${index}`;
      const previous = previousDashboardStats.get(key);
      previousDashboardStats.set(key, row.value);
      if (previous === undefined || previous === row.value) return;
      const node = container.children[index];
      if (!node) return;
      node.classList.remove('ui-stat-changed');
      void node.offsetWidth;
      node.classList.add('ui-stat-changed');
      window.setTimeout(() => node.classList.remove('ui-stat-changed'), 900);
    });
  }

  function bindRovingNavigation(containerSelector, itemSelector) {
    doc.querySelectorAll(containerSelector).forEach((container) => {
      if (container.dataset.uiRovingBound === 'true') return;
      container.dataset.uiRovingBound = 'true';
      container.addEventListener('keydown', (event) => {
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
        const items = [...container.querySelectorAll(itemSelector)].filter((item) => !item.disabled && item.offsetParent !== null);
        if (!items.length) return;
        const current = Math.max(0, items.indexOf(doc.activeElement));
        let next = current;
        if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = items.length - 1;
        else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (current - 1 + items.length) % items.length;
        else next = (current + 1) % items.length;
        event.preventDefault();
        items[next].focus();
      });
    });
  }

  function ensureKeyboardNavigation() {
    bindRovingNavigation('.workspace-step-list', '.workspace-step-button');
    bindRovingNavigation('.ui-segmented-control', 'button');
    bindRovingNavigation('.ui-sheet-tabs', 'button');
    bindRovingNavigation('.ui-final-section-nav', 'button');
    bindRovingNavigation('.spell-source-tabs,.spell-level-tabs', 'button');
  }


  const targetMilestones = {
    1:'创建角色',3:'路线初成',4:'成长节点',5:'中期构筑',8:'第二成长',12:'完整构筑'
  };

  function ensureTargetLevelStage() {
    const card = $('targetLevelCard');
    const bodyPanel = card?.querySelector('.card-body');
    if (!card || !bodyPanel) return;
    if (!$('uiTargetLevelStage')) {
      const stage = doc.createElement('section');
      stage.id = 'uiTargetLevelStage';
      stage.className = 'ui-target-level-stage';
      stage.innerHTML = `
        <div class="ui-target-level-crest"><b>1</b><span>目标等级</span></div>
        <div class="ui-target-level-main">
          <div class="ui-stage-heading"><div><span>LEVEL DESTINATION</span><h3>选择目标角色等级</h3><p>目标等级决定需要规划的升级次数，后续解锁仍按各职业自身等级计算。</p></div></div>
          <div class="ui-target-level-track" role="list" aria-label="目标等级 1 至 12"></div>
          <div class="ui-target-level-milestone"><strong>创建角色</strong><span>当前模拟从一级开始。</span></div>
        </div>
        <div class="ui-target-level-metrics"></div>
      `;
      bodyPanel.insertBefore(stage, bodyPanel.firstElementChild);
      const track = stage.querySelector('.ui-target-level-track');
      track.innerHTML = Array.from({length:12},(_,index)=>`<button type="button" data-ui-target-level="${index+1}" role="listitem"><b>${index+1}</b><span>${targetMilestones[index+1] || ''}</span></button>`).join('');
      track.addEventListener('click', (event) => {
        const button = event.target.closest('[data-ui-target-level]');
        if (!button) return;
        setTargetLevel(Number(button.dataset.uiTargetLevel));
      });
      card.querySelector('.target-level-picker')?.classList.add('ui-native-level-controls');
    }
  }

  function setTargetLevel(level) {
    const value = Math.max(1, Math.min(12, Number(level) || 1));
    const range = $('targetLevelRange');
    const select = $('targetLevelSelect');
    if (range) {
      range.value = String(value);
      range.dispatchEvent(new Event('input', { bubbles:true }));
      range.dispatchEvent(new Event('change', { bubbles:true }));
    }
    if (select) {
      select.value = String(value);
      select.dispatchEvent(new Event('change', { bubbles:true }));
    }
    queueSync();
  }

  function syncTargetLevelStage() {
    const stage = $('uiTargetLevelStage');
    const card = $('targetLevelCard');
    if (!stage || !card) return;
    const level = Number(currentLevel()) || 1;
    setText(stage.querySelector('.ui-target-level-crest b'), level);
    stage.querySelectorAll('[data-ui-target-level]').forEach((button) => {
      const value = Number(button.dataset.uiTargetLevel);
      button.classList.toggle('complete', value < level);
      button.classList.toggle('active', value === level);
      setAttr(button, 'aria-current', value === level ? 'step' : null);
    });
    const milestoneLevels = Object.keys(targetMilestones).map(Number).filter((value) => value <= level);
    const milestone = milestoneLevels.length ? Math.max(...milestoneLevels) : 1;
    setText(stage.querySelector('.ui-target-level-milestone strong'), targetMilestones[milestone] || `${level}级构筑`);
    setText(stage.querySelector('.ui-target-level-milestone span'), level >= 12 ? '已到达游戏等级上限。' : `还可继续规划 ${12-level} 个角色等级。`);
    const metrics = [...card.querySelectorAll('.target-level-summary>div')].slice(0,4).map((item) => ({
      label:safeText(item.querySelector('span')),
      value:safeText(item.querySelector('b'))
    })).filter((item)=>item.label||item.value);
    const box = stage.querySelector('.ui-target-level-metrics');
    const signature = metrics.map((item)=>`${item.label}:${item.value}`).join('|');
    if (box.dataset.signature !== signature) {
      box.dataset.signature = signature;
      box.innerHTML = metrics.map((item)=>`<div><span>${item.label}</span><b>${item.value || '—'}</b></div>`).join('');
    }
  }

  function ensureFeatDecisionCards() {
    const card = $('progressionCard');
    if (!card) return;
    card.querySelectorAll('.feat-row').forEach((row) => {
      const select = row.querySelector('select');
      if (!select || row.dataset.uiFeatDecisionReady === 'true') return;
      const options = [...select.options];
      const asi = options.find((option) => /属性提升|ability score/i.test(option.textContent || ''));
      const normal = options.find((option) => option.value && !/请选择|未选择|属性提升|ability score/i.test(option.textContent || ''));
      if (!asi && !normal) return;
      row.dataset.uiFeatDecisionReady = 'true';
      const switcher = doc.createElement('div');
      switcher.className = 'ui-feat-type-switch';
      switcher.innerHTML = `${normal ? '<button type="button" data-ui-feat-type="feat"><i>✦</i><span>普通专长</span></button>' : ''}${asi ? '<button type="button" data-ui-feat-type="asi"><i>＋</i><span>属性提升</span></button>' : ''}`;
      const summary = doc.createElement('div');
      summary.className = 'ui-feat-current-choice';
      row.append(switcher, summary);
      switcher.addEventListener('click', (event) => {
        const button = event.target.closest('[data-ui-feat-type]');
        if (!button) return;
        const target = button.dataset.uiFeatType === 'asi' ? asi : normal;
        if (!target) return;
        select.value = target.value;
        select.dispatchEvent(new Event('change', { bubbles:true }));
        queueSync();
      });
    });
  }

  function syncFeatDecisionCards() {
    ensureFeatDecisionCards();
    $('progressionCard')?.querySelectorAll('.feat-row').forEach((row) => {
      const select = row.querySelector('select');
      if (!select) return;
      const current = select.selectedOptions?.[0]?.textContent?.trim() || '尚未选择';
      const asiMode = /属性提升|ability score/i.test(current);
      row.classList.toggle('ui-asi-mode', asiMode);
      row.querySelectorAll('[data-ui-feat-type]').forEach((button) => {
        const active = button.dataset.uiFeatType === (asiMode ? 'asi' : 'feat') && !/尚未|请选择|未选择/.test(current);
        button.classList.toggle('active', active);
        setAttr(button, 'aria-pressed', active);
      });
      const summary = row.querySelector('.ui-feat-current-choice');
      if (summary) summary.innerHTML = `<span>当前选择</span><b>${current}</b><small>${asiMode ? '继续在右侧分配两点属性' : '选择将同步到最终角色纸'}</small>`;
    });
  }

  function fallbackSpellArtwork(name) {
    const letter = (name || '法').slice(0,1);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><defs><radialGradient id="g"><stop stop-color="#795142"/><stop offset="1" stop-color="#17110e"/></radialGradient></defs><rect width="128" height="128" rx="18" fill="url(#g)"/><circle cx="64" cy="64" r="42" fill="none" stroke="#d8b76f" stroke-width="3" opacity=".72"/><path d="M64 18l8 25 26 1-21 15 8 25-21-15-21 15 8-25-21-15 26-1z" fill="none" stroke="#d8b76f" opacity=".35"/><text x="64" y="77" text-anchor="middle" fill="#f0d69a" font-family="serif" font-size="38">${letter}</text></svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  function ensureSpellMediaAssets() {
    $('spellsCard')?.querySelectorAll('.spell-card,.spell-option,[data-spell-id]').forEach((card) => {
      const name = spellCardName(card);
      let image = card.querySelector('img');
      if (!image && !card.querySelector('.ui-spell-placeholder')) {
        const placeholder = doc.createElement('span');
        placeholder.className = 'ui-spell-placeholder';
        placeholder.innerHTML = `<img src="${fallbackSpellArtwork(name)}" alt="">`;
        card.querySelector('.spell-select,button')?.prepend(placeholder);
        image = placeholder.querySelector('img');
      }
      if (!image || image.dataset.uiMediaReady === 'true') return;
      image.dataset.uiMediaReady = 'true';
      image.loading = 'lazy';
      image.decoding = 'async';
      image.alt = image.alt || `${name}图标`;
      image.addEventListener('load', () => image.closest('.spell-card,.spell-option,[data-spell-id]')?.classList.add('ui-image-loaded'));
      image.addEventListener('error', () => {
        if (image.dataset.uiFallbackApplied === 'true') return;
        image.dataset.uiFallbackApplied = 'true';
        image.src = fallbackSpellArtwork(name);
        image.closest('.spell-card,.spell-option,[data-spell-id]')?.classList.add('ui-image-fallback');
      });
    });
  }

  function ensureSideUtilityPanels() {
    const check = $('workspaceCheckCard');
    const warnings = $('warnings');
    if (check && warnings && !$('uiPendingStage')) {
      check.classList.add('ui-utility-panel','ui-pending-panel');
      const stage = doc.createElement('section');
      stage.id = 'uiPendingStage';
      stage.className = 'ui-pending-stage';
      stage.innerHTML = `<div><span>BUILD CHECK</span><h3>待处理事项</h3><p>点击任意条目可直接返回对应构筑步骤。</p></div><b>0</b>`;
      warnings.insertAdjacentElement('beforebegin', stage);
    }
    [$('workspacePresetCard'), $('workspaceToolsCard')].filter(Boolean).forEach((panel) => panel.classList.add('ui-utility-panel','ui-save-panel'));
    const tools = $('workspaceToolsCard');
    if (tools && !$('uiSaveStage')) {
      const stage = doc.createElement('section');
      stage.id = 'uiSaveStage';
      stage.className = 'ui-save-stage';
      stage.innerHTML = `<span>SAVE & SHARE</span><h3>存档与分享</h3><p>保存到当前浏览器，或导出 JSON 继续编辑。</p>`;
      tools.querySelector('.card-body')?.prepend(stage);
      tools.querySelectorAll('.toolbar .btn').forEach((button,index) => {
        button.dataset.uiToolIndex = String(index);
        const label = safeText(button);
        button.innerHTML = `<i>${['⌁','↺','×'][index] || '✦'}</i><span>${label}</span>`;
      });
    }
  }

  function syncSideUtilityPanels() {
    const warnings = $('warnings');
    const stage = $('uiPendingStage');
    if (warnings && stage) {
      const items = [...warnings.children].filter((item)=>!item.matches('script,style'));
      const count = items.length;
      setText(stage.querySelector('b'), count);
      stage.classList.toggle('complete', count === 0);
      setText(stage.querySelector('p'), count ? `仍有 ${count} 项需要确认，完成后即可生成完整构筑。` : '当前构筑已通过完整性检查。');
    }
  }

  function ensureMobileStepHead() {
    const header = $('codexCommand');
    if (!header || $('uiMobileStepHead')) return;
    const compact = doc.createElement('div');
    compact.id = 'uiMobileStepHead';
    compact.className = 'ui-mobile-step-head';
    compact.innerHTML = `<div><span>STEP 01 / 08</span><strong>初始属性</strong></div><p>1级 · 当前构筑</p>`;
    header.appendChild(compact);
  }

  function syncMobileStepHead() {
    const head = $('uiMobileStepHead');
    const steps = stepButtons();
    if (!head || !steps.length) return;
    const index = activeStepIndex();
    const active = steps[index];
    setText(head.querySelector('span'), `STEP ${String(index+1).padStart(2,'0')} / ${String(steps.length).padStart(2,'0')}`);
    setText(head.querySelector('strong'), safeText(active.querySelector('strong')) || '构筑步骤');
    setText(head.querySelector('p'), `${currentLevel()}级 · ${textOf('headerBuildRoute','railClass') || '当前构筑'}`);
  }
  function syncChrome() {
    markActiveCard();
    addCardDetailToggles();
    ensureAbilityInspector();
    ensureTargetLevelStage();
    ensureRouteStage();
    ensureSkillStage();
    ensureSpellStage();
    ensureProgressionStage();
    ensureClassFeatureStage();
    ensureCharacterSheetLayers();
    ensureFinalReviewStage();
    ensureMobileSheetHandle();
    ensureMobileStepHead();
    ensureSideUtilityPanels();
    ensureKeyboardNavigation();
    ensureStepPendingBadges();
    decorateSkillChoices();
    ensureSpellMediaAssets();
    syncTargetLevelStage();
    syncSkillStage();
    syncFeatDecisionCards();
    syncProgressionStage();
    syncClassFeatureStage();
    syncCharacterDashboard();
    setCharacterSheetView($('resultCard')?.dataset.uiSheetView || 'overview');
    syncFinalReviewStage();
    decorateWarnings();
    syncMobileSheetState();
    syncStepPendingBadges();
    syncFooter();
    syncLevel();
    syncSelectionAccessibility();
    syncAbilityInspector();
    syncRouteStage();
    syncSpellLoadout();
    syncMobileResultHint();
    syncSideUtilityPanels();
    syncMobileStepHead();
  }

  function bindInteractions() {
    doc.addEventListener('click', (event) => {
      const step = event.target.closest('.workspace-step-button[data-workspace-step]');
      if (step) queueSync();
      const selectable = event.target.closest('.skill-choice,.subclass-card,.class-choice-option,.feat-card,.spell-card,.spell-option,[data-spell-id]');
      if (selectable) queueSync();
    });

    doc.addEventListener('change', queueSync);
    doc.addEventListener('input', queueSync);

    doc.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && body.classList.contains('ui-sheet-open')) {
        event.preventDefault();
        closeCharacterSheet();
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key === 'ArrowLeft') {
        event.preventDefault();
        navigate(-1);
      }
      if ((event.ctrlKey || event.metaKey) && event.key === 'ArrowRight') {
        event.preventDefault();
        navigate(1);
      }
    });

    const observer = new MutationObserver(queueSync);
    const observed = [
      $('workspaceStepRail'), $('decisionContext'), $('targetLevelValue'), $('railLevel'),
      $('headerLevelLabel'), $('railPending'), doc.querySelector('.main-stack')
    ].filter(Boolean);
    observed.forEach((node) => observer.observe(node, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['class', 'aria-pressed', 'value']
    }));
  }

  addLevelMedallion();
  addFocusToggle();
  createFooter();
  bindInteractions();
  syncChrome();

  window.addEventListener('resize', queueSync, { passive: true });
  window.setTimeout(queueSync, 350);
  window.setTimeout(queueSync, 1000);
})();

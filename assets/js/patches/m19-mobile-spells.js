const MOBILE_QUERY = window.matchMedia('(max-width: 767px)');
let scheduled = false;

function setTextIfNeeded(element, text) {
  if (element && element.textContent.trim() !== text) element.textContent = text;
}

function createToolbar(view) {
  const source = view.querySelector(':scope > .m-spell-source');
  const counts = view.querySelector(':scope > .m-spell-counts');
  const controls = view.querySelector(':scope > .m-spell-controls');
  const list = view.querySelector(':scope > .m-spell-list');
  if (!source || !counts || !controls || !list) return null;

  const toolbar = document.createElement('section');
  toolbar.className = 'm19-spell-toolbar';
  toolbar.setAttribute('aria-label', '法术来源、数量、搜索与筛选');

  const summary = document.createElement('div');
  summary.className = 'm19-spell-toolbar-summary';

  source.before(toolbar);
  summary.append(source, counts);
  toolbar.append(summary, controls);
  list.setAttribute('aria-label', '法术列表');
  return toolbar;
}

function applyMobileSpellLayout() {
  scheduled = false;
  const shell = document.querySelector('.mobile-app-shell');
  if (!shell) return;

  setTextIfNeeded(shell.querySelector('.mobile-character-action'), '角色纸');
  const primary = shell.querySelector('.mobile-primary-action');
  if (primary?.textContent.trim() === '查看结果') primary.textContent = '完成构筑';

  const view = shell.querySelector('.m-spells-view');
  if (!MOBILE_QUERY.matches || !view) {
    shell.classList.remove('m19-spells-mode');
    return;
  }

  shell.classList.add('m19-spells-mode');
  shell.querySelector('.mobile-inline-result')?.remove();
  view.querySelector(':scope > .m-prepared-row')?.remove();

  const content = shell.querySelector('.mobile-build-content');
  content?.classList.add('mobile-spells-content');

  const existingToolbar = view.querySelector(':scope > .m19-spell-toolbar');
  const toolbar = existingToolbar || createToolbar(view);
  if (!toolbar) return;

  const list = view.querySelector(':scope > .m-spell-list');
  if (list && toolbar.nextElementSibling !== list) toolbar.after(list);
}

function scheduleApply() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(applyMobileSpellLayout);
}

const observer = new MutationObserver(scheduleApply);
observer.observe(document.documentElement, { childList: true, subtree: true });
MOBILE_QUERY.addEventListener?.('change', scheduleApply);
window.addEventListener('hashchange', scheduleApply);
window.addEventListener('resize', scheduleApply, { passive: true });
scheduleApply();

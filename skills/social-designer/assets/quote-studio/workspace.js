/* Editor navigation is independent of artwork state and never changes saved quotes. */
(() => {
  const tabs = [...document.querySelectorAll('[data-panel]')];
  function select(tab, focus = false) {
    for (const item of tabs) {
      const active = item === tab;
      item.setAttribute('aria-selected', String(active));
      item.tabIndex = active ? 0 : -1;
      document.getElementById('panel-' + item.dataset.panel).hidden = !active;
    }
    if (tab.dataset.panel === 'image') window.quoteStockActivate?.();
    if (focus) tab.focus();
    document.querySelector('.panel-scroll').scrollTop = 0;
    if (matchMedia('(max-width:700px)').matches) {
      document.querySelector('.inspector').scrollIntoView({block:'start', behavior:'instant'});
    }
  }
  for (const tab of tabs) {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', event => {
      const index = tabs.indexOf(tab);
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== undefined) { event.preventDefault(); select(tabs[next], true); }
    });
  }
  const title = new URLSearchParams(location.search).get('project') || 'Draft';
  document.getElementById('project-title').textContent = title;
  window.quoteWorkspaceRefresh = state => {
    for (const button of document.querySelectorAll('[data-preset]')) {
      const preset = QuoteCore.presets[button.dataset.preset];
      const matches = Object.entries(preset).every(([key, value]) => state[key] === value);
      button.setAttribute('aria-pressed', String(matches));
    }
  };
  window.quoteWorkspaceSaved = (link, kind) => {
    const latest = document.getElementById('latest-file');
    latest.replaceChildren();
    const copy = link.cloneNode(true);
    copy.textContent = 'Open ' + kind.toUpperCase();
    copy.rel = 'noopener';
    latest.append(copy);
  };
  // app.js may finish its asynchronous font loading before or after this file.
  if (typeof s !== 'undefined') window.quoteWorkspaceRefresh(s);
})();

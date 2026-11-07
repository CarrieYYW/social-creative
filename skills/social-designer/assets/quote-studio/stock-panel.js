/* Public image discovery. Only an explicit selection downloads/applies an image. */
(() => {
  const $stock = id => document.getElementById(id);
  const queries = {water:'misty lake', botanical:'fern leaf', light:'window sunlight',
    tactile:'ceramic still life', atmosphere:'abstract natural light'};
  let active = false, currentMode = 'find', version = 0, searchController;
  let resultQuery = '', page = 1, hasMore = false, importing = false, selectionVersion = 0;
  const status = text => $stock('stock-status').textContent = text;
  async function api(path, body, signal) {
    const response = await fetch(path, {method:'POST', signal,
      headers:{'Content-Type':'application/json','X-Quote-Key':window.QUOTE_KEY}, body:JSON.stringify(body)});
    const data = await response.json();
    if (!response.ok) throw Error(response.status === 403
      ? 'The editor session changed. Reload this page and try again.' : data.error || 'Image search is unavailable. Try again.');
    return data;
  }
  function selectionButtons(disabled) {
    document.querySelectorAll('.stock-card>button').forEach(button => button.disabled = disabled);
    $stock('stock-cancel').hidden = !disabled;
  }
  async function useStock(item, button) {
    if (importing) return;
    const operation = ++selectionVersion, choice = ++imageChoiceVersion;
    const direction = $stock('image-style').value, placement = $stock('image-placement').value;
    importing = true; selectionButtons(true); status('Bringing this image into your project…');
    try {
      const saved = await api('/api/stock-import', {
        project:scope, id:item.id, style:direction, placement, query:resultQuery,
      });
      if (operation !== selectionVersion || choice !== imageChoiceVersion) {
        if (operation === selectionVersion) status('Selection cancelled by a newer change. The downloaded image is in Project images.');
        return;
      }
      const {applied, feedback} = await window.quoteApplyLibraryImage(saved, button, choice);
      if (operation === selectionVersion && applied) {
        status('Background applied and saved to Project images. Undo restores the previous background.');
      } else if (operation === selectionVersion) {
        status(feedback);
      }
      if (operation === selectionVersion) await window.quoteRefreshLibrary();
    } catch (error) {
      if (operation === selectionVersion) status(error.message);
    } finally {
      if (operation === selectionVersion) { importing = false; selectionButtons(false); }
    }
  }
  function card(item) {
    const article = document.createElement('article'); article.className = 'stock-card';
    const image = document.createElement('img'); image.src = item.thumbnail; image.alt = item.title;
    image.loading = 'lazy'; image.referrerPolicy = 'no-referrer'; image.width = 240; image.height = 240;
    image.onerror = () => { image.hidden = true; article.classList.add('stock-no-preview'); };
    const title = document.createElement('h4'); title.textContent = item.title;
    const credit = document.createElement('p'); credit.textContent = item.credit;
    const license = document.createElement('a'); license.href = item.licenseUrl;
    license.textContent = item.licenseLabel; license.target = '_blank'; license.rel = 'noopener noreferrer';
    const source = document.createElement('a'); source.href = item.source; source.textContent = 'Source ↗';
    source.target = '_blank'; source.rel = 'noopener noreferrer';
    const dimensions = document.createElement('p'); dimensions.className = 'stock-dimensions';
    dimensions.textContent = item.width && item.height ? item.width + ' × ' + item.height + ' px' : 'Size varies';
    const button = document.createElement('button'); button.textContent = 'Use background';
    button.setAttribute('aria-label', 'Use background: ' + item.title);
    button.disabled = importing; button.onclick = () => useStock(item, button);
    article.append(image, title, credit, dimensions, license, source, button);
    return article;
  }
  async function search(nextPage = 1, queryOverride = null) {
    if (queryOverride !== null) $stock('stock-query').value = queryOverride;
    const query = $stock('stock-query').value.trim();
    if (!query) { status('Add a subject to search for, such as misty lake.'); $stock('stock-query').focus(); return; }
    const operation = ++version; searchController?.abort(); searchController = new AbortController();
    $stock('stock-search').disabled = true; $stock('stock-more').disabled = true; $stock('stock-prev').disabled = true;
    $stock('stock-results').setAttribute('aria-busy', 'true'); status('Finding backgrounds…');
    try {
      const data = await api('/api/stock-search', {query, page:nextPage}, searchController.signal);
      if (operation !== version || currentMode !== 'find') return;
      resultQuery = data.query; page = data.page; hasMore = data.hasMore;
      $stock('stock-results').replaceChildren(...data.images.map(card));
      $stock('stock-more').hidden = !hasMore; $stock('stock-prev').hidden = page === 1;
      status(data.images.length
        ? data.images.length + ' photos found. Select one to try it.'
        : 'No backgrounds found. Try a simpler subject, such as lake, leaves or sunlight.');
    } catch (error) {
      if (operation !== version || error.name === 'AbortError') return;
      status(error.message + ' Your current background is unchanged.');
    } finally {
      if (operation === version) {
        $stock('stock-search').disabled = false; $stock('stock-more').disabled = false; $stock('stock-prev').disabled = false;
        $stock('stock-results').setAttribute('aria-busy', 'false');
      }
    }
  }
  $stock('stock-query').value = queries[$stock('image-style').value] || queries.water;
  $stock('stock-search').onclick = () => search();
  $stock('stock-more').onclick = () => search(page + 1, resultQuery);
  $stock('stock-prev').onclick = () => search(page - 1, resultQuery);
  $stock('stock-query').addEventListener('keydown', event => {
    if (event.key === 'Enter') { event.preventDefault(); search(); }
  });
  $stock('image-style').addEventListener('input', () => {
    $stock('stock-query').value = queries[$stock('image-style').value] || queries.water;
    if (active && currentMode === 'find') search();
  });
  $stock('stock-cancel').onclick = () => {
    selectionVersion++; imageChoiceVersion++; importing = false; selectionButtons(false);
    status('Selection cancelled. Your current background is unchanged. A completed download may remain in Project images.');
  };
  window.quoteStockMode = mode => {
    if (mode === currentMode) return;
    currentMode = mode;
    if (mode !== 'find') {
      version++; searchController?.abort(); $stock('stock-results').setAttribute('aria-busy','false');
      for (const id of ['stock-search','stock-more','stock-prev']) $stock(id).disabled = false;
    }
    else if (active && (!resultQuery || $stock('stock-query').value.trim() !== resultQuery)) search();
    else if (active) status('Choose a background, or search for another subject.');
  };
  window.quoteStockActivate = () => {
    if (!active) { active = true; if (currentMode === 'find') search(); }
  };
  // Image brief mode was initialized by image-panel.js before this module was loaded.
  currentMode = $stock('stock-browser').hidden ? 'generate' : 'find';
})();

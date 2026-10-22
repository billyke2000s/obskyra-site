/* Edit links.json to change the social links. The original HTML links remain as a fallback. */
(async function () {
  const container = document.querySelector('.tracks');
  if (!container) return;
  try {
    const response = await fetch('links.json', {cache: 'no-cache'});
    if (!response.ok) throw new Error('links.json unavailable');
    const config = await response.json();
    if (!Array.isArray(config.links)) throw new Error('Invalid links.json');
    const fragment = document.createDocumentFragment();
    let count = 0;
    for (const item of config.links) {
      if (!item || typeof item.name !== 'string' || typeof item.url !== 'string') continue;
      let url;
      try { url = new URL(item.url); } catch { continue; }
      if (!['https:', 'http:'].includes(url.protocol)) continue;
      count++;
      const link = document.createElement('a');
      link.className = 'track';
      link.href = url.href;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      const parts = [
        ['number', String(count).padStart(2, '0')],
        ['track-name', item.name],
        ['track-label', typeof item.description === 'string' ? item.description : ''],
        ['arrow', '↗']
      ];
      for (const [className, value] of parts) {
        const span = document.createElement('span');
        span.className = className;
        span.textContent = value;
        if (className === 'number' || className === 'arrow') span.setAttribute('aria-hidden', 'true');
        link.append(span);
      }
      const sr = document.createElement('span');
      sr.className = 'sr-only';
      sr.textContent = ' (opens in a new tab)';
      link.append(sr);
      fragment.append(link);
    }
    container.replaceChildren(fragment);
    const label = document.querySelector('.liner span:last-child');
    if (label) label.textContent = String(count).padStart(2, '0') + ' LINKS · ONE PERSON';
  } catch (error) {
    console.warn('Using built-in social links:', error);
  }
})();

(() => {
  const badge = document.getElementById('site-visitors');
  const label = document.getElementById('site-visitor-text');
  if (!badge || !label) return;
  const storageKey = 'obskyra-site-visitor-id';
  let id;
  try {
    id = sessionStorage.getItem(storageKey);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(storageKey, id);
    }
  } catch (_) { id = crypto.randomUUID(); }
  async function update() {
    if (document.hidden) return;
    try {
      const response = await fetch('/api/site-visitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
        cache: 'no-store'
      });
      if (!response.ok) throw new Error('Count unavailable');
      const data = await response.json();
      if (!Number.isSafeInteger(data.online) || data.online < 0) throw new Error('Invalid count');
      badge.dataset.state = 'live';
      label.textContent = 'SITE / ' + data.online.toLocaleString() + ' ONLINE';
    } catch (_) {
      badge.dataset.state = 'unavailable';
      label.textContent = 'SITE / UNAVAILABLE';
    }
  }
  update();
  setInterval(update, 45000);
  document.addEventListener('visibilitychange', update);
})();

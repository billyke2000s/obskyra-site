(() => {
  const indicator = document.getElementById('twitch-viewers');
  const label = document.getElementById('twitch-viewer-text');
  if (!indicator || !label) return;
  async function refresh() {
    try {
      const response = await fetch('/api/twitch-viewers', { cache: 'no-store' });
      if (!response.ok) throw new Error('Viewer count unavailable');
      const data = await response.json();
      if (data.live === true && Number.isSafeInteger(data.viewers) && data.viewers >= 0) {
        indicator.dataset.state = 'live';
        label.textContent = 'LIVE ON TWITCH / ' + data.viewers.toLocaleString() + ' WATCHING';
      } else if (data.live === false) {
        indicator.dataset.state = 'offline';
        label.textContent = 'TWITCH / OFFLINE';
      } else {
        throw new Error('Unexpected response');
      }
    } catch (_) {
      indicator.dataset.state = 'unavailable';
      label.textContent = 'TWITCH / STATUS UNAVAILABLE';
    }
  }
  refresh();
  setInterval(() => { if (!document.hidden) refresh(); }, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
})();

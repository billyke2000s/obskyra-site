/* Play counter for the holographic "PLAYED" sticker on the photo card.
   Counts one play per browser tab session, then shows the running total.
   If the counter can't be reached the sticker simply stays hidden. */
(() => {
  const sticker = document.querySelector('.holo-plays');
  const number = sticker && sticker.querySelector('.holo-plays-count');
  if (!sticker || !number) return;

  const flag = 'obskyra-played';
  let alreadyCounted = false;
  try { alreadyCounted = sessionStorage.getItem(flag) === '1'; } catch (_) {}

  const format = (n) => {
    const padded = String(n).padStart(6, '0');
    return padded.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  fetch('/api/plays', { method: alreadyCounted ? 'GET' : 'POST', cache: 'no-store' })
    .then((response) => (response.ok ? response.json() : Promise.reject(new Error('unavailable'))))
    .then((data) => {
      if (!Number.isSafeInteger(data.plays) || data.plays < 0) throw new Error('invalid');
      if (!alreadyCounted) { try { sessionStorage.setItem(flag, '1'); } catch (_) {} }
      number.textContent = format(data.plays);
      sticker.hidden = false;
    })
    .catch(() => { sticker.hidden = true; });

  // The foil movement and card tilt live in js/effects.js.
})();

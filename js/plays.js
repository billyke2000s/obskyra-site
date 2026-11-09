/* Holographic "PLAYED" sticker on the photo card.
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

  // Foil follows the pointer on devices with a mouse. Touch screens get a
  // slow automatic shimmer from CSS instead, and reduced-motion users get a
  // still sticker.
  const art = document.querySelector('.art');
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!art) return;
  let frame = 0;
  art.addEventListener('pointermove', (event) => {
    if (!canHover.matches || reduced.matches || sticker.hidden) return;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const box = art.getBoundingClientRect();
      const x = Math.min(1, Math.max(0, (event.clientX - box.left) / box.width));
      const y = Math.min(1, Math.max(0, (event.clientY - box.top) / box.height));
      sticker.style.setProperty('--holo-x', Math.round(x * 100) + '%');
      sticker.style.setProperty('--holo-y', Math.round(y * 100) + '%');
      sticker.style.setProperty('--holo-shine', Math.round(100 - x * 100) + '%');
    });
  });
  art.addEventListener('pointerleave', () => {
    sticker.style.removeProperty('--holo-x');
    sticker.style.removeProperty('--holo-y');
    sticker.style.removeProperty('--holo-shine');
  });
})();

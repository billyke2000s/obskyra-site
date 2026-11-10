/* Visual effects:
   1. "OBSKYRA ON RECORD." types itself out with a blinking cursor.
   2. The photo card tilts in 3D toward the mouse, and the holographic
      PLAYED sticker's foil shifts with it.
   3. The background video plays only while "Video" is the chosen background.
   Everything respects "reduce motion"; tilt is mouse-only (touch screens get
   the sticker's automatic shimmer from CSS instead). */
(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  /* ---------- 1. Typed heading ---------- */
  const title = document.getElementById('title');
  if (title && !reduced.matches) {
    // Read the lines from the existing markup: "OBSKYRA<span>ON RECORD.</span>"
    const second = title.querySelector('span');
    const lines = [
      (title.firstChild && title.firstChild.nodeType === 3 ? title.firstChild.textContent : '').trim(),
      second ? second.textContent.trim() : ''
    ].filter(Boolean);

    if (lines.length) {
      title.setAttribute('aria-label', lines.join(' '));
      title.textContent = '';
      title.classList.add('tw');
      const caret = document.createElement('span');
      caret.className = 'tw-caret';

      // Each line keeps its full text in a transparent "rest" span, so the
      // heading never changes size while it types (no page jump).
      const parts = lines.map((text) => {
        const line = document.createElement('span');
        line.className = 'tw-line';
        line.setAttribute('aria-hidden', 'true');
        const typed = document.createElement('span');
        typed.className = 'tw-typed';
        const rest = document.createElement('span');
        rest.className = 'tw-rest';
        rest.textContent = text;
        line.append(typed, rest);
        title.append(line);
        return { text, typed, rest, line };
      });

      // Size the cursor to the capital letters of whichever font is actually in
      // use (Impact on most computers, Anton on phones), measured with a canvas.
      const fitCaret = () => {
        try {
          const style = getComputedStyle(title);
          const size = parseFloat(style.fontSize);
          const ctx = document.createElement('canvas').getContext('2d');
          ctx.font = `${style.fontWeight} ${size}px ${style.fontFamily}`;
          const m = ctx.measureText('D');
          if (!m.fontBoundingBoxDescent || !m.actualBoundingBoxAscent) return;
          title.style.setProperty('--caret-bottom', (m.fontBoundingBoxDescent / size).toFixed(3) + 'em');
          title.style.setProperty('--caret-height', (m.actualBoundingBoxAscent / size).toFixed(3) + 'em');
        } catch (_) {}
      };
      fitCaret();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitCaret);

      let lineIndex = 0;
      let charIndex = 0;
      parts[0].line.insertBefore(caret, parts[0].rest);

      const step = () => {
        const part = parts[lineIndex];
        charIndex += 1;
        part.typed.textContent = part.text.slice(0, charIndex);
        part.rest.textContent = part.text.slice(charIndex);
        if (charIndex >= part.text.length) {
          lineIndex += 1;
          charIndex = 0;
          if (lineIndex >= parts.length) return; // done; caret keeps blinking at the end
          parts[lineIndex].line.insertBefore(caret, parts[lineIndex].rest);
          setTimeout(step, 260);
          return;
        }
        setTimeout(step, 70 + Math.random() * 70);
      };
      setTimeout(step, 350);
    }
  }

  /* ---------- 2. Photo card tilt + holo foil ---------- */
  const sleeve = document.querySelector('.sleeve');
  const sticker = document.querySelector('.holo-plays');
  const MAX_TILT = 10; // degrees
  if (sleeve) {
    let frame = 0;
    const reset = () => {
      cancelAnimationFrame(frame);
      sleeve.classList.remove('is-tilting');
      sleeve.style.removeProperty('--tilt-x');
      sleeve.style.removeProperty('--tilt-y');
      if (sticker) {
        sticker.style.removeProperty('--holo-x');
        sticker.style.removeProperty('--holo-y');
        sticker.style.removeProperty('--holo-shine');
      }
    };
    sleeve.addEventListener('pointermove', (event) => {
      if (event.pointerType !== 'mouse' || !finePointer.matches || reduced.matches) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const box = sleeve.getBoundingClientRect();
        const x = Math.min(1, Math.max(0, (event.clientX - box.left) / box.width));
        const y = Math.min(1, Math.max(0, (event.clientY - box.top) / box.height));
        sleeve.classList.add('is-tilting');
        // Card leans toward the cursor, like a card held in the hand.
        sleeve.style.setProperty('--tilt-y', ((x - 0.5) * 2 * MAX_TILT).toFixed(2) + 'deg');
        sleeve.style.setProperty('--tilt-x', ((0.5 - y) * 2 * MAX_TILT).toFixed(2) + 'deg');
        if (sticker && !sticker.hidden) {
          sticker.style.setProperty('--holo-x', Math.round(x * 100) + '%');
          sticker.style.setProperty('--holo-y', Math.round(y * 100) + '%');
          sticker.style.setProperty('--holo-shine', Math.round(100 - x * 100) + '%');
        }
      });
    });
    sleeve.addEventListener('pointerleave', reset);
    reduced.addEventListener('change', reset);
  }

  /* ---------- 3. Background video ---------- */
  const video = document.querySelector('.bg-video video');
  if (video) {
    const saveData = navigator.connection && navigator.connection.saveData;
    const sync = () => {
      const wanted = document.body.dataset.background === 'video' && !reduced.matches && !saveData && !document.hidden;
      if (wanted) {
        if (!video.getAttribute('src')) {
          // Phones get a smaller file (about 0.5 MB instead of 2 MB).
          const small = window.matchMedia('(max-width: 700px)').matches;
          video.src = (small && video.dataset.srcSmall) || video.dataset.src;
        }
        if (video.preload !== 'auto') video.preload = 'auto';
        const playing = video.play();
        if (playing && playing.catch) playing.catch(() => {}); // autoplay blocked: poster stays
      } else {
        video.pause();
      }
    };
    new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ['data-background'] });
    document.addEventListener('visibilitychange', sync);
    reduced.addEventListener('change', sync);
    sync();
  }
})();

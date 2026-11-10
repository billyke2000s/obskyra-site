/* Visual effects:
   1. "OBSKYRA ON RECORD." types itself out with a blinking cursor.
   2. The photo card tilts in 3D toward the mouse, and the holographic
      PLAYED sticker's foil shifts with it.
   3. The background video plays only while "Video" is the chosen background.
   4. The browser tab title types "@obskyra" on a loop (after the first interaction).
   5. Sparkles trail the mouse on desktop.
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
    const badge = title.querySelector('.verified-badge'); // kept and re-attached after typing
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
      if (badge) {
        badge.classList.add('is-waiting');
        parts[0].line.append(badge);
      }

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
          if (lineIndex === 0 && badge) badge.classList.remove('is-waiting'); // badge pops in after the name
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

  /* ---------- 4. Typing browser-tab title ---------- */
  // Starts only after the visitor interacts, so search engines and link
  // previews always see the real page title.
  const realTitle = document.title;
  const handle = '@obskyra';
  let titleStarted = false;
  const startTitle = () => {
    if (titleStarted || reduced.matches) return;
    titleStarted = true;
    let n = 1;
    let dir = 1;
    const tick = () => {
      if (document.hidden) { document.title = realTitle; setTimeout(tick, 1000); return; }
      document.title = handle.slice(0, n) || '@';
      let wait = 180;
      if (dir > 0 && n >= handle.length) { dir = -1; wait = 2600; }      // hold the full name
      else if (dir < 0 && n <= 1) { dir = 1; wait = 600; }              // short pause, retype
      n += dir;
      setTimeout(tick, wait);
    };
    tick();
  };
  ['pointermove', 'pointerdown', 'keydown', 'scroll', 'touchstart'].forEach((type) =>
    window.addEventListener(type, startTitle, { once: true, passive: true }));

  /* ---------- 5. Sparkle cursor trail ---------- */
  if (finePointer.matches && !reduced.matches) {
    const canvas = document.createElement('canvas');
    canvas.className = 'sparkle-layer';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.append(canvas);
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const colors = ['#ffffff', '#ffd6e8', '#cfe9ff', '#fff3c8', '#e2d4ff'];
    const sparks = [];
    let running = false;
    let last = 0;

    const resize = () => {
      canvas.width = Math.round(innerWidth * dpr);
      canvas.height = Math.round(innerHeight * dpr);
      canvas.style.width = innerWidth + 'px';
      canvas.style.height = innerHeight + 'px';
    };
    resize();
    window.addEventListener('resize', resize);

    const star = (x, y, r, rot) => {
      // four-pointed twinkle
      ctx.beginPath();
      for (let i = 0; i < 8; i += 1) {
        const a = rot + (i * Math.PI) / 4;
        const d = i % 2 === 0 ? r : r * 0.28;
        ctx.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d);
      }
      ctx.closePath();
      ctx.fill();
    };

    const frame = (now) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = sparks.length - 1; i >= 0; i -= 1) {
        const s = sparks[i];
        const age = (now - s.born) / s.life;
        if (age >= 1) { sparks.splice(i, 1); continue; }
        s.x += s.vx; s.y += s.vy; s.vy += 0.03; s.rot += s.spin;
        ctx.globalAlpha = (1 - age) * 0.95;
        ctx.fillStyle = s.color;
        star(s.x * dpr, s.y * dpr, s.size * dpr * (1 - age * 0.5), s.rot);
      }
      ctx.globalAlpha = 1;
      if (sparks.length) requestAnimationFrame(frame);
      else running = false;
    };

    window.addEventListener('pointermove', (event) => {
      if (event.pointerType !== 'mouse' || reduced.matches) return;
      const now = performance.now();
      if (now - last < 22) return; // a few sparkles per second, not hundreds
      last = now;
      if (sparks.length > 60) sparks.shift();
      sparks.push({
        x: event.clientX + (Math.random() - 0.5) * 8,
        y: event.clientY + (Math.random() - 0.5) * 8,
        vx: (Math.random() - 0.5) * 0.6,
        vy: Math.random() * 0.4 + 0.1,
        size: Math.random() * 4 + 4,
        rot: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.08,
        color: colors[Math.floor(Math.random() * colors.length)],
        born: now,
        life: 650 + Math.random() * 450
      });
      if (!running) { running = true; requestAnimationFrame(frame); }
    }, { passive: true });
  }
})();

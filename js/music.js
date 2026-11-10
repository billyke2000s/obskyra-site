/* Background music.
   Browsers only allow sound after the visitor interacts with the page, so the
   track starts on the first click, tap or key press anywhere. Nothing is shown
   on the page for it. It fades in, loops, and pauses while the tab is hidden. */
(() => {
  const audio = document.getElementById('bg-music');
  if (!audio) return;

  const VOLUME = 0.35;
  let started = false;

  const fadeIn = () => {
    const timer = setInterval(() => {
      const next = audio.volume + 0.03;
      if (next >= VOLUME) { audio.volume = VOLUME; clearInterval(timer); }
      else audio.volume = next;
    }, 40);
  };

  const start = () => {
    if (started) return;
    started = true;
    audio.volume = 0; // start silent so the fade-in has no loud first moment
    const attempt = audio.play();
    if (attempt && attempt.then) attempt.then(fadeIn).catch(() => { started = false; });
    else fadeIn();
  };
  ['pointerdown', 'keydown', 'touchstart'].forEach((type) =>
    window.addEventListener(type, start, { capture: true, passive: true }));

  // Pause in background tabs; carry on when the visitor comes back.
  let resumeOnReturn = false;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      resumeOnReturn = !audio.paused;
      audio.pause();
    } else if (resumeOnReturn) {
      audio.play().catch(() => {});
    }
  });
})();

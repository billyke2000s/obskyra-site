/* Background music.
   Browsers only allow sound after the visitor interacts with the page, so the
   track starts on the first click, tap or key press anywhere. The page stays
   fully visible the whole time (no "click to enter" screen).
   The corner button mutes/unmutes, and a mute is remembered for later visits. */
(() => {
  const audio = document.getElementById('bg-music');
  const button = document.querySelector('.sound-toggle');
  const label = button && button.querySelector('.sound-label');
  if (!audio || !button || !label) return;

  const KEY = 'obskyra-sound';
  const VOLUME = 0.35;
  let muted = false;
  try { muted = localStorage.getItem(KEY) === 'off'; } catch (_) {}
  let started = false;   // has the visitor interacted yet?
  let fadeTimer = 0;

  const render = () => {
    const playing = !audio.paused;
    button.setAttribute('aria-pressed', String(!muted && started));
    button.dataset.state = muted ? 'off' : (started ? (playing ? 'on' : 'loading') : 'waiting');
    label.textContent = muted ? 'SOUND OFF' : (started ? 'SOUND ON' : 'TAP ANYWHERE FOR SOUND');
  };

  const fadeTo = (target, done) => {
    clearInterval(fadeTimer);
    fadeTimer = setInterval(() => {
      const next = audio.volume + (target > audio.volume ? 0.03 : -0.05);
      if ((target > audio.volume && next >= target) || (target <= audio.volume && next <= target)) {
        audio.volume = Math.max(0, Math.min(1, target));
        clearInterval(fadeTimer);
        if (done) done();
      } else {
        audio.volume = Math.max(0, Math.min(1, next));
      }
    }, 40);
  };

  const play = () => {
    audio.volume = 0;
    const attempt = audio.play();
    if (attempt && attempt.then) {
      attempt.then(() => { fadeTo(VOLUME); render(); }).catch(() => render());
    } else {
      fadeTo(VOLUME);
    }
  };

  const stop = () => fadeTo(0, () => { audio.pause(); render(); });

  const firstInteraction = (event) => {
    if (started) return;
    started = true;
    // Pressing the sound button itself counts as a choice, handled below.
    if (event && button.contains(event.target)) return;
    if (!muted) play();
    render();
  };
  ['pointerdown', 'keydown', 'touchstart'].forEach((type) =>
    window.addEventListener(type, firstInteraction, { once: true, capture: true, passive: true }));

  button.addEventListener('click', () => {
    if (!started) started = true;
    muted = audio.paused ? false : true;
    if (muted && !audio.paused) stop();
    if (!muted) play();
    try { localStorage.setItem(KEY, muted ? 'off' : 'on'); } catch (_) {}
    render();
  });

  // Pause in background tabs; carry on when the visitor comes back.
  let resumeOnReturn = false;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      resumeOnReturn = !audio.paused;
      audio.pause();
    } else if (resumeOnReturn && !muted) {
      audio.play().catch(() => {});
    }
  });

  audio.addEventListener('playing', render);
  audio.addEventListener('pause', render);
  audio.addEventListener('error', () => { button.hidden = true; }); // file failed: hide the control
  render();

  // The button starts hidden and only appears once the music file is confirmed
  // to exist, so the page never offers sound it can't play.
  fetch(audio.currentSrc || audio.getAttribute('src'), { method: 'HEAD', cache: 'no-store' })
    .then((response) => {
      // Cloudflare answers a missing file with the homepage (200), so also
      // require an audio content type.
      const type = response.headers.get('content-type') || '';
      if (response.ok && /^audio\//i.test(type)) button.hidden = false;
    })
    .catch(() => {});
})();

// Homepage background: the ascii-sharks ocean (MIT, github.com/stackedlol/ascii-sharks)
// drawn on a fixed canvas behind the page. The page itself floats above it on glass panels.
import { OceanEngine } from './vendor/ascii-sharks/ocean.js';

const canvas = document.getElementById('ocean');

if (canvas && canvas.getContext) {
  const root = document.documentElement;
  const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const theme = () => root.getAttribute('data-theme') || (darkQuery.matches ? 'dark' : 'light');

  // Phones get three sharks instead of four so the schools still have room to move.
  const small = Math.min(window.innerWidth, window.innerHeight) < 560;
  const sharks = small
    ? [{ kind: 'classic', size: 1 }, { kind: 'classic', size: 0.84 }, { kind: 'classic', size: 0.72 }]
    : undefined;

  try {
    // 30 fps is plenty for motion that snaps to a character grid, and it halves how often
    // the glass panels above have to re-blur the ocean.
    const engine = new OceanEngine(canvas, sharks, { theme: theme(), fps: 30 });
    // Fade the ocean in once its first frame is on the canvas.
    requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('ocean-on')));
    const sync = () => engine.setTheme(theme());
    new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    darkQuery.addEventListener('change', sync);

    // Blurring glass over a moving canvas is the expensive part. If this device can't hold
    // ~33 fps a moment after load, drop the blur: panels turn more opaque and stay readable.
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const probe = () => {
        let frames = 0, start = 0;
        const tick = (now) => {
          if (document.visibilityState !== 'visible') return setTimeout(probe, 2000);
          if (!start) start = now;
          if (++frames < 60) return requestAnimationFrame(tick);
          if ((now - start) / (frames - 1) > 30) document.body.classList.add('glass-lite');
        };
        requestAnimationFrame(tick);
      };
      setTimeout(probe, 1500);
    }
  } catch (err) {
    // No 2D canvas: the page keeps its plain paper background.
  }
}

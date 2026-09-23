/* Minimalt tween-system: promise-baserade animationer som drivs av render-loopen. */

export const ease = {
  linear: (t) => t,
  inCubic: (t) => t * t * t,
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  outQuart: (t) => 1 - Math.pow(1 - t, 4),
  inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  inOutQuart: (t) => (t < 0.5 ? 8 * t ** 4 : 1 - Math.pow(-2 * t + 2, 4) / 2),
  inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  outBack: (t) => { const c1 = 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
};

let motionScale = 1;
/** 0 = inga animationer (prefers-reduced-motion), 1 = normalt. */
export function setMotionScale(k) { motionScale = k; }

const active = new Set();

/** Kör onUpdate(eased, raw) över `seconds` sekunder. Returnerar ett promise. */
export function tween(seconds, onUpdate, easing = ease.inOutCubic) {
  return new Promise((resolve) => {
    const duration = Math.max(1, seconds * 1000 * motionScale);
    active.add({ start: performance.now(), duration, onUpdate, easing, resolve });
  });
}

export const wait = (seconds) => tween(seconds, () => {}, ease.linear);

export function updateTweens(now) {
  for (const t of active) {
    const raw = Math.min(1, Math.max(0, (now - t.start) / t.duration));
    t.onUpdate(t.easing(raw), raw);
    if (raw >= 1) { active.delete(t); t.resolve(); }
  }
}

export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
/** Bildfrekvensoberoende utjämning mot ett mål. */
export const damp = (a, b, lambda, dt) => lerp(a, b, 1 - Math.exp(-lambda * dt));

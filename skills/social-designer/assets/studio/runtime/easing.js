// Deterministic easing. Named curves are the vocabulary used by templates and project.json.
export function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (t) => ((ax * t + bx) * t + cx) * t;
  const sy = (t) => ((ay * t + by) * t + cy) * t;
  const dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const e = sx(t) - x;
      if (Math.abs(e) < 1e-6) return sy(t);
      const d = dx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= e / d;
    }
    let lo = 0, hi = 1;
    t = x;
    for (let i = 0; i < 24; i++) {
      const e = sx(t);
      if (Math.abs(e - x) < 1e-6) break;
      if (e < x) lo = t; else hi = t;
      t = (lo + hi) / 2;
    }
    return sy(t);
  };
}

// Closed-form damped spring, normalised so it settles at p=1.
export function spring(bounce = 0.25) {
  const zeta = Math.min(0.98, Math.max(0.2, 1 - bounce));
  const omega = 9.5;
  const wd = omega * Math.sqrt(1 - zeta * zeta);
  return (p) => {
    if (p <= 0) return 0;
    if (p >= 1) return 1;
    const t = p * 1.15;
    return 1 - Math.exp(-zeta * omega * t) * (Math.cos(wd * t) + ((zeta * omega) / wd) * Math.sin(wd * t));
  };
}

export const CURVES = {
  linear: (p) => p,
  hold: (p) => (p >= 1 ? 1 : 0),
  step: (p) => (p > 0 ? 1 : 0),
  // Fast start, long settle: the value reaches readable position early.
  'out-soft': bezier(0.22, 1, 0.36, 1),
  'out-expo': bezier(0.16, 1, 0.3, 1),
  'out-strong': bezier(0.05, 0.7, 0.1, 1),
  'in-soft': bezier(0.55, 0, 1, 0.45),
  'in-strong': bezier(0.3, 0, 0.8, 0.15),
  'in-out': bezier(0.65, 0, 0.35, 1),
  'in-out-strong': bezier(0.87, 0, 0.13, 1),
  overshoot: bezier(0.34, 1.56, 0.64, 1),
  'spring-soft': spring(0.18),
  'spring-tight': spring(0.32),
};

export function curve(spec) {
  if (typeof spec === 'function') return spec;
  if (Array.isArray(spec)) return bezier(...spec);
  return CURVES[spec] || CURVES['out-soft'];
}

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, p) => a + (b - a) * p;

// Small seeded PRNG: identical seeds give identical renders.
export function rng(seed = 1) {
  let s = seed >>> 0 || 1;
  return () => {
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

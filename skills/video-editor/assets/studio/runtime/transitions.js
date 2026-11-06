// Scene transitions. Every transition is a pure function of progress, so any frame can be rendered alone.
import { curve, clamp, rng } from './easing.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
let filterId = 0;

export const TRANSITIONS = {
  cut: { label: 'Cut', dur: 0, ease: 'linear' },
  dissolve: { label: 'Dissolve', dur: 0.6, ease: 'in-out' },
  push: { label: 'Push', dur: 0.7, ease: 'in-out-strong', dir: 'up' },
  whip: { label: 'Whip (directional blur)', dur: 0.42, ease: 'in-out-strong', dir: 'left' },
  cover: { label: 'Slide over', dur: 0.7, ease: 'in-out-strong', dir: 'up' },
  wipe: { label: 'Soft wipe', dur: 0.8, ease: 'in-out', angle: 90, soft: 0.12 },
  iris: { label: 'Iris', dur: 0.8, ease: 'in-out-strong', x: 0.5, y: 0.5 },
  bars: { label: 'Staggered bars', dur: 0.9, ease: 'in-out-strong', count: 6, axis: 'y' },
  grid: { label: 'Cross grid matte', dur: 1.1, ease: 'in-out-strong', cols: 3, rows: 3 },
  luma: { label: 'Luma dissolve', dur: 0.9, ease: 'in-out' },
  organic: { label: 'Organic matte', dur: 1.0, ease: 'in-out', scale: 0.0045 },
  zoom: { label: 'Zoom through', dur: 0.6, ease: 'in-out-strong' },
};

const vector = (dir) => ({ up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[dir] || [0, -1]);

// Filter markup is built only from constants and coerced numbers.
function makeFilter(defs, build) {
  const filter = document.createElementNS(SVG_NS, 'filter');
  const id = `tf${++filterId}`;
  filter.setAttribute('id', id);
  filter.setAttribute('x', '0'); filter.setAttribute('y', '0');
  filter.setAttribute('width', '100%'); filter.setAttribute('height', '100%');
  filter.setAttribute('color-interpolation-filters', 'sRGB');
  const parsed = new DOMParser().parseFromString(`<svg xmlns="${SVG_NS}">${build}</svg>`, 'image/svg+xml');
  filter.append(...[...parsed.documentElement.children].map((n) => document.importNode(n, true)));
  defs.appendChild(filter);
  return { id, node: filter };
}

// Returns {apply(a, b, p)} where p is raw 0..1 progress. a = outgoing element, b = incoming element.
export function createTransition(spec, { W, H, defs, seed = 7 }) {
  const type = typeof spec === 'string' ? spec : spec?.type || 'cut';
  const base = TRANSITIONS[type];
  if (!base) throw new Error(`Unknown transition "${type}"`);
  const o = { ...base, ...(typeof spec === 'object' ? spec : {}), type };
  const ease = curve(o.ease);
  const clear = (el) => {
    el.style.transform = ''; el.style.opacity = ''; el.style.clipPath = '';
    el.style.filter = ''; el.style.maskImage = ''; el.style.webkitMaskImage = '';
  };
  let filter = null;
  if (type === 'whip') {
    filter = makeFilter(defs, '<feGaussianBlur in="SourceGraphic" stdDeviation="0 0"/>');
  } else if (type === 'luma') {
    filter = makeFilter(defs, `
      <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  .2126 .7152 .0722 0 0" result="l"/>
      <feComponentTransfer in="l" result="t"><feFuncA type="linear" slope="9" intercept="-9"/></feComponentTransfer>
      <feComposite in="SourceGraphic" in2="t" operator="in"/>`);
  } else if (type === 'organic') {
    filter = makeFilter(defs, `
      <feTurbulence type="fractalNoise" baseFrequency="${Number(o.scale) || 0.0045}" numOctaves="4" seed="${Number(seed) || 1}" result="n"/>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1 0 0 0 0" result="a"/>
      <feComponentTransfer in="a" result="t"><feFuncA type="linear" slope="16" intercept="-16"/></feComponentTransfer>
      <feComposite in="SourceGraphic" in2="t" operator="in"/>`);
  }
  // Fixed random reveal order, stable across frames.
  const cellOrder = (() => {
    if (type !== 'grid') return [];
    const { cols, rows } = o;
    const cx = (cols - 1) / 2, cy = (rows - 1) / 2;
    const cells = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const onCross = Math.abs(c - cx) < 0.51 || Math.abs(r - cy) < 0.51;
      cells.push({ c, r, rank: (Math.abs(c - cx) + Math.abs(r - cy)) + (onCross ? 0 : 0.6) });
    }
    const max = Math.max(...cells.map((x) => x.rank));
    cells.forEach((x) => { x.rank /= max || 1; });
    return cells;
  })();
  const r = rng(seed);
  const barJitter = Array.from({ length: o.count || 0 }, () => r() * 0.12);

  return {
    options: o,
    apply(a, b, raw) {
      const p = ease(clamp(raw));
      clear(a); clear(b);
      switch (type) {
        case 'dissolve':
          b.style.opacity = p.toFixed(4);
          break;
        case 'push':
        case 'whip': {
          const [vx, vy] = vector(o.dir);
          const dx = vx * W, dy = vy * H;
          a.style.transform = `translate3d(${dx * p}px,${dy * p}px,0)`;
          b.style.transform = `translate3d(${dx * (p - 1)}px,${dy * (p - 1)}px,0)`;
          if (type === 'whip') {
            // Blur follows measured speed so it peaks mid-move and vanishes at rest.
            const speed = Math.abs(ease(clamp(raw + 0.02)) - ease(clamp(raw - 0.02))) / 0.04;
            const amount = Math.min(140, speed * 46);
            filter.node.firstElementChild.setAttribute('stdDeviation', vx ? `${amount} 0` : `0 ${amount}`);
            const url = `url(#${filter.id})`;
            a.style.filter = url; b.style.filter = url;
          }
          break;
        }
        case 'cover': {
          const [vx, vy] = vector(o.dir);
          b.style.transform = `translate3d(${vx * W * (p - 1)}px,${vy * H * (p - 1)}px,0)`;
          a.style.transform = `translate3d(${vx * W * p * 0.25}px,${vy * H * p * 0.25}px,0)`;
          a.style.filter = `brightness(${(1 - p * 0.35).toFixed(3)})`;
          break;
        }
        case 'wipe': {
          const span = 100 + o.soft * 100;
          const edge = p * span;
          const mask = `linear-gradient(${o.angle}deg, #000 ${edge - o.soft * 100}%, transparent ${edge}%)`;
          b.style.maskImage = mask; b.style.webkitMaskImage = mask;
          break;
        }
        case 'iris': {
          const radius = Math.hypot(W, H) * p;
          b.style.clipPath = `circle(${radius.toFixed(1)}px at ${o.x * 100}% ${o.y * 100}%)`;
          break;
        }
        case 'bars': {
          const n = o.count;
          let d = '';
          for (let i = 0; i < n; i++) {
            const local = clamp((clamp(raw) - (i / n) * 0.4 - barJitter[i]) / 0.5);
            const e = ease(local);
            if (o.axis === 'y') {
              const h = H / n, y = i * h;
              d += `M0 ${y}H${W * e}V${y + h + 0.5}H0Z`;
            } else {
              const w = W / n, x = i * w;
              d += `M${x} 0H${x + w + 0.5}V${H * e}H${x}Z`;
            }
          }
          b.style.clipPath = `path('${d || 'M0 0'}')`;
          break;
        }
        case 'grid': {
          const { cols, rows, gap = 0 } = o;
          const cw = W / cols, ch = H / rows;
          let d = '';
          for (const cell of cellOrder) {
            const local = clamp((clamp(raw) - cell.rank * 0.5) / 0.5);
            const e = curve('in-out-strong')(local);
            if (e <= 0) continue;
            const x = cell.c * cw + gap / 2, w = cw - gap;
            const h = (ch - gap) * e, y = cell.r * ch + gap / 2 + (ch - gap) * (1 - e);
            d += `M${x} ${y}H${x + w}V${y + h}H${x}Z`;
          }
          b.style.clipPath = `path('${d || 'M0 0'}')`;
          break;
        }
        case 'luma':
        case 'organic': {
          // Bright areas arrive first; threshold sweeps from white to black.
          const slope = type === 'luma' ? 9 : 16;
          const fa = filter.node.querySelector('feFuncA');
          // Fractal noise clusters near mid-grey, so its threshold sweeps that band, not 0..1.
          const threshold = type === 'luma' ? 1 - p * 1.14 : 0.74 - p * 0.5;
          fa.setAttribute('intercept', String(-slope * threshold));
          b.style.filter = p >= 0.999 ? '' : `url(#${filter.id})`;
          break;
        }
        case 'zoom':
          a.style.transform = `scale(${1 + p * 0.5})`;
          a.style.opacity = (1 - clamp(p * 1.6 - 0.3)).toFixed(3);
          b.style.transform = `scale(${0.82 + 0.18 * p})`;
          b.style.opacity = clamp(p * 2 - 0.4).toFixed(3);
          break;
        default:
          break;
      }
    },
    reset(a, b) { clear(a); clear(b); },
  };
}

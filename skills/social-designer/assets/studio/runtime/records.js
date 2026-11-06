// Structured list controls share defaults and validation with the visual editor.
export const RECORDS = {
  edits: { defaults: { in: 0, out: 1 }, required: ['in', 'out'], numbers: ['in', 'out'], nonnegative: ['in'], range: ['in', 'out'] },
  words: { defaults: { w: '', s: 0, e: 0.4 }, required: ['w', 's', 'e'], strings: ['w'], numbers: ['s', 'e'], nonnegative: ['s'], range: ['s', 'e'] },
  broll: { defaults: { src: '', at: 0, dur: 2 }, required: ['src', 'at', 'dur'], strings: ['src'], numbers: ['in', 'at', 'dur'], nonnegative: ['in', 'at'], positive: ['dur'] },
  clips: { defaults: { src: '', role: 'open', text: '', in: 0 }, strings: ['src', 'role', 'text'], numbers: ['in', 'beats'], nonnegative: ['in'], positive: ['beats'] },
  beats: {
    defaults: { role: 'explain', visual: 'statement', text: '' }, required: ['role', 'visual'], strings: ['role', 'visual', 'text', 'label', 'items', 'left', 'right', 'leftItems', 'rightItems', 'src', 'voice', 'prefix', 'suffix'],
    numbers: ['value', 'from', 'fill', 'cols', 'decimals', 'duration'], positive: ['duration'],
    kindField: 'visual', kinds: {
      statement: { defaults: { text: '' }, required: ['text'] },
      stat: { defaults: { value: 0, label: '' }, required: ['value', 'label'] },
      dots: { defaults: { value: 10, fill: 5, text: '' }, required: ['value'], positive: ['value', 'cols'], nonnegative: ['fill'], integer: ['value', 'fill', 'cols'] },
      list: { defaults: { text: '', items: '' }, required: ['items'] },
      compare: { defaults: { left: '', right: '', leftItems: '', rightItems: '' }, required: ['left', 'right', 'leftItems', 'rightItems'] },
      flow: { defaults: { items: '' }, required: ['items'] },
      image: { defaults: { src: '', text: '' }, required: ['src'] },
    },
  },
};

const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const record = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

export function recordDefaults(control, item = {}) {
  const spec = control.record;
  if (!spec) return { ...Object.fromEntries((control.fields || []).map((key) => [key, control.choices?.[key]?.[0] ?? ''])), ...item };
  const kind = item[spec.kindField] ?? spec.defaults?.[spec.kindField];
  return { ...structuredClone(spec.defaults || {}), ...structuredClone(spec.kinds?.[kind]?.defaults || {}), ...item };
}

export function validateRecords(control, items) {
  if (!control.record) return null;
  const spec = control.record;
  for (let index = 0; index < items.length; index++) {
    const item = items[index];
    const fail = (message) => `item ${index + 1}: ${message}`;
    if (!record(item)) return fail('must be an object');
    const kind = item[spec.kindField];
    if (spec.kinds && !own(spec.kinds, kind)) return fail(`choose a supported ${spec.kindField}`);
    const extra = spec.kinds?.[kind] || {};
    for (const key of [...(spec.required || []), ...(extra.required || [])]) if (!own(item, key)) return fail(`missing ${key}`);
    for (const key of spec.numbers || []) if (own(item, key) && (typeof item[key] !== 'number' || !Number.isFinite(item[key]))) return fail(`${key} must be a finite number`);
    for (const key of spec.strings || []) if (own(item, key) && typeof item[key] !== 'string') return fail(`${key} must be text`);
    for (const key of [...(spec.positive || []), ...(extra.positive || [])]) if (own(item, key) && item[key] <= 0) return fail(`${key} must be greater than 0`);
    for (const key of [...(spec.nonnegative || []), ...(extra.nonnegative || [])]) if (own(item, key) && item[key] < 0) return fail(`${key} must be at least 0`);
    for (const key of extra.integer || []) if (own(item, key) && !Number.isInteger(item[key])) return fail(`${key} must be a whole number`);
    if (spec.range && item[spec.range[1]] <= item[spec.range[0]]) return fail(`${spec.range[1]} must be after ${spec.range[0]}`);
    for (const [key, choices] of Object.entries(control.choices || {})) if (own(item, key) && !choices.includes(item[key])) return fail(`choose a supported ${key}`);
    if (kind === 'dots' && item.fill > item.value) return fail('fill cannot exceed value');
    if (own(item, 'decimals') && (!Number.isInteger(item.decimals) || item.decimals < 0 || item.decimals > 20)) return fail('decimals must be a whole number from 0 to 20');
  }
  return null;
}

// Measured facts about the rendered file. These do not replace watching and listening.
import { execFileSync, spawnSync } from 'node:child_process';

export function probe(file) {
  const raw = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', file]).toString());
  const v = raw.streams.find((s) => s.codec_type === 'video');
  const a = raw.streams.find((s) => s.codec_type === 'audio');
  const [n, d] = v.r_frame_rate.split('/').map(Number);
  return { duration: Number(raw.format.duration), width: v.width, height: v.height, fps: n / d, videoCodec: v.codec_name, pixelFormat: v.pix_fmt, audioCodec: a?.codec_name ?? null, bytes: Number(raw.format.size) };
}

const logOf = (args) => spawnSync('ffmpeg', args, { encoding: 'utf8', maxBuffer: 1 << 28 }).stderr || '';

export function qa(file) {
  const facts = probe(file);
  const log = logOf(['-hide_banner', '-i', file, '-vf', 'blackdetect=d=0.2:pix_th=0.06,freezedetect=n=0.0005:d=2', '-an', '-f', 'null', '-']);
  const black = [...log.matchAll(/black_start:([\d.]+) black_end:([\d.]+)/g)].map((m) => ({ start: Number(m[1]), end: Number(m[2]) }));
  const freezes = [...log.matchAll(/freeze_start: ([\d.]+)[\s\S]*?freeze_end: ([\d.]+)/g)].map((m) => ({ start: Number(m[1]), end: Number(m[2]) }));
  // Whole-frame brightness swings; approximates the WCAG general-flash test for full-screen changes only.
  const stats = spawnSync('ffmpeg', ['-v', 'error', '-i', file, '-vf', 'scale=64:-2,signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=-', '-an', '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 1 << 28 }).stdout || '';
  const luma = [...stats.matchAll(/YAVG=([\d.]+)/g)].map((m) => Math.max(0, (Number(m[1]) - 16) / 219) ** 2.2);
  const flashes = maxFlashesPerSecond(luma, facts.fps);
  let loudness = null;
  if (facts.audioCodec) {
    const e = logOf(['-hide_banner', '-nostats', '-i', file, '-af', 'ebur128=peak=true', '-vn', '-f', 'null', '-']);
    const tail = e.slice(e.lastIndexOf('Summary:'));
    loudness = { lufs: Number(tail.match(/I:\s+(-?[\d.]+) LUFS/)?.[1]), truePeak: Number(tail.match(/Peak:\s+(-?[\d.]+) dBFS/)?.[1]) };
  }
  const warnings = [];
  if (black.some((b) => b.end - b.start > 0.3)) warnings.push('Long black section found.');
  if (flashes > 3) warnings.push(`Up to ${flashes} full-frame flashes in one second. WCAG limit is 3.`);
  if (loudness && loudness.truePeak > -1) warnings.push(`True peak ${loudness.truePeak} dBFS is high.`);
  return { facts, black, freezes, flashesPerSecondMax: flashes, loudness, warnings };
}

export function maxFlashesPerSecond(luma, fps) {
  const turns = [];
  let anchor = luma[0] ?? 0, dir = 0;
  luma.forEach((v, i) => {
    const change = v - anchor;
    if (Math.abs(change) >= 0.1 && Math.min(v, anchor) < 0.8) {
      const d = Math.sign(change);
      if (d !== dir) { turns.push(i); dir = d; }
      anchor = v;
    } else if (dir && Math.sign(change) === dir) anchor = v;
  });
  let best = 0;
  for (let i = 0; i < turns.length; i++) {
    let j = i;
    while (j + 1 < turns.length && turns[j + 1] - turns[i] <= fps) j++;
    best = Math.max(best, Math.floor((j - i + 1) / 2));
  }
  return best;
}

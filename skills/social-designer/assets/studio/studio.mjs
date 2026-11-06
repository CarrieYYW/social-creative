#!/usr/bin/env node
// Studio CLI. One project.json drives the editor preview, stills and video.
import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { KIT, listTemplates, projectFile, readProject, startServer, templatePath } from './lib/server.mjs';
import { audioPreview, check, render, renderBoard, renderStills } from './lib/render.mjs';
import { newProject, validateProject } from './runtime/schema.js';

const [command, ...rest] = process.argv.slice(2);
const flags = {};
const args = [];
for (const a of rest) {
  const m = a.match(/^--([\w-]+)(?:=(.*))?$/);
  if (m) flags[m[1]] = m[2] ?? true; else args.push(a);
}
const loadTemplate = async (id, dir = '.') => import(pathToFileURL(templatePath(id, resolve(dir))).href);
const print = (items) => {
  if (!items.length) return console.log('No findings.');
  for (const l of items) console.log(`${l.level.toUpperCase().padEnd(5)} ${l.rule.padEnd(20)} ${l.where ? `[${l.where}] ` : ''}${l.message}`);
};

// --scenes means every scene; --scenes=N means the first N.
const sceneList = (flag) => {
  if (flag === undefined) return undefined;
  if (flag === true) return 'all';
  const count = Number(flag);
  if (!Number.isInteger(count) || count < 1) throw new Error(`--scenes needs a whole number of at least 1, not "${flag}".`);
  return [...Array(count).keys()];
};

const usage = `Studio: editable post and reel templates

  node studio.mjs templates                    List templates
  node studio.mjs new <template> <dir> [--format=reel]
  node studio.mjs edit <dir> [--port=4310]     Open the visual editor server
  node studio.mjs check <dir> [--format=post] [--variant=B]
  node studio.mjs board <dir> [--format=post] [--variant=B]   Storyboard sheet and beat list
  node studio.mjs still <dir> [--format=post] [--scenes[=N]] [--at=0.4,2]
  node studio.mjs render <dir> [--draft] [--format=post] [--variant=B]`;

async function main() {
  switch (command) {
    case 'templates': {
      for (const id of listTemplates()) {
        const { meta } = await loadTemplate(id);
        console.log(`${id.padEnd(20)} ${meta.status.padEnd(13)} ${meta.formats.join(',').padEnd(26)} ${meta.summary}`);
      }
      break;
    }
    case 'new': {
      const [id, dir] = args;
      if (!id || !dir) throw new Error(usage);
      if (existsSync(projectFile(dir))) throw new Error(`${dir} already has a project.json.`);
      const template = await loadTemplate(id);
      mkdirSync(join(dir, 'assets'), { recursive: true });
      writeFileSync(projectFile(dir), `${JSON.stringify(newProject(template, flags.format), null, 2)}\n`);
      writeFileSync(join(dir, '.gitignore'), '.cache/\n');
      if (!existsSync(join(dir, 'brief.md'))) copyFileSync(join(KIT, 'brief-template.md'), join(dir, 'brief.md'));
      console.log(`Created ${join(dir, 'project.json')}`);
      break;
    }
    case 'edit': {
      const dir = resolve(args[0] || '.');
      const server = await startServer(dir, {
        port: Number(flags.port || 4310),
        actions: { render, check: (r) => check(r), audioPreview },
      });
      console.log(`Studio editor: ${server.url}\nProject: ${dir}\nPress Ctrl+C to stop.`);
      break;
    }
    case 'check': {
      const dir = resolve(args[0] || '.');
      const project = readProject(dir);
      const template = await loadTemplate(project.template, dir);
      const errors = validateProject(project, template);
      if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; return; }
      const { lint, info } = await check(dir, { format: flags.format, variant: flags.variant });
      console.log(`${project.template} / ${flags.format || project.format} / ${info.duration.toFixed(1)} s`);
      print(lint);
      if (lint.some((l) => l.level === 'error')) process.exitCode = 1;
      break;
    }
    case 'still': {
      const dir = resolve(args[0] || '.');
      const project = readProject(dir);
      const format = flags.format || project.format;
      mkdirSync(join(dir, 'exports'), { recursive: true });
      const { info, files } = await renderStills(dir, {
        format, variant: flags.variant,
        out: join(dir, 'exports', flags.out || `still-${format}.png`),
        times: flags.at ? String(flags.at).split(',').map(Number) : undefined,
        scenes: sceneList(flags.scenes),
      });
      console.log(files.join('\n'), `\n(${files.length} of ${info.scenes.length} scenes)`);
      break;
    }
    case 'board': {
      const dir = resolve(args[0] || '.');
      const project = readProject(dir);
      const template = await loadTemplate(project.template, dir);
      const errors = validateProject(project, template);
      if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; return; }
      const board = await renderBoard(dir, { format: flags.format, variant: flags.variant });
      console.log(readFileSync(board.table, 'utf8'));
      print(board.lint);
      console.log(`\nSheet: ${board.sheet}\nBeats: ${board.table}`);
      break;
    }
    case 'render': {
      const dir = resolve(args[0] || '.');
      const project = readProject(dir);
      const template = await loadTemplate(project.template, dir);
      const errors = validateProject(project, template);
      if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; return; }
      const started = Date.now();
      let last = '';
      const result = await render(dir, { draft: !!flags.draft, format: flags.format, variant: flags.variant, force: !!flags.force }, (p, m) => {
        const line = `${Math.round(p * 100)}% ${m}`;
        if (line !== last && process.stdout.isTTY) process.stdout.write(`\r${line.padEnd(40)}`);
        last = line;
      });
      console.log(`\n${result.file}\nStill: ${result.poster}\nSheet: ${result.sheet}`);
      console.log(`${result.report.facts.width}x${result.report.facts.height} ${result.report.facts.fps}fps ${result.report.facts.duration.toFixed(2)}s, audio: ${result.report.facts.audioCodec ?? 'none'}, ${((Date.now() - started) / 1000).toFixed(0)}s to render`);
      if (result.report.loudness) console.log(`Loudness ${result.report.loudness.lufs} LUFS, true peak ${result.report.loudness.truePeak} dBFS`);
      for (const w of result.report.warnings) console.log(`WARN  ${w}`);
      print(result.lint);
      break;
    }
    default:
      console.log(usage);
  }
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });

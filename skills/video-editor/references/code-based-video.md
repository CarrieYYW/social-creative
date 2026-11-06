# Code-Based Video Production

Use when code is an appropriate editable source for motion graphics, animated quotes, diagrams, explainers, or footage compositing. Respect an existing editor/project preference and inspect available tools before selecting an engine. A code-rendering route is optional; do not build an application or install a stack merely because the user asked for an edit. [Studio](studio-system.md) needs no installation and suits most short-form template work. Use an engine such as Remotion when a project already has it or needs something Studio does not do; check its licence for company use.

## Establish the production contract

Inspect the existing project, package/engine versions, render scripts, entry point, composition, source assets, and delivery requirements. Verify current official documentation and licensing for a selected engine; do not assume it is free for every use or available in this host. Use the project's lockfile and existing commands rather than replacing its dependencies blindly.

Record the inputs that determine a reproducible render:

| Input | Required decision |
|---|---|
| Copy and source map | Approved words, source attribution, footage in/out points, and narrative beats |
| Timing | Actual narration/footage, checked word or phrase timings, units, frame rate, and time origin |
| Asset manifest | Local source paths, logos/fonts/images/footage, rights/context, and unresolved gaps |
| Treatment | Project typography, palette, caption roles, layout/motion intent, and sound palette |
| Composition | Entry point/ID, dimensions, duration, frame rate, editable files, and output path |
| Audio assembly | Whether narration/music/effects are inside the composition or assembled later, and who produces the final mix |
| Reproduction | Exact render command, parameters, engine/dependency versions, assets, and verification performed |

A visual-only render is not a finished spoken video. If audio is assembled later, preserve that step and inspect the resulting final file, not just the silent intermediate. A silent animated quote may be the intended deliverable; state that choice rather than treating silence as a missing component automatically.

## Build from actual timing

Use checked narration timings as production inputs. Correct important names and words against the audio, establish seconds versus milliseconds, and distinguish source time from edited-timeline time. After cuts, map source spans to the edited timeline; do not attach original timecodes to a shortened audio file unchanged. Recalculate alignment after narration, speed, or edit changes.

Map semantic beats to visuals, captions, and sound. Word timing can anchor a reveal without requiring every word to pop separately. Hold complete thoughts long enough to read; decorative emphasis and accessible captions can have different roles. Keep visual density compatible with the simultaneous speech.

Drive scene state and motion from the renderer's frame/time model so seeking and rendering a frame give a reproducible result. Avoid wall-clock timers or browser-only animations that drift between preview and export. Resolve assets/fonts before frame capture, and keep nondeterministic data out of the render or pin it explicitly.

For Remotion specifically, inspect the installed version and the official [frame API](https://www.remotion.dev/docs/use-current-frame), [caption workflow](https://www.remotion.dev/docs/captions/), [render command](https://www.remotion.dev/docs/cli/render), and [still command](https://www.remotion.dev/docs/cli/still). Frames are zero-indexed and local scene frames can differ from composition frames. Make timing units and sequence offsets explicit rather than hiding them in scattered constants.

## User-facing fine-tuning

When users should adjust the video directly, follow [visual editing](visual-editing.md). Expose appropriate composition and mix parameters through a working control panel using the same validated, saved state as the renderer. Preserve scene overrides and replacement assets on reopen; a CSS overlay or browser monitor-volume change alone does not change the exported film. Prefer existing controls over adding a separate application.

## Render, inspect, and revise

Use existing project scripts when present. These example commands illustrate an installed Remotion project; replace the entry point, composition ID, frame, and paths with actual project values and verify the local CLI before running. They do not install dependencies or constitute a render performed by this skill file.

```sh
npx --no-install remotion still src/index.ts Main out/review.png --frame=120
npx --no-install remotion render src/index.ts Main out/review.mp4
```

Choose review frames around difficult cuts, caption changes, overlaps, animation extremes, and the ending; a representative frame alone cannot verify the timeline. Run the project's type/build checks when applicable, render a rough sequence before expensive finishing, then inspect actual output with the main skill's playback, sound, and delivery checks. Type checking and stills do not prove correct timing, audio, or a complete export.

For expensive renders, use available low-resolution/partial previews and cache reusable components; verify the engine’s actual options. A caption or logo change need not regenerate footage or reanalyze unchanged speech. See [reviewable editing](reviewable-editing.md) for cost accounting and version-bound notes.

Keep successful components and timing stable during revisions. If a voice change affects alignment, propagate it through captions, scenes, sound, and duration; if only color changes, avoid rewriting the narrative. Deliver a rendered file plus editable code/assets and the tested render recipe where supported. If rendering fails or playback is unavailable, report the concrete stage and coverage gap without calling a plan, still, or silent intermediate a verified finished video.

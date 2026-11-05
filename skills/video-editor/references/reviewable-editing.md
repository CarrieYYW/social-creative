# Affordable, Reviewable AI Editing

Use for AI edits of existing footage, choosing an editing route, controlling revision cost, or timecoded feedback. AI should execute supported edits and produce files when that is requested. Keep a reproducible source, make review inexpensive, and use human feedback for editorial decisions that remain uncertain. This reference is a working method, not a benchmark of any provider. The dated evidence and tradeoffs are in [the research notebook](ai-editing-research-2026-11-03.md).

## Choose the smallest capable route

| Situation | Useful route | Check before committing |
|---|---|---|
| Existing editor/project | Supported native integration, API, scripting, or timeline import | Installed edition/version, exposed operations, backup/version support, media paths, actual render/export access |
| Straightforward footage edit | AI-planned cut list plus installed local media tools | Accurate cuts, audio continuity, frame/timebase handling, caption realignment, reproducible assembly |
| Quotes, diagrams, repeatable motion graphics | Code-rendered components, optionally composited over footage | Deterministic timing, license, render cost, editable copy/assets; see [code-based production](code-based-video.md) |
| Speech-first rough cut with a suitable existing account | Text-based editor/agent | Media allowances, AI credits, current API/export support, editable handoff limitations |
| A specific missing shot | Stock, controlled compositing, or selective generation | Visual fit, rights, continuity, price and retry allowance; see [footage generation](ai-video-tools.md) |

Prefer purpose-built tool operations over fragile repeated UI clicking when both are available. Use UI automation as a supported fallback and report unfinished operations. Do not force every footage edit into a graphics engine or rebuild an existing project to suit a favorite tool. Vendor integrations and community bridges are different products; verify their origin and capabilities.

## Keep changes reversible

Preserve originals and version the editable project, source, or edit recipe. For a simple edit, a concise recipe is enough; for a longer project, use a structured source/timeline map. Record stable clip IDs, source identity/path or hash, source in/out, edited in/out, timing units, frame rate/timebase, speed changes, overlays, audio, and export settings as applicable. A custom `edit.json` is only a recipe; do not mislabel it OTIO, FCPXML, or a native editor project.

Inspect media before choosing cuts. Retain transcript/analysis results keyed to the unchanged source and analysis settings. Use proxies where useful, keeping their relationship to originals explicit, especially for variable frame rate, synchronized audio, and nonzero source timecode. Invalidate dependent timing/captions/caches after source, voice, speed, or structural changes.

Treat silence/filler detection and automatic clip ranking as proposals. Preserve complete thoughts, qualifiers, expressive pauses, breaths, and intentional music or visual beats. Audition edit boundaries and verify words against audio; a clean transcript cannot establish natural pacing. Fast stream-copy seeking can land on keyframe boundaries; check exact cuts and re-encode when necessary rather than assuming a command's requested timestamp guarantees the result.

Keep speech, music, captions, and graphics separately editable where practical. Cache selected generated shots and reusable graphic components. A caption or logo fix should not trigger fresh transcription, new generated footage, and a rewritten narrative. Imported timelines need an actual import/playback check: fonts, animations, sequences, effects, and audio may not transfer intact. Keep a reference movie alongside the handoff.

For direct user adjustments, follow [visual editing](visual-editing.md). Use a supported editor or a control panel connected to the actual composition and render settings; the feedback helper below remains a review-only tool.

## Review a version, then revise it

Produce a playable draft with sound at an economical resolution before expensive finishing when the task warrants it. Label its version and preserve its editable source. A contact sheet helps locate scenes but cannot replace temporal or audio review. A single-file correction may proceed straight to the complete export.

Use an existing review service/editor if it suits the project. Otherwise [the bundled local review helper](../scripts/make_review.py) creates a portable player and downloadable feedback for an already-rendered MP4; it performs no editing or transcoding:

```sh
python3 /path/to/video-editor/scripts/make_review.py /path/to/draft.mp4 --output /path/to/review-v01 --version v01
```

Resolve the script from the installed skill, not a hardcoded personal path. Open the generated `index.html` in a browser, or serve the folder locally if the browser restricts file playback. Video seeking over HTTP requires a server with media byte-range support; a basic static server may play the file but fail to seek. Keep `index.html`, `review.mp4`, and `review-context.json` together and unchanged. Generate a new packet for revised media; replacing the MP4 manually would invalidate its recorded identity. Use a browser-playable MP4, commonly H.264/AAC; the helper checks container identification but does not validate codec playback. Notes are held in memory until downloaded. It needs no account, network API, or additional Python package. Reopen the same packet and import its downloaded notes to resume.

Capture feedback against the exact draft: version, media identity, point or time range, requested change, and what should stay fixed. The helper uses elapsed seconds and `HH:MM:SS.mmm`, not frame-accurate SMPTE timecode. For frame-specific work use the editor's actual frame rate/timecode. Natural-language notes are welcome; the agent can organize them.

After editing, map old notes through the source/timeline decisions; do not blindly apply an old timestamp to a shortened version. Keep a concise change log including resolved, deferred, or ambiguous notes. Show the affected sequence with enough surrounding context, then verify the final full assembly. Partial previews do not prove the complete export. Recheck captions and synchronization after timing changes.

## Budget for accepted edits

Before substantial metered work, establish the user's budget or a bounded trial. Count incremental agent/model usage, transcription, generation, service credits, render/compute, storage/transfer, and necessary licenses; show existing subscription entitlement separately from new cash spend. Track human setup/review time separately. Do not call an edit free because it used a subscription or local hardware.

Use **cost per accepted deliverable**: total relevant trial/revision cost divided by accepted deliverables. State what's included and unknown; a model-token receipt alone is not an all-in estimate. For a new route, measure a representative sequence's spend, latency, output quality, and effort to make a realistic revision before scaling. Set a retry/time allowance proportionate to the task. Continue within the agreed scope; stop or switch methods when failures repeat or the next step would exceed the allowance. Do not make every inexpensive local correction an approval request.

Check current official pricing, licensing, tool availability, and export limits when selecting a service. Published tutorials and this notebook are dated evidence, not a current price guarantee. Retain the actual chosen route, spend/credits if observable, editable files, reproduction commands, review coverage, and unresolved limitations with the project.

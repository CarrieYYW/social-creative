# Studio: editable templates

Use for any quote, reel or explainer that should stay editable, and whenever the user and the agent will refine a piece together. Studio is in [assets/studio](../assets/studio/README.md). It needs Node 22+, Chrome or Chromium, and ffmpeg. Nothing to install. An existing native-editor preference still wins; Studio is the default when no editor is preferred.

## How the collaboration works

`project.json` is the single source of truth. The editor preview, stills and video all read it.

- The user edits in the browser. Changes autosave to the file.
- The agent edits the file. The open editor updates within about a second.
- Pinned notes save into `notes` with their time, so the agent reads them directly.

For a feedback round: read `notes`, edit named values, run `check`, render a draft, inspect it. Do not rebuild anything for a routine change.

## Work in this order

For a new video, this sits inside the [production workflow](production-workflow.md), which sets the stages and sign-offs.

1. **Story.** Follow [story and hooks](story-and-hooks.md) and fill in `story`.
2. **Project.** Create it in the active client project, for example `social/2026-11-05-title/`, never inside the plugin. Put brand values from the brief in `brand`.

```sh
node <skill>/assets/studio/studio.mjs templates
node <skill>/assets/studio/studio.mjs new quote-editorial social/my-post --format=reel
```

3. **Open the editor** for the user, in the background:

```sh
node <skill>/assets/studio/studio.mjs edit social/my-post
```

4. **Check** before showing anything, and treat findings as design notes:

```sh
node <skill>/assets/studio/studio.mjs check social/my-post
```

5. **Storyboard.** `board` writes one sheet of real frames and a beat list with timing, and takes about a second on a text project. Add `--variant=B` to compare a second direction.

```sh
node <skill>/assets/studio/studio.mjs board social/my-post
```

6. **Render a draft, inspect, then render final.** Read the contact sheet and frames around each transition.

```sh
node <skill>/assets/studio/studio.mjs render social/my-post --draft
node <skill>/assets/studio/studio.mjs render social/my-post
node <skill>/assets/studio/studio.mjs render social/my-post --variant=B
node <skill>/assets/studio/studio.mjs still social/my-post --format=post
```

Each render writes a numbered video, the matching settings, a still, a contact sheet and a QA report to `exports/`, so feedback stays tied to a version.

## Choose a template

| Video type | Template | Key inputs |
|---|---|---|
| Quote, calm | `quote-editorial` | quote, attribution, optional image |
| Quote, loud | `quote-poster` | quote, attribution |
| Motion explainer | `explainer` | beats with a role and a visual |
| Talking head | `talking-head` | clip, keep ranges, word timings, hook, B-roll |
| Event promo or recap | `event-promo` | clips with roles, music and tempo, title, date, place |

All templates are experimental until the user accepts one in a named context. Record acceptance or rejection with the project. If none fits, copy the closest into `<project>/templates/<id>.js` and change it there; a local template wins over the plugin's. Promote it only after alternate content works and the user has accepted it.

## Translate feedback into values

| They say | Change |
|---|---|
| "Bigger", "more impact" | `scale`, or a shorter line |
| "Too fast" | `speed`, `hold`, `pace: reading` |
| "Feels dead" | a stronger `reveal`, `drift`, or a better image, before adding effects |
| "Too busy" | fewer transition types, less `grain`, a simpler `reveal` |
| "Can't read it" | `scrim`, position, shorter copy; run `check` for contrast |
| "Wrong shot here" | reorder `clips`, change `focus`, swap `src` |
| "Change the opening" | add a variant rather than overwriting |

## Footage

Word timings come from a transcription tool, in source seconds: `[{"w":"Hello","s":0.1,"e":0.4}]`. Check names against the audio. Cut with `edits`, a list of keep ranges. Captions and audio follow automatically; do not hand-adjust their timing. Tempo for cuts comes from `bpm`; confirm it against the music, then watch that cuts land.

## Report honestly

- `check` and the QA report are measurements. They do not replace watching and listening.
- An agent can inspect frames and read loudness, but cannot judge how sound feels. Say so.
- Contrast is measured against the frame where text comes to rest. Moving footage can differ.
- Safe areas are working defaults. Meta's published Reels ad guidance is available as `safeProfile: "meta-ads"`. Third-party figures for organic overlays disagree widely, so confirm current guidance for a platform-ready claim. Adjust with `safe` in `project.json`.
- Font licences are the project's responsibility. Use `brand.fonts` to load licensed files from `assets/`. System fonts will not exist on another computer; `missing-font` catches this.
- Rendered output is not proof of taste or performance.

## Not built yet

Beat detection from music, a demo or how-to template, a dedicated narrated-clips template, subject cut-outs for type behind people, a dedicated carousel layout (explainer beats export as stills with `--scenes`, or the first few with `--scenes=N`), speed ramps within a clip, and native project export to Premiere or Final Cut.

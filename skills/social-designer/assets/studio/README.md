# Studio

Editable post and reel templates. One `project.json` drives the live preview, stills and video, so a change made in the browser and a change made from chat land in the same place.

Status: experimental. Tested in draft and final renders with sample content; no template has yet been accepted by a user or measured with an audience. Footage templates were tested with placeholder clips only.

Requires Node 22+, Chrome or Chromium (or `CHROME_PATH`), and ffmpeg. There are no npm dependencies.

```sh
node studio.mjs templates
node studio.mjs new quote-editorial ./my-post --format=reel
node studio.mjs edit ./my-post          # http://127.0.0.1:4310
node studio.mjs check ./my-post
node studio.mjs board ./my-post         # storyboard sheet and beat list
node studio.mjs render ./my-post --draft
node studio.mjs render ./my-post
node studio.mjs still ./my-post --format=post
node studio.mjs still ./my-post --scenes  # every scene; --scenes=3 for the first three
node --test test/*.test.mjs
```

`new` adds a `brief.md` from `brief-template.md`, keeping one that already exists. It records the story, script, beats and decisions for the piece. `board` numbers its output separately from renders: `exports/board-001.png` and `.md`.

## project.json

```json
{
  "studio": 1,
  "template": "quote-editorial",
  "format": "reel",
  "fps": 30,
  "seed": 7,
  "motionBlur": 0,
  "brand": { "paper": "#F3EFE7", "ink": "#161412", "accent": "#B5492B", "muted": "#6F6A62", "display": "New York", "text": "Helvetica Neue", "fonts": [] },
  "story": { "audience": "", "takeaway": "", "hookType": "", "promise": "", "payoff": "", "shareReason": "" },
  "values": { "quote": "Forever\nis composed\nof *nows.*" },
  "variants": [{ "name": "B", "values": { "reveal": "resolve" } }],
  "audio": [{ "src": "assets/music.wav", "gain": -8, "fadeOut": 1 }],
  "notes": [{ "t": 3.2, "text": "Hold this longer" }]
}
```

`values` holds the template's named controls. Unknown names are errors. In text, a return is a hard line break and `*asterisks*` mark emphasis. `brand.fonts` loads licensed files: `{ "family": "My Serif", "src": "assets/my-serif.otf", "weight": 400 }`. `audio` accepts files and generated sounds (`synth:room`, `synth:air`, `synth:whoosh`, `synth:tick`, `synth:thud`, `synth:rise`). Set `"cues": false` to mute a template's accents, or `cueGain` in dB to change them.

## Add a template

A template is a file in `templates/` exporting `meta`, `controls` and a pure `build(ctx)`. The editor generates its panel from `controls`. A project can hold its own in `<project>/templates/<id>.js`.

`build` returns scenes of layers: `text`, `image`, `video`, `rect`, `svg`, `group`, `counter`, `captions`. Everything is a function of time, so never use timers or `Math.random`; use `ctx.seed`. Start the hook with a negative `start` so frame one is not blank. Treat the still as a design in its own right: `ctx.mode` is `still` for post exports.

## Files

- `runtime/`: browser engine, type, transitions, checks. Shared by preview and export.
- `lib/`: Chrome control, server, renderer, audio, QA.
- `editor/`: visual editor.
- `templates/`: one file per template.

The server binds to 127.0.0.1 and refuses other hosts, cross-origin writes and paths outside the project. `.cache/` is disposable.

The canonical copy lives in `skills/video-editor/assets/studio`. `scripts/sync_studio.py` copies it into `skills/social-designer/assets/studio`, and the brief template into `skills/social-content/assets`, so each skill stays self-contained.

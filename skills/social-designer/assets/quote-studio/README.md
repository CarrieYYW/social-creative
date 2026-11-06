# Quote studio — type and material prototype

Status: experimental, browser-verified starting treatments; user taste approval remains open. Four original type/material presets plus an image-led preset with uploaded, sourced or AI-generated media. This is a focused 4:5 quote editor, not a carousel manager or a reel renderer.

## Run and use

Requires Python 3.9+ and a modern browser; no package installation or account is needed. Run from the active project directory with the actual path to this editor. Choose an output folder in the active client project, outside the editor and packaged skill/plugin source. The server and image helper reject folders inside those distributed source trees so client exports/media cannot enter a later skill ZIP.

```sh
python3 /path/to/quote-studio/serve.py --output ./quote-artifacts --port 8787
```

Open <http://127.0.0.1:8787/?project=my-brand>. The project name scopes browser persistence. Fonts are bundled under the SIL Open Font License; keep `fonts/` and the included license files with the editor.

Starting styles: Atmosphere, Clean type, Handwritten note, Image & serif, Graphic poster. They preserve words, attribution and an uploaded image. Choose background and type independently afterwards. Image & serif needs a PNG/JPEG/WebP; its export stays disabled until an image is provided or another background is selected. A duotone poster can use an original abstract color field or an uploaded image.

Texture options are None, Fine grain, Paper fibers and Dust & speckles, with independent strength and scale. The deterministic texture layer sits below live text. Clean type starts without texture. Materials are original procedural artwork; no reference-account image, texture, logo, text or paid preset is bundled.

Save project writes complete JSON in the chosen project output folder; Export editable SVG embeds typefaces and retained image data with live text; Export PNG produces 1080×1350 through the same SVG composition. File links appear after successful save. Keep exported state/media within their intended privacy scope. SVG import/editability in a specific native design application is not certified; the bundled typefaces remain available if that application ignores embedded fonts.

Restore JSON through the file control or the Paste a saved project panel. Review and Apply/Cancel are inline. Restore and Reset style are undoable. Reset style keeps words, attribution, footer and image. Ordinary changes persist in this browser; save a project for a portable copy. Browser storage capacity varies with uploaded-image size, so retain exported files rather than relying on localStorage alone.

## Implementation and verification

`core.js` owns validated state and presets. `app.js` builds the shared SVG for preview and export; preview zoom does not change its logical dimensions. Media is retained as image data. Text overflow is reported and prevents artwork export; wording is never silently shortened. Designed Cormorant italic letterforms are bundled; unavailable mono weights and non-serif italics are disabled.

The server binds to 127.0.0.1, rejects noncanonical Host headers, exposes an explicit static/export allowlist, keeps project artifacts outside distributed skill/plugin source, and requires the local page key and same-origin check for writes. It performs no shell commands or remote media fetches. Fonts come from the official Google Fonts repository: Cormorant Garamond (regular/italic), Inter, Caveat and IBM Plex Mono; source copyright and license notices are in `fonts/*-OFL.txt`. They are substitutes for the studied typography roles, not claimed exact font identifications.

```sh
node --test core.test.cjs app.async.test.cjs
```

Six state/brief tests cover preserving words/media across styles, complete settings round-trip, invalid/unsafe state, and recoverable empty drafts. Browser checks covered PNG/SVG export with embedded fonts, style changes, texture adjustment with undo, file import followed by Cancel, pasted project Apply and reload, retained embedded image/crop, overflow blocking and recovery, and 320/390 CSS-pixel layouts without horizontal overflow. Main controls measured at least 44×44px; physical phone/screen-reader acceptance remains untested. A native file chooser caused a long automation delay, motivating the alternative paste route.

An original short draft was exported in Atmosphere, Clean type, Handwritten note and Graphic poster. A synthetic test image verified image crop/softening and PNG export; it is not an approved creative asset. Native design-app import, a complete carousel, video motion and audience response were not tested by this prototype.


## Find or generate backgrounds

Open **Find or generate an image**. Choose Quiet water & mist, Botanical detail, Warm window light, Tactile everyday objects or Abstract atmosphere, then describe a subject and where the words should sit. These are original directions drawn from the [partial reference study](../../references/quote-style-study-2026-11-05.md); see [image sourcing](../../references/image-sourcing.md) for evidence, provenance and assistant instructions.

- **Find stock:** opens real Pexels/Unsplash searches, or saves a brief asking your AI assistant to find and return reviewed images. Stock website searches run outside this editor; downloaded images can be uploaded manually.
- **Generate with AI:** prepares an editable brief and a local request. Copy it into chat for your assistant to process with its available image-generation tool. This editor does not invoke a model or charge a paid API automatically. It starts no background worker.
- **Project images:** refresh after the assistant returns an image. Inspect the source and Image notes, then Use background. It retains words/type/colors and any existing duotone, centers the new crop, and supports Undo. Check contrast; applying an image does not certify readability.
- **Saved image requests:** reopen a saved brief after a reload, or cancel a waiting request. Cancellation prevents the helper from returning new results for that request. Cancelled and ready requests remain part of the local record.

The assistant reads requests and registers real reviewed images with `image_jobs.py`; the complete workflow and commands live in [image sourcing](../../references/image-sourcing.md). Requests, source credit, rights notes and actual images are stored in the configured output folder, never bundled into this skill. Saved quote JSON retains embedded media and image provenance; manual uploads begin with unrecorded license information. Image files must be PNG/JPEG/WebP under 8 MB. The server exposes only generated image/export filenames and keeps the library manifest off the static/export allowlist.

An original AI background and a credited, source-verified stock photograph were tested through request → return → apply → PNG/JSON/SVG workflows on macOS. The assistant must inspect the real image, not fulfil a request with a placeholder. Both creative samples are trial directions; taste acceptance and audience response remain project-level questions.

```sh
python3 -m unittest image_store_test.py server_test.py
```

The focused image-store tests cover project-scoped listing, cancellation, provenance retention, unsupported requests and file types. The browser controls reuse this editor's existing buttons, neutral palette, disclosures, form styles and visible focus; request history is secondary to the current image choices. No new app-wide visual system or motion convention was introduced.

Image-library access uses standard-library process locks (`fcntl` on Unix, `msvcrt` on Windows). macOS was exercised; Windows runtime behavior remains unverified.

## Scoped post-implementation review — 2026-11-05

A separate Design Lead review in Thorough mode inspected the actual assisted image flow, then fixed request reopening after reload, stale handoffs after brief edits/cancellation, session recovery wording and crowded history. Final rendered checks covered desktop, 320/390 CSS-pixel layouts, expanded source notes, long brief input, keyboard focus, empty/error/cancel/reopen states, real generated/stock image application, undo and retained-image reload. Actual PNGs were inspected and the generated-image SVG was exported. Six Node tests, two Python tests, API file/auth boundaries and skill packaging passed. Scoped outcome: PASS for the tested macOS assisted flow; this is not universal creative acceptance, an engagement finding or full accessibility certification. Browser-level text zoom, physical-phone/screen-reader behavior, forced appearance modes, Windows runtime and native design-app SVG import remain unverified. Detailed screenshots, source fingerprints, original tuning and sample exports are retained in the active project’s image-controls review record.


## Release guard regressions

Eight async regressions cover out-of-order decode completion, correct geometry before export, Cancel/new project/Undo during restore, later uploaded-image selection, and library-image cancellation/application. Image dimensions are associated with their exact retained URI; a superseded decode cannot change the active crop. A validated project is captured before Apply awaits its image, so a newer review or cancellation cannot replace that candidate midway through restoration.

Four boundary regressions cover rejection of foreign Host headers before key/library reads, normal canonical-loopback access, and output-folder protection in plugin, standalone-skill and standalone-editor layouts. The shared guard in `quote_paths.py` is used by both server and image helper, follows resolved paths, and protects the owning skill and detected plugin root as well as the editor directory. These are source/harness checks; the release's separate rendered UX/UI review must inspect the revised interactions before completion.

# Quote studio — type and material prototype

Status: experimental, browser-verified starting treatments; user taste approval remains open. Four original type/material presets plus an image-led preset with uploaded, sourced or AI-generated media. This is a focused 4:5 quote editor, not a carousel manager or a reel renderer.

## Editor interface

The working editor uses an editorial workspace with **Text**, **Style**, **Image** and **Project** panels. Save project and PNG export are always in the header; the latest saved output appears in the footer. Style cards preview starting treatments without changing the current artwork until selected. Left/Right and Home/End navigate section tabs. On phones, the Preview link returns to the canvas. See [interface design and behavior](DESIGN.md) for the canonical direction and responsive rules.

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

The server binds to 127.0.0.1, rejects noncanonical Host headers, exposes an explicit static/export allowlist, keeps project artifacts outside distributed skill/plugin source, and requires the local page key and same-origin check for writes. It performs no shell commands. Direct stock search/import contacts only fixed HTTPS Openverse API paths; it rejects arbitrary download URLs and redirects and bounds reads/timeouts. Only a selected image is copied into the project library. Fonts come from the official Google Fonts repository: Cormorant Garamond (regular/italic), Inter, Caveat and IBM Plex Mono; source copyright and license notices are in `fonts/*-OFL.txt`. They are substitutes for the studied typography roles, not claimed exact font identifications.

```sh
node --test core.test.cjs app.async.test.cjs
```

Six state/brief tests cover preserving words/media across styles, complete settings round-trip, invalid/unsafe state, and recoverable empty drafts. Browser checks covered PNG/SVG export with embedded fonts, style changes, texture adjustment with undo, file import followed by Cancel, pasted project Apply and reload, retained embedded image/crop, overflow blocking and recovery, and 320/390 CSS-pixel layouts without horizontal overflow. Main controls measured at least 44×44px; physical phone/screen-reader acceptance remains untested. A native file chooser caused a long automation delay, motivating the alternative paste route.

An original short draft was exported in Atmosphere, Clean type, Handwritten note and Graphic poster. A synthetic test image verified image crop/softening and PNG export; it is not an approved creative asset. Native design-app import, a complete carousel, video motion and audience response were not tested by this prototype.


## Find or generate backgrounds

Open the **Image** tab, then choose **Find stock** or **Generate with AI**. Choose Quiet water & mist, Botanical detail, Warm window light, Tactile everyday objects or Abstract atmosphere, then describe a subject and where the words should sit. These are original directions drawn from the [partial reference study](../../references/quote-style-study-2026-11-05.md); see [image sourcing](../../references/image-sourcing.md) for evidence, provenance and assistant instructions.

- **Find stock:** automatically loads public-domain photo options from Openverse when the Image tab first opens. Search directly, change the image direction for new suggestions, or use Previous/More images. **Use background** downloads the available source image into the project and applies it without a site visit or upload. The search uses anonymous public API access; no account/key is needed. Results show source-reported CC0/Public Domain Mark labels, creator, dimensions and source/license links; they are search matches, not independently verified rights or AI-curated designs. **Other stock sources** retains optional external Pexels/Unsplash links. The separate AI brief can request a curated selection.
- **Generate with AI:** prepares an editable brief and a local request. Copy it into chat for your assistant to process with its available image-generation tool. This editor does not invoke a model or charge a paid API automatically. It starts no background worker.
- **Project images:** includes directly imported photos and images returned by your assistant. Refresh after an assistant return. Inspect the source and Image notes, then Use background. It retains words/type/colors and any existing duotone, centers the new crop, and supports Undo. Check contrast; applying an image does not certify readability.
- **Saved image requests:** reopen a saved brief after a reload, or cancel a waiting request. Cancellation prevents the helper from returning new results for that request. Cancelled and ready requests remain part of the local record.

Direct import uses `stock_images.py`; the assistant route reads requests and registers real reviewed images with `image_jobs.py`; the complete workflow and commands live in [image sourcing](../../references/image-sourcing.md). Requests, source credit, rights notes and actual images are stored in the configured output folder, never bundled into this skill. Saved quote JSON retains embedded media and image provenance; manual uploads begin with unrecorded license information. Image files must be PNG/JPEG/WebP under 8 MB. The server exposes only generated image/export filenames and keeps the library manifest off the static/export allowlist.

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

## Direct stock search — implementation

`stock-panel.js` loads suggestions on first opening Image, uses explicit Search/Enter for edited terms, and switches direction queries automatically. Searches are cached for 15 minutes in server memory, with normal pagination capped at three 12-item pages per query. Only search words are sent to Openverse, not the quote or project name. Thumbnails use Openverse URLs without a page referrer. No stock files enter the local library until selected.

Import re-fetches provider metadata and accepts only CC0/Public Domain Mark records, uses a strict UUID with the fixed Openverse full-size image endpoint, and saves provenance with the image. URLs/license fields supplied by the browser are not trusted. Payloads are bounded to 8 MB and redirects are refused. A Cancel selection/newer image choice prevents a late result applying; an already completed download can remain in the project library. The image remains available offline after import, and repeated selection reuses the existing project image. Search has visible loading/empty/retry feedback. Source outages/rate limits do not affect saved images or quote editing.

```sh
node --test core.test.cjs app.async.test.cjs stock-panel.test.cjs
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest image_store_test.py server_test.py stock_images_test.py
```

The anonymous [Openverse API](https://api.openverse.org/v1/) search/detail/full-size image endpoints were verified 2026-11-06. The service's reported license data is retained as reported; its metadata is not an independent rights check. Direct photo lookup does not change the explicit chat handoff for AI generation.

A separate final Thorough UX/UI review exercised real direct search/download, imported-image export, Undo, cancellation, empty/recovery, pagination/mode changes, keyboard and 320/390px layouts. Scoped PASS for the tested local macOS browser flow, with 31 automated checks passing; this does not certify indexed licenses, physical devices, screen readers or browser text enlargement. Existing artwork settings matched the saved baseline exactly after the trial.

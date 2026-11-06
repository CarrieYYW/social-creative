# Editable Static Mockups

Use for quote posts, carousels, and other static designs the user should be able to fine-tune. Deliver a genuinely adjustable source alongside a rendered preview. Match the editing experience to the person and the available tools; editable code alone is not a convenient visual editor for a nontechnical user.

## Choose a supported handoff

Reuse the user's existing editor and source project when possible. Ask about a preferred editor only when the choice materially changes the deliverable and cannot be inferred. Verify current tool capabilities and format/import support before promising a native file or conversion.

| Route | Suitable use | Handoff requirement |
|---|---|---|
| Native design document | User already works in an accessible design tool | Real editable frames/layers, named text roles, usable assets, and access to the actual document; verify the native result |
| Studio project | No editor preference, or the post may also become a reel | [Studio](../assets/studio/README.md) gives live controls, autosave, reopen and export from one `project.json` |
| Standalone HTML/CSS mockup with controls | No editor preference and browser-based fine-tuning suits the user | Local preview, visible controls, saved edits that reopen correctly, and a working export/render path |
| SVG with live text | Compact vector handoff to a compatible editor | Separate text and graphic elements, required fonts/assets, and checked rendering in the intended editor |
| Editable slide document | User prefers a slide editor and available tooling supports it | Separate text boxes/shapes and correctly sized canvases, with an inspected export |

These are alternatives, not a requirement to generate four formats. A native tool or renderer is not bundled by this skill. Do not call an uploaded flat image, an SVG wrapping a single screenshot, or outlined lettering fully editable. Do not promise arbitrary SVG/HTML import will preserve native layers in another tool. If the requested native format is unavailable, state the gap and provide a usable supported alternative.

## Preserve meaningful controls

Keep quote, attribution, logo, imagery, and decoration separate. Use real text for quotes and attribution; generated imagery can supply a background without baking essential words into it. Preserve the supplied source quotation for comparison. User changes to the words need the same attribution/quotation checks as any new copy.

Expose the controls that matter for this composition: quote and attribution; font family/size/weight; line height and tracking; intentional line breaks; text alignment; margins/text width; foreground/background/accent colors; and image replacement, crop, position, or overlay strength where relevant. Preserve the brand's typography and palette as sensible starting values. A simple type-only post needs no image controls. Do not flatten a complex background into editable-looking layers that cannot actually be changed; disclose raster elements.

For carousels, keep each slide independently editable with shared styles for common roles. Make the distinction between changing one slide and changing the whole set clear. Retain slide order and per-slide overrides. Recheck the whole sequence after shared changes.

## Browser mockups

For a user without a preferred editor, prefer a portable local mockup with a small set of labeled controls when this is supported by the environment. Keep controls outside the export canvas. Use real project copy and assets; keep the design's logical export dimensions separate from its responsive on-screen zoom. Changing preview zoom must not change exported dimensions or line wrapping.

Use controls that can be operated by keyboard, visible focus, readable labels, and feedback for save/export errors. Preserve full text if it overflows; explain the fit issue rather than silently truncating it or rewriting a quotation. Use bundled fonts/assets where permitted or state the required fonts and tested fallbacks. Avoid mandatory accounts, paid tools, and unnecessary frameworks for a small mockup.

Provide a concrete save/reopen mechanism: a saved self-contained document or a clearly associated state file that restores the design. Form input values and transient DOM changes do not automatically persist when saving a page. Include any replacement images and typography settings needed to reproduce the user's selected result. Never label a browser tab's unsaved state a saved editable file.

Only show an image-export control if it really produces the design at the intended size. Check fonts, images, clipping, and controls exclusion in the actual export; browser display alone does not prove export fidelity. If export requires an agent-operated renderer, provide the editable mockup and preview, explain that path plainly, and state what has and has not been rendered. Do not build a general design application for a single post.

For stock discovery or AI backgrounds, use [image sourcing](image-sourcing.md): inspect the actual image, retain provenance, plan the text-bearing crop and keep the essential quote separate. In Quote Studio, requests are processed explicitly by the assistant in chat; returned assets enter the project library for review and undoable application.

## Verify and deliver

For a new editing route or substantially changed template, exercise a representative text/typography change and a relevant layout or image change. Save, close/reopen or reload from the saved source, and verify the changes survive. Inspect the preview/export against that saved revision. Reuse a previously checked route for small corrections without repeating a full tool trial.

Check **UX**: can the intended user find the controls, understand their scope, save/recover changes, and obtain the intended output? Check **UI**: does the design retain hierarchy, legible type, intentional spacing, contrast, and correct cropping after plausible edits? Report observed issues separately from usability or audience hypotheses.

Deliver the editable file/document, the matching preview, required assets or font information, and brief instructions for opening, adjusting, saving, and exporting. Name the tested editor/browser and inspection limits. Keep the editable source and render together under the same revision; do not supply a polished preview that no longer matches the adjustable design.

## Optional type and material studio

The [bundled quote studio](../assets/quote-studio/README.md) is a focused browser editing route for 4:5 quotes with live text, editable SVG/PNG output and project JSON. It offers independent type, image and material choices; use them where the project calls for them. Texture is optional, with strength/scale and a clean baseline. Keep the material under lettering, distinguish photo grain/paper/duotone/blur, and check contrast and actual exports. Its styles are experimental substitutes inspired by the [retained study](quote-style-study-2026-11-05.md), not exact creator fonts or universal brand defaults.

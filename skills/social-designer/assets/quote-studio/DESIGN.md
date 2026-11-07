# Quote Studio interface

Updated 2026-11-06. Canonical implementation: `index.html`, `style.css`, `workspace.js`. Artwork composition and portable project schema remain owned by `app.js` and `core.js`.

## Direction and scope

The user chose a redesign of the working editor and a bolder creative-tool direction with editorial character. This authorizes the direction; the specific rendered revision still awaits taste feedback. Keep this interface brand-neutral. A client quote, image or saved appearance must not become the tool's default.

Use a restrained editorial workspace: warm paper, dark ink, a neutral canvas surround, a mixed sans/italic-serif wordmark and a warm stone selection accent. Bundled Inter handles functional typography; bundled Cormorant italic handles the wordmark and footer. Use actual Caveat in the handwritten preset illustration. The interface's fonts and colors are independent of editable artwork settings.

`style.css :root` owns semantic colors, the 6px control radius and 160ms feedback timing. Reuse existing buttons, labeled native inputs, disclosures, 44px targets and visible focus. Selected states include a border/underline, weight or checkmark as well as color. Reduced motion removes transitions; forced colors retains outlines. The interface intentionally remains light in both OS appearances; no dark theme is advertised.

Design Compass's generated catalogue recommendation was consulted. Its marketing hero, saturated pink/cyan palette and thick neo-brutalist shadows were unsuitable for this existing editing task and the user's editorial constraint. They were not adopted.

## Task structure

- **Text:** exact quote, attribution/footer and typography/layout.
- **Style:** visual starting treatments, background mode, colors and texture.
- **Image:** automatic photo suggestions and direct import; optional AI brief; saved project images and disclosed upload/crop controls.
- **Project:** editable SVG, portable JSON restore and saved output history.

Save project and PNG export stay in the header. The latest saved output is directly linked in the footer so a header action never points to an invisible result. Full saved-file history remains in Project. Stock discovery uses the anonymous Openverse API and one-click local import. Curated assistant selection and AI generation retain their explicit chat handoff; no unattended paid model call is made.

Tabs support Left/Right, Home/End, one tab stop and semantic panel relationships. Navigation does not alter artwork or JSON schema. Selecting a preset is undoable; a customized preset is no longer shown as an exact match.

Desktop uses an independently scrollable inspector and a fitted canvas with persistent history/actions/status. Tablet uses a sticky preview alongside document-scrolling controls. At 700 CSSpx and below, preview leads into full-width controls, with sticky header/section navigation and an explicit Preview link. Switching sections returns to the start of that section. Native inputs use 16px mobile text. Preserve browser zoom.

## Review

A separate final Thorough UX/UI review on 2026-11-06 returned a scoped PASS for the tested macOS browser editor: desktop, 320/390px phones, 768px tablet and 800×450 landscape; keyboard, long/empty text, image Undo, restore recovery and actual JSON/PNG/SVG exports. Findings fixed: hidden save results, truncated font name, mobile section position, landscape preview fit, raw JSON error wording and wrapped footer feedback. Detailed evidence is retained in the active project’s Quote Editor Redesign review record. Physical devices, screen readers, browser text-only enlargement/200% zoom and alternate OS appearance runtime remain unverified. Tests and selected direction do not establish taste acceptance or audience performance.

## Direct image discovery refinement — 2026-11-06

The Image tab now leads with Find stock / Generate with AI, a shared direction, a compact search row and a two-column image gallery. Openverse photo options auto-load on first entry and on direction change. The user chooses an image before download/application; Cancel selection and Undo retain control. Existing media adjustments move into **Adjust current background**, keeping search/results in view. Use the existing tokens, native labels, 44px actions and image-card conventions. Cards retain available dimensions, photographer, source and source-reported license links. Detailed license verification is not claimed. No new app-wide color/type/motion convention was introduced.

A separate Thorough review of the final direct-search implementation returned a scoped PASS: real search/import/export, cancelled selection, empty-result recovery, pagination, mode changes, crop Undo, keyboard and 320/390px layouts. It fixed stale mode/direction results, late response application, excessive form height, buried media controls and stale empty-state wording. 31 automated tests and plugin/link checks passed. Detailed captures and exact-state comparison remain in the active project’s Direct Image Search review record. Physical-device/AT/text-zoom and alternate-OS runtime limits remain as noted above.

## Accent refinement — 2026-11-06

Replace the original lime highlight with warm stone (`--accent: #e6dfd4`), a softer neutral panel tint (`--accent-soft: #f0ece5`) and a warm dark focus/link color (`--focus: #655b4e`). This updates the shared selection/search/brand-mark treatment and recovery/handoff surfaces. Preserve selected borders, checks, underlines and keyboard outlines. Quote artwork colors and image grading remain independent. The user explicitly rejected the bright green in this editor; the exact replacement is a design recommendation pending feedback, not a universal preference for other brands.

A separate scoped Thorough UX/UI review checked the actual selected/unselected modes, selected preset/checkmark, keyboard outline, restore Cancel and 320px label containment. Scoped PASS; the neutral image-mode selection uses dark borders and stronger type in addition to its tint. Ink/stone contrast is 11.51:1; focus/link ink on the off-white surface is 6.59:1. Desktop/mobile captures and the exact feedback are retained in the active project's Neutral Accent review record. The exact replacement still awaits user feedback.

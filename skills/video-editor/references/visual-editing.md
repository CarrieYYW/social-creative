# Direct Visual Video Editing

Use when delivering videos users can fine-tune themselves, adding visual controls to a repeatable video treatment, or revising an existing interactive video project. Give users a working editing surface connected to the actual project, not only a flattened MP4, JSON, code, or feedback form. Keep the interface proportionate to the film and the user's tools.

## Choose a usable editing surface

Prefer the user's existing supported editor and native project. Its real text, transform, timeline, and audio controls may already satisfy the request. Verify the project opens with its media, layers, fonts, and supported effects; a file extension alone does not prove editability. Do not rebuild it as a web application just to add controls.

For code-rendered videos, expose relevant composition parameters through a small visual panel beside a playable, seekable preview. Reuse existing project controls when available. Connect the panel to the same composition, asset inputs, timing model, and saved settings used for export; follow [code-based production](code-based-video.md). Inspect the installed engine and current official documentation before implementing engine-specific controls. This plugin does not bundle a general video editor or renderer.

If the environment cannot provide direct editing, explain the specific gap and deliver the supported source plus preview and a concrete continuation path. Do not describe that fallback as a working visual editor. The [review packet helper](../scripts/make_review.py) only plays a rendered movie and collects notes; it neither modifies video nor becomes an editor by displaying sliders beside it.

## Expose relevant controls

Select controls from the content and project; a simple quote animation does not need every timeline operation.

| Area | Useful controls | Required relationship to the video |
|---|---|---|
| Captions and quote text | Text, font, size/weight, line height, colors, background, placement, readable text width | Live editable text and checked caption timings; do not pretend baked-in subtitles are separate layers |
| Layout and imagery | Crop/reframe, image replacement, fit, focal point, background, overlay strength | Update the actual composition; retain source resolution and media dependencies |
| Timing and motion | Clip/scene in/out, hold duration, caption timing, supported motion intensity or transition duration | Use explicit units/timebase, maintain source-to-edited mapping, and recompute dependent timing |
| Audio | Speech/music/effect gain, mute, fades, track replacement where supported | Persist actual mix settings with stated units; monitor volume on a player is not an exported track gain |
| Branding and scope | Palette, logo position/size, reusable style, selected scene versus whole film | Make global settings and local overrides clear; preserve unrelated scenes when changing one |

Keep an original/baseline revision and offer the editor's undo/reset or a clear way to restore saved settings. Explain affected scope before a consequential structural change. Replacing narration, changing speed, or cutting speech can invalidate captions, scene duration, and synchronization. Correct those dependencies rather than preserving stale timing. Editing a caption does not change the spoken words; do not imply otherwise.

Use existing assets and cached analysis. Ordinary styling adjustments should not trigger transcription, new footage generation, or a full high-quality render on every slider movement. Make expensive generation, voice changes, and final rendering explicit actions, with the existing [budget and review controls](reviewable-editing.md). Continue routine local refinements within the user's brief without approval gates on each adjustment.

## Save the edit, not just the preview

For code projects, keep a single validated settings representation with a revision/schema version, source/asset identities, timing units, composition dimensions/frame rate, global styles, relevant scene overrides, and mix settings as needed. Both preview and render must consume that state. Validate types, units, bounds, clip ranges, and missing assets before applying changes; retain the last valid state when an edit is invalid. A settings file is not a native timeline unless it actually uses that format.

Save the native project or provide a concrete save/reopen mechanism for the control panel. Copy or retain replacement media and font dependencies in the project/packet as appropriate; temporary browser file/blob URLs and unsaved form values do not survive a handoff. Restore selected assets, scene overrides, timing, and mix on reopen. Version the user's saved state so later AI edits preserve their choices and disclose conflicts rather than silently resetting them.

Keep responsive preview zoom separate from composition dimensions and media crop. Support playback/seeking with sound and relevant caption changes. Clearly label proxies, draft quality, incomplete assets, and settings changed since the last rendered draft. A styled overlay on top of an old MP4 is not proof that the final composition contains that edit.

Provide a real export path for the saved revision. Where an installed renderer can be connected safely, make the export action invoke it and show progress, failure, and the resulting file. If final rendering requires the agent, provide a clear save-and-render handoff and use those exact saved settings for the subsequent render. Do not offer a decorative export button, invent an endpoint, or silently change dimensions or timing to make export work.

## Verify and hand off

For a new control route or substantially changed template, exercise representative changes with actual project media: for example caption size/position, an image or scene adjustment, and music gain where present. Save, reopen, and verify those changes survive. Render from that saved revision and compare the affected frames, temporal behavior, and sound with the preview. Recheck synchronization after structural changes, then inspect the final assembly using the main skill's export checks. State coverage gaps; a successful render command is not a viewing/listening review.

Check **UX**: can this user locate the controls, distinguish scene/global scope, undo or recover, save/reopen, and understand rendering status and cost? Check **UI**: are controls labeled and keyboard accessible, focus visible, text readable, and the video's typography, spacing, contrast, crop, and hierarchy sound after plausible adjustments? Separate observed defects from usability or audience hypotheses.

Deliver the editing surface/project, saved revision, required dependencies or asset manifest, matching playable draft/final export, and brief opening/editing/saving/rendering instructions. Record the tested editor/engine and remaining limitations. Reuse this checked route for later small refinements; do not turn every correction into a new editor build.

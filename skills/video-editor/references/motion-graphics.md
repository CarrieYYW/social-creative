# Motion-graphics studies and reusable patterns

Use for typography animation, vector/shape sequences, graphic explainers and transitions whose craft needs closer study. Pair with [reference analysis](reference-analysis.md) and the existing [code production](code-based-video.md) and [visual editing](visual-editing.md) workflows as needed. This guide is a production study method, not an installed renderer or an accepted aesthetic.

## Study the construction

Watch the actual reference and identify how its visual idea develops through time. Capture selected frames around a change plus the intervening playback. A pleasing still cannot establish the quality of a movement.

| Area | Observe and record | Possible implementation to test; not proof of the creator's method |
|---|---|---|
| Type choreography | Character/word/line grouping; tracking and line-break behavior; overlap and holds | Text selectors or grouped text layers, per-unit time offsets, masks and clipping |
| Movement | Start/end poses, path, pivot, acceleration, settle and overshoot | Keyframe curves, frame-based interpolation, constrained springs or intentional stepped motion |
| Vector graphics | Stroke direction, drawing order, shape correspondence and changing negative space | Stroke dash progress, path interpolation or separately designed transition poses |
| Composition changes | What persists across a cut; occlusion, continuity and hierarchy | Masks/mattes, matched geometry, nested scenes and coordinated position/scale |
| Finish and rhythm | Texture, edges, blur, grain, material, silence and precise sound events | Tested compositing layers, seeded variation and time-aligned sound design |

Choose techniques because they explain the observed result and serve the message. Do not add all effects to every film or assume that more movement is better. When a UI motion skill is also loaded, distinguish interface responsiveness constraints from the needs of rendered graphics; this guide does not override explicit project rules. Propose an appropriate supported rendering route when the requested effect conflicts with those rules.

## Design the movement, then verify it

Establish representative compositions using actual copy. Plan anticipation/action/settle or another appropriate progression; specify start time, duration, stagger, curve, overlap and readable hold rather than “make it smooth.” Test the defining sequence at affordable review quality before costly finishing. Continue to the requested complete film; do not stop at a storyboard or demonstration when a deliverable can be rendered.

For deterministic code renderers, drive animation from frame/time, including masks, vector progress and seeded textures. Seek to the same frame repeatedly and compare preview with export. Verify the installed API before implementation. For path morphs, inspect intermediate contours, holes, twists and self-intersections; valid endpoint SVGs do not guarantee a good transition. Inspect moving text for broken shaping, kerning, awkward wraps and clipping.

A reusable template retains the source, settings/content schema, media dependencies, example render, exact reproduction steps and acceptance status described in [reference analysis](reference-analysis.md#make-an-executable-pattern-template). Parameters should preserve the pattern's defining relationships; a set of unrelated sliders is insufficient. Test alternate content and retain failed cases as limits. Do not claim a tutorial or documentation review establishes production mastery.

## Research seed — 2026-11-05

Coverage: primary documentation read. No reference film, tutorial playback, implementation trial or user taste acceptance is implied by these notes.

- [Adobe text animation](https://helpx.adobe.com/after-effects/using/animating-text.html): selectors can operate by characters, words or lines, with range/offset and easing controls. Application: study the unit and ordering of a reveal before approximating it with a generic fade.
- [Adobe speed controls](https://helpx.adobe.com/after-effects/using/speed.html): speed graphs expose how velocity changes between keyframes and how incoming/outgoing influence affects that progression. Application: describe acceleration and settling separately from total duration.
- [Remotion animation](https://www.remotion.dev/docs/animating-properties): frame-driven properties support reproducible rendering; wall-clock CSS transitions can flicker. Application: implement the observed timing on the composition timebase, with APIs checked against the installed version.
- [Remotion evolvePath](https://www.remotion.dev/docs/paths/evolve-path) and [interpolatePath](https://www.remotion.dev/docs/paths/interpolate-path): provide stroke-drawing progress and SVG path interpolation. Application: test graphic explanations and shape transitions, inspecting intermediate geometry rather than assuming endpoints establish quality.

Further study candidates, discovered from creator-published YouTube metadata only: [Ben Marriott's type-animation tutorial](https://www.youtube.com/watch?v=jS1YMWkm4DQ) and [his project/animatic breakdown](https://www.youtube.com/watch?v=tw_HJ1-NfrI). Playback, exact techniques and their suitability remain unverified. Select deeper research from the user's actual references instead of treating this list as a style prescription.

## Working craft defaults

Timing, curves, reveals and transition choices are in [motion craft](motion-craft.md). The luma, organic and grid mattes there are implemented in [Studio](studio-system.md) and were checked at intermediate frames with two photographs, not with footage or sound.

## Working example

The experimental [cross-grid template](../assets/cross-grid/README.md) includes a complete media-free demo, replaceable source layer, parameters and geometry tests. It is one implemented matte pattern, not a library of all methods mentioned in the [Studio Znaak study](studio-znaak-study-2026-11-05.md).

---
name: video-editor
description: Create, edit, or review videos, including reels, animated quotes, visual explainers, talking-head edits with B-roll, audio-to-video and long-form projects, and shorts drawn from recordings or batches of clips. Own visual direction, story structure, pacing, captions, sound, animation, and verified exports. Also use for video production pipelines, direct visual fine-tuning, and timecoded edit feedback. Static posts and carousels belong to social-designer when available.
---

# Video Editor

Turn the intended message and source material into a coherent viewing experience. Own the complete video, including its visual design, timeline, sound, and delivery. Adapt the process to the task; a caption correction does not require a new creative concept.

## Route the work

- **Create or edit:** produce the requested video with available tools, not just an edit plan. Inspect supplied footage and audio before making editorial decisions.
- **Review:** watch/listen to the actual edit when accessible, give timecoded observations and fixes, and state coverage gaps. A transcript-only review cannot establish pacing, image quality, or sound quality.
- **Creative direction:** propose a treatment, reference frames, or storyboard when that is the requested deliverable. Distinguish a concept from a rendered film.
- **Pipeline design:** define source ingestion, beat selection, sourcing/generation, assembly, captions, sound, export, and review as needed. Explain the editable source and repeatable controls; do not build an application when the user asked for an edit.

For a recording or clip collection that needs to become one or more shorts, follow [Source to shorts](references/source-to-shorts.md). It covers excerpt-only requests, source coverage, candidate selection, assembly and per-short review. For a cut assembled from one recording with verified source-timed captions, the [speech-short renderer](references/speech-shorts.md) can join selected passages, retain their audio and export retimed captions. For an insert, demo, or product animation, follow [Product and B-roll direction](references/product-and-b-roll.md) to decide what can be shown faithfully with the available material.

Story comes first. For any new video, read [references/story-and-hooks.md](references/story-and-hooks.md) and settle the audience, promise, payoff and share reason before choosing a treatment. Never promise virality.

For any new video, follow [references/production-workflow.md](references/production-workflow.md): story brief, script, storyboard, low-res draft, final, learn, with a sign-off that asks only what each stage can show. It also sizes the job, so small edits skip the stages.

For supported template edits, use Studio when no native editor is preferred. For source footage, [map the edit into Studio](references/footage-in-studio.md), including source versus edited timing. Studio has templates for quote, explainer, talking-head and event-promo videos, where one `project.json` drives the live preview, stills and video. Read [references/studio-system.md](references/studio-system.md). For type, timing, curves and transition choices, read [references/motion-craft.md](references/motion-craft.md).

For reels, animated quotes, explainers, and talking-head edits, read [references/short-form.md](references/short-form.md). For platform-ready delivery, read [references/platform-specs.md](references/platform-specs.md). Load [references/audio-design.md](references/audio-design.md) when working on sound and [references/ai-video-tools.md](references/ai-video-tools.md) when generating footage.

For a substantial new treatment, test the hardest passage with actual copy, assets and sound before repeating the design across the edit. Use the [craft review](references/craft-review.md) to judge the first export and bind repairs to the affected version.

For reference teardowns, repeatable treatments, or substantial beat/shot planning, read [references/reference-analysis.md](references/reference-analysis.md). State inspection coverage, connect timecoded observations to editorial purpose, and adapt the pattern to this brand. Simple edits do not require a separate analysis or shot list.

For motion-graphics studies and templates, read [references/motion-graphics.md](references/motion-graphics.md). Reference-led taste calibration belongs to the reference-analysis workflow; retain user feedback against actual rendered versions.

For a reusable project visual/sound treatment, read [references/project-treatment.md](references/project-treatment.md). For code-rendered motion graphics or compositing, read [references/code-based-video.md](references/code-based-video.md). Load these only when relevant; an existing editor preference or simple footage edit need not become a code project.

For AI edits of existing footage, editing-route selection, cost control, or draft feedback, read [references/reviewable-editing.md](references/reviewable-editing.md). AI should carry out supported edits, preserve editable decisions, and produce a playable draft. Use existing tools and entitlements before substantial metered work; verify the actual export route. Do not stop at an edit plan when the requested editing can be performed.

For videos users can fine-tune directly, read [references/visual-editing.md](references/visual-editing.md). Deliver a supported visual editing surface with the project: prefer existing native editor controls, or a focused panel connected to a code-rendered composition. Save user adjustments and use that same state for preview and export. A playback/feedback page is not an editing interface.

## Establish source and context

Consult the [learning index](references/learning-index.md) for relevant retained methods and source studies before related work; load matching records and the active project’s explicit feedback, preserving inspection, implementation and acceptance status.

Use the active project's existing brand brief or project-local `brand-brief.md`, source media, copy, and approved examples. Share that same brief with social-designer when available. Keep audience, intended takeaway, voice, visual/editorial language, references, destination, and production constraints with the project; this skill is brand-agnostic.

Preserve provenance for context derived from sites/accounts. Mark inferred preferences and unresolved claims rather than treating them as approved brand facts. Reuse project-specific treatments and asset manifests without carrying another brand's defaults forward.

Inspect source duration, orientation, frame rate, audio streams, and quality as relevant. Transcribe spoken material when useful, retaining source timecodes and checking important wording against the audio. Identify the actual clips, images, voice, music, logos, and fonts available. Keep source originals intact and retain an edit recipe or project that maps back to them.

For narration-led work, use checked word/phrase timing as a production input. Distinguish timing units and source versus edited time, remap after cuts, and realign captions/scenes/sound after voice or speed changes. Allow readable phrase holds rather than requiring word-by-word animation. Name the final audio-assembly step if rendering visuals separately.

Ask only for missing information that materially blocks the requested result. Use the user's editor/source-format preference where possible and discover available tooling before promising a native project or a generation service. If the platform is unspecified, state the review format; do not claim platform readiness until delivery requirements have been checked.

## Direct and build

1. **Find the story.** Identify the central idea, evidence or examples, emotional movement, and ending. Open on a clear subject and a real question, and pay it off. Preserve a speaker's meaning when shortening material; do not splice quotations into a claim they did not make.
2. **Choose the treatment.** Translate references into concrete choices about framing, typography, imagery, color, pacing, transitions, and sound. Explore alternatives when the direction is unresolved; refine an existing direction directly when it is clear.
3. **Establish a representative moment.** Use actual source content to test the visual language and caption readability. For a new video, make a storyboard with `studio.mjs board` or a rough sequence before rendering. Stop at sign-offs only when the user is working on the piece with you; a clear, small edit needs none.
4. **Assemble for meaning.** Cut around complete thoughts and intentional beats. Choose footage, graphics, animation, and silence for their editorial role. Preserve breathing room where the idea needs it; fast cuts and constant motion are not universal defaults.
5. **Finish deliberately.** Correct captions, refine timing, mix sound, align visual treatment, and inspect continuity. For animation, define what changes, why it moves, and how long the viewer needs to understand it.
6. **Revise with control.** Tie feedback to the exact draft version and time/range. State what stays fixed and what changes. Preserve successful timing, content, and visual relationships unless the problem calls for a broader rethink. Reuse unchanged assets/analysis, remap notes after structural cuts, and inspect the affected sequence before verifying the full final assembly.

For audio-to-video work, map transcript sections to narrative beats and visuals without adding unrelated B-roll. For long-form work, maintain the larger arc, chapter transitions, and recurring visual language while checking each local sequence. Scale the storyboard and edit recipe to the project.

## Verify the actual export

- Watch and listen to the rendered result when tools support playback; inspect frames at cuts, caption changes, and animation extremes. Check the full timeline for truncation, black gaps, frozen frames, missing media, drift, and unintended jumps. Do not describe sampled-frame checks as full playback.
- Check message clarity, reading/viewing order, pacing, and a relevant next action. Inspect typography, spacing, contrast, imagery, caption placement, and consistency at realistic phone size for mobile destinations.
- Correct caption words, names, punctuation, line breaks, timing, and attribution against the source. Distinguish captions from decorative emphasis text. Check the sound-off experience when meaning depends on speech.
- Listen for intelligibility, clipping, masking, clicks, sudden level changes, and synchronization. Inspect generated subjects, products, logos, and continuity; reject or repair defects visible in the final sequence.
- Inspect export metadata against the actual destination requirements. Differentiate technical checks, rendered review, user acceptance, and untested assumptions about retention or engagement.

Report precisely what was checked and any remaining gaps. If full playback or a required rendering capability is unavailable, name that limitation and do not label the output fully verified.

## Deliver and learn

Provide the rendered video when requested, an editable project or reproducible source supported by the chosen tools, and captions/cover assets as appropriate. For direct fine-tuning, include the working editing surface, saved settings, and instructions to reopen and render the selected revision; state concrete gaps rather than labeling code or a flat MP4 a visual editor. A flattened MP4 is not an editable timeline. Preserve source references, clip in/out points, overlays, audio decisions, and export settings in the project or a concise edit recipe. Never claim a native editing project was created if only a script or render exists.

Record useful feedback in the active brand/project context with the artifact, reason, applicable format, and constraints. Distinguish preferences from observed results and performance hypotheses. Reuse successful workflows without transferring another brand's style silently.

For tested edits, preserve the original and record the hypothesis, changed/fixed elements, actual outcome, limitations, and next decision. Testing an opening package cannot isolate its individual text, speech, and framing changes; a drop-off point alone does not establish why viewers left.

Handle an ordinary reel independently, including its graphics. For matching static assets, share the message, visual references, brand brief, and selected frames with social-designer when available. Content planning may use social-content; these companions are optional. Creating or editing media does not authorize publishing or scheduling.

# AI Video Editing: Cost, Control, and Review

Research date: **2026-11-03**. Purpose: choose practical methods for Social Creative to edit videos itself while keeping revisions affordable and inspectable.

## Synthesis

The strongest supported direction is a modular workflow: AI makes editable decisions about real footage; an appropriate editor or deterministic renderer executes them; the user reviews a versioned playable draft; revisions preserve successful work. Generate new footage for a specific missing shot rather than treating generation as the default way to edit existing media.

This is our synthesis, not a controlled comparison or proof of savings. Provider documentation establishes supported capabilities and constraints. Creator trials show concrete successes and failures, with setup, selection, incentives, and human intervention that limit generalization. No production edit, paid service trial, or audience-performance experiment was conducted for this research.

## What appears useful, and where it breaks

| Method | Supported use | Failure or cost to account for | Integration |
|---|---|---|---|
| AI-guided local footage editing | Repeatable trims, captions, assembly, audio operations using existing tools | Exact cuts, speech continuity, source/timeline remapping, local setup/compute; no automatic editorial understanding | Optional low-cash-cost route; retain source and executable recipe |
| Native editor control | AI operates supported actions inside an editable project | Edition/version restrictions, limited exposed operations, dependency on export access | Prefer an existing suitable editor; test one edit and export |
| Code-based graphics | Reusable typography, diagrams, animation plates, controlled composites | Slow iteration on an unsuitable design, full rebuilds, licensing and render costs | Use for graphics where it adds control; separate from the spoken cut when useful |
| Speech-first agent/editor | Rough cuts, transcript editing, captions and cleanup | Agent reasoning plus tools can both consume credits; arbitrary pauses and selected excerpts still need judgment | Consider existing entitlement; verify export route before automating |
| Timeline handoff | Editable rough cut followed by finishing in a preferred editor | Effects, animations and sequences may not round-trip | Import and compare with a reference MP4 |
| Generated footage | Specific shots unavailable from existing/stock material | Retry cost, temporal defects, visual mismatch; attractive stills cannot verify motion | Establish representative frames, bound trials, cache selected clips |

Avoid universal claims such as “Remotion is bad,” “AI edits for four cents,” or “one prompt replaces an editor.” The sources support narrower decisions about task fit. Over-trimming, poor excerpt selection, inconsistent graphics, and revision friction can negate initial automation savings. These are observed possibilities, not measured failure rates.

## YouTube evidence

Inspection used exported **auto-generated English transcripts**, with targeted passages for the two long creator trials and the complete transcript of the short official tutorial. These are not full playback or sound-quality reviews. Caption errors affect tool names; wording was interpreted in context. The transcript access does not establish visual fidelity, output quality, or the completeness of the creators' cost accounting.

### Sandy Lee AI — automation trial

[How I Fully Automated My Video Editing with Claude Code (No Hype)](https://www.youtube.com/watch?v=OjRiJRItPrY), published 2026-04-17. Targeted transcript coverage: approximately 00:00–09:30. Description includes a Descript affiliate link.

- **01:56–03:09:** distinguishes basic cleanup from disappointing/slow animation attempts in her workflow.
- **03:55–06:15:** describes a shortened cut, captions/B-roll, output shortcomings, and very low claimed edit costs. These are creator reports without reproducible all-in accounting.
- **07:00–08:58:** returns to a speech-first editor and reports higher credit consumption when routing through an additional agent layer.

**Lesson:** test narrow operations and count both orchestration and downstream usage. One creator's results neither condemn a graphics engine nor establish its cost for another project.

### Ali Abdaal — mixed workflow and visible intervention

[I Tried Fully Automating My Video Editing With AI (RAW RESULTS)](https://www.youtube.com/watch?v=C0jOKDJtK9s). Page title at research time; exact publication date not independently verified. Targeted transcript passages across the 46:33 video, including 05–06, 15–19, 25–34, 38, and 41–46 minutes.

- **15:36–17:24:** describes an unsatisfactory shortened selection and unnatural pacing/coherence.
- **25:00–34:00:** plans graphics, rerecords a shorter take, and combines an assisted/manually refined spoken edit with generated motion work.
- **41:45–46:00:** a logo revision illustrates rebuild friction; final enthusiasm follows hours of work. A “no extra” AI-spend claim excludes an earlier editor purchase and does not mean zero total cost.

**Lesson:** rough cuts and motion plates can be separate editable stages. This is evidence of a hybrid process and iterative labor, not an independent quality/cost benchmark or a fully autonomous end-to-end comparison.

### Descript — official editable handoff tutorial

[How to Export Your Descript Timeline to Premiere Pro, Resolve & Final Cut](https://www.youtube.com/watch?v=xU619_B69Fo). Complete 03:21 transcript inspected; vendor demonstration.

**00:37–02:34:** describes editor-specific timeline exports and media inclusion, then warns that some animations/sequences do not transfer. Useful as a rough-cut-to-finishing route. It does not prove lossless interchange for an arbitrary project; verify the destination import and preserve a reference movie.

## Primary documentation and dated constraints

### Local media tools and interchange

- [FFmpeg documentation](https://ffmpeg.org/ffmpeg.html), especially `-ss` and accurate seeking: stream-copy seeking and transcoded accurate cuts differ. Check actual edit boundaries. Local execution avoids a hosted generation charge but still uses compute, setup, and any upstream agent/transcription services.
- [Auto-Editor cookbook](https://auto-editor.com/docs/cookbook): adjustable margins/thresholds, preview and editor-export routes. Silence detection supplies candidate cuts, not an editorial style. Verify the specific CLI/app and license/tier; do not generalize a CLI capability to every hosted product.
- [OpenTimelineIO format specification](https://opentimelineio.readthedocs.io/en/latest/tutorials/otio-file-format-specification.html): use the actual schema/library and suitable adapters when interchange is needed. A made-up JSON cut list is not automatically an OTIO or native timeline, and an interchange format does not guarantee effects compatibility.

### Remotion

[Official agent skills](https://www.remotion.dev/docs/ai/skills) document supported coding-agent workflows. [License/pricing](https://www.remotion.dev/docs/license/pricing), snapshot on the research date: free use is conditional, including individuals/companies up to three people; listed company Creator pricing is $25/month per seat, while automation is $0.01/render with a $100/month minimum. Check applicable terms and current pricing before adoption. These figures exclude model usage and render infrastructure. Do not interpret a creator's “free” claim as universal licensing advice.

### Descript

[Underlord help](https://help.descript.com/getting-started/underlord-beta-your-ai-co-editor-in-descript) says reasoning and invoked tools both consume credits, and identical prompts can cost different amounts. [Usage documentation](https://help.descript.com/billing-payments-plans/track-and-understand-your-media-minutes-and-ai-credits) distinguishes media allowance from AI credits. [Pricing](https://www.descript.com/pricing) varies by plan/billing cadence; count actual allowances and overages rather than assuming unlimited AI.

The [API page](https://www.descript.com/api) is internally inconsistent at inspection: one section describes publication producing a downloadable file URL, while its limitations section says direct media exports are not supported. The linked endpoint reference and known-limitations page were not accessible through our research tool. **Unresolved:** verify the actual account/endpoint or do an export smoke test before promising unattended MP4 delivery. The page says paid-account API usage draws from existing AI/media allowances; orchestration is not cost-free merely because API access has no separate fee.

### DaVinci Resolve

[Blackmagic's September 8, 2026 announcement](https://www.blackmagicdesign.com/media/partial/release/20260908-03) describes native AI-assistant integration for project analysis, media organization, settings, highlight/removal tasks, and batch rendering. [Blackmagic's own Studio announcement](https://www.linkedin.com/posts/activity-7502954600224673792-SRtk) identifies Studio 21.1. The press-release wording also refers to a free download; that does not establish all integration features in the free edition. Verify installed edition, exposed operations, and current official setup documentation. Community MCP bridges are separate from the vendor integration. This research did not run Resolve or verify a complete automated edit/export.

### Review practices

[Frame.io's commenting documentation](https://help.frame.io/en/articles/9105251-commenting-on-your-media) describes point/range feedback; its [comparison viewer](https://help.frame.io/en/articles/9952618-comparison-viewer) supports version comparison with playback controls. Our adaptation is version-bound notes and playable previews, usable in an existing editor/service or a small local review packet. No paid review service is required by the skill. The local helper uses elapsed timestamps, not Frame.io's frame-accurate review system or its collaboration features.

## Decisions and remaining evaluation

Implemented in the 1.4.0 source update: optional guided setup, route selection, reversible edits, cached inputs, bounded spending, playable drafts, version-aware feedback, and a local MP4 review helper. Maintained instructions live in [reviewable editing](reviewable-editing.md), with generation and code-rendering details in their existing references. This notebook preserves rationale and evidence, not duplicate operational instructions. Publication/installation must be checked separately.

Next real-media trial: use representative supplied footage; compare the chosen route's first usable draft and one realistic revision. Record observed spend/credits, machine/render latency, setup/review time, preserved editable source, caption/audio issues, and final playback coverage. Test narrative selection separately from graphic polish. A synthetic helper test or successful package validation cannot establish creative quality, AI editing effectiveness, or audience results.

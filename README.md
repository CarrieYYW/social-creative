# Social Creative

A brand-agnostic social media plugin with guided setup and four independently usable production/strategy skills:

| Skill | Owns |
|---|---|
| [setup](skills/setup/SKILL.md) | A short, guided start for a new user or brand, tool discovery, a reusable brief, and the first useful asset |
| [social-marketer](skills/social-marketer/SKILL.md) | Project research, audience/competitor insight, channel strategy, campaigns, strategic experiments, and outcome review |
| [social-content](skills/social-content/SKILL.md) | Post copy, hooks, captions, scripts, repurposing, focused copy variants, and editorial calendars |
| [social-designer](skills/social-designer/SKILL.md) | Static quote posts, carousels, covers, thumbnails, and coordinated visuals |
| [video-editor](skills/video-editor/SKILL.md) | Reels, animated quotes, explainers, talking-head edits, audio-to-video work, animation, and longer videos |

The specialists reuse the active project's existing brand guide or project-local `brand-brief.md`. [Brand context guidance](skills/social-designer/references/brand-context.md) covers sources, inferred preferences, unresolved claims, audience, source copy, visual/editorial language, and feedback. Generic skills contain no particular brand's identity or results.

Social-marketer researches a new project's foundation and refreshes it for meaningful decisions. Social-content translates the direction into copy and a practical editorial plan; the production skills own their finished deliverables. Simple requests proceed directly from a clear brief without a four-role pipeline. Product UI design is outside this plugin's scope.

## Version 1.7.0 — footage to shorts

Ask Social Creative to turn a recording or folder of clips into distinct shorts. For example, “Turn this interview into two vertical shorts for first-time buyers. Keep the speaker’s qualifications, caption both cuts, and give me the editable projects.” The [video editor](skills/video-editor/SKILL.md) tracks which parts of the sources it reviewed, chooses moments that stand on their own, and checks each export. A transcript by itself supports a paper edit. A verified source-timed transcript plus media can support a rendered cut.

Use the [footage workflow](skills/video-editor/references/source-to-shorts.md) for selection and delivery, [product and B-roll direction](skills/video-editor/references/product-and-b-roll.md) for inserts, and [craft review](skills/video-editor/references/craft-review.md) for versioned revisions. For a speaking clip with checked source-timed SRT, the [speech-cut helper](skills/video-editor/references/speech-shorts.md) creates a captioned MP4, retimed SRT and editable source bundle using Python, Pillow, FFmpeg/FFprobe and Fontconfig. For an editable talking-head template, [map the decisions into Studio](skills/video-editor/references/footage-in-studio.md).

## Version 1.6.0 — editable templates and creative learning

**[Studio](skills/video-editor/assets/studio/README.md)** adds editable templates for quote, motion explainer, talking-head and event-promo videos. One `project.json` drives a live browser preview, stills and video, so edits made in the browser and from chat land in the same file. It runs on Node 22+, Chrome and ffmpeg with no packages to install. All templates are experimental: rendered and tested, not yet accepted or measured. Footage templates have only been tested with placeholder media.

**[Story and hooks](skills/video-editor/references/story-and-hooks.md)** puts story first, with a hook structure for any video, structures by video type and an [evidence record](skills/video-editor/references/story-research-2026-11-05.md) that lists the popular claims that failed verification. [Motion craft](skills/video-editor/references/motion-craft.md) and [quote design](skills/social-designer/references/quote-design.md) add working typography, timing and transition guidance.

**[Production workflow](skills/video-editor/references/production-workflow.md)** takes a new video through a story brief, script, storyboard, low-res draft and final, with a sign-off at each stage that asks only what that stage can show. Small edits skip the stages. [Script development](skills/social-content/references/script-development.md) writes a script from nothing or improves an existing one, and `studio.mjs board` makes a storyboard sheet and beat list. Studio steps have been run on sample projects; the whole workflow has not yet been run on a real project.

**[Quote Studio](skills/social-designer/assets/quote-studio/README.md)** adds a focused 4:5 quote editor with live typography, optional texture, image/crop controls, undo, saved project JSON, editable SVG and matching PNG exports. Its [image sourcing workflow](skills/social-designer/references/image-sourcing.md) offers reference-informed directions, stock search and an explicit assistant-in-chat generation handoff. Returned images enter a local project library; the editor starts no unattended model calls or paid API integration. Client images and exports stay outside plugin/skill source.

The [learning library](LEARNINGS.md) indexes source studies, reusable patterns and evidence limits. Release review also covers timing, adjacent transitions, variant media, saved-edit recovery and local file boundaries; see [release validation](RELEASE_REVIEW.md).

## Included from version 1.5.0

Adds a [direct visual video editing workflow](skills/video-editor/references/visual-editing.md): use an existing editor or a focused composition panel so users can fine-tune captions, layout, media, timing, motion, and audio as supported by the project. Saved adjustments must drive both preview and export, with undo/recovery, scene/global scope, and persistence checks. The included playback/feedback helper remains review-only. This release adds maintained production instructions, not a bundled editing engine or a tested universal video editor.

### Included from 1.4.0

Adds guided setup, a Codex setup entry point, and practical AI editing guidance for existing footage, native editors, code-based graphics, and speech-first tools. Video work now includes cost/retry controls, reversible sources, cached inputs, playable drafts, and version-bound feedback. A small local review helper packages an existing MP4 with downloadable timestamped notes; it does not edit or render video. [Dated research](skills/video-editor/references/ai-editing-research-2026-11-03.md) retains official documentation, three YouTube transcript analyses, counterexamples, and unresolved tool limits. These are implemented methods, not a measured quality or cost benchmark.

Quote posts and carousel mockups now default to an editable source plus a matching preview. The workflow prefers a supported existing editor, or a portable mockup with practical controls, and verifies save/reopen and export behavior. See [editable static mockups](skills/social-designer/references/editable-mockups.md). This is production guidance, not a bundled design editor.

## Reference-to-result workflow

Inspect actual evidence, extract a transferable pattern, adapt it to the project, produce and inspect the asset, test a clear hypothesis when useful, and retain the outcome. Apply only what the task needs. Use dated research and project-specific results rather than fixed posting quotas, reach multipliers, or unverified platform limits.

- [Project social marketing research](skills/social-marketer/references/project-research.md)
- [Content reference analysis and format cards](skills/social-content/references/reverse-engineering.md)
- [Focused creative testing and learning](skills/social-content/references/creative-testing.md)
- [Editable quote and carousel mockups](skills/social-designer/references/editable-mockups.md)
- [Eight-account quote/type/material study](skills/social-designer/references/quote-style-study-2026-11-05.md) and [experimental quote studio](skills/social-designer/assets/quote-studio/README.md)
- [Static reference analysis and variants](skills/social-designer/references/reference-analysis.md)
- [Video teardowns, beat plans, and shot coverage](skills/video-editor/references/reference-analysis.md)
- [Motion-graphics studies and working pattern templates](skills/video-editor/references/motion-graphics.md)
- [Bryan Hynes: filming, edit coverage and text roles](skills/video-editor/references/bryan-hynes-study-2026-11-05.md)
- [Studio Znaak methods study](skills/video-editor/references/studio-znaak-study-2026-11-05.md) and the experimental [cross-grid template](skills/video-editor/assets/cross-grid/README.md)
- [Direct visual video editing](skills/video-editor/references/visual-editing.md)
- [Affordable, reviewable AI editing](skills/video-editor/references/reviewable-editing.md)
- [Code-based video production](skills/video-editor/references/code-based-video.md)
- [Project visual and sound treatment](skills/video-editor/references/project-treatment.md)

## Installation and use

Share this public repository: [CarrieYYW/social-creative](https://github.com/CarrieYYW/social-creative). Both Codex and Claude Code install from its `main` branch. This repository contains only Social Creative and its research notes; it has no dependency on the private aya-plugins repository.

Install the CLI for your tool, then run its commands in a terminal.

### Codex

```sh
codex plugin marketplace add CarrieYYW/social-creative --ref main
codex plugin add social-creative@social-creative
```

Restart Codex after installation and confirm Social Creative is enabled in the plugin browser. See the [official marketplace documentation](https://developers.openai.com/plugins/build/plugins).

### Claude Code

```sh
claude plugin marketplace add CarrieYYW/social-creative
claude plugin install social-creative@social-creative --scope user
```

User scope makes the plugin available across projects on that machine. Start a new Claude Code session, or run `/reload-plugins` in an existing one. See the [official installation documentation](https://code.claude.com/docs/en/discover-plugins).

### Update an existing installation

For Codex, refresh this marketplace and install its latest snapshot:

```sh
codex plugin marketplace upgrade social-creative
codex plugin add social-creative@social-creative
```

For a user-scoped Claude Code installation:

```sh
claude plugin marketplace update social-creative
claude plugin update social-creative@social-creative --scope user
```

Restart Codex; start a new Claude Code session or use `/reload-plugins`. Existing conversations can retain skill instructions loaded earlier. User-scoped installations apply across projects on this machine; separately uploaded skill ZIPs need replacing too. Existing project files are not automatically migrated or restyled by a plugin update.

### Migrate from aya-plugins

Install and verify `social-creative@social-creative` first. If you previously installed `social-creative@aya-plugins`, remove only that old plugin to avoid loading both copies. Keep the aya-plugins marketplace if you use its other plugins.

For Codex:

```sh
codex plugin remove social-creative@aya-plugins
```

For a user-scoped Claude Code installation:

```sh
claude plugin uninstall social-creative@aya-plugins --scope user
```

Use the original scope if your old Claude Code installation was project- or local-scoped.

### Start here

After installation, ask: **“Help me set up Social Creative for my brand and make my first post or video.”** You can use `$setup` in Codex or `/social-creative:setup` in Claude Code. Codex packages the same skill as its optional setup entry point; choose setup when the host offers it. This is a conversational guide, not a separate onboarding application.

The guide reuses existing project context, asks only consequential missing questions, checks usable tools, and helps make a first asset. New users do not need to choose among specialist roles. A focused request with sufficient context goes directly to production. Your brand and feedback stay in your project; another installation starts with its own context.

For video, the AI can edit through supported integrations or reproducible scripts when those tools are available. It should supply a playable draft plus editable source or a reproduction recipe, then apply your feedback to that version. It checks existing tools/entitlements and relevant costs before substantial metered work. The plugin includes the Studio template renderer but no general timeline editor, subscriptions, credentials, or automatically connected accounts.

### Review a video locally

Use your preferred editor/review service or ask the agent to make a local review packet. The [bundled helper and workflow](skills/video-editor/references/reviewable-editing.md) let you play an existing MP4, add point/range notes, edit or remove them, and download feedback JSON for the agent. Keep all packet files together. Notes are held in memory until downloaded and can be imported into the same draft; no review subscription or network API is required. Codec playback and the final edited film still need inspection.

### Use the skills

Invoke the skill that owns the requested decision or deliverable and provide the active project's brand context. Both host manifests use the same physical `skills/` sources. This plugin supplies instructions and references; the host needs appropriate research/media tools for the task. A production plan is not a rendered video, and sampled frames are not full playback. Creating content or a calendar does not authorize publishing, account connections, messaging, or ad spend.

### Validate and package

From a checkout of this repository:

```sh
python3 scripts/sync_studio.py
python3 scripts/check_plugin.py
python3 scripts/pack_skills.py
python3 scripts/test_review.py
python3 scripts/test_speech_short.py  # Requires the speech-cut dependencies above.
node --test scripts/test_review_ui.js
node --test skills/video-editor/assets/studio/test/*.test.mjs
node --test skills/social-designer/assets/quote-studio/*.test.cjs
(cd skills/social-designer/assets/quote-studio && python3 -m unittest image_store_test.py)
```

The packer writes one standalone skill ZIP per skill under `dist/` for surfaces that accept skill uploads. Those uploads are separate installed copies and need to be replaced when updating. Package checks do not establish marketing or media quality.

## Research and retained learnings

Start with the [learning library](LEARNINGS.md): a topic/source catalogue, working-pattern index, evidence status and retrieval instructions. Each production/content/research skill includes a local learning index so standalone packages remain discoverable. Detailed notes keep their existing owners; private brand taste and feedback stay with the active project.

[Creative research and learnings](skills/social-content/references/creative-research.md) synthesizes source findings, evidence limits, rejected approaches, pending references, and their integration status. [Social marketing learnings](skills/social-content/references/social-marketing-research.md) retains audience, offer, distribution, and measurement lessons with applicability and evaluation limits. These notebooks live in social-content's references for packaging; the working methods live with their owning skills, without requiring other skill folders in a standalone package.

[AI editing research](skills/video-editor/references/ai-editing-research-2026-11-03.md) lives with video-editor so its standalone package retains the evidence for its editing methods.

Add reference batches to the relevant notebook and keep brand-specific artifacts, taste, strategy, and measured outcomes with the active project. Promote maintained methods into the owning skill/reference and link back instead of keeping duplicate instructions or treating proposals as completed features.

## Validation

Check frontmatter, metadata, local links, manifest alignment, standalone package contents, role boundaries, and installed-file parity. Evaluation scenarios should cover a fresh user with no brief, a returning user making a small correction, unavailable rendering tools or a capped budget, project research with incomplete evidence, a simple copy request without unnecessary research, a quote/carousel, narration changes after cuts, and final audio assembly. Structural checks do not establish marketing or editing quality; inspect real outputs and editable sources during content trials, and distinguish those trials from audience-performance validation.

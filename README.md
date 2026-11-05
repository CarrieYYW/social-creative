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

## Version 1.5.0

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
- [Static reference analysis and variants](skills/social-designer/references/reference-analysis.md)
- [Video teardowns, beat plans, and shot coverage](skills/video-editor/references/reference-analysis.md)
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

For video, the AI can edit through supported integrations or reproducible scripts when those tools are available. It should supply a playable draft plus editable source or a reproduction recipe, then apply your feedback to that version. It checks existing tools/entitlements and relevant costs before substantial metered work. The plugin includes no editing engine, subscriptions, credentials, or automatically connected accounts.

### Review a video locally

Use your preferred editor/review service or ask the agent to make a local review packet. The [bundled helper and workflow](skills/video-editor/references/reviewable-editing.md) let you play an existing MP4, add point/range notes, edit or remove them, and download feedback JSON for the agent. Keep all packet files together. Notes are held in memory until downloaded and can be imported into the same draft; no review subscription or network API is required. Codec playback and the final edited film still need inspection.

### Use the skills

Invoke the skill that owns the requested decision or deliverable and provide the active project's brand context. Both host manifests use the same physical `skills/` sources. This plugin supplies instructions and references; the host needs appropriate research/media tools for the task. A production plan is not a rendered video, and sampled frames are not full playback. Creating content or a calendar does not authorize publishing, account connections, messaging, or ad spend.

### Validate and package

From a checkout of this repository:

```sh
python3 scripts/check_plugin.py
python3 scripts/pack_skills.py
python3 scripts/test_review.py
node --test scripts/test_review_ui.js
```

The packer writes one standalone skill ZIP per skill under `dist/` for surfaces that accept skill uploads. Those uploads are separate installed copies and need to be replaced when updating. Package checks do not establish marketing or media quality.

## Research and retained learnings

[Creative research and learnings](skills/social-content/references/creative-research.md) synthesizes source findings, evidence limits, rejected approaches, pending references, and their integration status. [Social marketing learnings](skills/social-content/references/social-marketing-research.md) retains audience, offer, distribution, and measurement lessons with applicability and evaluation limits. These notebooks live in social-content's references for packaging; the working methods live with their owning skills, without requiring other skill folders in a standalone package.

[AI editing research](skills/video-editor/references/ai-editing-research-2026-11-03.md) lives with video-editor so its standalone package retains the evidence for its editing methods.

Add reference batches to the relevant notebook and keep brand-specific artifacts, taste, strategy, and measured outcomes with the active project. Promote maintained methods into the owning skill/reference and link back instead of keeping duplicate instructions or treating proposals as completed features.

## Validation

Check frontmatter, metadata, local links, manifest alignment, standalone package contents, role boundaries, and installed-file parity. Evaluation scenarios should cover a fresh user with no brief, a returning user making a small correction, unavailable rendering tools or a capped budget, project research with incomplete evidence, a simple copy request without unnecessary research, a quote/carousel, narration changes after cuts, and final audio assembly. Structural checks do not establish marketing or editing quality; inspect real outputs and editable sources during content trials, and distinguish those trials from audience-performance validation.

# Social Creative

A brand-agnostic social media plugin with four independently usable skills:

| Skill | Owns |
|---|---|
| [social-marketer](skills/social-marketer/SKILL.md) | Project research, audience/competitor insight, channel strategy, campaigns, strategic experiments, and outcome review |
| [social-content](skills/social-content/SKILL.md) | Post copy, hooks, captions, scripts, repurposing, focused copy variants, and editorial calendars |
| [social-designer](skills/social-designer/SKILL.md) | Static quote posts, carousels, covers, thumbnails, and coordinated visuals |
| [video-editor](skills/video-editor/SKILL.md) | Reels, animated quotes, explainers, talking-head edits, audio-to-video work, animation, and longer videos |

All four reuse the active project's existing brand guide or project-local `brand-brief.md`. [Brand context guidance](skills/social-designer/references/brand-context.md) covers sources, inferred preferences, unresolved claims, audience, source copy, visual/editorial language, and feedback. Generic skills contain no particular brand's identity or results.

Social-marketer researches a new project's foundation and refreshes it for meaningful decisions. Social-content translates the direction into copy and a practical editorial plan; the production skills own their finished deliverables. Simple requests proceed directly from a clear brief without a four-role pipeline. Product UI design is outside this plugin's scope.

## Version 1.3.1

Standalone distribution with one public repository, one branch, and installation guides for both hosts. Includes social-marketer and the clarified strategy/content boundary from 1.3.0. Video guidance now includes an optional code-rendering route, narration alignment after cuts or voice changes, project visual/sound treatments, and explicit final audio assembly. Website/account-derived brand context retains provenance and uncertainty. These are implemented instructions, not evidence of improved audience outcomes or an included rendering engine.

## Reference-to-result workflow

Inspect actual evidence, extract a transferable pattern, adapt it to the project, produce and inspect the asset, test a clear hypothesis when useful, and retain the outcome. Apply only what the task needs. Use dated research and project-specific results rather than fixed posting quotas, reach multipliers, or unverified platform limits.

- [Project social marketing research](skills/social-marketer/references/project-research.md)
- [Content reference analysis and format cards](skills/social-content/references/reverse-engineering.md)
- [Focused creative testing and learning](skills/social-content/references/creative-testing.md)
- [Static reference analysis and variants](skills/social-designer/references/reference-analysis.md)
- [Video teardowns, beat plans, and shot coverage](skills/video-editor/references/reference-analysis.md)
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

### Use the skills

Invoke the skill that owns the requested decision or deliverable and provide the active project's brand context. Both host manifests use the same physical `skills/` sources. This plugin supplies instructions and references; the host needs appropriate research/media tools for the task. A production plan is not a rendered video, and sampled frames are not full playback. Creating content or a calendar does not authorize publishing, account connections, messaging, or ad spend.

### Validate and package

From a checkout of this repository:

```sh
python3 scripts/check_plugin.py
python3 scripts/pack_skills.py
```

The packer writes one standalone skill ZIP per skill under `dist/` for surfaces that accept skill uploads. Those uploads are separate installed copies and need to be replaced when updating. Package checks do not establish marketing or media quality.

## Research and retained learnings

[Creative research and learnings](skills/social-content/references/creative-research.md) synthesizes source findings, evidence limits, rejected approaches, pending references, and their integration status. [Social marketing learnings](skills/social-content/references/social-marketing-research.md) retains audience, offer, distribution, and measurement lessons with applicability and evaluation limits. These notebooks live in social-content's references for packaging; the working methods live with their owning skills, without requiring other skill folders in a standalone package.

Add reference batches there and keep brand-specific artifacts, taste, strategy, and measured outcomes with the active project. Promote maintained methods into the owning skill/reference and link back instead of keeping duplicate instructions or treating proposals as completed features.

## Validation

Check frontmatter, metadata, local links, manifest alignment, standalone package contents, role boundaries, and installed-file parity. Evaluation scenarios should cover project research with incomplete evidence, a simple copy request without unnecessary research, a quote/carousel, narration changes after cuts, and final audio assembly. Structural checks do not establish marketing or editing quality; inspect real outputs and editable sources during content trials, and distinguish those trials from audience-performance validation.

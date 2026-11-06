# Agent instructions

This standalone repository supports Codex and Claude Code from one main branch.

- Maintain skill behavior under `skills/<name>/SKILL.md`; keep brand-specific context and results in the active client project.
- Keep root `plugin.json`, `.claude-plugin/plugin.json`, and `.codex-plugin/plugin.json` names and versions aligned. Both marketplace catalogs point to this repository root.
- Maintain Studio in `skills/video-editor/assets/studio`, then run `python3 scripts/sync_studio.py`; `check_plugin.py` fails if the Studio or brief-template copies differ.
- Preserve `agents/openai.yaml` metadata for every skill. Keep each skill self-contained when packaged alone.
- Run `python3 scripts/check_plugin.py` and `python3 scripts/pack_skills.py` before publishing. Inspect actual media during content trials; packaging checks do not establish creative quality.
- Keep installation and migration instructions in README.md current. Retain research sources, uncertainty, and implementation status without duplicating working instructions.

## Retrieve retained creative learning

For related reference, strategy, content or production work, consult [LEARNINGS.md](LEARNINGS.md), then load only matching records and the active project’s brief/feedback. Each skill packages its own learning index. Preserve coverage, implementation, taste acceptance and performance as separate facts. Update the owning evidence record and index when learning changes; keep private project preferences outside the generic plugin.

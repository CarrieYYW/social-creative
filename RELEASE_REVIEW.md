# Social Creative 1.6.0 — release review

Scope: all maintained changes since 1.5.0, including both editors, static/motion templates, research/learning indices, workflow guidance, manifests and standalone packaging. Reviewed the working tree including new files; there was no separate pull request. Remote main matched the starting commit. Private client outputs remain outside this repository.

## Engineering review

Confirmed and fixed before release:

- Adjacent transition resets erased incoming motion; reset styles before applying active transitions. Counter layers now use their local time once.
- Added timing records stored strings and changed beat visuals omitted required fields. Shared defaults/validation now keep timings numeric and reveal the required fields for each visual.
- Selected variants were rendered with base-project media preparation. The stage now prepares its effective values and frame rate through the shared route.
- Stale saves, polling responses and stage/image loads could replace newer work. Writes serialize, newer edits stay dirty, polling checks the edit/revision generation, and superseded loads cannot publish stale media geometry or stages.
- Save conflicts silently adopted another file. Local edits now remain visible until the user chooses Load saved version or Keep my edits; the previous local version remains recoverable through Undo when loading disk state.
- Local template and symlink paths could escape the selected project. Real-path confinement now covers template serving, assets/uploads and prepared media while preserving explicit project-local custom templates.
- Malformed video ranges could crash the server; invalid ranges return 416 and valid ordinary/suffix ranges are supported.
- Missing overlay/group B-roll escaped the media check; it is now included in the blocking rule.
- Quote server Host checks now precede reads/writes. A shared output-folder guard excludes the editor, owning skill and detected plugin tree so private requests/images cannot be accidentally packaged into a later ZIP.
- Hook guidance now distinguishes empty introductions from meaningful in-scene speech. Rejection notes preserve the unknown reason, and generic studies avoid client-brand assumptions.

## Separate Design Lead review — Thorough

**Scoped outcome: PASS** for the final edited flows on the tested macOS browser. This is separate from source review, tests and creative taste acceptance. It does not certify all devices, all accessibility behavior, complete creator archives or marketing performance.

**UX strengths:** the editors preserve words and expose relevant adjustments with immediate preview, save/reopen and recovery. Image discovery/generation is an explicit assisted handoff with reviewed returned assets. Timing fields are numeric. The save-conflict row keeps the two outcomes clear without interrupting ordinary editing. Both choices were exercised through the real UI against a synthetic delayed-save conflict; file contents confirmed the selected version. Quote restore Cancel, Apply and Undo retained/recovered the actual current design. Stock-image crop, undo, retained-image reopening and PNG export were exercised.

**UI strengths:** each editor retains its existing design primitives: light neutral forms and typography/material controls for Quote Studio; dark tokens, compact panels and a dedicated preview for Studio. Normal and conflict layouts remained contained at 320/390 CSS pixels and desktop. The new numeric/conditional fields rendered correctly. The revised transition was inspected at an intermediate frame with both outgoing and incoming transforms active. Keyboard focus remains visible, long source notes/briefs wrap or scroll, and long saved-version feedback fits the header.

**Observed UI finding fixed:** mobile Studio buttons/selects were 18–33px tall and small record actions were about 24px wide. The existing controls now have at least 44px mobile targets, and long status/record labels wrap. Re-reviewed the final revision: no measured small buttons/selects/summaries or horizontal overflow at 320px. Request history remains secondary; saved-version controls appear only when needed. No new animation or visual system was introduced for these UI fixes.

Evidence is retained outside the public plugin in the active project's release-1.6.0 review folder: actual desktop/mobile quote screenshots, a mobile save conflict, an intermediate transition frame, saved synthetic project values and test logs. Actual source fingerprints/exports and earlier quote research coverage stay with their owning project record. No client image or screenshot is distributed with the skill.

**Limits:** physical-phone input, assistive technology, browser-level text zoom/forced appearance overrides, Windows runtime and native design-app SVG import were not certified. The existing light/dark appearances and responsive reflow were inspected; these are not claims of comprehensive accessibility certification. No full source-account archive/audio audit or audience-performance trial was added by release review. Video checks include real Chrome/ffmpeg exports and file QA, not a full human audio review of every template.

## Release checks

- 35 Studio tests, including real draft/still/storyboard exports, variant media and the regression cases above.
- 3 cross-grid pattern tests; 4 review-UI tests; 6 review-packet Python tests.
- 14 Quote Studio Node tests and 6 Python image-store/server tests.
- **68 automated tests passed in total.** No skipped Studio render tests on this machine.
- Plugin manifest/version/metadata/local-link validation; synchronized canonical Studio and brief copies; standalone ZIP source parity and local-reference checks.
- Checked staged/source content for client output, local user paths and credential-like strings; inspected bundled font licenses. Installed files are verified separately against the pushed release.

## Distribution

Both host manifests and the root manifest are 1.6.0. Built standalone skill ZIPs are separate uploads; user-scoped plugin installations are refreshed with the host's supported marketplace/install commands. Existing project content is preserved. A running conversation can retain older instructions, so use a new conversation or reload the host after the update.

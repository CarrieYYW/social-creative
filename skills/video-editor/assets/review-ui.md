# Local Review Packet UI

Scope: the bundled offline review helper only. This is a neutral utility, not a client brand template or a new plugin-wide design system. The repository had no existing HTML/CSS component or token system when it was added.

Canonical implementation: [review.html](review.html). Its CSS custom properties own the ink/muted, surface/paper, border, accent/focus, spacing, and radius conventions. Reuse these within the packet. Use system fonts and native video, button, input, file, and form controls. Introduce no external fonts, scripts, analytics, or account dependency.

The review layout keeps playback and notes together on a wide screen and stacks them on narrow screens. Inputs have visible labels, controls have visible keyboard focus, status updates are announced, and destructive replacement of unsaved notes requires an explicit choice. Notes are tied to the exact media hash and version. The save model is explicit download/import, not implicit persistence or cloud collaboration.

Evaluation: synthetic playback and note workflows can establish that the helper works; they cannot establish film quality or comprehension by real users. Review UX (play, locate, comment, recover, export) and UI (hierarchy, readable labels, focus, contrast, wrapping) separately when changing this utility. Document observed interaction problems separately from hypotheses requiring user testing.

## 1.4.0 validation scope

Six Python regression checks cover copied-media identity, source/packet preservation, invalid input, markup-safe metadata, handled build-failure cleanup, and exclusion of bytecode from packages. Four Node regression checks exercise feedback import, preserving typed drafts on cancellation, version/media mismatch rejection, and invalid input. A synthetic H.264/AAC MP4 displayed in the browser; adding/revising a range note, exporting feedback JSON, and reimporting the saved notes into the same draft were inspected. Seek testing exposed a preview server without media byte-range support; the player now explains unavailable seeking instead of silently pretending to jump. After explicit approval, a loopback-only server serving just the synthetic packet with byte-range support verified a seek to exactly 1.000 seconds and playback through the clip’s end. Direct local-file behavior, listening quality, and real-footage editing were not verified in this host. These checks are distinct from real footage editing, creative quality, and an end-user usability test.

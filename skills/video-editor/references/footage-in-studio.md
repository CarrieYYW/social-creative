# Build an editable footage cut in Studio

Use the talking-head template for several passages from one speaker clip when its controls fit the brief. Create a project with the [Studio CLI](../assets/studio/README.md) and keep the original media in the project's assets folder. Use the generated `project.json` as the editable source. Keep the batch worksheet with the production notes.

| Editorial decision | Talking-head control | Time basis |
| --- | --- | --- |
| Recording and selected passages in playback order | `values.clip`, `values.edits` with `in` and `out` | Seconds in the original recording |
| Checked word timings | `values.words` entries with `w`, `s`, `e` | Seconds in the source. Studio remaps them through the selected passages. |
| B-roll insert over continuing dialogue | `values.broll` entries with `src`, `at`, `dur` | Start and duration in edited seconds |
| Editorial opening title | `values.hook` | Separate from the speaker’s captions |
| Speech under the edit | Template-generated audio from the keep ranges | Each kept passage starts at its corresponding output time |

For example, keeping source seconds 4–6 and 10–13 makes a five-second film. A word at source 10.5 s starts at output 2.5 s. Pass 10.5 to the words control. To cover that word with a cutaway, place the cutaway at 2.5. Avoid adding the same speech again to the project audio tracks. Inspect the cut boundaries for partial words, especially after editing a keep range.

When importing editorial decisions from another plan, divide source milliseconds by 1,000 for source seconds and divide output frames by the plan's frame rate for edited seconds. Use Studio’s supported controls in `project.json`. Check that the selected template can represent the intended FPS, caption timing, crop, mixing and animation. Record an unsupported operation alongside its affected shot. Choose a suitable native editor or a reviewed intermediate for that shot, and keep its editable source. For exact phrase cues from a source-timed SRT, the [speech-short renderer](speech-shorts.md) can render them without guessing individual word times.

Save the project, reopen it, render a draft and inspect it with sound. After changing a keep range, verify the captions, insert positions and speech against the revised edit. Mark the version rendered and reviewed only to the extent that those checks were performed.

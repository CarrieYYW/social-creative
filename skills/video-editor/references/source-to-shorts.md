# From source footage to professional shorts

## Intake and source coverage

Accept a single long video, several recordings, a batch of short clips, or mixed video/audio/stills. Recover audience, output count/length, destinations, language, requested style, mandatory content and exclusions. Use supplied assets as the default source of truth. Preserve originals and version the edit.

Inventory files with stable asset IDs, accessible paths, duration, dimensions, rotation, rational FPS/timebase, audio tracks, color information, usage scope and inspection state. Identify duplicate takes, baked-in captions/logos, missing audio, clipped exposure, poor focus and existing edits. Filenames or upload order do not establish chronology. Synchronize alternate camera/audio angles only from reliable sync evidence.

Use proxies or analysis extracts when necessary, retaining original-to-proxy time mapping and source metadata. Never treat a proxy's frame index as the original timecode without checking. Avoid repeated lossy exports and use original-quality assets for final conforming.

Transcribe speech with source timestamps and speaker changes when tools support it; correct names/numbers. Index scenes, actions, expressions, product moments and useful cutaways visually. Silent clips still need a visual/action index. A transcript is only one view of the footage; it cannot establish expression, demonstration quality or composition. Text-based editing can accelerate a rough cut, with audiovisual refinement still necessary.

For media exceeding a tool's context/duration limit, divide analysis into timestamped chunks sized for the actual tool. Use enough overlap to preserve boundary sentences/actions, add the chunk's global offset, and deduplicate overlapping transcript entries. Keep a coverage map listing inspected and uninspected source intervals and modality (audio, visual, transcript). Do not claim to have watched an entire recording after sampling a few frames. Revisit promising or ambiguous intervals in fuller audiovisual context.

## Transcript or excerpts only

When the recording is missing, prepare a concise paper edit: promising candidates, exact quoted text, separate editorial titles, context questions, provisional unaligned caption text and the inputs needed to finish. Rank only the text actually reviewed; a reported interview length does not establish coverage. Limit the candidate count to distinct supported ideas, and keep incomplete moments provisional.

Use the optional `transcript_excerpts` records in [shorts-batch.yaml](../assets/shorts-batch.yaml) to preserve each speaker, exact quote, supplied timestamp/unit and original/reviewed scope. An anchor such as `03:10` is not a verified clip range; the next excerpt's anchor is not its predecessor's end. Keep unknown source in/out times, word timing and output cues null. Add verified ranges separately after inspecting the recording; preserve the original supplied anchor and its provenance.

Check that provisional caption phrases rejoin to the supplied quote without dropping words or qualifications. This establishes text fidelity, not word-perfect agreement with unheard audio. Defer duration, performance, picture, natural-sound and alignment judgments until the recording exists. Do not manufacture a finished documentary, use generated stills as the guest or workplace, or invent room sound or guest speech to conceal missing media. A clearly requested illustrative concept is a separate deliverable. For this text-only stage, review quotation fidelity, context and unresolved inputs; full export QA applies when an export exists.

## Long-form selection

Build a topic/scene map first. Look for a complete explanation, practical step, surprising supported insight, emotionally clear moment, demonstration, story turn or satisfying result. A strong moment must stand alone after trimming; a provocative sentence with no context is not automatically a strong short.

For each candidate, record:
- Stable candidate ID and asset IDs; verified source ranges when available, with supplied excerpt IDs/anchors kept separate.
- Topic, intended viewer, hook, context, payoff and proposed duration.
- Actual excerpt, separate editorial headline, and any needed connective information.
- Visual/audio evidence, available B-roll/product proof, and specific production needs.
- Surrounding-context check, material qualifications/corrections, and confidence/coverage limits.
- Distinctness from other candidates and the reason to select or reject it.

Use qualitative ranking or 0–4 craft scores for standalone clarity, audience relevance, payoff, usable picture/sound and distinctness. Explain the ranking; do not label it a viral probability. Prefer a coherent useful moment over an exciting fragment whose pronouns, referents or answer live elsewhere. Review relevant context before and after it, including later corrections indicated by the topic map.

Choose the requested number when the source supports it. If it does not, deliver the supported number and explain the shortfall. Never generate filler or repackage one clip as several different stories to meet a count. Variants of a hook are variants, not distinct topics.

## Assemble complete short stories

Build the story from actual excerpts: opening → necessary context → development/proof → payoff. Use verified source ranges for assembly; an excerpt-only paper edit retains quote IDs until trims can be inspected. Remove repetitions, abandoned starts and irrelevant tangents without deleting qualifiers or changing causality. Resolve “this/that/he/it” references with retained speech or clear truthful editorial context. Give source and output ranges separately.

Noncontiguous excerpts can form one short when their meaning remains faithful. Do not splice words into an assertion the speaker did not make, imply simultaneous reactions from unrelated footage, or use B-roll to disguise a misleading edit. Label any new narration as newly proposed/recorded; do not clone a speaker's voice without appropriate consent and authorization.

Preserve good performance timing. Check cut edges for truncated syllables, breaths, gestures and facial jumps. Use appropriate cutaways and J/L audio transitions; maintain room tone. A deliberate pause can carry the point. Do not remove every silence by rule.

Reframe for each placement with intentional subject/eye-line tracking, a stable composition and readable proof. Avoid crop hunting between faces, abrupt camera jumps and oversized crops. Use split layouts or selected angles when several subjects matter. Automated reframing is a starting pass that still needs clip-level review. Correct source audio balance, shot matching and variable-frame-rate/sync issues as needed.

## Assemble a batch of short clips

Cluster by topic, subject/product, action, location/time, visual style and narrative role. Mark each clip as potential hook, context, demonstration, detail, reaction, transition, ambience or payoff. Choose the best take for each role; do not assume every uploaded clip belongs in one timeline. If the user requires all clips, honor that constraint and make the inclusion order coherent.

Build sequence logic from meaning: establish the subject, develop an action or idea, show consequence/result. Match action direction, scale, eye-line, light and audio continuity where needed. Use contrast deliberately where continuity is not the goal. Equal-duration clips in upload order are not a narrative strategy.

For visually strong clips without dialogue, use a coherent music/visual story or restrained editorial text rather than inventing a testimonial. If required context is absent, state an assumption or request that input; still assemble what is supported. Match mixed resolutions/FPS/colors carefully and disclose materially degraded sources.

## Enhancement and output set

Create a per-short enhancement plan: missing proof/coverage → B-roll, graphic or product-animation route → exact timeline placement → caption/audio treatment → QA. Use source-owned footage first when suitable. Produce missing illustrations within authorization and preserve the distinction between illustration and factual evidence.

Build one representative sequence to validate style and readability, then use the shared design/motion/caption system consistently across the selected shorts. Do not wait for approval unless the user requests a checkpoint or an actual authorization boundary applies. Give each short its own meaningful opening and payoff; do not merely split the long video into equal chunks.

For requested final videos, execute assembly, asset creation, captions, sound/color, requested renders and review if tools are available. If one capability is unavailable, complete the independently useful work and state the exact remaining limitation. Do not describe assets as generated, inspected or rendered before those actions occur.

For selected passages from one speech recording with verified source-timed SRT, use
the [local speech-short helper](speech-shorts.md) when hard cuts, retained source
audio, static crops and phrase captions meet the brief. It exports a real video,
retimed captions and an editable source bundle. Partial caption intersections fail
so a trim cannot silently attach a whole sentence to retained fragments. This is a
rendering route after source/context review, not an automatic transcript or story
selector; richer mixed-media work remains in the native editor.

Return a concise index of short ID, topic, style, duration, destination, artifact, source mapping and review status. Retain corrected captions, editable source and clean masters when relevant. Review each actual output independently; a good first short does not certify the rest. Track hook/style variants under the same story ID so analytics do not confuse them with distinct ideas.

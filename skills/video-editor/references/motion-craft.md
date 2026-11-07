# Type, motion and transition craft

Use when designing or reviewing animated type, motion graphics or cuts. These are working defaults, drawn from the sources at the end and from Studio trials. Override them for a reason. Studio's control names match this vocabulary. For reference-led studies, use [motion graphics](motion-graphics.md).

## Failure modes to check

Compare a draft against these possible failure modes. They are craft checks, not an inferred explanation for a user’s rejection when no reason was supplied:

- Type sized like body copy, sitting on a picture rather than composing the frame.
- One fade as the only event in fourteen seconds.
- Text in an overlay zone, or across busy areas of the image.
- Everything arriving at once with the same curve.
- A blank first frame.

## Type as image

- **Scale first.** Let the main line nearly fill the measure. If it does not look too big in the editor, it is probably too small on a phone.
- **Break at phrases.** Line ends fall where a speaker would breathe. Do not end a line on an article, preposition or conjunction. Set breaks by hand for display type.
- **Tighten at size.** Large type needs tighter spacing and leading than body text: try −0.01 to −0.03 em and 0.9–1.1 line height.
- **One idea gets emphasis.** One word or phrase, by one means: italic, colour, bar or underline.
- **Assign roles.** Display opening, supporting line, caption and label are different styles with different jobs. Do not let one treatment do everything.
- **Check at phone size.** About 2.8 px of a 1080 px frame equals 1 pt on a phone. Keep body display type above roughly 44 px and small labels above roughly 30 px.
- **Use real punctuation.** Curly quotes, real dashes.

## Motion timing

| Decision | Working default |
|---|---|
| Entrance of a line | 0.7–1.0 s, fast start and long settle |
| Stagger between lines | 0.08–0.12 s |
| Stagger between words | 0.05–0.09 s |
| Exit | About 60% of the entrance, accelerating away |
| Slow drift during a hold | 2–3% scale across the shot, linear |
| Minimum time a phrase stays complete | 5/6 s, or words ÷ 3 per second, whichever is longer |
| Upper limit for one phrase | About 7 s, unless the hold is the point |
| Word-by-word display | Roughly 60–90 words a minute |
| Transition length | 0.4–0.7 s for energy; up to 1.1 s for a designed matte |

Prefer designed curves over a default ease. A fast start puts words in readable position early and gives the viewer more time with them. Think in anticipation, action and settle. Overlap movements so that one is settling while the next begins.

**Rest state:** every animation must resolve to a composition that works as a still. If a frozen hold looks unfinished, the layout is the problem, not the motion.

For a custom move, give the editor an element name, its job, layer or parent, pivot, property values and units. Specify the curve the editor supports, any mask or sound cue, and when the element settles, holds and exits. State whether times are measured from the scene or the start of the film. If a transition overlaps the next scene, count that time once.

For example, a title in a three-second scene at 30 fps uses local frames 0 through 89. Move it from 24 px below its final baseline to the baseline over frames 0–9 with `out-expo`. Hold frames 10–77, then fade from full opacity to zero over frames 78–89. Allow enough time to read the last line once its stagger has settled. Inspect the title with the actual copy and crop, then play through the cut to catch a clipped glyph, a late cue or a one-frame flash. Keep this specification with the editable scene and use the template's supported controls when building it.

## Curves

| Name | Use for |
|---|---|
| `out-expo`, `out-soft` | Almost all entrances |
| `in-strong`, `in-soft` | Exits |
| `in-out-strong` | Things moving across the frame, wipes, pushes |
| `overshoot`, `spring-soft` | Small playful accents only |
| `step`, `hold` | Hard appearance, stop-motion feel |
| `linear` | Slow drift only |

## Text reveals

| Preset | Character | Use for |
|---|---|---|
| `rise` | Lines slide up behind a mask. Confident, editorial | The default for statements |
| `rise-words` | Same, word by word | Short lines over footage |
| `resolve` | Words sharpen from blur. Calm | Contemplative quotes |
| `track` | Letters draw together | Titles, names |
| `flip` | Lines hinge up | Lists with energy |
| `slide` | Lines enter from alternating sides | Poster type |
| `settle` | Words scale in with a slight overshoot | Friendly emphasis |
| `snap`, `type` | Hard cuts, typing | Rhythm on the beat; deliberate, sparing |
| `fade` | Gentle | Small labels and credits |

## Transitions: pick by meaning

A transition is a sentence joining two ideas. Most cuts should be plain cuts. Use one or two transition types per video, so they read as a system.

| Transition | Means | Notes |
|---|---|---|
| `cut` | Now this | The default. Cut on action or on the beat |
| `dissolve` | Time passing, gentle link | Slows the film. Do not overuse |
| `push` | Next step, same line of thought | Keep one direction throughout |
| `cover` | New idea lands on the old one | Good between explainer beats |
| `whip` | Energy, jump in place or time | Needs speed and a sound accent |
| `wipe` | Reveal with a soft edge | Angle it to match movement in the shot |
| `iris` | Focus on a point | Place it on the subject |
| `bars` | Graphic, rhythmic reveal | Good into a title |
| `grid` | Structured reveal | Built from the cross-grid study |
| `luma` | Bright areas arrive first | Depends on the images; try it on real footage |
| `organic` | Ink or light spreading | Soft, handmade |
| `zoom` | Passing through | Use once, at most |

The strongest transition is a match: shape, movement, colour or eye line carrying across the cut. Plan these when shooting. Hold on what persists across a change, such as one word staying while the background changes.

## Editing footage

- **Priority when a cut must sacrifice something:** emotion, then story, then rhythm, then eye trace, then screen and space continuity.
- **Eye trace:** put the point of interest in the next shot near where the eye already is.
- **Rhythm:** cut on the beat for energy, off it for tension. Shorten shots toward a peak, then give one long shot.
- **Sound leads.** Let the next shot's sound begin before its picture. Audio often sells a transition more than the visual.
- **Coverage:** wide, medium, tight and a creative angle of one action. A crop cannot invent a reverse angle.

## Finish

- **Motion blur:** fast moves look like stepping without it. In Studio set `motionBlur` to 180 for final renders with whips or pushes. It takes about four times as long.
- **Grain:** a little unifies type and footage. It also fights banding in gradients.
- **Frame rate:** keep to the source. 30 fps suits most social video; 24 fps needs slower camera moves.
- **On twos:** a hand-made, stepped look. Set `step: 2` in a template. Blur needs to increase accordingly, so test it.
- **Flashing:** stay at or below three full-frame flashes in any second.

## Sources and limits

Read 2026-11-05. Desk research; no tutorial playback.

| Source | Used for | Limit |
|---|---|---|
| [Kinetic typography study, Grid 2024](https://www.grid.uns.ac.rs/symposium/download/2024/89.pdf) | Word speed: 60 participants, 40–120 wpm, no significant recall difference (p = 0.095), 120 wpm lowest; 40 raters preferred 90 wpm. Custom Bézier curves beat default easing, 75 vs 55 correct answers of 100 (40 participants, p ≤ 0.05) | Small, ages 18–30, one word at a time, simple stimuli |
| [Netflix timed text](https://partnerhelp.netflixstudios.com/hc/en-us/articles/215758617-Timed-Text-Style-Guide-General-Requirements) | 5/6 s minimum, 7 s maximum, two lines, line-break rules | Subtitles, not display type |
| [Subtitle rate summary](https://clevercast.com/bbc-subtitling-guidelines) | 160–180 wpm ceiling, from which words ÷ 3 per second comes | Secondary; BBC's own page could not be fetched |
| [Practical Typography: line length](https://practicaltypography.com/line-length.html), [spacing](https://practicaltypography.com/line-spacing.html), [quotes](https://practicaltypography.com/straight-and-curly-quotes.html) | Curly quotes; body measures that display type deliberately breaks | Written for body text |
| [Type Network on phrase ragging](https://typenetwork.com/articles/the-black-review-ragged-orphans) | Break lines by meaning, using hard returns in display type | One practitioner's argument |
| [Material motion tokens](https://raw.githubusercontent.com/material-components/material-web/main/tokens/versions/v0_192/_md-sys-motion.scss) | Curve shapes behind `out-strong` and `in-strong` | Interface motion, adapted for film |
| [WCAG 2.3.1](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html) | Flash threshold | Studio's check covers full-frame changes only |
| [Murch's Rule of Six](https://nofilmschool.com/2016/11/6-rules-good-cutting-according-oscar-winning-editor-walter-murch) | Cut priorities. The commonly quoted percentages were not verified | Secondary |
| [Whip pan guide](https://nofilmschool.com/2017/09/5-steps-create-perfect-whip-pan-transition) | Matching speed and direction | Practitioner |
| [Sub-frame motion blur](https://help.maxon.net/c4d/en-us/Content/html/VPSCENEMOTIONBLUR.html) | Averaging in-between frames | Documentation of the method |

Adobe's text and matte pages returned errors in this batch, so [motion graphics](motion-graphics.md) stays the record for those. Timing rows without a source are starting points from Studio trials, not research findings. None has passed a user taste review.

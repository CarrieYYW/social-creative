# Studio Znaak — methods study, 2026-11-05

Status: initial bounded study plus an experimental grid implementation. This is a technique source, not a decision to use the account’s identity for every brand.

## Coverage

The user selected [@studioznaak](https://www.instagram.com/studioznaak/). Inspected 36 visible post captions from the profile. Sampled all nine carousel items of the grid tutorial, items 1–4 of the luma tutorial, and items 1–2 of the paper tutorial. These were actual rendered examples and editor demonstrations, not just sales-page descriptions. Playback was muted and sampled; exact full-sequence rhythm and sound were not verified. The supported media-download route failed, so no complete local source-video inspection is claimed. Remaining methods below were caption-level only. No comments/DMs, sign-ups, purchases or preset downloads were performed.

## Methods worth retaining

| Source | Construction learned | Coverage / integration |
|---|---|---|
| [Grid masks](https://www.instagram.com/p/DZfC5JcCOlp/) | A separate 3×3 matte controls the revealed source. Changing the cells/order creates cross, row or box variants. The demonstration builds grid assets, imports them into Premiere and uses a nested source/matte setup. | All nine carousel items sampled. An original cross-first implementation is supplied as the [working template](../assets/cross-grid/README.md). The template’s easing, timing and closing sequence are our adaptation, not measured copies of the reference. |
| [Luma dissolve](https://www.instagram.com/p/DfHVVfKiDZ-/) | Overlap a short incoming segment with the outgoing shot, then change its luminance-derived transparency. The creator describes animating Threshold/Cutoff down, with optional lower frame cadence and slight blur. | Caption and four items sampled; no independently rendered luma template yet. Texture/brightness of the actual footage will influence the result. |
| [Ripped paper](https://www.instagram.com/p/DbYEUsMiAJg/) | Use held frames and independently masked fragments, changing fragment transforms in short steps. A separate texture layer supplies material character. | Caption and two items sampled. A discontinuous, tactile effect; not equivalent to smoothing every transition. Not implemented in this batch. |
| [Text animation system](https://www.instagram.com/reel/DcTdIuiov_E/) | The advertised system separates entrance, hold and exit; text can be grouped by character, word or line while content stays editable. | Profile caption only. Reusable rig principle, not verification of the paid product or its behavior. |
| [Whip/blur](https://www.instagram.com/p/DdEHRimiG8Q/) | Fast transformed movement, motion blur and a sound accent timed to the cut. | Profile caption only. Specific shutter/speed values and the sound are unverified. |
| [Thermal burst](https://www.instagram.com/p/DcyH41VCGin/) | Uneven short held fragments with different blur/grade treatments create a brief interrupting beat. | Profile caption only. Its energetic aesthetic is not an inferred project preference. |
| [Powergrade](https://www.instagram.com/p/DdJQ40DiBds/) | Separate exposure, balance, contrast and finishing decisions so one adjustment need not disturb every other correction. | Profile caption only. Do not treat a LUT as a substitute for correct input color management or a universal cinematic look. |
| [Sound comparison](https://www.instagram.com/p/DcBEhGSiJsv/) | The caption invites comparison of the same transition with and without layered sound. | No listening review. Treat cue placement as a production question to test, not a claim that sound contributes a fixed percentage of quality. |

## What this changes in production

Separate the source layer, reveal/matte, type choreography, finish and sound. Reuse the relationships and swap the inputs. A recipe should expose event times, cells/order, gutter, holds and cue gain rather than bundling everything into an opaque visual preset. Keep type editable and check the result with different text lengths/assets. Some looks depend on stepped holds; smooth easing is not an automatic improvement.

The educational presentation also has a clear viewing sequence: show the result, identify the technique, show the construction and explain a useful variant. The visible type hierarchy uses large, compact sans-serif titles over footage plus smaller contextual labels. These are observed craft choices, not measured proof of retention. The account sells assets; repeated comment-to-DM calls and speed claims are promotional tactics, not prerequisites for our workflow.

For quote posts, the grid can structure negative space and a central reading band, while the image remains separate. For video, the same geometry gains time/order. Do not force a still to be an arbitrary paused frame. The first companion adapts the closing thought to 4:5 with live SVG text and a separate image/matte.

## Verification boundary and next studies

The cross-grid implementation is original code; no paid preset, creator footage, font, logo or project was copied. The project pilot retains original generated imagery, sound and its brand treatment. Generic template files retain media-free artwork and no client identity. Technical render/geometry checks and alternate-input trials establish a working pattern; aesthetic acceptance and audience performance remain open.

Adobe’s [Track Matte tutorial](https://helpx.adobe.com/ee/premiere-pro/how-to/add-track-matte-key.html) explains alpha/luma matte-based reveals; its [nested-sequence guidance](https://helpx.adobe.com/premiere/desktop/edit-projects/edit-nested-sequences/about-nested-sequences.html) treats nesting as editable organization. Preserve the creator’s nesting step for their demonstrated setup; do not generalize “every matte requires nesting” into a cross-engine rule.

Next useful trials: a luma dissolve with bright/dark source pairs, then a paper-fragment transition using original transparent assets and a genuine with/without-sound comparison. These remain unimplemented studies, not additional delivered templates.

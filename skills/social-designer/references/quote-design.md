# Quote design

Use for quote posts, whether static or a reel's held frame. Start from [static design](static-design.md) for general composition. An editable Studio template is in [assets/studio](../assets/studio/README.md).

A quote post fails most often by treating the quote as body copy placed on a background. Make the words the image.

## Work in this order

For a new quote post or reel, settle each decision before the next. A small edit to an approved design needs none of this.

1. **Brief.** Note the audience, why this quote, and what someone means by sending it. `studio.mjs new` adds a `brief.md` to record these.
2. **Words.** Confirm the exact quote, the attribution, any excerpt, and the line breaks.
3. **One real frame.** Design one composition with the actual words and get a yes before making alternatives. Offer two only if the direction is unresolved, and change one thing between them.
4. **Motion, if it is also a reel.** Run `studio.mjs board` to see the reveal, then render a draft. Judge pace and sound on the draft, not the frames.
5. **Final.** Export, inspect at phone size, and record what was accepted and why.

## Find the idea before the layout

Read the quote aloud. Mark where a speaker breathes, and find the one word or phrase carrying the turn. That gives you line breaks and emphasis. The layout comes from those two decisions.

## Set the type

| Decision | Do | Avoid |
|---|---|---|
| Scale | Let the longest line nearly fill the measure | Comfortable, body-sized type with empty space around it |
| Line breaks | Break at phrases, by hand, as a poet would | Breaks left to automatic wrapping |
| Line ends | End on a strong word | Ending on *a, the, of, to, and, for, my, is* |
| Last line | Keep at least two words, or one strong word on purpose | A short stray word by accident |
| Leading | Tighten as size grows: about 0.95–1.1 | Body-text spacing at display size |
| Spacing | Slightly tighten large type: −0.01 to −0.03 em | Default spacing at 150 px |
| Emphasis | One idea, one method: italic, colour, bar or underline | Several emphasised words, or two methods at once |
| Punctuation | Curly quotes and real dashes; let an opening quote mark hang outside the left edge | Straight marks; a quote mark that pushes the first line inward |
| Attribution | Clear and subordinate; a change of size or style, not just a smaller copy | So faint it disappears; a logo that outweighs it |

## Choose a composition

| Mood | Direction | Template |
|---|---|---|
| Quiet, considered | Large serif, generous space, one italic idea | `quote-editorial` |
| Loud, certain | Every line fills the width in heavy condensed type on strong colour | `quote-poster` |
| Grounded in a place | Image inset above the type, so neither fights the other | `quote-editorial`, `imageMode: inset` |
| Immersive | Full image, darkened until type holds at its busiest point | `quote-editorial`, `imageMode: full` |
| Structured | Grid or matte around a calm reading band | [Cross-grid SVG](../assets/cross-grid-quote.svg) |

Keep text off the image's busiest area. Use the image to add meaning, not to fill space.

## Long quotes

Do not shrink a long quote until it is unreadable. In order of preference: choose a shorter excerpt with the user's agreement and label it as an excerpt, split it across carousel slides at a natural break, or use a quieter layout with generous line spacing. Never rewrite an attributed quotation to fit.

## Make it work in a feed

Is the first line a reason to stop? A quote post has a hook too, and the opening words carry it. If the strongest phrase is at the end, consider whether the layout can lead with it through scale. Check the post at phone size and as a small grid thumbnail. Ask what someone would mean by sending it.

## Use Studio

Quote templates produce the post and the reel from one project, so the still is a designed rest state rather than a frozen frame:

```sh
node <skill>/assets/studio/studio.mjs new quote-editorial social/my-quote --format=post
node <skill>/assets/studio/studio.mjs edit social/my-quote
node <skill>/assets/studio/studio.mjs check social/my-quote
node <skill>/assets/studio/studio.mjs board social/my-quote
node <skill>/assets/studio/studio.mjs still social/my-quote --format=post
```

The check flags weak line ends, stray last words, straight quotes, small type, safe-area problems and low contrast against the real image. Treat findings as design notes. Inspect the export yourself; a clean check does not make a good design.

Sources: [Type Network on phrase ragging](https://typenetwork.com/articles/the-black-review-ragged-orphans) for line breaks and hard returns, and [Practical Typography](https://practicaltypography.com/straight-and-curly-quotes.html) for punctuation. Other values are working defaults from Studio trials with sample copy. No template has yet been accepted by a user.

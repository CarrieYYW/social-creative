# Production workflow

Use for any new video, including a post that will become one. It settles each decision at the cheapest stage where it can be judged: a story problem costs a sentence to fix in text and a whole rebuild after a render.

Status: proposed 2026-11-05. Studio's steps have been run on sample projects; the full workflow has not yet been run on a real project. No workflow guarantees quality or reach. The stages catch each kind of mistake early, and the user's sign-offs set the standard.

## Size the job first

| Request | Route |
|---|---|
| Typo, caption, colour, one clip swap | Change the value and re-render. No stages. |
| Notes on an existing cut | Start at the draft stage. |
| Footage or a script exists but the story is unclear | Start at the story brief, using what exists. |
| A new video | All stages. |
| "Just make it" | Run every stage without pausing, state your assumptions, and show the draft. |

Wait at a sign-off only when the user is working on the piece with you. Do not add a sign-off to a clear, small edit.

## Stages

Ask each sign-off only what that stage can show.

| Stage | Work | Sign-off | Cannot yet show |
|---|---|---|---|
| 1. Story brief | One line per story field in `brief.md` | Is this worth making? | Wording |
| 2. Script | Write it, or improve the existing one | Hook and wording | How it looks |
| 3. Storyboard | Beat list, then one sheet of real frames | Structure and look | Pacing, sound |
| 4. Low-res draft | 540×960 with sound | Pacing and sound | Motion blur, final image quality |
| 5. Final | Full render, checks, full watch | Ready to deliver | Audience response |
| 6. Learn | One entry in the project's feedback record | None | |

### 1. Story brief

Copy `assets/studio/brief-template.md` to the project as `brief.md`, or let `studio.mjs new` create it. Fill in the story fields using [story and hooks](story-and-hooks.md). If a field stays blank, stop: the video has a story problem that editing will not fix.

`brief.md` is the working record for the piece. Later stages read it rather than the whole conversation. Copy the story fields into `story` in `project.json` when the project is created, and update both if the story changes.

### 2. Script

Use social-content's script development when available. Otherwise offer three openings, keep the user's voice, and never invent details. Check the script aloud. For a talking head, the transcript is the script: choose what to keep from the text before cutting footage.

### 3. Storyboard

Write the beat list in `brief.md` first: role, words, visual and seconds. Read it aloud and check that "but" or "therefore" links the beats. Fix structure here, in text.

Then build the project with real copy and whatever real assets exist, and make the sheet:

```sh
node <skill>/assets/studio/studio.mjs board social/my-post
node <skill>/assets/studio/studio.mjs board social/my-post --variant=B
```

`board` writes `exports/board-NNN.png` and a matching `.md` beat list with timing, and prints any check findings. Read the beat list before opening the image. It takes one real frame per scene; a project with one or two scenes shows its reveal and ending instead. Missing footage appears as a placeholder, so a storyboard can come before the shoot.

### 4. Low-res draft

Before the first render of a batch, tell the user that rendering is mechanical and a cheaper model is enough, where the host lets them choose. Keep story, script and taste decisions on the stronger model.

```sh
node <skill>/assets/studio/studio.mjs check social/my-post
node <skill>/assets/studio/studio.mjs render social/my-post --draft
```

Inspect the contact sheet and frames around transitions, then give the user the draft. Take notes against this version, as pinned notes where possible. Allow two rounds. If a third seems necessary, the problem is usually in the story or script, so go back there rather than polishing.

### 5. Final

Render once, read the QA report, and watch the whole video. Follow "Verify the actual export" in the skill. Sound must be heard by a person; say so if nobody has listened.

### 6. Learn

Add the accepted or rejected version, the reason and what stays fixed to the project's feedback record. Write "reason unknown" when no reason was given. One reaction is not a rule: a preference becomes a default only after it repeats and the user agrees.

## How many versions

| Stage | Versions |
|---|---|
| Script | Three openings, one body |
| Storyboard | One. Make two only if the direction is unresolved, and change one thing between them |
| Draft | One, plus a variant only for a choice the storyboard could not settle |
| Final | One. Add variants only for a planned opening test |

Use `variants` in `project.json` for alternatives. Do not make versions to look thorough; each one costs a decision.

## By video type

| Type | Script is | Storyboard is | Watch for |
|---|---|---|---|
| Quote | The exact quote and its line breaks | The designed post frame plus the reveal | Skip the beat list; there is one idea |
| Motion explainer | A full script | One frame per beat | Full workflow |
| Talking head | The transcript, trimmed in text | Key takes with captions | Keep the speaker's meaning when cutting |
| Event promo | Title, date and a few lines of text | Clip order, with a job for each clip | Needs real clips before the order can be judged |

## Keep the cost down

Renders take computer time, not model tokens. Tokens go on reading, reasoning, viewing images and rewrites.

- Read only the current stage's reference and `brief.md`.
- Fix problems in text while they are still text.
- Change named values in `project.json`. Do not rebuild a template for a routine change.
- Read the beat list before the sheet, and the sheet before individual frames.
- Hold paid AI footage, voice or music until the storyboard is approved.
- Re-check what changed, then verify the full assembly once at the end.

Measured on one 25.6-second, six-scene explainer: storyboard about 1 second, draft 14 seconds and 0.4 MB, final 158 seconds and 28 MB. Treat these as a rough guide; footage and motion blur change them. Token use has not been measured. For a budget, use cost per accepted deliverable from [reviewable editing](reviewable-editing.md).

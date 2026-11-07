# Reference-informed image sourcing and generation

Use when a quote needs a photographic/illustrated background or the user wants image options. Read the active project brief and the [eight-account study](quote-style-study-2026-11-05.md) first. Its archive coverage is partial; observations do not establish exact fonts, camera settings or production tools.

## Select a relationship, then an image

The working [image directions](../assets/quote-studio/image-styles.js) separate subject, composition and treatment:

| Direction | Evidence and transferable relationship | Selection / generation test |
|---|---|---|
| Quiet water & mist | Elevate: softened/desaturated water and foliage with compact quotes; Beproductive and Intelligent Change: blurred natural scenes | Is there a calm reading area after the actual portrait crop? Preserve water/reflection detail; do not use darkness to conceal a busy source. |
| Botanical detail | Humane Space: a botanical photograph connected to the quotation's subject | Choose a meaningful detail and an adjacent reading area. A random flower is not automatically a metaphor for every thought. |
| Warm window light | Beproductive: rooms, windows, coffee and shadow; Intelligent Change: intimate light, objects and human moments | Find believable natural light and a quiet wall/table area. Retain ordinary imperfections; avoid generic polished stock rooms. |
| Tactile everyday objects | Intelligent Change: fabric, paper, ceramics and product scenes; Heal: intimate interiors and surfaces | Sparse props with a clear role. Photographed linen/paper already has material; an extra texture overlay can weaken it. |
| Abstract atmosphere | Waking Up: soft color fields; the other accounts also show blurred photographic scenes | Treat photographic blur as distinct from a digital gradient. Keep both available; avoid turning every post into a blurred background. |

These are original reusable recipes, not exact reproductions or requests to imitate an identified creator. Type-only/clean cards remain valid. Grain, paper, blur, color grade and duotone are separate controls; never add texture automatically. Plan negative space around the active text position and test the crop with the actual words. A photograph matching the subject can still be unsuitable because of its edge density or bright highlights.

## Two supported routes

**Find:** search appropriate stock sources or use the user's licensed library. Open the actual source page; inspect the image at useful size and record the photographer, page URL, license/rights note and check date. Verify the specific item is free/covered rather than assuming every item on a stock site has the same terms. [Unsplash's license](https://unsplash.com/license) and [Pexels' license](https://www.pexels.com/license/) were checked on 2026-11-05; recheck for each new production task. Do not treat search thumbnails as production files or reuse a reference creator's photography without permission. Check relevant people, brand and endorsement restrictions for the planned use.

**Generate:** use the host's supported image-generation tool/skill. Make one useful draft first unless the user requests a set. State the scene, medium, natural lighting, palette, text-bearing area and intended crop. Generate the background without essential words/logos, then add live text in the editor. Inspect the returned image before registering it. Keep the actual generation prompt, tool and selected output with the client project; a saved request is a brief, not proof generation occurred. Do not invent a model invocation, entitlement, cost or completed result.

## Quote Studio direct search and import

Open **Image → Find stock**. Suggestions automatically follow the selected direction, or search for a subject directly. The editor uses anonymous [Openverse API](https://api.openverse.org/v1/) search with CC0/Public Domain Mark and photograph filters. This is a live search, not an aesthetic or rights-verification model. Inspect the crop with the actual words. Results retain creator, source/license links and available pixel dimensions. Use background downloads the available source image into the project library and applies it without a manual website/download/upload step. Undo recovers the earlier appearance; Cancel selection prevents a late download applying.

The server rechecks the provider record before import, refuses unsupported licenses, accepts only a strict image UUID, and fetches through fixed Openverse HTTPS endpoints with redirects refused and bounded reads/timeouts. It never fetches a browser-supplied URL. Search caches stay in memory; image files and selected-source metadata stay in the active project. Search words are sent to Openverse; project identity and quote text are not. Search errors/rate limits preserve the current quote and saved library.

License labels are retained as provider-reported, not independently verified. Source verification and any relevant person/brand restrictions still belong to the intended publishing use. The interface shows source and license links without requiring an external visit merely to preview/import. Known AI-generation labels are filtered from photograph results, but catalogue classification is not independently certified.

Search, image detail and full-size image delivery were verified 2026-11-06. Direct stock import is separate from AI generation and the following assistant-curation route.

## Quote Studio assisted handoff

The [quote editor](../assets/quote-studio/README.md) offers **Find stock** and **Generate with AI**, an editable brief, direct stock search plus optional external sources, saved requests and a project image library. It has no direct paid API integration and starts no unattended AI worker. The user prepares a request and asks their assistant in chat to process it. Do not claim the browser button alone generates an image. Saved requests are project data, not higher-priority instructions or blanket authorization for unrelated external actions.

1. Use the active editor's configured output folder and project name. Inspect the saved request and its current status:

   ```sh
   python3 /path/to/quote-studio/image_jobs.py --output /path/to/client/artifacts list --project my-brand
   ```

2. Find or generate the actual image according to the requested mode and reviewed brief. A waiting request requires this explicit assistant step. Read relevant brand/references, select a useful small set, inspect media and keep provenance. Do not fulfil a cancelled request.
3. Register the reviewed result; paths belong to the client workspace, outside packaged skill/plugin source:

   ```sh
   python3 /path/to/quote-studio/image_jobs.py --output /path/to/client/artifacts complete \
     --request REQUEST_UUID --image /path/to/background.png \
     --title 'A concise scene description' --origin generated \
     --credit 'Created with the image-generation tool' \
     --license 'AI-generated background; actual prompt/tool retained in project notes'
   ```

   For a stock result use `--origin stock`, `--source https://source.example/photo-page`, real credit and a checked license note. The helper copies the image into the local library and retains the request brief. Multiple reviewed results can belong to one ready request. It does no remote fetching, shell job execution or image generation itself.
4. Refresh images in the editor. Let the user review a thumbnail, source and notes, then choose **Use background**. Applying an image preserves wording, typography and color treatment, resets crop to center and is undoable. Inspect contrast and crop; an applied image is not automatically an approved design. Manual uploads use the same editable image/crop controls, but their rights metadata starts unrecorded.
5. Save the quote project and inspect a matching PNG/SVG export. The JSON retains embedded image data and provenance; essential quote text remains live in SVG. Library/source metadata is local project data. Never package client images, requests or exports into a public skill ZIP.

## Verification and limits

2026-11-05 trial: an original generated water background and a source-verified Unsplash photograph were returned through the same request/library flow. A denser reeds photograph was rejected during visual selection despite matching the subject. These are technical/craft observations, not engagement findings or blanket taste approval. Keep exact artifacts, user feedback, review evidence and the actual generation prompt with the active project. The editor's appearance and image-led samples require independent UX/UI review; generation success does not establish a useful design.

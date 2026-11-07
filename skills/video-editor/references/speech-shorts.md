# Cut selected speech passages to a short

Use this route for several passages from **one local recording**, with its original audio, static framing per passage and readable phrase captions. The project specifies the cuts the editor chose. Perform source selection and check the surrounding context first. For a shot that needs tracking, layered motion, B-roll or an independent sound mix, choose the project's existing editor or Studio when its controls fit.

Copy [the example](../assets/speech-short.example.json) to the private job folder. Set the source and caption paths, select a zero-based audio track, and supply a local font and its license. The example's paths, copy and timings are placeholders. Use a corrected, source-timed SRT and verify wording against the recording. Transcribe separately when needed. With transcript excerpts or approximate anchors alone, prepare a paper edit.

Use Python 3.9+ with Pillow and the command-line tools FFmpeg (with libx264 and AAC encoding), FFprobe and Fontconfig's `fc-query`. Run from the installed video-editor folder or give the absolute path to its [renderer](../scripts/render_speech_short.py).

```sh
python3 scripts/render_speech_short.py --project /path/to/job/short.json --check
python3 scripts/render_speech_short.py --project /path/to/job/short.json --out /path/to/job/cut-01
```

- **Timing.** Each segment selects `duration_frames` at the output FPS, starting at `source_in_seconds`. The helper joins segments in listed order. It keeps source audio at original speed and resamples to 48 kHz stereo. Review cut edges, breaths and the meaning of any reordered passages.
- **Picture.** Use one ordinary 8-bit SDR video stream (MOV/MP4, Matroska/WebM or AVI), square pixels, no rotation, known zero-based audio/video starts and a mono/stereo audio track. Select a normalized crop per passage. The helper scales it to cover the canvas and crops the remainder from the center. Follow the subject throughout the retained passage.
- **Captions.** Use ordered, nonoverlapping, plain-text SRT in source time with `HH:MM:SS,mmm` timestamps. Cues outside all cuts are omitted and logged. A boundary through a cue fails. Move that cut or supply verified finer timings. The burned captions and output SRT share frame-rounded boundaries. Supply explicit line breaks and a readable size. Use a shaping-aware editor for complex scripts, grapheme sequences, or simultaneous speakers.
- **Inputs and output.** Keep inputs inside the job folder. For an intentionally external recording, inspect the source path and use `--reference-source` for both checking and rendering. This references the original file and makes the result nonportable. Use a fresh output folder in the user's project, outside the plugin. By default the output copies the recording, SRT, font and license, so check disk space and usage scope.

The output includes `video.mp4`, corrected-timeline `captions.srt`, the editable speech-cut `project.json`, required inputs and rerender scripts, and a manifest with source ranges, caption mapping, hashes and technical checks. Edit the speech project in its folder and render a new version. Its `speech-short-1.0` schema belongs to this renderer. Studio uses its own template project format.

Check the complete export with sound and muted. Verify caption placement and accuracy, clip edges, lip sync, subject visibility and payoff. A successful encode reports `rendered_review_unverified` until the actual picture and sound receive review.

# Cross-grid matte — experimental production template

Status: original implementation tested in a reference-led production study; user taste acceptance is pending. Derived from the observed matte relationship in [Studio Znaak’s tutorial](https://www.instagram.com/studioznaak/p/DZfC5JcCOlp/), not their project files, footage or paid presets.

`CrossGrid.tsx` clips arbitrary React/Remotion children through a 3×3 matte. The center and cross arms reveal first, corners follow, the full image holds, then the matte closes. The matte is separate from the source media. Text can sit outside it to remain readable. `demo.tsx` is a complete media-free demo composition with original vector artwork; `example.json` is its editable input. It contains no brand identity, footage, fonts or sound dependencies.

Copy this directory into an existing compatible Remotion project. Requires the host’s installed React, React DOM and matching Remotion/renderer/bundler packages; no engine is bundled. The project trial used Remotion 4.0.443. From this directory with that project’s dependencies accessible:

```sh
node --test pattern.test.cjs
npx --no-install remotion render demo.tsx CrossGrid out/cross-grid.mp4 --scale=3 --props=example.json
npx --no-install remotion still demo.tsx CrossGrid out/cross-grid.png --frame=150 --scale=3 --props=example.json
```

Logical composition: 360×640, 30fps. Scale 3 exports 1080×1920. `gap` is in logical composition pixels. `stagger` is measured in frames at the composition fps; 1–12 frames is the tested study range. `duration` scales the matte progression from its 12-second base; it does not retime narration automatically. `reducedMotion` reveals the full source. Keep children fitted to the composition and retain their source resolution. Sound, when needed, belongs to the host timeline and must follow its events.

Verified: cross precedes corners, bounds/progress are valid, full read hold, reduced-motion geometry; media-free demo render plus a project trial with different words, duration, gutters and stagger. Recheck the actual build against the source after updates. Not established: audience performance, user acceptance, arbitrary text fit or every engine version. The still/layout companion is supplied independently with social-designer; a static format does not need to depend on this skill.

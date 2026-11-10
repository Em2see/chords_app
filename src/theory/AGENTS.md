# Music theory modules

Keep `src/theory/` pure: no DOM, storage, or audio side effects. Represent a note by letter and alteration; derive MIDI pitch from it. Preserve theoretical spelling, including double accidentals and the configurable F#/Gb seam.

When changing chord, progression, slash-chord, or voicing behavior, add Vitest coverage in `tests/unit/`. Exercise all 12 roots where the rule applies and check long progression chains and playable ranges. Run `make test` before submitting.

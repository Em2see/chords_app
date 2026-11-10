# Test suites

Use `*.test.ts` names. `tests/unit/` uses Vitest for music and audio logic; `tests/e2e/` uses Playwright for user flows; `tests/visual/` stores screenshot scenarios. Run unit tests with `make test`, browser tests with `make test-e2e`, and visual tests with `make test-visual`. Install browsers first with `make pw-install`. Update visual baselines using `make pw-update` only after inspecting the intended UI change. No coverage threshold is configured.

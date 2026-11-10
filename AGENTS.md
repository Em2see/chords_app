# Repository Guidelines

## Project Structure & Module Organization

`src/main.ts` connects the UI to the application modules, and `src/style.css` holds the styles. Keep pure music logic in `src/theory/`, Web Audio and microphone code in `src/audio/`, the SVG keyboard in `src/ui/`, and persisted settings in `src/state/`. Tests live in `tests/unit/`, `tests/e2e/`, and `tests/visual/`. `index.html` is the Vite entry point; Docker, Compose, and nginx files define local and production environments.

## Build, Test, and Development Commands

Run project commands through Docker via the `Makefile` rather than running npm on the host:

- `make dev` starts Vite with hot reload on port 5173.
- `make test` runs the Vitest unit suite.
- `make pw-install` installs Chromium and WebKit in the development container once.
- `make test-e2e` runs Playwright browser tests; `make test-visual` checks screenshot baselines.
- `make build` builds the production Docker image; `make up` serves it through nginx on port 3000.

## Coding Style & Naming Conventions

Use strict TypeScript, two-space indentation, single quotes, and no semicolons, matching existing files. Name modules and test files in lowercase (`progressions.ts`, `progressions.test.ts`); use `camelCase` for functions and variables, and `PascalCase` for types and classes. Keep `src/theory/` free of DOM and audio side effects. TypeScript's `noUnusedLocals` and `noUnusedParameters` are enabled; `npm run build` also type-checks. No formatter or linter is configured.

## Testing Guidelines

Add or update `*.test.ts` files beside the corresponding suite under `tests/`. Use Vitest for music and audio logic, and Playwright for user flows and visual snapshots. Changes to chord or progression logic should cover all 12 roots and preserve correct note spelling. Run `make test` before submitting; run `make test-e2e` for interaction changes. Update visual baselines with `make pw-update` only after checking the intended UI change. There is no configured coverage threshold.

## Commit & Pull Request Guidelines

The available Git history contains only release-style subjects (`version v0.1`, `version v0.2`), so it does not establish a feature-commit convention. Use short, descriptive subjects for new work. In pull requests, summarize behavior changes, list tests run, link any relevant `TASKS.md` item, and include screenshots for visible UI changes. Note any microphone or browser-specific behavior that needs manual verification.

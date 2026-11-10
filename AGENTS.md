# Repository Guidelines

## Project layout

`src/main.ts` connects the UI, `src/style.css` holds styles, and `index.html` is the Vite entry point. Music logic is in `src/theory/`, browser audio in `src/audio/`, the SVG keyboard in `src/ui/`, and saved settings in `src/state/`. Tests are under `tests/`. See the scoped `AGENTS.md` files in `src/theory/`, `src/audio/`, and `tests/` when changing those areas.

## Commands

Use Docker through the `Makefile`; do not run npm on the host. `make dev` starts Vite on port 5173. `make test` runs Vitest. `make pw-install` installs Playwright browsers; `make test-e2e` runs browser tests. `make build` builds the production image, and `make up` serves it on port 3000. The Pages workflow builds with `npm run build:pages`; the normal build keeps root-relative assets for nginx.

## Style and contributions

Use strict TypeScript, two-space indentation, single quotes, and no semicolons. Name files in lowercase, functions in `camelCase`, and types/classes in `PascalCase`. No formatter or linter is configured. Use short descriptive commit subjects; the early history only contains release subjects such as `version v0.3`. Pull requests should explain behavior, list checks run, link relevant `TASKS.md` items, and show screenshots for UI changes.

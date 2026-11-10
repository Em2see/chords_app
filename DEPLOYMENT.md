# GitHub Pages deployment

This repository builds a static Vite app. Its **Build Vite and deploy Pages** workflow is in `.github/workflows/pages.yml` and publishes on pushes to `master` or a manual run.

1. Make the GitHub repository public.
2. In **Settings → Pages → Build and deployment**, select **GitHub Actions** as the source.
3. Push changes to `master`, or run **Build Vite and deploy Pages** from the Actions tab.
4. Open `https://em2see.github.io/chords_app/` and check the UI, audio, and microphone over HTTPS. The microphone requires browser permission.

The workflow runs unit tests, builds with `npm run build:pages`, and publishes `dist/`. The Pages build sets Vite's base path to `/chords_app/`; the normal `npm run build` keeps `/` for the nginx/Traefik deployment. If Pages later uses a custom domain at its root, change the Pages base path to `/`.

Settings and progress are stored in each browser's `localStorage`. They do not transfer automatically between the Pages URL and another domain.

## Troubleshooting

If the browser requests `/src/main.ts` and gets a 404, Pages is serving the repository's source `index.html` rather than the built `dist/index.html`. Keep **Settings → Pages → Build and deployment → Source** set to **GitHub Actions**. Open the repository's **Actions** tab, choose **Build Vite and deploy Pages** (not `pages-build-deployment`), and run it on `master`. The build checks that `dist/index.html` points to `/chords_app/assets/` before deploying. Once the job succeeds, reload the site; the published HTML should no longer reference `/src/main.ts`.

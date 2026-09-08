# Public development and Pages

**PRE-ALPHA / ACTIVE DEVELOPMENT.** The browser snapshot is a **PRE-ALPHA HUMAN PLAYTEST BUILD**, not a finished product, beta or release candidate.

The single repository is `astrobyte-dev/freak-city`. Source, full development history, tags, tests, design documents, parser documentation and debug tooling are intentionally public. They contain story spoilers. No separate distribution repository is used.

The original `parser-pivot-checkpoint` tag is retained. The first public human-playtest snapshot is `v0.1.0-playtest.1`. Future snapshots should use a new tag; do not move existing checkpoints or squash the history to publish a build.

## Build and deployment

`.github/workflows/pages.yml` builds the production app from `main`, runs the unit/regression suite, uploads `dist/`, then deploys it through GitHub Pages. Its actions are pinned to specific commits. The workflow follows [GitHub's custom Pages workflow guidance](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

`npm run build:playtest` sets the public base to `/freak-city/`. `npm run preview:playtest` serves that same subpath locally. Ordinary `npm run dev` retains the root development path. Vite rewrites the CSS artwork URL for the selected base; the phone attachment uses `import.meta.env.BASE_URL`.

Settings displays the playtest version from `package.json` and the short source commit embedded by Vite. The deployed `build.json` exposes the same identifier. All playable content remains in the client bundle and is inspectable. Production source maps and the normal-interface debug inspector are disabled; the complete debugger source and editorial scene cards remain public and available in the development build.

The original project has no assigned open-source licence. Third-party licences are included in the repository and copied into the deployed site as `THIRD_PARTY_NOTICES.txt`. Generated environment-art provenance remains in `ASSETS.md`.

## Validation and screenshots

`npm run check` exercises the existing 908 tests, legacy deterministic/fuzz routes, 12 original parser campaigns and 60 natural-language campaigns. `npm run format:check` includes the public guides and workflow files.

Run `PLAYTEST_URL=https://astrobyte-dev.github.io/freak-city/ npm run test:publication` against the actual deployed site. It checks the opening, adulthood confirmation, parser, movement, transcript, phone, journal, belongings, map, save/reload, optional audio, production debugger exclusion, mobile layout, JavaScript/CSS/fonts/artwork, five accessibility scans and unexpected external requests. Browser reports are generated locally under `artifacts/publication-browser-*.json` and ignored because failed-run stacks contain workstation paths.

`CAPTURE_SCREENSHOTS=1` captures six images in `screenshots/`: opening, Velvet, an ordinary transcript, phone, belongings and mobile. Screenshots use the game's default placeholder alias and stop before the invitation's answer or major twists. The later phone-artwork test fixture is injected only after all screenshots are complete. Review every image before committing.

## Privacy and repository hygiene

No human tester's saves, preference data or personal feedback are included. Existing generated campaign artifacts are synthetic and explicitly labelled as spoilers in the contributor guide. Actual credentials and environment overrides are ignored; dependency caches, build output, IDE metadata and raw workstation logs are excluded from the current tree. The pre-existing raw test log was removed from the current tree; historical commits are preserved, including their historical test-output context.

The pre-publication review scanned all existing history for common credential formats and reviewed current tracked/untracked publication files for credentials, environment files, workstation paths and private addresses. This is a practical audit, not a guarantee that pattern matching can detect every possible secret. No credential findings required a history rewrite.

Player saves remain local to the browser. Public documentation and issue forms explicitly prohibit posting exported saves or sensitive personal adult-preference information. GitHub receives ordinary hosting and issue-tracker requests; the game adds no analytics, external model calls or preference transmission.

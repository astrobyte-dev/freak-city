# Contributing to FREAK//CITY

**PRE-ALPHA / ACTIVE DEVELOPMENT.** The UI, story, adult tone, parser, artwork, systems and scope may change substantially. This repository contains source, history, tests, design documents and debug tooling. They include major story spoilers.

Please play once before studying development information if you want to give blind first-run feedback. See [PLAYTEST.md](PLAYTEST.md). Constructive ideas and concrete reports are welcome; coding experience is not required.

## Local setup

Use Node.js 22 and npm. Run `npm ci`, then `npm run dev`. Open the URL printed by Vite. **Ctrl+Shift+D** opens the development inspector; it reveals hidden state and its mutations can create invalid narrative states. The production Pages interface excludes the inspector, while its source remains available here.

The main folders are `src/engine/` (deterministic state and parser), `src/content/` (authored world and story), `src/components/` (interface), `tests/` (regressions), `scripts/` (validation and reporting), `docs/` (architecture, design and authoring), and `screenshots/` (curated public build images). Generated `artifacts/` reports contain synthetic test runs and **major spoilers**, not real tester submissions.

## Reporting and proposing changes

Use the issue templates for parser/game bugs or constructive ideas. Preserve the exact wording of a failed command when safe to share, and include the build identifier from Settings. Keep issue titles spoiler-free and clearly mark story spoilers in the body.

Do not upload exported saves or sensitive personal adult preferences to public issues. A save includes private player state. Use the private channel through which you received the playtest invitation for personal feedback.

Discuss a substantial story, interface or architecture change before building a large pull request. Small focused fixes are easier to review. Explain the concrete before/after behavior and relevant validation. Do not add telemetry, external model calls or preference transmission. Preserve deterministic seeds, boundary controls, physical custody and existing save behavior unless a discussed change explicitly requires migration.

## Validation

```sh
npm run format:check
npm run check
npx playwright install chromium
npm run dev
# In another terminal, with the correct local URL:
PLAYTEST_URL=http://localhost:5173 npm run test:browser
```

`npm run check` builds and runs unit tests, narrative QA, deterministic/fuzz campaigns, natural-language players and the embodiment audit. Add a useful regression for a parser fix, including a differently meant near-neighbour when relevant. Do not paste private human saves into fixtures.

For the hosted asset layout, use `npm run build:playtest` and `npm run preview:playtest`. The base path is `/freak-city/`. `PLAYTEST_URL=https://astrobyte-dev.github.io/freak-city/ npm run test:publication` checks the deployed production snapshot. Screenshots can be regenerated from a local production preview using `CAPTURE_SCREENSHOTS=1`; review them for spoilers before committing.

No open-source licence has been selected for the original project. Public availability does not by itself assign one. Third-party licences are documented separately. Discuss permissions with the maintainer before reusing original story or artwork outside this project.

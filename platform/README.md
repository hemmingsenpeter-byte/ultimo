# Ultimo student application — v0.5

A static, dependency-free browser application. Canonical content lives in curriculum/, framework/, library/ and pathways/. Python compiles a public curriculum.json; HTML/CSS/JavaScript consume it. Do not hand-edit generated data.

## Features
- Responsive dashboard; progress across all sixteen faculties is reading progress, not mastery.
- Search all 134 courses and preview 536 lesson blueprints. The thirty-five authored courses have full readers.
- Formative open-answer quizzes with model answer reveal and learner self-marking.
- Prerequisite-aware rolling study queue and four suggested spaced reviews (roughly day 1, 3, 7, 30 when performed on time).
- Selectable local study plans: foundation semester, an authored faculty pathway, or all authored courses, with required prerequisites in the dashboard course list and new-study recommendations. The tutor studio highlights the next planner recommendation.
- Search the reading library and the 140 frameworks extracted from written lessons.
- Local course notes plus criterion-linked evidence with self-judgements, dated reassessments and preserved attempt/rubric history; no automatic certification.
- Export, validated import and deletion of learner data.

## Study plans and backup compatibility

The selected study plan is a local preference. Changing it preserves progress, reviews, quiz records and evidence; prerequisite completion still controls which new lessons are ready. Faculty pathways include required prerequisites outside the selected faculty. Due reviews and practice from saved weak self-checks remain eligible across all courses. The planner combines these with new study in one queue within the weekly budget, and also shows the complete due-review list. The tutor studio highlights the next item in that same recommendation queue; its lesson selector still allows any written lesson. Dashboard totals remain across all courses. Reading progress and recommendations do not certify competency.

`studyPlan` was introduced as an optional additive field in learner state version 1. Identifiers are `foundation`, `all`, or `faculty:<ID>` (for example, `faculty:MEN`). Existing records without the field use `foundation`; unknown, invalid or unavailable identifiers also use that default while retaining valid learner records. Current payloads and exports use version 2 under the unchanged storage key `ultimo.learner.v1`, so existing records are still discovered. Import validates the preference against available plans. See [the learner-state migration guide](../docs/LEARNER_STATE.md) for the complete format and recovery behaviour.

### Criterion evidence and reassessment

The evidence page keeps course notes separate from new lesson/competency evidence. Learners describe fictional or non-sensitive practice, record **Not yet demonstrated**, **Developing** or **Meets criterion** as their own judgement, and optionally set a reassessment date. A reassessment appends a new attempt with the current criterion and rubric; earlier attempts retain their saved snapshots. The dashboard and planner show due competency reassessments across all study plans, separately from the budgeted reading/review queue.

Version-1 course notes remain course notes; migration does not assign them a competency or award. A valid version-1 load is upgraded under the same key when storage is available. Version 2 requires an explicit `portfolios` array; its records are strictly validated on restore, including history, dates, targets and rubric snapshots. Invalid or missing history rejects the import rather than dropping attempts. Unloadable existing storage is preserved with writes blocked until explicit restore or erasure; Data & settings provides an original-data recovery download. See [LEARNER_STATE.md](../docs/LEARNER_STATE.md) for limits, rubric hashes, historical versions and backup portability. Self-assessments never certify competence or create mentor verification. The human pilot remains pending under [the roadmap](../PRODUCT_ROADMAP.md).

## Privacy
No user accounts, analytics or remote database on the static site. Optional model tutoring requires a separately configured loopback gateway and explicit consent. The curriculum is public. Learner records use browser localStorage; they are neither encrypted nor synced and are accessible to scripts on the same origin and to someone with access to that profile. Keep records non-sensitive and use fictional or anonymised practice evidence. Typed quiz attempts are not stored. Downloads contain private records; store securely. Use separate origins for deployment. Future multi-user accounts, consent and access control require a separate security design.

## Local development
```sh
python3 -m unittest discover -s tests -v
node tests/test_state.mjs
node tests/test_portfolio.mjs
node tests/test_tutor.mjs
node --check --input-type=module < platform/app.js
python3 tools/build.py
python3 -m http.server 8000 --directory dist
```
Open http://localhost:8000. Build output is dist/; serve over HTTP, not file://. Use Python 3.11+ and Node 22.12+ for development checks. The unit/module checks above need no external packages; browser checks use the development tools below.

### Browser and accessibility tests

The browser development tools require Node 22.12+ and Python 3.11+. From the repository root:

```sh
npm ci
npx playwright install --with-deps chromium
npm run test:browser
```

The single `@playwright/test` suite builds the site, serves the test copy at `http://127.0.0.1:3001`, and runs Chromium journeys, axe checks, synthetic tutor interactions and layout assertions using fictional records. Keep port 3001 free. CI installs Playwright's bundled Chromium. To use an installed browser instead of downloading it, replace the last two commands with:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:browser
```

Set that variable to the actual executable path and record its version; leave it unset for the bundled browser. These npm packages are development dependencies only: the static application and Python build remain dependency-free, and deployment does not require npm. See [the engineering audit](../docs/accessibility-audit.md) for scope/results, [the canonical learner pilot](../docs/learner-pilot.md) for human checks and [the INT-101 review brief](../docs/INT101_REVIEW_BRIEF.md) for independent academic review. Those human and academic reviews remain pending.

## Deployment

For a later local learner pilot, run `python3 tools/build_pilot.py` from the repository root and extract `pilot-dist/ultimo-pilot.zip`. Its launcher serves the included app without npm or model credentials, with loopback-only access by default and an explicit `--lan` option for phone testing on the same Wi-Fi. See the [pilot-kit instructions](../docs/learner-pilot.md#build-the-take-away-pilot-kit). This is a local test package; normal hosting configuration is a separate step.
A static host can publish dist/ after running python3 tools/build.py. Render static site: connect this repository, main, build command python3 tools/build.py, publish directory dist. Select the intended workspace before creating a site; do not provision paid services. GitHub Pages: set Settings > Pages > Source to GitHub Actions and run the included manual Publish Ultimo workflow. The hash-based routes work under repository subpaths. Deployment is not automatic until explicitly configured.

## Boundaries
Draft materials only. No source-level approval, independent assessor, cloud sync, mentor verification, identity system or publicly hosted AI inference. No CASE/SCORM export yet; the portable versioned curriculum.json is a platform-neutral internal export, not a standards-certified adapter. The simple reader supports the Markdown subset used by current lessons, not arbitrary HTML/Markdown. Scoped automated keyboard, semantic and reflow checks are recorded in [the engineering audit](../docs/accessibility-audit.md); real screen-reader, device and learner sessions remain required. All evidence is self-recorded; no levels are awarded. See SPEC.md and framework/review-policy.md.

## Tutor studio
Six role-based deterministic guides, curriculum passage retrieval, open-answer practice questions, prompt export and a review-first adaptive queue. A configured local Ollama or OpenAI gateway adds generative tutoring; see ../tutor/README.md. The public static site does not perform model inference.

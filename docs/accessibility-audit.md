# Accessibility engineering audit and pilot status

Status: scoped engineering integration checks passed; committed CI verification remains pending. Representative learner, real-device and manual screen-reader sessions remain pending. This is a scoped engineering record, not a WCAG conformance claim or academic approval. Pending checks are not passes.

## Scope and tested build

Baseline: merged study-plan PR #4 (`6d52159`), with 26 authored draft courses and local learner records. The integration combines browser/accessibility PRs #5 and #6 into one `@playwright/test` runner and one browser CI job. Use fictional data and leave real model inference disabled. Synthetic local gateway responses exercise asynchronous tutor interactions without a model provider.

| Field | Integrated observation |
|---|---|
| Audit date / tester | 2026-11-28; Codex engineering integration |
| Tested revision | Consolidated PR #5/#6 working tree based on `6d52159`; local run passed before the integration commit. The subsequent CI run must identify the exact committed SHA. |
| Test origin | `http://127.0.0.1:3001`; isolated static build served by the test harness |
| Environment / exact browser and tool versions | Linux/Debian 13; Python 3.12.14; Node 24.22.3; system Chromium 156.0.8078.79; `@playwright/test` 1.65.1; axe/axe Playwright adapter 4.14.1. CI's bundled Chromium is a separate observation. |
| Automated checks / final count | 21 Playwright tests passed in approximately one minute; twelve axe route scans reported no violations. Scans are steps within a test. |
| Actual screen reader / learner / real-device sessions | Not run; human coverage remains pending |

The earlier branches recorded different baselines: PR #5 (`55623ed`) reported 12 Playwright tests and eleven route scans, while PR #6 (`234221c`) reported 227 assertions in a custom Chromium script. Those are historical reports, not comparable test counts or results for the integrated build. The custom runner is superseded by the single suite below.

## Reproduce the engineering checks

Requires Python 3.11+ and Node 22.12+ for development tooling. From the repository root:

```sh
python3 -m unittest discover -s tests -v
node tests/test_state.mjs
node tests/test_tutor.mjs
node --check --input-type=module < platform/app.js
python3 tools/validate.py
python3 tools/validate_framework.py
python3 tools/validate_content.py
python3 tools/build.py
npm ci
npx playwright install --with-deps chromium
npm run test:browser
```

`npm run test:browser` is the single `@playwright/test` entry point. Its web-server configuration builds the site and serves it on port 3001; keep that port free. CI installs Playwright's bundled Chromium. To use an existing system Chromium instead of downloading the bundled browser, replace the last two commands with:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:browser
```

Set the variable to the actual executable path; leave it unset for the bundled browser. The npm dependencies are development-only; the application and Python build remain dependency-free. Ignored `playwright-report/` and `test-results/` contain reports, screenshots and failure traces using only fictional records. The suite blocks external gateway requests and uses synthetic responses for optional tutor tests.

## Coverage and results

Record pass, fail, not run or blocked with the tested revision and evidence. The results below record the final local integrated run on the environment above; committed CI verification is a separate observation.

| Check | Scope / evidence | Integrated result |
|---|---|---|
| Automated accessibility | Twelve representative routes, including expanded lesson answers/rubric, examiner answer and populated evidence; axe `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa` and `best-practice` tags with no explicit exclusions in [accessibility.spec.js](../tests/browser/accessibility.spec.js) | Pass in declared scope |
| Keyboard navigation and focus | Skip link, route titles, plan selection, lesson disclosures, quiz/read/review, evidence, backup/erase and narrow navigation; [learner-flow.spec.js](../tests/browser/learner-flow.spec.js) | Pass in declared scope |
| Local learner records and backups | Synthetic full journey, reload, preservation across plan changes, export/import, legacy/unknown preference fallback, rejected input, cancelled replacement/deletion and no retained typed quiz attempts | Pass in declared scope |
| Layout and input | Widths 320, 390, 768 and 1280 CSS pixels, 200% rendered text, keyboard and touch emulation; [reflow.spec.js](../tests/browser/reflow.spec.js). Emulation and computed text-size changes are not real-device or actual browser-zoom tests. | Pass in declared scope |
| Optional tutor interactions | Validation, synthetic delayed replies and useful focus/status; [tutor-gateway.spec.js](../tests/browser/tutor-gateway.spec.js). No model quality or safety evaluation. | Pass in declared scope |
| Existing regressions | 25 Python tests, both Node logic suites, module syntax, three validators and static build | Pass in the integrated working tree |
| Manual screen reader / native dialogs | Real reader/browser pairing, exact words heard, reading order, native file picker and confirmation access | Not run; human session required |
| Representative learners / devices | Voluntary task results, assistance, comprehension, actual touch/zoom and delayed follow-up | Not run; human sessions required |

Scanned routes: `#home`, `#courses`, `#course/INT-101`, `#lesson/INT-101.L01`, `#lesson/PHY-102.L01` (blueprint), `#lesson/EMO-103.L01`, `#planner`, `#library`, `#frameworks`, `#portfolio/INT-101`, `#tutor/INT-101.L01`, `#settings`. Route scans are steps within a test, not additional independent tests. An automated focus/semantic assertion is not a screen-reader result.

## Consolidated findings and retests

Severity follows the [human pilot guide](learner-pilot.md#severity-and-exit-decisions). The changes below combine both branches; the final integrated browser suite passed all 21 tests. Human confirmation remains separate. Keep reproduction artifacts fictional.

| Issue / severity | Observed barrier | Integrated change to verify | Retest evidence / status |
|---|---|---|---|
| A11Y-01 / S2 | Read/review, evidence, backup and tutor redraws replaced focused elements and lost useful focus. Deleting the final note had no useful destination. | Restore focus to a relevant status, field or action after view updates. | Learner-flow and synthetic tutor focus regressions passed, including late replies on invalid lesson routes |
| A11Y-02 / S2 | Field errors were transient messages without persistent field association; saving a quiz before revealing answers lacked clear recovery. | Persistent described-by messages, invalid state and focus at the affected field or unopened answer. | Hours, quiz, evidence, invalid-backup and tutor-validation regressions passed |
| A11Y-03 / S2 | Repeated quiz/disclosure and delete-note controls did not distinguish their associated question or note. | Question-associated names and course/date context for delete actions. | Expanded-state scans and semantic assertions passed; real screen-reader confirmation remains pending |
| A11Y-04 / S2 | Navigation context was unclear; course/framework results skipped heading levels; skip-link reuse and mobile Escape/current-route selection needed reliable focus and closing. | Meaningful route titles, ordered result headings, reusable skip link and consistent menu handling. | Route title, heading, skip-link and mobile-menu regressions passed |
| A11Y-05 / S2 | Prior CSS measurements found low form-boundary and dark-sidebar focus contrast. | Higher-contrast form boundaries and focus indicators, including active navigation and disclosures. | Integrated browser regressions passed; actual visibility with varied displays/users remains pending |
| A11Y-06 / S3 | Disclosure targets needed a stated minimum size. | Minimum summary target height and visible focus style. | Integrated geometry/browser regressions passed; real touch usability remains pending |

## Readiness and remaining work

- Engineering readiness: the local integrated suite and existing regressions passed; independent integrated code review found no blockers in this scope. Committed CI URL/SHA and bundled-browser result remain to be recorded. These scoped results do not close the human pilot.
- Human pilot completion: pending actual voluntary learner, real screen-reader and device sessions under [learner-pilot.md](learner-pilot.md), with findings and successful retests. No participant or actual assistive technology result is claimed here.
- Coverage limits: Chromium automation does not establish other engines, real touch, actual browser zoom, screen-reader announcements or native-dialog usability. Only documented combinations are covered.
- Independent INT-101 source/subject review remains pending under [the review brief](INT101_REVIEW_BRIEF.md). Teaching efficacy, model safety/quality, deployment and hosted inference remain separate gates.

Keep [roadmap milestone 2](../PRODUCT_ROADMAP.md#2-browser-and-accessibility-pilot--in-progress) in progress until its human gates are met. Record a dated product review decision and disposition for remaining issues/coverage limits; automated results alone do not close the milestone.

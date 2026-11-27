# Accessibility engineering audit and pilot status

Status: scoped engineering pass complete; human pilot remains open. All 12 browser tests and the existing regression checks pass in the scope below. This report separates engineering checks from actual learner and manual screen-reader sessions. Pending rows are not passes. This is a scoped test record, not a WCAG conformance claim or academic approval.

## Baseline and scope

Baseline: selectable study plans from product PR #4, with 26 authored draft courses and local learner records. The core journey is plan → course → lesson → quiz → read → review → evidence → backup restore/erase. Review the dashboard, planner, course/lesson readers, tutor guide, library, portfolio, settings and responsive navigation. Use fictional data and leave model inference disabled.

The prior study-plan change recorded 43 scripted Chromium checks and layouts at 320, 390 and 768 CSS pixels. That prior result is context only; current findings, fixes and retests belong below. See [the learner pilot protocol](learner-pilot.md) for voluntary consent, tasks and manual assistive technology expectations.

## Tested build and environment

| Field | Recorded value |
|---|---|
| Audit date / tester | 2026-11-27; Codex automated engineering audit |
| Baseline commit / tested commit | `43acc2a` baseline; tested product code and browser suite in `7a2414b` |
| Tested URL and origin | `http://127.0.0.1:3001`; isolated local static build with fictional records; external model requests blocked and two gateway tests use synthetic local responses |
| OS / environment | Debian 13.7 cloud environment; Python 3.12.14; Node 24.22.3 |
| Browser name and exact version | Installed Chromium 156.0.8078.79 |
| Automation library and version | Playwright 1.65.1 |
| axe-core version / rules or tags / exclusions | axe-core 4.14.1; `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`; no explicit route-element exclusions |
| Viewports, orientation and zoom | 1280 × 900 baseline and 320 × 900 narrow layout; doubled computed text sizes at 1280 × 900 simulate text-only enlargement, not actual browser zoom |
| Keyboard / pointer / touch inputs | Scripted Tab, Enter, Space and select-key interactions; pointer used for some expanded-state setup; no real touch session |
| Actual screen reader, version and browser pairing | Not run; no manual session recorded |
| Representative learner sessions | Not run; no participants recorded |
| Preferred learner device | Optional preference unanswered; Chromium engineering baseline used, with actual device coverage still pending |

## Checks and results

Use pass, fail, not run or blocked; add issue IDs and evidence paths. An automated semantic/focus assertion is not a manual screen-reader result. Record routes and states, including expanded quiz answers and populated local records; a scan of the landing page alone does not cover the journey.

| Check | Method / routes and states | Result | Evidence / follow-up |
|---|---|---|---|
| Automated accessibility scan | Eleven routes; expanded lesson answers/rubric, examiner answer and populated evidence | Pass in declared scope; zero axe violations | [accessibility.spec.js](../tests/browser/accessibility.spec.js); eleven scans are steps inside one test, not eleven separate tests |
| Keyboard navigation and visible focus | Tab/Enter/Space learning flow; skip link, navigation, course/lesson, quiz and read action; narrow menu | Pass; includes plan selection, route titles, skip-link reload and mobile Escape | [learner-flow.spec.js](../tests/browser/learner-flow.spec.js) and [reflow.spec.js](../tests/browser/reflow.spec.js); focus assertions do not establish actual screen-reader announcements |
| Focus after actions and errors | Read/review, evidence save/delete, restore/erase and tutor controls; field-validation improvements | Pass; validation, cancellation and delayed synthetic tutor responses also tested | Learner-flow tests assert `document.activeElement` after redraw; see findings below |
| Responsive layout and reflow | Seven routes at 320 CSS pixels; same seven with doubled computed text at 1280 CSS pixels | Pass; no document horizontal overflow or off-screen form controls in asserted states | [reflow.spec.js](../tests/browser/reflow.spec.js); simulated text enlargement is not actual browser zoom or a real mobile device |
| Fictional learner journey | Course search → lesson → self-check → read; seeded due review → evidence → download → erase → restore → delete | Pass | Learner-flow tests check local records, focus and backup equality; native file selection is supplied by Playwright and confirmations are handled by script |
| Backup compatibility and rejected input | Browser round trip, malformed/oversized rejection and cancellation; Node legacy/unknown plan validation | Pass for the stated browser and Node assertions | Learner-flow tests verify rejected/cancelled imports preserve records; `tests/test_state.mjs` covers legacy/unknown selections. Native picker/confirmation accessibility still needs the manual pilot |
| Regression suites, validators and build | 12 Playwright tests, 25 Python tests, both Node suites, JS syntax, three validators and build | Pass | Browser run: 12 passed in 28.9s; two synthetic gateway tests rechecked after the final assertion addition (2 passed). Commands below |
| Manual screen-reader journey | Actual reader/browser pairing and words heard for labels, state changes and status/focus | Not run | Human session required |
| Representative learner sessions | Voluntary protocol; unaided vs assisted task results and retests | Not run | Human sessions required |

Scanned routes: `#home`, `#courses`, `#course/INT-101`, `#lesson/INT-101.L01`, `#lesson/PHY-102.L01` (blueprint), `#planner`, `#library`, `#frameworks`, `#portfolio/INT-101`, `#tutor/INT-101.L01`, `#settings`. Reflow/text-enlargement routes: home, planner, courses, authored lesson, portfolio, tutor and settings.

## Reproduce the engineering checks

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
npx playwright install chromium
npm run test:browser
```

The local run selected installed Chromium using `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium`. CI installs Playwright's Chromium; its run is a separate browser/build observation. Reports and failure traces are generated under ignored `playwright-report/` and `test-results/`; they contain only fictional test records. Tests mock the optional gateway and never call a model provider.

## Findings and fixes

| Issue / severity | Reproduction and observed barrier | Change / commit | Retest method and result | Status |
|---|---|---|---|---|
| A11Y-01 / S2 | Read/review, evidence, backup and tutor actions replaced focused elements and lost a useful focus location | Explicit focus restoration to status, field or action | Learner-flow and synthetic tutor focus regressions pass | Fixed and retested in engineering scope |
| A11Y-02 / S2 | Field errors were transient status messages without a persistent field association | Persistent messages, described-by links, invalid state and focus at the affected field; quiz save directs to the unopened answer | Hours, quiz, evidence, invalid-backup and tutor-validation regressions pass | Fixed and retested in engineering scope |
| A11Y-03 / S2 | Repeated quiz/disclosure and delete-note controls did not distinguish their associated question or note | Question-associated attempt/self-check labels and disclosure names; course/date context for delete actions | Expanded-state axe scan passes; semantic assertions and manual screen-reader confirmation remain distinct | Automated scan passed; manual reader test pending |
| A11Y-04 / S2 | Route titles, repeated skip-link use, mobile-menu escape and heading structure needed clearer navigation context | Updated page titles, skip/navigation handling, Escape behaviour and heading structure | Route title, skip-link reload, menu Escape and expanded semantic scans pass | Fixed and retested in engineering scope |
| A11Y-05 / S2 | Form-boundary contrast measured 2.03:1; dark-sidebar focus contrast measured 2.42:1 | CSS changes measured 4.09:1 for form boundaries and 8.21:1 for sidebar focus; active-navigation focus 5.03:1 | Ratios measured from declared CSS colour combinations; assess actual visibility with users and varied displays separately | Measured and browser regressions pass |
| A11Y-06 / S3 | Disclosure targets needed a stated minimum size | Summary minimum height 24 CSS pixels; measured height 26 pixels in the checked baseline | CSS/geometry measurement; real touch usability not tested | Measured; real-device check pending |

Use the [pilot severity guide](learner-pilot.md#severity-and-exit-decisions). Keep source artifacts and screenshots fictional; do not commit participant records or learner backups.

## Readiness and remaining coverage

- Engineering readiness: all 12 browser tests, eleven axe route scans, both seven-route layout checks and existing regressions pass; independent code review found no remaining blockers in this scope. The browser suite is now a CI job. Human accessibility validation remains open.
- Human pilot completion: pending actual voluntary learner sessions, manual screen-reader checks and follow-up retests. No participants or real assistive technology sessions are claimed here.
- Browser/device limits: only combinations explicitly listed as tested are covered. A resized desktop viewport does not establish real mobile touch, browser or assistive technology behaviour.
- Remaining checks include actual browser zoom, real screen-reader announcements/reading order, native file-picker and confirmation accessibility, device-specific touch interactions, and learner comprehension of the workflow. Scripted input/file/dialog handling does not establish these human outcomes.
- Curriculum source review, teaching efficacy, model safety/quality and hosted inference are separate gates.

Track engineering readiness and human pilot completion separately in [the product roadmap](../PRODUCT_ROADMAP.md). Keep the milestone in progress while human coverage or material fixes remain outstanding.

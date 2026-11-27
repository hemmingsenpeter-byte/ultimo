# Browser, accessibility and INT-101 pilot

This protocol supports milestone 2 of the [product roadmap](../PRODUCT_ROADMAP.md). **Representative learner sessions, real screen-reader testing and independent INT-101 review are pending.** Automated checks support this work; they do not complete those human gates, establish accessibility conformance or approve curriculum.

## Scope and preparation

Use INT-101, *Learning how to learn*, as the first course. It has no prerequisites and four canonical lessons. Preserve its outcomes, IDs, draft status and assessment rules. Follow [SPEC.md](../SPEC.md), the [review policy](../framework/review-policy.md) and [assessment policy](../framework/assessment-policy.md).

- Record the commit SHA, test date, browser/OS/device versions, viewport and assistive technology/version before testing.
- Use a fresh browser profile and synthetic progress, quiz ratings and fictional evidence. Run on a separate test origin; preserve any existing learner records before testing deletion.
- Explain the draft status and obtain voluntary participation. Allow breaks, stopping and equivalent written, oral or other accessible responses. Do not require personal disclosure or record a session by default.
- Keep participant identities, consent records, downloads and detailed session notes outside this public repository. Publish aggregate findings and synthetic reproduction steps only.

## Reproduce automated checks

Requires Python 3.11+ and Node 22.12+ for the optional browser tooling. The application itself remains dependency-free. From the repository root, using the locked development dependencies:

```sh
python tools/build.py
npm ci
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:browser
```

The last command uses an installed system Chromium at `/usr/bin/chromium`. CI installs Playwright's bundled Chromium instead:

```sh
python tools/build.py
npm ci
npx playwright install --with-deps chromium
npm run test:browser
```

Leave `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` unset when using the bundled browser. Record the actual results and limitations with the tested SHA; do not infer screen-reader or learner results from this suite. For manual sessions, serve the built app with `python -m http.server 8765 --directory dist` and open `http://localhost:8765`.

## Initial automated baseline — 27 November 2026

Tested the changes on `product/browser-accessibility-pilot`, based on merged study-plan PR #4 (`6d52159`). GitHub's browser check records the exact committed revision and bundled Chromium version for subsequent runs.

| Coverage | Local observation |
|---|---|
| Environment | Linux; system Chromium 156.0.8078.79; Playwright 1.65.1; axe 4.14.1. |
| Synthetic learner journey | 227 browser checks pass, including plan selection, prerequisite unlocking, self-check, reading, due review, notes, reload, backup transfer/migration, malformed input and deletion. |
| Automated accessibility | No findings on 11 representative routes under axe's WCAG A/AA and best-practice rules. This is not a WCAG conformance result. |
| Layout and input | Viewports 320, 390, 768 and 1280 pixels; 200% root text sizing; keyboard journey and touch emulation. No page-level horizontal overflow in tested views. Text sizing and emulation do not establish real browser-zoom or device support. |
| Other checks | 25 Python tests, both Node logic suites, three content validators, module syntax and static build pass. |
| Human and engine coverage | Representative learners, real screen readers, real touch devices and non-Chromium engines not tested. |

Confirmed and corrected these defects; regression checks exercise the affected flows:

- Saving a note replaced the focused button and left focus on the document body. View updates now retain the relevant control; read/review completion focuses its confirmation and deleting the last note focuses the note field.
- Course and framework results skipped from an `h1` to an `h3`. Their results now have an intermediate heading.
- Selecting the current page from mobile navigation did not trigger `hashchange`, leaving the menu open. The same-route action now closes it and moves focus to the page.

Page titles now identify each view, and native answer/rubric disclosures have an explicit visible focus style. The pilot remains in progress until the human coverage and exit gate below are satisfied.

## Representative learner sessions — pending

Start with a small formative group, for example 3–5 adult learners spanning study experience and device needs, including an experienced screen-reader user. This is a practical starting sample, not a policy threshold or evidence of population-wide effectiveness. Record gaps in representation and recruit further sessions when findings require them.

Allow roughly 45–60 minutes for the application walkthrough. Ask the learner to attempt the tasks before offering help; record assistance and confusing wording. Use fictional records throughout.

| Task | Observable result |
|---|---|
| Choose foundation, a faculty and all written courses | Learner identifies the active plan and finds its course list. A Mental plan explains why INT-101 is a prerequisite. Switching preserves saved work. |
| Navigate dashboard, course and lesson | Learner finds INT-101 and L01, returns to the course and understands the next recommendation. |
| Read and self-check | Learner locates objective, example and rubric, attempts a question before revealing its answer, and records a self-rating. Reading and self-rating are understood as distinct from verified competence. |
| Save a fictional evidence note | Learner saves and finds the note, can delete it, and understands that local records are not encrypted or synced. |
| Complete a due review | Using a synthetic due-review fixture, learner finds the review, completes it and understands the updated state. Changing plan does not hide the complete due-review list. |
| Reload and transfer a backup | Plan and saved records survive reload. Export/import into a fresh profile restores the synthetic records; malformed input gives a useful error without erasing valid state. |
| Delete test records | Learner understands the scope of deletion, can cancel, then deletes the synthetic records and verifies the result after reload. |
| Use a narrow screen or zoom | Navigation, reading, inputs and actions remain reachable without lost content or blocked controls. |

Separately allow the four lessons and extended seven-day cycle to be attempted over time. Record actual time, comprehension difficulties, workload and feasibility; a short walkthrough cannot validate the four-hour estimate or delayed learning. Ask the learner to:

1. Distinguish recognition from recall using a new example (INT-101.L01).
2. Plan spaced retrieval with corrections and explain why timing may vary (L02).
3. Apply feedback to a new case and explain what counts as transfer (L03).
4. Revise a learning plan using delayed results (L04).

These are pilot observations, not automatic competency decisions. Capture feedback after the delayed attempt and note missing follow-up explicitly.

## Keyboard, screen reader and device checks — pending

Repeat every application task using keyboard only and a real screen reader with a supported browser, such as NVDA/Firefox or VoiceOver/Safari. Record the exact pairing; one passing pairing does not establish support for others. Include a desktop browser from another engine, a real touch device, narrow screens and text zoom; record any coverage still unavailable.

- Headings, landmarks, page title, course/lesson identity and active plan are understandable when spoken. Form controls have meaningful labels and selected/expanded states.
- Focus is visible and follows a usable order. Navigation and rerendering leave focus at an understandable location. There are no keyboard traps or pointer-only actions.
- Answer reveal, self-rating, note saving, review completion, import errors and deletion feedback are perceivable without relying on colour or visual position.
- Reading order, source links, rubric tables and answer explanations remain understandable. Equivalent evidence options are discoverable.
- At 200% text zoom and a narrow mobile viewport, content and controls remain usable. Check touch operation, orientation changes and browser zoom/reflow separately; viewport emulation alone is not a real-device result.

Record pass, fail or not tested for each task and pairing, with concrete observations. Automated accessibility scans and DOM focus assertions cannot substitute for these checks.

## Session log, defects and exit gate

Keep the detailed session log private. Copy this template for each task; do not fill unknown fields with assumed passes.

```text
Session code / date / tested SHA:
Browser / OS / device / viewport or zoom / assistive technology versions:
Task ID and synthetic starting state:
Result: pass | fail | not tested
Assistance needed / observed confusion / elapsed time:
Issue ID / severity / synthetic reproduction steps / expected vs actual:
Fix SHA / affected tasks and pairings / retest date and result:
Coverage gaps / remaining limitations:
```

| Severity | Meaning and response |
|---|---|
| Blocking | Core task cannot be completed, assistive access is prevented, or records are unexpectedly lost/disclosed. Stop the affected flow, fix and retest before the pilot milestone closes. |
| Major | A core task needs assistance or a difficult workaround, or feedback misleads the learner. Fix and retest before closure. |
| Minor | Friction or presentation issue with a usable path. Track with an owner and disposition; retest when changed. |

Close the product pilot only when the task/pairing coverage and representative sessions are recorded, no blocking or major defects remain, affected flows have passed retest, and unresolved minor issues and coverage limits have an explicit owner and disposition. Document a dated product review decision and link its evidence. Until then, milestone 2 remains in progress. Product pilot completion does not promote course status, approve deployment or authorise hosted AI.

## Independent INT-101 review brief — pending

This is preparation for an independent source and subject review, not a completed audit. Review all four lessons, their `.assessment.json` and `.sources.json` files, [syllabus.json](../curriculum/INT-101/syllabus.json) and [capstone/rubric](../curriculum/INT-101/assessment.md). The current maps contain broad teaching paragraphs and generic locators, explicitly marked `draft_reference_mapping`.

Retrieve full text for Dunlosky et al. (2013), DOI `10.1177/1529100612453266`, and Roediger and Karpicke (2006), DOI `10.1111/j.1467-9280.2006.01693.x`. The `learn-review`/`dunlosky-2013` and `learn-test`/`roediger-karpicke-2006` IDs describe the same respective publications, not independent additional evidence. Abstracts and located links alone do not verify the lessons. *Make It Stick* is supplementary; verify edition/pages if relying on a claim from it.

| Lesson | Priority claim checks |
|---|---|
| L01 | Recognition, recall and understanding distinctions; immediate fluency versus delayed retention; limits of a correct answer as evidence of understanding. |
| L02 | Retrieval and spacing effects, corrective feedback and “why/how” questions. Preserve the limitation that days 1/3/7/30 are a starting schedule rather than a universal optimum. |
| L03 | Feedback effectiveness, self-explanation and transfer. Check each assertion against specific evidence; the broad review citation may not support every feedback/transfer claim. |
| L04 | Evidence-backed learning principles versus original planning/error-log heuristics. Keep the seven-day cycle clearly labelled as an Ultimo design exercise, not a validated mastery intervention. |

For each factual claim, record the exact sentence and stable lesson ID, source/edition/DOI, exact page/section/table, evidence type, context and limitations, verdict (supported/partial/unsupported), correction, reviewer role/date, reviewed SHA and conflicts of interest. Check factual accuracy, bias and intellectual property. Add an appropriate source or narrow/remove unsupported assertions; do not invent locators. Keep original fictional exercises distinct from research findings.

An independent education, statistics or philosophy specialist, as relevant, should assess outcome alignment, answer feedback, assessment validity and equivalent accessible demonstrations. All four criteria require Level 2 evidence; no averaging away missing criteria. Level 3 requires delayed independent application and documented human judgement. Record gaps in reviewer expertise rather than implying qualified coverage.

Retain draft status until actual evidence satisfies the ordered source, subject, learner and approval gates in the review policy. Any eventual status change must cite the reviewed version, reviewer decision, remaining limitations and resulting corrections. AI or automated review does not replace the required independent judgement.

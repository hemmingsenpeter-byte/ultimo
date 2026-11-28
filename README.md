# Ultimo

An open curriculum for lifelong human development: capability, character, connection and flourishing.

**v0.5 — tutor studio and personalised learning pilot.** 16 faculties, 134 course syllabuses, 536 lesson blueprints, 537 competencies. Thirty-three courses now contain 132 authored draft lessons, 460 knowledge-check questions and thirty-three capstones. Not accredited; independent review pending.

- [Tutor architecture and local model setup](tutor/README.md)
- [Student application and deployment guide](platform/README.md)
- [Product roadmap](PRODUCT_ROADMAP.md)
- [Prepare the take-away phone/desktop pilot kit](docs/learner-pilot.md#build-the-take-away-pilot-kit)
- [Learner and assistive technology pilot](docs/learner-pilot.md), [engineering audit](docs/accessibility-audit.md) and [independent INT-101 review brief](docs/INT101_REVIEW_BRIEF.md)
- [Local competency evidence, reassessment and backup migration](docs/LEARNER_STATE.md)
- [Master specification](SPEC.md)
- [Faculty and course index (readable)](framework/faculty-index.md)
- [Five-year pathway](pathways/five-year.md)
- [Faculty and course catalogue (JSON)](framework/catalogue.json)
- [Assessment policy](framework/assessment-policy.md)
- [Lesson authoring standard](framework/lesson-standard.md)
- [Progression levels](framework/levels.json)
- [Foundation semester — ten authored courses](pathways/semester-one.md)
- [First course: Learning how to learn](curriculum/INT-101/README.md)
- [Contributing and AI agent rules](AGENTS.md)

## Run locally

Requires Python 3.11+ and Node 22.12+ for the development checks below. The application and Python build have no external package dependencies. Optional browser checks use locked npm development dependencies.

    python -m unittest discover -s tests -v
    python tools/validate.py
    python tools/validate_framework.py
    python tools/validate_content.py
    node tests/test_state.mjs
    node tests/test_portfolio.mjs
    node tests/test_tutor.mjs
    python tools/build.py
    python -m http.server 8000 --directory dist

Open http://localhost:8000. The application includes course search, lessons, formative quizzes, spaced review, a study planner, framework and reading libraries, and browser-local reading progress and practice notes. No cloud learner data or verified mastery. See platform/README.md for deployment and limitations.

Run the single browser suite with `npm ci`, `npx playwright install --with-deps chromium`, then `npm run test:browser`. It builds and serves its own test site. To use system Chromium instead of downloading a browser, replace the installation step and final command with `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:browser`. See the [engineering audit](docs/accessibility-audit.md) for scope, results and coverage limits. Actual learner, screen-reader/device and independent academic reviews remain pending; the browser/accessibility pilot is in progress.

The existing MIT licence is retained. Additional content-licensing decisions are pending owner approval. Do not put private learner records, journals or credentials here.

Tutor Studio is available on the static site with curriculum guidance, practice and prompt export. Actual generative inference requires a configured local gateway; see tutor/README.md. No API key is shipped in static assets.

# Ultimo

An open curriculum for lifelong human development: capability, character, connection and flourishing.

**v0.5 — tutor studio and personalised learning pilot.** 16 faculties, 134 course syllabuses, 536 lesson blueprints, 537 competencies. Seventeen courses now contain 68 authored draft lessons, 204 knowledge-check questions and seventeen capstones. Not accredited; independent review pending.

- [Tutor architecture and local model setup](tutor/README.md)
- [Student application and deployment guide](platform/README.md)
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

Requires Python 3.11+; no external packages.

    python -m unittest discover -s tests -v
    python tools/validate.py
    python tools/validate_framework.py
    python tools/validate_content.py
    node tests/test_state.mjs
    node tests/test_tutor.mjs
    python tools/build.py
    python -m http.server 8000 --directory dist

Open http://localhost:8000. The application includes course search, lessons, formative quizzes, spaced review, a study planner, framework and reading libraries, and browser-local reading progress and practice notes. No cloud learner data or verified mastery. See platform/README.md for deployment and limitations.

The existing MIT licence is retained. Additional content-licensing decisions are pending owner approval. Do not put private learner records, journals or credentials here.

Tutor Studio is available on the static site with curriculum guidance, practice and prompt export. Actual generative inference requires a configured local gateway; see tutor/README.md. No API key is shipped in static assets.

# Ultimo

An open curriculum for lifelong human development: capability, character, connection and flourishing.

**v0.3 — foundation semester draft.** 16 faculties, 134 course syllabuses, 536 lesson blueprints, 537 competencies. Ten courses now contain 40 authored draft lessons, 120 knowledge-check questions and ten capstones. Not accredited; independent review pending.

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
    python tools/build.py
    python -m http.server 8000 --directory dist

Open http://localhost:8000. The static prototype renders plain text course material; it does not track learner progress. See SPEC.md for future Moodle, LiaScript and Astro adapters.

The existing MIT licence is retained. Additional content-licensing decisions are pending owner approval. Do not put private learner records, journals or credentials here.

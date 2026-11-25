# Ultimo

An open curriculum for lifelong human development: capability, character, connection and flourishing.

**v0.1 foundation / draft** — not accredited and not a completed university.

- [Master specification](SPEC.md)
- [Faculty and course catalogue](framework/catalogue.json)
- [Progression levels](framework/levels.json)
- [First course: Learning how to learn](curriculum/INT-101/README.md)
- [Contributing and AI agent rules](AGENTS.md)

## Run locally

Requires Python 3.11+; no external packages.

    python -m unittest discover -s tests -v
    python tools/validate.py
    python tools/build.py
    python -m http.server 8000 --directory dist

Open http://localhost:8000. The static prototype renders plain text course material; it does not track learner progress. See SPEC.md for future Moodle, LiaScript and Astro adapters.

The existing MIT licence is retained. Additional content-licensing decisions are pending owner approval. Do not put private learner records, journals or credentials here.

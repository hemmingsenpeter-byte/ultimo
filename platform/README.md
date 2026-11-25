# Ultimo student application — v0.5

A static, dependency-free browser application. Canonical content lives in curriculum/, framework/, library/ and pathways/. Python compiles a public curriculum.json; HTML/CSS/JavaScript consume it. Do not hand-edit generated data.

## Features
- Responsive dashboard; progress across all sixteen faculties is reading progress, not mastery.
- Search all 134 courses and preview 536 lesson blueprints. The twenty-three authored courses have full readers.
- Formative open-answer quizzes with model answer reveal and learner self-marking.
- Prerequisite-aware rolling study queue and four suggested spaced reviews (roughly day 1, 3, 7, 30 when performed on time).
- Search the reading library and the 92 frameworks extracted from written lessons.
- Local practice evidence notes and per-lesson competency rubric display; no automatic certification.
- Export, validated import and deletion of learner data.

## Privacy
No user accounts, analytics or remote database on the static site. Optional model tutoring requires a separately configured loopback gateway and explicit consent. The curriculum is public. Learner records use browser localStorage; they are neither encrypted nor synced and are accessible to scripts on the same origin and to someone with access to that profile. Keep records non-sensitive and use fictional or anonymised practice evidence. Typed quiz attempts are not stored. Downloads contain private records; store securely. Use separate origins for deployment. Future multi-user accounts, consent and access control require a separate security design.

## Local development
```sh
python3 -m unittest discover -s tests -v
node tests/test_state.mjs
node tests/test_tutor.mjs
node --check --input-type=module < platform/app.js
python3 tools/build.py
python3 -m http.server 8000 --directory dist
```
Open http://localhost:8000. Build output is dist/; serve over HTTP, not file://. Python 3.11+ and Node 20+ for development tests; no external packages needed.

## Deployment
A static host can publish dist/ after running python3 tools/build.py. Render static site: connect this repository, main, build command python3 tools/build.py, publish directory dist. Select the intended workspace before creating a site; do not provision paid services. GitHub Pages: set Settings > Pages > Source to GitHub Actions and run the included manual Publish Ultimo workflow. The hash-based routes work under repository subpaths. Deployment is not automatic until explicitly configured.

## Boundaries
Draft materials only. No source-level approval, independent assessor, cloud sync, mentor verification, identity system or publicly hosted AI inference. No CASE/SCORM export yet; the portable versioned curriculum.json is a platform-neutral internal export, not a standards-certified adapter. The simple reader supports the Markdown subset used by current lessons, not arbitrary HTML/Markdown. Keyboard, screen-reader and device testing still required. All evidence is self-recorded; no levels are awarded. See SPEC.md and framework/review-policy.md.

## Tutor studio
Six role-based deterministic guides, curriculum passage retrieval, open-answer practice questions, prompt export and a review-first adaptive queue. A configured local Ollama or OpenAI gateway adds generative tutoring; see ../tutor/README.md. The public static site does not perform model inference.

# Ultimo agent instructions

Read SPEC.md before editing. Do not change the mission, stable IDs, licence, assessment policy or privacy boundaries without owner approval.
1. Select a small course/competency scope; map outcomes and prerequisites.
2. Research credible sources. Verify exact claims and links; never invent citations.
3. Write original Markdown, worked examples, retrieval prompts, transfer tasks and a rubric.
4. Add structured records and tests. Use draft status unless evidence of independent review exists.
5. Run python -m unittest discover -s tests -v; python tools/validate.py; python tools/build.py.
6. Submit a focused PR with source audit, assumptions, remaining limitations and test results.
Do not add personal records, secrets, scraped books or unlicensed text. Never claim medical, psychological or financial expertise or award competency automatically. For higher-risk topics require subject-matter review. Avoid generic motivational filler. Extend schemas with migration notes. Keep source content independent of frontend frameworks.

## v0.2 authoring workflow
Before writing, read curriculum/<ID>/syllabus.json and framework/lesson-standard.md, assessment-policy.md and review-policy.md. The four lesson IDs and outcomes are canonical; do not generate placeholder lessons or alter scope without review. Add actual lesson, assessment and source-map files, then update syllabus and catalogue content statuses together as appropriate. Preserve the existing course schema for authored course records and validate both layers. Run python tools/validate_framework.py in addition to prior tests. Syllabus.md is a readable mirror; update it with the canonical JSON. Open one focused PR per course/faculty. Framework coverage is not academic approval.

## v0.3 content validation
The foundation semester is a reference implementation. Run python tools/validate_content.py after any content change. Retain draft status until the editorial gates are met. Reference-located is not source-checked; replace paragraph-level source maps with precise claim-level citations during independent review. Keep original exercises clearly distinct from validated findings. Do not promote any course to approved merely because structural checks pass.

## v0.4 platform workflow
The browser app consumes generated curriculum.json; never hand-edit dist. Keep canonical content and private learner state separate. No remote learner data, API keys, tracking or automatic competency awards. Preserve accessibility and data portability. Run Python and Node tests plus app module syntax check before merging. Treat deployment configuration and independent academic review as separate gates. See platform/README.md.

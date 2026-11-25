# Lesson architecture and authoring contract — v0.2

Design backward from the observable outcome and acceptable evidence, then choose learning experiences. Each syllabus.json is the canonical authoring brief; syllabus.md is its human-readable counterpart. A blueprint is not a written lesson. Preserve course and lesson IDs.

## Standard lesson structure (60 minutes indicative)

| Block | Time | Required deliverable |
|---|---:|---|
| Orientation and retrieval | 5 min | Prior knowledge question, objective, relevance and scope |
| Core theory | 15 min | Original explanation, defined terms, mechanisms, evidence, limitations |
| Framework | 10 min | Reusable mental model, steps, conditions for use, accessible visual and counterexample |
| Worked example | 10 min | Realistic fictional case with reasoning and contrasting case |
| Guided practice | 10 min | Task, instructions, feedback and a worked solution |
| Transfer and retrieval | 10 min | Novel case, low-stakes questions, answer explanations and independent exercise |

For skill-based sessions, replace lecture time with supervised or simulated practice when appropriate. Provide an equivalent text alternative for audiovisual and physical tasks where possible. Keep higher-risk skills within qualified supervision, and distinguish literacy from practical certification.

## Required lesson files for future authors

- L01.md etc: complete learner-facing material, original prose and worked examples.
- L01.assessment.json etc: question IDs, outcome mapping, answer key, scoring and feedback.
- L01.sources.json etc: exact claim-to-source mapping, edition or publication date, page/section/DOI, evidence type, access date and limitations.
- Optional visuals or scripts: accessible alternatives, provenance and licence.
- Use syllabus.json reading candidates as leads, not proof of claims. Add new verified sources as needed.

Use spaced retrieval after approximately 1, 3, 7 and 30 days as a suggested starting cadence, adjustable to retention goals and workload; do not claim those intervals are universally optimal. Include meaningful application rather than recognition alone. Base design on MIT backward design guidance, Dunlosky et al. (2013) and CAST UDL Guidelines 3.0; see library/sources.json.

## Authoring gate

A complete draft includes actual explanation, one worked example, one contrasting example, at least three meaningful retrieval/application questions with answers, an exercise, feedback guidance, and a claim-source map. A title, templated paragraph or reading list is not a complete lesson. No target word count substitutes for instruction quality. Identify contested claims and contexts. Do not require private disclosure. Review for accessibility and potential harm before publishing.

The four initial INT-101 lessons are preserved as earlier drafts; they must be upgraded to this standard before approval.

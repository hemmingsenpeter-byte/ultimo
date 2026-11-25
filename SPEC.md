# Ultimo — Master specification v0.5
Status: framework defined for 134 courses; seventeen authored draft courses; owner and subject review still required.

## Mission and constitution
Develop a well-rounded adult who can live independently, think critically, care for others, create, contribute and enjoy life. The initial audience is adult men, but the curriculum is inclusive and does not prescribe a single life path, personality, relationship arrangement, body type or worldview. Character and agency matter more than status. Achievement is not human worth. Protect autonomy, rest, safety, privacy, consent and intellectual humility.

## Architecture
Git is the source of truth. JSON records hold stable IDs, metadata, outcomes, prerequisites and rubrics; original Markdown holds lessons. Python validates and compiles static HTML. Delivery is replaceable: evaluate LiaScript for interactions, Astro for the polished site and Moodle for competency evidence later. Do not duplicate canonical content in an LMS. Align future competency exports with 1EdTech CASE where feasible; no compliance claim yet.

## Taxonomy and progression
Faculty > domain > competency > observable rubric > course > lesson > exercise > assessment > evidence. See framework/faculties.json and levels.json. Each learner can progress independently by competency. Levels 0–6 describe demonstrated learning, not human value. Level 3 is the intended core target where appropriate. Higher levels require repeated application and qualified judgement; AI cannot certify clinical, safety-critical, physical or relationship outcomes. No score is assigned to happiness, disability, income, partnership status or personal disclosure. Allow equivalent accessible demonstrations. Separate self-assessment, observed performance and mentor verification.

## Five-year pathway
1. Foundation: learning, physical and physiological literacy, habits, emotional awareness, personal finance, practical safety.
2. Human connection: relationships, communication, friendship, social psychology, cultural literacy.
3. Builder: business, technology, science, systems, finance and creative projects.
4. Responsibility: leadership, ethics, community service, civic literacy and crisis judgement.
5. Integration: philosophy, arts, life design and a multidisciplinary capstone.
All sixteen faculties remain available. This is an adult, self-paced programme; years are sequencing suggestions, not fixed deadlines. Default study plan: 5 hours/week, adjustable; protect leisure and recovery.

## Authoring contract
Every course defines ID, faculty, measurable outcomes (in future schema revision), prerequisites, target level, estimated hours, source IDs, assessment and review status. Each lesson includes objective, original explanation, worked example, retrieval or application prompt, practical task, and source mapping. Use plain English and New Zealand spelling. Book titles are references, not substitutes for instruction. Produce accessible diagrams with text alternatives. Use short sections and meaningful headings. Create original exercises and explanations.

## Evidence and academic integrity
Prefer primary research, systematic reviews and official guidance. Distinguish established evidence, expert judgement, hypotheses, and contested claims. Include limitations and publication metadata; verify URLs and specific claims before approval. Popular books are supplementary. Do not reproduce copyrighted material or fabricate references. Health, finance, law, safety and psychology content requires appropriately qualified review and local adaptation. Offer educational material, not diagnosis, treatment or regulated personal advice. No forced disclosures or hazardous trials.

## Assessment
Use baseline retrieval, application questions, authentic practical tasks, delayed reassessment and reflection. Rubrics specify observable evidence for each level; assessment criteria are shared beforehand. An AI tutor may offer formative feedback; independent competency confirmation requires appropriate evidence and, when relevant, qualified human observation. Provide retakes, alternative tasks and appeals. Store no personal evidence in this public repo.

## Framework library
Every reusable mental model will have a stable ID, provenance, scope, limitations, worked examples, counterexamples, exercises, and links to competencies. Distinguish a descriptive model from empirically validated intervention. Avoid treating heuristics as universal laws.

## Governance
Draft -> source checked -> subject review -> pilot tested -> approved -> published. Record reviewer, date, claims checked and change history in PRs. CI checks machine-readable structure, ID uniqueness, references, prerequisite cycles and lesson paths. CI is not academic review. Never promote status merely because code passes. Use one faculty per focused PR, independent review, and explicit owner approval for scope/licence changes.

## Privacy and security
Public curriculum only. Future student data in a separate private datastore with access control, encryption, export and deletion. Do not send journals or health/relationship records to model providers without informed consent. No secret keys in Git. Never require biometric data. No grading people on protected traits or intimate choices.

## Roadmap and exit gates
v0.1: framework, catalogue, first draft course, local renderer and tests. Gate: validator and local build pass; owner reviews specification.
v0.2: 134 course syllabuses, 536 lesson blueprints, mapped competency rubrics, reading candidates, course assessments and prerequisite-ordered pathways. Framework coverage implemented; validation and independent review are gates, not assumed complete.
v0.3: ten substantive first-semester courses; independent reviews and student pilot.
v0.4: static student application, local progress and evidence records, searchable libraries and platform-neutral JSON export; deployment, accessibility validation and standards adapters remain separate gates.
v0.5: curriculum-grounded AI tutor with provenance, refusal boundaries and evals.
v0.7: evidence portfolios, mentor review and tested progression engine.
v1.0: complete foundation programme, validated assessments, accessibility and privacy review.
v2.0: full five-year curriculum. No fixed calendar or guaranteed learning outcomes.

## Decisions pending
Content licence (existing MIT preserved; consider CC BY-SA for future original course content), public site deployment, learner account design, review panel, complete taxonomy and institutional accreditation claims. The first pilot is Intellectual Mastery. The catalogue has complete syllabus coverage but not completed course content.

## v0.2 canonical artefacts

- framework/faculty-index.md and catalogue.json: full programme index.
- curriculum/<ID>/syllabus.json and syllabus.md: four topic-specific lesson blueprints, learning outcomes, practice briefs, candidate readings, capstone and criteria. These are not authored lessons.
- framework/competencies.json: 536 lesson-level records and original umbrella INT.learning. Seven levels per record; topic-anchored initial rubrics require subject calibration.
- pathways/five-year.json: prerequisite-ordered course progression and annual capstones.
- framework/lesson-standard.md, assessment-policy.md, review-policy.md and standards-mapping.md: design, editorial and interoperability policies.
- schemas/syllabus.schema.json and tools/validate_framework.py: blueprint contract and cross-record consistency checks.

The four lessons of INT-101 remain intact as draft content. No new lessons are authored in this release. Default estimated study time is six hours per course (four lesson hours plus assessment) except INT-101 retains four hours plus its extended practice cycle. Programme sequencing is indicative and can be revised; yearly workload is intentionally not equal. The framework uses backward design (MIT Teaching + Learning Lab), retrieval/distributed practice research (Dunlosky et al.) and CAST UDL Guidelines 3.0. Sources are in library/sources.json. No claim of CASE certification or clinical accreditation.

## v0.3 teaching semester

The first ten courses are listed in pathways/semester-one.json and semester-one.md. Forty complete draft lesson files, companion formative assessment records and draft reference maps, plus course capstones, are now present. The original INT-101 draft lessons have been expanded to the common authoring format. The remaining 124 courses have blueprints, not authored lessons. All ten courses are explicitly draft and still need source-level verification, subject review, safety review as appropriate, pilot testing and editorial expansion. The reference maps link core teaching paragraphs to located references, not certified sentence-level evidence. The 58 indicative study hours exclude extended practice and should be recalibrated during learner pilots. No LMS or competency certification is deployed.

## v0.4 student application
The Python compiler produces public curriculum.json from canonical records, with authored lesson sections, formative questions, evidence criteria and sources. A dependency-free HTML/CSS/JavaScript frontend provides course and syllabus browsing, a dashboard, self-checked quizzes, prerequisite-aware study planning, spaced reviews, searchable libraries, per-lesson rubrics and a local evidence portfolio. Client data is versioned, validated on import, exportable and erasable. Local browser storage is not encryption or an authenticated multi-user datastore; do not collect confidential data. Completion and self-assessment are not verified competence. No AI tutor or automated assessor. Future framework interactions, human review, SCORM/CASE adapters and accessibility audits remain pending. Deployment requires choosing a hosting target and configuring its account. See platform/README.md.

## v0.5 tutoring and recommendations
The tutor studio supplies six roles scoped to authored lessons and reference IDs. The public static site supports deterministic retrieval, self-check examinations and export of curriculum-grounded prompts. A separate optional loopback-only provider gateway supports Ollama and OpenAI, with explicit consent, bounded conversation history, no automatic award of competency and no private portfolio in prompts. Hosted generative tutoring requires separate approval and production security. Study recommendations prioritise due reviews, low self-check scores and prerequisite-ready lessons within the weekly budget. Model-level evaluations, academic review and hosted inference remain gates. See tutor/README.md.

## Curriculum expansion — Intellectual Faculty

INT-102 and INT-104 now include eight additional authored draft lessons, 24 questions and two capstones. The foundation semester remains unchanged; 122 courses remain syllabus-only. Source maps are preliminary and independent review is pending.

## Intellectual Faculty draft completion

All nine Intellectual Faculty courses now have authored draft lessons (36 in total). INT-105 through INT-109 add 20 lessons, 60 formative questions and five capstones. Across the programme, 17 courses and 68 lessons are authored; 117 courses and 468 lessons remain blueprint-only. The existing ten-course foundation semester is unchanged. Source mapping, qualified review and learner pilots remain required.

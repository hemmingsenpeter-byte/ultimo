# Ultimo — Master specification v0.1
Status: draft; owner review required.

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
v0.2: define competency rubrics, source registry, course outcomes and assessment maps for remaining planned courses; review pilot.
v0.3: ten substantive first-semester courses; independent reviews and student pilot.
v0.4: accessible website, private progress, framework library and export adapter proof.
v0.5: curriculum-grounded AI tutor with provenance, refusal boundaries and evals.
v0.7: evidence portfolios, mentor review and tested progression engine.
v1.0: complete foundation programme, validated assessments, accessibility and privacy review.
v2.0: full five-year curriculum. No fixed calendar or guaranteed learning outcomes.

## Decisions pending
Content licence (existing MIT preserved; consider CC BY-SA for future original course content), public site deployment, learner account design, review panel, complete taxonomy and institutional accreditation claims. The first pilot is Intellectual Mastery. The catalogue is a planning scaffold, not completed courses.

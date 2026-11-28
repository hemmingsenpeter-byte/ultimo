# Ultimo product roadmap

This roadmap covers the learner application. Curriculum remains draft; product checks do not establish academic approval or verified competence.

## Current baseline

- Static browser app with 134 course syllabuses; 26 authored draft courses, 104 lessons and 348 formative questions.
- Course readers, self-checked quizzes, spaced reviews, local evidence notes, searchable libraries and portable learner backups.
- Deterministic tutor guides and an optional single-user loopback model gateway; no learner accounts or cloud sync.

## 1. Selectable local study plans — implemented

Let learners choose the foundation semester, an authored faculty pathway, or all authored courses. Use the selected plan for the dashboard course list and next lesson, and for new lessons in the weekly planner. The tutor studio highlights the next item from the planner's recommendation queue.

Acceptance criteria:

- All three plan types are available; faculty plans include their prerequisite courses even when those sit outside the faculty.
- Queues respect recorded prerequisite completion and show the next eligible lessons; a plan choice never marks work complete or awards competence.
- New study follows the selected plan, including required prerequisites; due reviews and practice from saved weak self-checks remain global when focus changes.
- The planner shows one queue within the weekly budget and a separate complete due-review list. The tutor studio highlights its next recommendation; dashboard totals remain across all courses and its selected course list identifies the active plan.
- Switching plans preserves existing progress, quizzes, reviews and evidence. The preference survives reload and backup export/import.
- Older version-1 backups and invalid plan identifiers fall back to the foundation plan without losing valid learner records.
- State, planner and tutor tests pass; browser checks cover selecting, switching, restoring and following each plan.

Validation: 25 Python tests, both Node suites, all content validators and the static build pass. A scripted Chromium journey passed 43 checks for plan selection, prerequisite unlocking, backup migration, shared recommendations, keyboard focus and layouts at 320, 390 and 768 pixels. Screen-reader and representative learner testing remain part of the next milestone.

## 2. Browser and accessibility pilot — in progress

A reusable local pilot ZIP can now be built with `python3 tools/build_pilot.py`. It supplies phone/desktop launch instructions, fictional starter data, participant tasks, a facilitator guide and blank private-feedback template. An AI preliminary INT-101 source audit provides review questions and full-text locators. Actual learner sessions, screen-reader/device testing and independent source/subject review remain pending.

Exercise the complete learning flow with representative learners and assistive technology before expanding the application.

The browser automation and accessibility fixes from PRs #5 and #6 are consolidated into one `@playwright/test` suite and one browser CI job. The integrated local run passed 21 browser tests, including twelve axe route scans with no violations; committed CI verification is separate. Human learner, real-device and manual screen-reader sessions remain pending. Follow the [canonical learner pilot protocol](docs/learner-pilot.md), and record tested revisions, combinations, findings and retests in the [engineering audit](docs/accessibility-audit.md). Engineering readiness and human pilot completion are separate decisions; automated results alone do not complete this milestone.

Acceptance criteria:

- Test plan selection, dashboard navigation, lesson reading, quiz self-check, review completion, evidence notes and backup export/import/deletion.
- Complete the same flows using only a keyboard; verify visible focus, labels, headings, focus order and clear feedback with a screen reader.
- Check narrow mobile screens, touch controls and text zoom for readable content, usable forms and no blocked actions.
- Record browser/device coverage and learner feedback without private records; fix blocking issues and retest affected flows.
- Record engineering readiness only after scoped checks and blocking fixes pass. Mark the human pilot complete only after actual voluntary learner and manual screen-reader sessions, findings and necessary retests are documented; untested combinations remain explicit limitations.

The engineering scope covers the synthetic learning/backup journey, keyboard focus, route titles, narrow layouts, text enlargement, touch emulation, axe rules and optional tutor controls with synthetic responses. Fixes address focus after redraws, persistent field errors and control names, heading order, mobile navigation, contrast and disclosure targets. Independent INT-101 full-text and exact-claim source/subject review is still pending; see the [review brief](docs/INT101_REVIEW_BRIEF.md). Product validation does not approve curriculum.

## 3. Criterion-linked local evidence and reassessment

Connect practice evidence to existing lesson competency criteria and make delayed follow-up visible.

Acceptance criteria:

- Learners can link non-sensitive or fictional evidence to a stable competency ID and rubric version, record their own criterion judgement and set a reassessment date.
- Self-assessment, reading completion and any future reviewer judgement remain distinct; missing evidence stays “not yet demonstrated”.
- Reassessment presents the relevant criteria and earlier evidence, supports a new attempt and preserves history.
- Versioned local records support validated migration, export, import and deletion, with accessible alternative demonstrations and no automatic certification.

## 4. Accounts, sync and mentor review — later

Design the private data architecture before connecting learner records to a service.

Acceptance criteria:

- Approve a design for identity, access control, consent, encryption, retention, export/deletion, sync conflicts and migration from local records before implementation.
- Demonstrate account isolation and recovery using synthetic data; make sharing explicit and limited to the intended reviewer.
- Mentor decisions identify criteria, evidence, reviewer role, date and feedback, with reassessment and appeal; self-recorded work remains separate.

## Hosted AI — gated future work

Proceed only after model-specific educational, safety, hallucination, citation-entailment, prompt-injection and privacy evaluations, plus owner approval of the authenticated architecture, per-user/global spend controls, rate limits, consent and retention policy. Provider credentials stay server-side; learner evidence is excluded from prompts unless separately authorised. Deployment approval is a separate gate.

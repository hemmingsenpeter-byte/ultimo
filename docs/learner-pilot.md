# Learner and assistive technology pilot

Status: protocol prepared; representative learner, real-device and manual screen-reader sessions remain pending. This is the canonical human pilot protocol. Use [the accessibility audit](accessibility-audit.md) for engineering results and [the INT-101 review brief](INT101_REVIEW_BRIEF.md) for the separate independent academic review. A scripted browser pass does not complete this pilot or establish curriculum quality.

## Build the take-away pilot kit

From the repository root, with Python 3.11+:

```sh
python3 tools/build_pilot.py
```

This produces `pilot-dist/ultimo-pilot.zip` from the canonical curriculum and the four fixed files in [pilot/](../pilot/). It includes the browser app, a standard-library launcher, participant task card, facilitator/consent guide, fictional starter backup and blank feedback CSV. A manifest records the source revision, curriculum version and file hashes. The archive contains no participant results, research papers or model gateway. Output is ignored by Git; completed feedback belongs in a separate private location.

Extract the ZIP on a computer and run `python3 start-pilot.py` (Windows: `py -3 start-pilot.py`). Open the printed browser URL. When ready to test a phone on the same trusted Wi-Fi, restart with `--lan` and open the printed LAN URL on the phone. Download the fictional fixture from the printed `/pilot-fixture.json` URL and import it through **Data & settings**. The default server is computer-only; LAN access is an explicit option. Stop with Ctrl+C after use.

Read the kit README before starting: each hostname/port/device has separate browser records, and a busy port may produce a new origin. No installation of npm packages, learner account, model provider or feedback service is required to run the extracted kit. The participant's browser records are local to their device.

Use [the preliminary evidence audit](INT101_PRELIMINARY_AUDIT.md) as a handoff for an independent reviewer. It identifies wording and source-map questions; canonical teaching material and draft statuses are unchanged. Preparing or launching this kit does not create a completed human session.

## Session setup and voluntary consent

Start with a small formative group, for example 3–5 adult learners spanning study experience and device needs, including an experienced screen-reader user. This is a practical starting sample, not a policy threshold or evidence of population-wide effectiveness. Record gaps in representation and arrange further sessions when findings require them.

Allow about 45–60 minutes with breaks for the application walkthrough. Use the learner's preferred device, browser and usual assistive technology where available; record versions, viewport/zoom and input method. Run a separate keyboard-only pass and a manual screen-reader pass if those are not the learner's usual setup. Record untested combinations as not run. Keep INT-101's outcomes, stable IDs, draft status and assessment rules; it has no prerequisites and is the initial course scope.

Use a clean test browser profile on the verified preview or local static build. Check the origin before starting: records and backups are local to that origin. Never replace or erase the learner's real records. Do not configure a model provider, enter credentials or send prompts during this session. Use only the fictional fixture, quiz attempts and note below.

Read aloud or provide in an accessible format:

> We are testing the application, not you. Participation is voluntary. You can pause, skip a task or stop at any time without giving a reason. Please use fictional information only. We will note which actions worked and where the interface caused difficulty; we do not need your name, health information or other personal history. We will not make audio, video or screen recordings under this protocol. Your answers and reading marks are not a test of competence. May we proceed with these anonymous session notes?

Proceed only after an explicit yes; log consent as yes/no, session code and date in the private session record. If declined, stop. Ask separately before retaining a direct quotation; otherwise paraphrase without identifying details. Explain who will see the notes and the agreed deletion date before consent. Do not put participant-level notes, consent records or backups in this public repository; publish only de-identified aggregate findings and reproducible fictional examples.

Facilitation: give each task goal first, allow an unaided attempt, then offer help or a skip. Record help given and the interface obstacle. Do not count facilitator-led completion as independent success. Stop and remove accidental private information from notes if it appears. At the end, erase the test profile's app records and delete fixture/backups from downloads and any shared folder as agreed.

## Fictional starter backup

The facilitator saves this as `ultimo-pilot-fictional.json` and restores it through **Data & settings → Restore a backup** in the clean profile. It simulates one earlier reading session so a review is already due; it does not represent a real learner. Confirm the app has no real records before accepting the replacement prompt. The dates are deliberately in the past; do not change the device clock.

```json
{
  "version": 1,
  "completed": {"INT-101.L02": "2020-01-01"},
  "reviews": {"INT-101.L02": {"due": "2020-01-02", "step": 0}},
  "quizzes": {},
  "evidence": [],
  "hours": 5,
  "last": null,
  "studyPlan": "foundation"
}
```

## Task journey and observable criteria

Use the controls as presented, without development tools. These are expected outcomes to check, not results already observed. Record pass, fail, assisted, skipped or not run for each task, plus the failure step and severity.

| Task | Learner goal | Observable acceptance criteria |
|---|---|---|
| 1. Choose a plan | Choose **Mental faculty**, keep five hours, and save. | The saved focus is visible, survives reload and includes **INT-101** as a prerequisite. Existing due review remains available. Switching to **All written courses**, **Foundation semester** and back preserves it. |
| 2. Find a course | From the plan, open **INT-101 — Learning how to learn**. | The course title, prerequisite information and lesson list are discoverable. The learner can explain which items are authored drafts and that reading is not certified competence. |
| 3. Read a lesson | Open **L01**, locate core teaching, a worked example and the knowledge check. | The lesson heading and sections are available in reading order. Links, text and tables remain usable at the chosen zoom/viewport. The learner can return to the course without losing the selected plan. |
| 4. Self-check | Enter the fictional answer “A short practice task with feedback”; reveal every model answer, mark any one answer matched, then save. | Hidden answers are not presented as already revealed. Saving before every reveal explains the missing step. Successful save reports the score and “No competency awarded”; typed answers are not included in the saved backup. This tests interaction, not correctness. |
| 5. Mark read | Mark **INT-101.L01** read once. | A read date and first review date appear. Repeating the action cannot add a duplicate or reset the first review. Reading completion is distinct from quiz score and competence. |
| 6. Complete a due review | Find the seeded **INT-101.L02** review, open it, attempt a recall and record the due review. | It is reachable from the full due-review list even after a focus change. One action advances one review step and shows the next due date. A repeat before that date is rejected or unavailable without silently advancing. |
| 7. Add evidence | Save the note “Fictional pilot: compared two practice plans, tried a short retrieval task and noted one change.” for **INT-101**. | The selected course and exact fictional note appear once. Saving does not claim assessment or certification. Delete-note cancel preserves it; confirm removes it. Re-add it for the backup task. |
| 8. Export and restore | Download a backup, change the plan, then restore that backup. | Download can be found using the browser's normal controls. Cancel replacement preserves current records. Confirm restores the exported plan, hours, read marks, review dates, score and note. No typed quiz attempt is retained. Keyboard/screen-reader access to the native file picker and confirmation is verified. |
| 9. Erase | Erase the local test data, first cancelling and then confirming. Reload. | Cancel changes nothing. Confirm returns to the foundation default with no read marks, scores, reviews or evidence; reload stays empty. The app explains exported files are separate. Delete test downloads during cleanup. |

Optional engineering checks, separate from the learner's unaided tasks: restore a copy with `studyPlan` omitted, then one with an unknown identifier. Each uses the foundation default while retaining valid fictional records. An invalid JSON file or file over 5 MB must be rejected without replacing existing records. Use disposable files only.

## Delayed INT-101 follow-up — pending

Separately allow the four lessons and extended seven-day learning cycle to be attempted over time. Record actual time, comprehension difficulties, workload and task feasibility; the walkthrough alone cannot validate the four-hour estimate or durable learning. Ask the learner to:

1. Distinguish recognition from recall using a new example (INT-101.L01).
2. Plan spaced retrieval with corrections and explain why timing may vary (L02).
3. Apply feedback to a new case and explain what counts as transfer (L03).
4. Revise a learning plan using delayed results (L04).

Provide equivalent accessible written, oral, visual or simulated demonstrations without personal disclosure. These are pilot observations, not automatic competency decisions. Capture feedback after the delayed attempt and record missing follow-up explicitly. Source and subject review remain separate ordered gates under the [review policy](../framework/review-policy.md).

## Keyboard checklist

- Start at the page top. Tab reveals **Skip to content**; activating it moves focus to main content. Route navigation moves focus to the new main content and exposes its page heading.
- Tab/Shift+Tab follows the visual and reading order with a visible, unobscured indicator. Every link, select, disclosure, button, quiz checkbox, file picker and confirmation can be operated without a pointer. There are no traps.
- At a narrow viewport, **Menu** exposes navigation, its expanded state matches visibility, and navigation remains reachable. After choosing a page, focus is in that page rather than hidden navigation.
- Arrow keys change the study-focus select without saving until **Update study plan** is activated. Saving keeps focus at a useful control; invalid hours take focus to the hours field and explain the accepted range.
- Space/Enter operates answer disclosures and checkboxes using their native semantics. After read/review/save/delete/restore/erase actions that redraw the page, focus remains at an understandable status, field or next action rather than disappearing to the document body.
- Native file and confirmation dialogs can be completed or cancelled with the keyboard. Cancellation returns to the initiating control or an equally clear location without data changes.

## Manual screen-reader checklist

Use an actual screen reader, not only an accessibility-tree inspection. Record reader/browser versions, reading and interaction modes, the exact words heard, and the observed focus after each action. Expected meanings below are acceptance targets; wording may vary by reader. Do not mark a row passed from source attributes or automated checks alone.

Use a supported pairing such as NVDA/Firefox or VoiceOver/Safari, preferably the participant's familiar setup. Passing one pairing does not establish coverage of another.

| Interaction | Expected announcement and focus behaviour |
|---|---|
| Page navigation | **Primary navigation** and **main** landmarks, the current navigation item and a meaningful page heading are discoverable. After a route change the reader is at the new main content; the new page can be identified without searching the entire document. |
| Plan selection | The control is announced as **Study focus**, a select/combobox, with its current option. The help about prerequisites and keeping progress is associated with it. Saving announces “Study plan saved in this browser” or an honest storage-failure message; focus remains useful. |
| Hours error | The hours field has an accessible name and current value. Submitting zero or a non-whole value announces “Enter a whole number from 1 to 20” and focuses that field. |
| Search and progress | Search fields have labels; changed result counts are announced without moving focus on every keystroke. Progress controls identify the course/faculty and quantity, with no claim of mastery. |
| Quiz | Each attempt field has its question/answer-number label. **Reveal model answer** exposes expanded/collapsed state; answer and feedback can be read after expansion. Checkboxes have meaningful names. An incomplete save explains every answer must be revealed; successful save announces the score and no competency award. |
| Read and review | “Lesson marked read. First review scheduled”, “Review recorded”, or “This review is not yet due” is perceivable. After redraw the read/review status and next review date are readily reachable; focus does not silently reset. |
| Evidence | Course and note controls have labels. Save/delete feedback is announced; focus lands on a useful input/action or remaining note after redraw. The note can be reviewed without duplicated or missing text. |
| Backup/erase | The download button, file input and destructive confirmation are named. Restore/erase success or failure is announced; after confirmation focus returns to a useful settings control. Cancellation preserves data. Verify the native browser dialogs with the reader too. |

## Device, zoom and reading checks — pending

- Repeat the core tasks on a real touch device and a desktop browser from another engine; record exact combinations and unavailable coverage. Desktop resizing or touch emulation is not a real-device result.
- Check narrow screens, portrait/landscape changes, 200% text enlargement and actual browser zoom/reflow. Text, forms and actions remain reachable without clipped content or blocked controls. Record actual settings rather than treating a simulated font increase as browser zoom.
- Read source links, worked examples and rubric tables in order. Confirm that draft status, equivalent evidence options, local-storage limitations and the distinction between completion and competence are understandable.

## Severity and exit decisions

| Severity | Meaning | Action |
|---|---|---|
| S1 critical | Private data exposed, records unexpectedly lost, or an essential task cannot be completed by the tested input/assistive technology with no reasonable alternative. | Stop the affected flow, preserve only fictional reproduction evidence, fix and retest before declaring engineering readiness. |
| S2 major | A core task needs facilitator help or a substantial workaround; focus, labels or feedback prevent reliable independent use. | Fix and repeat the affected task with the relevant input method before closing the issue. |
| S3 minor | Task completes independently but wording, navigation or presentation causes avoidable confusion. | Track with a reproducible example and prioritise with learner feedback. |
| S4 suggestion | Preference or enhancement without an observed task barrier. | Record separately from a failure. |

Engineering readiness requires passing the declared automated and keyboard/reflow engineering checks with no unresolved S1/S2 issues in the tested scope. Human pilot completion additionally requires actual voluntary sessions and manual screen-reader/device coverage on the recorded combinations, documented findings and successful retests of affected flows. S3 issues and coverage limits need an explicit owner and disposition; missing coverage is not a pass. Record a dated product review decision and its evidence. Keep roadmap milestone 2 in progress until these human gates are met. Neither decision certifies the curriculum, establishes broad accessibility conformance, approves deployment or authorises hosted AI.

## Blank anonymised session record

Copy this into an approved private location; never commit completed participant records here.

```text
Session code (no name/contact details):
Date / facilitator code:
Consent yes/no; explanation of note audience/deletion date accepted:
Device / OS / browser and version:
Input method / screen reader and version / reading mode:
Viewport / zoom / orientation:
Build commit and tested URL/origin:
Planned coverage; skipped combinations:

Task ID | pass/fail/assisted/skipped/not run | observed action/focus/announcement
        | help given | elapsed time | severity | fictional reproduction steps | issue ID

What was clear? (anonymous paraphrase):
What was difficult? (anonymous paraphrase):
Requested improvement:
Direct quotation permitted separately? yes/no; omit unless needed:
Breaks/skipped tasks/stop request (no personal reason required):
Retest build / date / affected task and pairing / result / remaining issue:
Issue or coverage-gap owner / disposition / review decision:
Cleanup of app data and test downloads confirmed:
Notes owner and agreed deletion date:
```

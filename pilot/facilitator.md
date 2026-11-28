# Ultimo pilot: facilitator guide

This kit prepares a later session. It contains no participant results. Start with 3–5 adult volunteers spanning study experience and device needs, including an experienced screen-reader user where possible. This is a formative starting group, not a claim of representative effectiveness. Allow 45–60 minutes per walkthrough, with breaks or early stopping.

## Before each session

1. Launch the kit using its README. Use a dedicated test browser profile and only fictional data. For a phone, use the same trusted Wi-Fi as the host computer and the launcher's explicit LAN option; mobile data alone cannot reach that local address.
2. Make a private working folder outside this kit and any public repository. Copy `feedback.csv` there; never put completed records back into the kit. Record who may read the notes and their deletion date before asking for consent. Do not record names or contact details in the task log.
3. Read `manifest.json` and record its source revision, curriculum version and kit build identity in the session notes. Also record device, operating system, browser/version, viewport/zoom, input method and actual assistive technology/version. Mark unavailable coverage as not run.
4. In the clean profile, open **Data & settings → Restore a backup** and import `pilot/fictional-fixture.json`. On a phone, first download the printed `/pilot-fixture.json` URL on that phone, then select that download in the restore control; the host computer's file path is not a phone file. Check that INT-101.L02 has a due review. This deliberately old fixture simulates an earlier session; do not change the device clock. Check the test profile has no real records before accepting replacement.
5. Give the participant `participant-tasks.md`. Keep this facilitator guide separate from their task card so its expected outcomes do not lead their responses.

## Consent script

Fill the two placeholders before reading this aloud or providing it accessibly:

> We are testing the application, not you. Participation is voluntary. You can pause, skip a task or stop without giving a reason. Please use fictional information only. We will keep anonymous notes about which actions worked and where the interface caused difficulty. The notes will be read by **[audience]** and deleted by **[date]**. We will not make audio, video or screen recordings. Reading marks and self-checks are not a test of your competence. May we proceed with these anonymous notes?

Proceed only after an explicit yes; record yes/no, date and an anonymous session code. If declined, stop. Ask separately before retaining an exact quotation; otherwise paraphrase. If private information appears, stop that note and remove the private information. Do not record a reason for stopping.

## Observe the eight tasks

Give each goal, allow an unaided attempt, then offer help or a skip. Record `pass`, `fail`, `assisted`, `skipped` or `not_run`; assisted completion is not an independent pass. Do not judge correctness of the fictional quiz response.

| Task | What to verify |
|---|---|
| 1. Plan | Mental includes INT-101 prerequisites; selection survives reload; switching preserves the existing due review. |
| 2. Navigation | Course, lesson, objective, example and knowledge check are discoverable. Reading order and return navigation work. Draft and syllabus-only states are understood. |
| 3. Self-check | An early save identifies the missing reveal; all answers can be revealed and one self-rating saved. The score is formative and typed attempts are absent from backups. |
| 4. Read | One read mark creates a first review date; repeating cannot duplicate/reset it. Reading is understood as separate from verified competence. |
| 5. Review | The seeded due review remains reachable across plan choices; one action advances one review step. Another action before the next date cannot advance it. |
| 6. Evidence | The exact fictional note appears once for INT-101. Cancel preserves it; confirm deletes it. Focus and status remain useful after each action. |
| 7. Backup | Export includes the plan, hours, read/review records, score and note. Cancel preserves the changed plan; confirm restores the export. Native file picker and confirmation work with the participant's input method. |
| 8. Erase | Cancel preserves records; confirm clears local records and reload stays empty. Exports are understood as separate copies and are cleaned up. |

For keyboard-only and real screen-reader passes, repeat the same tasks. Observe focus, labels, heading/landmark order, expanded/selected states, errors and success messages. Write the actual words heard and assistive technology pairing; source attributes or a browser accessibility scan are not a screen-reader result. Check Menu opening/closing, Escape and selecting the current page on narrow screens.

For device coverage, use a real phone and a desktop browser from another engine where available. Check portrait/landscape, touch, narrow screens, 200% text and actual browser zoom. Emulation and a resized desktop window do not establish real-device support.

## Record and close

For the optional competency-evidence extension, check that migration does not assign a competency to an old note automatically. Reusing it must preserve the original; recording a later attempt must append rather than replace its notes and rubric. Confirm optional follow-up dates, full backup history and explicit deletion. Ask the participant to explain the difference between their judgement and verified competence. An immediate second attempt is an interface rehearsal; it does not complete the delayed learning follow-up.

`feedback.csv` is a blank template with no example participant rows. Keep one private copy per session; record one row per task or coverage gap. Use a session code, not a person's name. Keep quotes out unless separately permitted. Record elapsed time, help, a concrete interface barrier and any synthetic reproduction steps. Fill unknown results as `not_run`, never as passes.

Severity: `S1` means exposure/loss of records or an essential task blocked; `S2` means a major obstacle requiring help or a substantial workaround; `S3` means usable friction; `S4` means a preference or suggestion. Stop an affected S1 flow. Fix and retest S1/S2 issues using the same input method before closing them. Record a named role responsible for each issue and coverage gap, without participant identities.

End by erasing the test profile's app records and deleting fixture/backup downloads from the device and shared folders. Keep the agreed private session notes until their deletion date. Publish only aggregate findings and fictional reproduction steps.

Do not close the pilot until actual sessions, screen-reader/device coverage, successful retests and a dated review decision are recorded, with no unresolved S1/S2 issues and a disposition for other gaps. App checks do not approve the curriculum. Independent source/subject review and delayed learning follow-up remain separate.

For the seven-day INT-101 learning follow-up and full acceptance checklist, see the [canonical pilot protocol](https://github.com/hemmingsenpeter-byte/ultimo/blob/main/docs/learner-pilot.md). For independent academic review, see the [INT-101 review brief](https://github.com/hemmingsenpeter-byte/ultimo/blob/main/docs/INT101_REVIEW_BRIEF.md).

An [AI preliminary evidence audit](https://github.com/hemmingsenpeter-byte/ultimo/blob/main/docs/INT101_PRELIMINARY_AUDIT.md) records source locators and wording questions for that reviewer. It is preparation, not independent academic approval; the packaged teaching material remains draft.

# Local learner state and evidence history

The browser stores private learner records under the existing localStorage key `ultimo.learner.v1`. The key is retained to discover existing records; the current JSON payload and new backups use **`version: 2`**. The storage key is not the payload schema version. No records are uploaded, synchronised, human-verified or used to award competence.

## Version 1 migration

Loading or importing a valid version-1 record produces version 2 in memory. A successful load also writes the upgraded payload under the same key when browser storage is available; a write failure is reported. Existing valid reading marks, reviews, quiz summaries, study hours, last lesson, study-plan preference and course notes retain their values. Missing `studyPlan` and unknown plan identifiers use `foundation` under the existing compatibility rule.

The legacy `evidence` array remains a collection of course-level notes with `{id, course, date, note}`. Migration does not guess a lesson, competency, judgement or rubric for a note. These notes remain available separately from the new `portfolios` collection; a migrated record starts with an empty collection unless it contains valid portfolio records. New exports carry version 2. Older application versions cannot safely restore the new format. Keep backups and use a separate browser profile or port when running an older pilot kit: older code on the same origin may overwrite data it cannot understand.

## Criterion-linked records

The new collection has this shape; field names below describe the structure rather than an import fixture:

```text
portfolios: [
  {
    id, course, lesson, competency,
    attempts: [
      {
        id, date, note, judgement, reassessOn,
        rubric: {version, criterion, levels}
      }
    ]
  }
]
```

| Field | Meaning |
|---|---|
| `id` | Stable local record ID; each attempt also has its own unique ID. |
| `course`, `lesson`, `competency` | An authored lesson and its stable competency ID, for example `INT-101`, `L01` and `INT-101.L01`. Blueprint-only lessons are not evidence targets. |
| `date` | Calendar date of the attempt, formatted `YYYY-MM-DD`. |
| `note` | Non-sensitive or fictional description of practice evidence. Equivalent written, oral, visual or simulated demonstrations may be described; no personal disclosure is required. |
| `judgement` | `not_yet`, `developing` or `meets`, always a learner's own judgement against the criterion. `meets` is not an awarded competency level or reviewer decision. |
| `reassessOn` | A valid calendar date on or after the attempt date, or `null` for no reminder. |
| `rubric` | The criterion text, seven level descriptions and version captured for that attempt. |

A reassessment appends an attempt rather than rewriting earlier notes or judgements. The latest attempt determines whether that record has a due reminder. Due competency reassessments appear across study-plan choices on the dashboard and planner, separately from the budgeted reading/review queue; they do not consume an assumed number of study minutes. The earlier criterion and attempt history remain visible. Learners can delete a record and its history or erase all local records explicitly.

Reading completion, quiz self-checks, course notes and criterion self-assessments remain separate. Missing evidence is not yet demonstrated. No self-rating, saved attempt, elapsed time or reminder marks a competency verified or overrides prerequisites.

## Rubric versions and historical snapshots

The compiler adds `evidence_rubric` to each authored lesson in public `curriculum.json`:

```text
{version: "sha256:<64 lowercase hexadecimal characters>", criterion, levels}
```

The version is SHA-256 of the UTF-8 canonical JSON object `{competency, criterion, levels}`, with sorted keys, compact separators and unescaped Unicode. Inputs are the lesson's competency ID and evidence criterion plus that competency's seven level descriptions. Unrelated titles, lesson prose and other curriculum changes do not affect the version. A change to any of those three inputs changes it. This is generated metadata; canonical curriculum source records, IDs and review statuses are unchanged.

New attempts capture the current rubric. Imported historical attempts retain their earlier snapshots even when the current criterion or levels differ. Restoring an old snapshot does not rewrite it using today's curriculum. A hash identifies a rubric revision; it is not a signature, academic approval or proof that an imported self-assessment is true. Imports validate the snapshot's structure and version format, not an external reviewer's authority.

## Validation and portability

Version-1 and version-2 backups are accepted. Version 2 must explicitly contain a `portfolios` array, including `[]` when there are no criterion records. An absent collection is rejected rather than interpreted as permission to discard history. New portfolio records are validated strictly before replacing current state. Invalid or over-limit portfolio history rejects the restore rather than silently dropping attempts. Supported fields are projected into the local model; imported `verified`, reviewer or certification fields gain no authority.

- Each portfolio must reference a known authored course/lesson and its mapped competency. Missing or mismatched targets are rejected; stable curriculum IDs must be retained to restore those records.
- Record and attempt IDs use 1–80 ASCII letters, digits or hyphens. Record IDs are unique; attempt IDs are unique across the collection.
- Each record contains 1–50 chronologically ordered attempts, each with a valid calendar date, non-empty note, allowed judgement, valid reassessment date and complete rubric snapshot. Equal-date attempts are allowed.
- Limits are 200 portfolio records; 4,000 characters per note and criterion; seven non-empty rubric levels of at most 2,000 characters each. Existing course-note handling remains separate.
- The complete serialised backup must fit within 5 MiB of UTF-8 JSON. An operation exceeding that cap is rejected without truncating history. Export before deliberately removing records to free space.

Download backups before changing browser profiles, origins or devices. Files contain private records and should be kept securely outside this public repository. Deleting browser records does not delete downloaded copies.

## Unreadable stored records and recovery

If existing storage contains invalid JSON, an unsupported future version or data that cannot be restored safely, the application preserves the original raw value and blocks writes that could replace it. Data & settings offers an original-data recovery download. This copies the stored text for recovery; it may not itself be a valid importable backup.

Keep that recovery copy before troubleshooting. Restore a corrected supported backup or explicitly erase the local records to resume writing. Failed or cancelled restores preserve the original stored value. Do not treat a temporary empty display as permission to discard an unreadable record. Ordinary browser storage failures are also reported; records are not encrypted or protected from others using the same profile.

The [assessment policy](../framework/assessment-policy.md) and [review policy](../framework/review-policy.md) still apply. Human pilot, independent academic review, accounts, sync and mentor decisions remain separate work.

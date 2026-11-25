# Interoperability design

Canonical IDs: faculty IDs (PHY), stable course IDs (PHY-101), lesson IDs scoped by course (L01), global competency IDs (PHY-101.L01). Existing INT.learning remains a legacy umbrella competency. Prerequisite edges connect course IDs. Outcomes, evidence, rubric levels and assessment links are separately represented.

1EdTech CASE is a future interchange target: map faculty hierarchy and competency records to framework/item entities, parent-child and prerequisite relationships to associations, and rubric levels to the appropriate proficiency metadata. Use persistent URI identifiers and a version mapping when implementing an adapter. This repository does not implement or certify CASE compliance. See https://standards.1edtech.org/case/.

Course delivery remains replaceable: Markdown/LiaScript, Astro or Moodle adapters may consume canonical syllabus records. Do not make LMS completion equivalent to mastery. Keep private learner data separate. No adapter is deployed in v0.2.

import json
import tempfile
import unittest
from pathlib import Path
from tools.build import compile_data, build, extract_sections, evidence_rubric, ROOT

class PlatformTests(unittest.TestCase):
    def test_compiler_uses_canonical_curriculum(self):
        data = compile_data()
        self.assertEqual(len(data["faculties"]), 16)
        self.assertEqual(len(data["courses"]), 134)
        authored = [c for c in data["courses"] if c["authored"]]
        self.assertGreaterEqual(len(authored), 10)
        self.assertEqual(len(data["frameworks"]), sum(len(c["lessons"]) for c in authored))
        for c in authored:
            for l in c["lessons"]:
                self.assertTrue(l["sections"])
                self.assertTrue(l["assessment_record"]["questions"])
                self.assertTrue(l["source_record"]["claims"])
                self.assertRegex(l["evidence_rubric"]["version"], r"^sha256:[a-f0-9]{64}$")
                self.assertEqual(l["evidence_rubric"]["criterion"], l["evidence_criterion"])
                competency = next(item for item in data["competencies"] if item["id"] == l["competency"])
                self.assertEqual(l["evidence_rubric"], evidence_rubric(competency, l["evidence_criterion"]))
                self.assertFalse(any("<details>" in s["body"] for s in l["sections"]))
        for c in data["courses"]:
            if not c["authored"]:
                self.assertTrue(all("sections" not in l for l in c["lessons"]))

    def test_answers_not_in_reader_sections(self):
        sections = extract_sections("## Teaching\nContent\n<details><summary>Answers</summary>\nSecret answer\n</details>\n## Review\nNext")
        self.assertNotIn("Secret answer", str(sections))
        self.assertEqual([s["title"] for s in sections], ["Teaching", "Review"])

    def test_build_exports_only_public_curriculum(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp)
            build(ROOT, out)
            self.assertEqual({p.name for p in out.iterdir()}, {"index.html","style.css","app.js","state.mjs","tutor.mjs","portfolio.mjs","curriculum.json"})
            data = json.loads((out / "curriculum.json").read_text())
            self.assertEqual(data["version"], "0.5.0")
            self.assertNotIn("learner", data)

    def test_rubric_versions_track_assessment_content(self):
        competency = {"id": "INT-101.L01", "title": "A title", "levels": [str(i) for i in range(7)]}
        original = evidence_rubric(competency, "Explain and apply the idea.")
        self.assertEqual(original, evidence_rubric({**competency, "title": "Unrelated title"}, "Explain and apply the idea."))
        self.assertNotEqual(original["version"], evidence_rubric(competency, "Explain a different criterion.")["version"])
        self.assertNotEqual(original["version"], evidence_rubric({**competency, "id": "INT-101.L02"}, "Explain and apply the idea.")["version"])
        changed = {**competency, "levels": ["Changed level"] + competency["levels"][1:]}
        self.assertNotEqual(original["version"], evidence_rubric(changed, "Explain and apply the idea.")["version"])
        original["levels"][0] = "A caller's edit"
        self.assertEqual(competency["levels"][0], "0")

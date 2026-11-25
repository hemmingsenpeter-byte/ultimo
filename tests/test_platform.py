import json
import tempfile
import unittest
from pathlib import Path
from tools.build import compile_data, build, extract_sections, ROOT

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
            self.assertEqual({p.name for p in out.iterdir()}, {"index.html","style.css","app.js","state.mjs","tutor.mjs","curriculum.json"})
            data = json.loads((out / "curriculum.json").read_text())
            self.assertEqual(data["version"], "0.5.0")
            self.assertNotIn("learner", data)

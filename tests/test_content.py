import json
import shutil
import tempfile
import unittest
from pathlib import Path
from tools.validate_content import ROOT, validate_content

class ContentTests(unittest.TestCase):
    def test_semester_content(self):
        courses, lessons, questions = validate_content()
        self.assertGreaterEqual(courses, 10)
        self.assertGreaterEqual(lessons, 40)
        self.assertGreaterEqual(questions, 120)

    def mutate(self, file, change):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            for folder in ("framework", "library", "curriculum", "pathways"):
                shutil.copytree(ROOT / folder, root / folder)
            path = root / file
            data = json.loads(path.read_text(encoding="utf-8"))
            change(data)
            path.write_text(json.dumps(data), encoding="utf-8")
            with self.assertRaises(ValueError):
                validate_content(root)

    def test_missing_questions(self):
        self.mutate("curriculum/INT-101/L01.assessment.json", lambda a: a["questions"].clear())

    def test_unknown_reference(self):
        self.mutate("curriculum/INT-101/L01.sources.json", lambda a: a["claims"][0]["source_ids"].append("unknown"))

    def test_wrong_semester_order(self):
        self.mutate("pathways/semester-one.json", lambda a: a["courses"].reverse())

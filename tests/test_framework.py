import json
import shutil
import tempfile
import unittest
from pathlib import Path
from tools.validate_framework import ROOT, validate_framework

class FrameworkTests(unittest.TestCase):
    def test_full_coverage(self):
        courses, lessons, competencies = validate_framework()
        self.assertEqual(courses, 134)
        self.assertEqual(lessons, 536)
        self.assertEqual(competencies, 537)

    def mutate(self, file, change):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            for folder in ("framework", "library", "schemas", "curriculum", "pathways"):
                shutil.copytree(ROOT / folder, root / folder)
            path = root / file
            data = json.loads(path.read_text(encoding="utf-8"))
            change(data)
            path.write_text(json.dumps(data), encoding="utf-8")
            with self.assertRaises(ValueError):
                validate_framework(root)

    def test_unknown_prerequisite(self):
        self.mutate("curriculum/INT-101/syllabus.json", lambda s: s["prerequisites"].append("BAD-999"))

    def test_cycle(self):
        self.mutate("curriculum/INT-101/syllabus.json", lambda s: s["prerequisites"].append("INT-101"))

    def test_missing_assessment_mapping(self):
        self.mutate("curriculum/INT-101/syllabus.json", lambda s: s["assessment"]["criteria"].pop())

    def test_false_authorship(self):
        self.mutate("curriculum/PHY-101/syllabus.json", lambda s: s["lessons"][0].update(content_status="draft"))

    def test_missing_pathway_course(self):
        self.mutate("pathways/five-year.json", lambda y: y[0]["courses"].pop())

    def test_unknown_reading(self):
        self.mutate("curriculum/INT-101/syllabus.json", lambda s: s["reading"].append("unknown"))

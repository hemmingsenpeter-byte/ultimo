import json
import shutil
import tempfile
import unittest
from pathlib import Path
from tools.validate import ROOT, validate, indexed

class CurriculumTests(unittest.TestCase):
    def test_valid_catalogue(self):
        total, authored = validate()
        self.assertGreaterEqual(total, 100)
        self.assertGreaterEqual(authored, 1)

    def test_duplicate_id(self):
        with self.assertRaises(ValueError):
            indexed([{"id":"X"}, {"id":"X"}])

    def test_unknown_reference(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            for folder in ("framework", "library", "schemas", "curriculum"):
                shutil.copytree(ROOT / folder, root / folder)
            path = root / "curriculum/INT-101/course.json"
            course = json.loads(path.read_text())
            course["reading"].append("not-a-source")
            path.write_text(json.dumps(course))
            with self.assertRaises(ValueError):
                validate(root)

    def test_cycle(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            for folder in ("framework", "library", "schemas", "curriculum"):
                shutil.copytree(ROOT / folder, root / folder)
            path = root / "curriculum/INT-101/course.json"
            course = json.loads(path.read_text())
            course["prerequisites"] = ["INT-101"]
            path.write_text(json.dumps(course))
            with self.assertRaises(ValueError):
                validate(root)

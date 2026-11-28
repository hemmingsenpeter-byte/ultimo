"""Exercise actual packaging, privacy boundaries and the extracted stdlib launcher."""
import hashlib
import json
from pathlib import Path
import re
import selectors
import shutil
import socket
import subprocess
import sys
import tempfile
import unittest
from urllib.error import HTTPError
from urllib.request import urlopen
import zipfile

from tools.build import ROOT, compile_data
from tools.build_pilot import build_pilot


class PilotPackageTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temporary = tempfile.TemporaryDirectory(prefix="ultimo-pilot-test-")
        cls.addClassCleanup(cls.temporary.cleanup)
        cls.folder = Path(cls.temporary.name)
        cls.source = cls.folder / "source"
        cls.source.mkdir()
        for name in ("platform", "curriculum", "framework", "library", "pathways", "schemas"):
            shutil.copytree(ROOT / name, cls.source / name)
        (cls.source / "pilot").mkdir()
        for name, content in {
            "fictional-fixture.json": '{"version":1,"completed":{},"reviews":{},"quizzes":{},"evidence":[],"hours":5,"last":null,"studyPlan":"foundation"}',
            "participant-tasks.md": "Fictional participant tasks for a later session.\n",
            "facilitator.md": "A facilitator guide; no session completed.\n",
            "feedback.csv": "session,task,outcome\n",
        }.items():
            (cls.source / "pilot" / name).write_text(content, encoding="utf-8")
        # Deliberately put private-looking files adjacent to every relevant boundary.
        (cls.source / ".env").write_text("PRIVATE_SENTINEL", encoding="utf-8")
        (cls.source / "learner-data").mkdir()
        (cls.source / "learner-data" / "records.json").write_text("PRIVATE_SENTINEL", encoding="utf-8")
        (cls.source / "pilot" / "private-notes.txt").write_text("PRIVATE_SENTINEL", encoding="utf-8")
        (cls.source / "dist").mkdir()
        (cls.source / "dist" / "private-export.json").write_text("PRIVATE_SENTINEL", encoding="utf-8")
        cls.archive = build_pilot(cls.source, cls.folder / "kit.zip")

    def test_exact_public_manifest_and_canonical_curriculum(self):
        expected = {
            "site/index.html", "site/style.css", "site/app.js", "site/state.mjs", "site/tutor.mjs", "site/portfolio.mjs", "site/curriculum.json",
            "pilot/fictional-fixture.json", "pilot/participant-tasks.md", "pilot/facilitator.md", "pilot/feedback.csv",
            "README.md", "start-pilot.py", "manifest.json",
        }
        with zipfile.ZipFile(self.archive) as archive:
            self.assertEqual(set(archive.namelist()), expected)
            self.assertTrue(all("PRIVATE_SENTINEL" not in archive.read(name).decode("utf-8") for name in archive.namelist()))
            manifest = json.loads(archive.read("manifest.json"))
            data = json.loads(archive.read("site/curriculum.json"))
            self.assertEqual(data, compile_data(ROOT))
            self.assertEqual(manifest["curriculum_version"], data["version"])
            self.assertEqual(set(manifest["files"]), expected - {"manifest.json"})
            for name, record in manifest["files"].items():
                self.assertEqual(record["bytes"], len(archive.read(name)))
                self.assertEqual(record["sha256"], hashlib.sha256(archive.read(name)).hexdigest())
            compile(archive.read("start-pilot.py"), "start-pilot.py", "exec")

    def test_identical_inputs_produce_identical_archive_bytes(self):
        second = build_pilot(self.source, self.folder / "second.zip")
        self.assertEqual(self.archive.read_bytes(), second.read_bytes())

    def test_missing_or_redirected_material_fails_without_replacing_output(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            material = root / "pilot"
            material.mkdir()
            output = root / "existing.zip"
            output.write_bytes(b"existing package must survive failure")
            with self.assertRaisesRegex(ValueError, "unsafe pilot material"):
                build_pilot(root, output)
            self.assertEqual(output.read_bytes(), b"existing package must survive failure")
            (material / "fictional-fixture.json").symlink_to(self.source / ".env")
            with self.assertRaisesRegex(ValueError, "unsafe pilot material"):
                build_pilot(root, output)
            self.assertEqual(output.read_bytes(), b"existing package must survive failure")
            (material / "fictional-fixture.json").unlink()
            material.rmdir()
            material.symlink_to(self.source / "pilot", target_is_directory=True)
            with self.assertRaisesRegex(ValueError, "Unsafe pilot material directory"):
                build_pilot(root, output)
            self.assertEqual(output.read_bytes(), b"existing package must survive failure")


    def test_redirected_frontend_lesson_and_input_directories_cannot_leak_into_package(self):
        for relative in ("platform/app.js", "curriculum/INT-101/L01.md", "curriculum/INT-101", "library"):
            with self.subTest(path=relative), tempfile.TemporaryDirectory() as temporary:
                path = self.source / relative
                moved = Path(temporary) / "original"
                path.rename(moved)
                target = self.source / ".env"
                if moved.is_dir():
                    target = Path(temporary) / "private-directory"
                    target.mkdir()
                    (target / "private-records.json").write_text("PRIVATE_SENTINEL", encoding="utf-8")
                path.symlink_to(target, target_is_directory=moved.is_dir())
                old_archive = self.archive.read_bytes()
                try:
                    with self.assertRaisesRegex(ValueError, "[Uu]nsafe canonical input"):
                        build_pilot(self.source, self.archive)
                    self.assertEqual(self.archive.read_bytes(), old_archive)
                finally:
                    path.unlink()
                    moved.rename(path)

    def test_extracted_launcher_uses_free_loopback_port_and_serves_only_public_files(self):
        with tempfile.TemporaryDirectory() as temporary, socket.socket() as occupied:
            extracted = Path(temporary) / "extracted"
            with zipfile.ZipFile(self.archive) as archive:
                archive.extractall(extracted)
            occupied.bind(("127.0.0.1", 0))
            occupied.listen()
            preferred = occupied.getsockname()[1]
            process = subprocess.Popen(
                [sys.executable, str(extracted / "start-pilot.py"), "--port", str(preferred)],
                cwd=temporary, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True,
            )
            try:
                with selectors.DefaultSelector() as selector:
                    selector.register(process.stdout, selectors.EVENT_READ)
                    self.assertTrue(selector.select(timeout=10), "Launcher did not print its URL")
                first = process.stdout.readline()
                match = re.fullmatch(r"Ultimo pilot: http://localhost:(\d+)/\n", first)
                self.assertIsNotNone(match, first)
                chosen = int(match.group(1))
                self.assertNotEqual(chosen, preferred)
                self.assertIn("Fictional fixture download:", process.stdout.readline())
                self.assertIn(f"Bound to 127.0.0.1:{chosen}", process.stdout.readline())
                origin = f"http://127.0.0.1:{chosen}"
                with urlopen(origin + "/", timeout=5) as response:
                    self.assertIn(b"Ultimo", response.read())
                with urlopen(origin + "/curriculum.json", timeout=5) as response:
                    self.assertEqual(json.load(response)["version"], "0.5.0")
                with urlopen(origin + "/pilot-fixture.json", timeout=5) as response:
                    self.assertIn("attachment", response.headers["Content-Disposition"])
                    self.assertEqual(json.load(response)["studyPlan"], "foundation")
                for path in ("/README.md", "/pilot/fictional-fixture.json", "/../pilot/feedback.csv", "/%2e%2e/README.md", "/api/tutor/status"):
                    with self.assertRaises(HTTPError, msg=path) as error:
                        urlopen(origin + path, timeout=5)
                    self.assertEqual(error.exception.code, 404, path)
                # Even a later accidental symlink cannot make a private file downloadable.
                private = Path(temporary) / "private.txt"
                private.write_text("PRIVATE_SENTINEL", encoding="utf-8")
                (extracted / "site" / "app.js").unlink()
                (extracted / "site" / "app.js").symlink_to(private)
                with self.assertRaises(HTTPError) as error:
                    urlopen(origin + "/app.js", timeout=5)
                self.assertEqual(error.exception.code, 403)
            finally:
                process.terminate()
                process.communicate(timeout=5)


if __name__ == "__main__":
    unittest.main()

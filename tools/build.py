"""Compile the canonical curriculum to a portable, dependency-free static site."""
import json
import re
import shutil
from pathlib import Path
if __package__:
    from .validate import ROOT, validate
    from .validate_framework import validate_framework
    from .validate_content import validate_content
else:
    from validate import ROOT, validate
    from validate_framework import validate_framework
    from validate_content import validate_content

def read(path):
    return json.loads(path.read_text(encoding="utf-8"))

def extract_sections(text):
    """Split known Markdown headings, withholding inline answer key from lesson display."""
    text = re.sub(r"<details>.*?</details>", "", text, flags=re.S | re.I)
    sections = []
    current = {"title": "", "body": ""}
    for line in text.splitlines():
        if line.startswith("## ") or line.startswith("### "):
            if current["body"].strip() or current["title"]:
                sections.append(current)
            current = {"title": line.lstrip("# ").strip(), "body": ""}
        else:
            current["body"] += line + "\n"
    if current["body"].strip() or current["title"]:
        sections.append(current)
    return sections

def compile_data(root=ROOT):
    catalogue = read(root / "framework/catalogue.json")
    courses = []
    frameworks = []
    for entry in catalogue:
        folder = root / "curriculum" / entry["id"]
        syllabus = read(folder / "syllabus.json")
        authored = (folder / "course.json").is_file()
        course = {**syllabus, "authored": authored}
        if authored:
            course["overview"] = (folder / "README.md").read_text(encoding="utf-8")
            course["capstone"] = (folder / "assessment.md").read_text(encoding="utf-8")
            for lesson in course["lessons"]:
                lid = lesson["id"]
                key = entry["id"] + "." + lid
                lesson["sections"] = extract_sections((folder / (lid + ".md")).read_text(encoding="utf-8"))
                lesson["assessment_record"] = read(folder / (lid + ".assessment.json"))
                lesson["source_record"] = read(folder / (lid + ".sources.json"))
                section = next((s["body"].strip() for s in lesson["sections"] if s["title"] == "Framework"), "")
                if section:
                    frameworks.append({"id": key, "course": entry["id"], "title": lesson["title"], "body": section, "status": "draft"})
        courses.append(course)
    return {"version": "0.5.0", "faculties": read(root / "framework/faculties.json"),
            "courses": courses, "sources": read(root / "library/sources.json"),
            "competencies": read(root / "framework/competencies.json"),
            "levels": read(root / "framework/levels.json"), "frameworks": frameworks,
            "pathway": read(root / "pathways/five-year.json"),
            "semester": read(root / "pathways/semester-one.json")["courses"]}

def build(root=ROOT, out=None):
    validate(root)
    validate_framework(root)
    validate_content(root)
    out = Path(out) if out is not None else root / "dist"
    out.mkdir(parents=True, exist_ok=True)
    for filename in ("index.html", "style.css", "app.js", "state.mjs", "tutor.mjs"):
        shutil.copyfile(root / "platform" / filename, out / filename)
    data = compile_data(root)
    (out / "curriculum.json").write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"Built Ultimo {data['version']}: {len(data['courses'])} courses, {len(data['frameworks'])} draft frameworks.")
    return data

if __name__ == "__main__":
    build()

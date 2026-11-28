"""Compile the canonical curriculum to a portable, dependency-free static site."""
import hashlib
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

def evidence_rubric(competency, criterion):
    """Version the exact public criteria recorded with a learner's own attempt."""
    payload = {"competency": competency["id"], "criterion": criterion, "levels": competency["levels"]}
    encoded = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return {"version": "sha256:" + hashlib.sha256(encoded).hexdigest(),
            "criterion": criterion, "levels": list(competency["levels"])}

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
    competencies = read(root / "framework/competencies.json")
    competency_map = {item["id"]: item for item in competencies}
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
                lesson["evidence_rubric"] = evidence_rubric(competency_map[lesson["competency"]], lesson["evidence_criterion"])
                section = next((s["body"].strip() for s in lesson["sections"] if s["title"] == "Framework"), "")
                if section:
                    frameworks.append({"id": key, "course": entry["id"], "title": lesson["title"], "body": section, "status": "draft"})
        courses.append(course)
    return {"version": "0.5.0", "faculties": read(root / "framework/faculties.json"),
            "courses": courses, "sources": read(root / "library/sources.json"),
            "competencies": competencies,
            "levels": read(root / "framework/levels.json"), "frameworks": frameworks,
            "pathway": read(root / "pathways/five-year.json"),
            "semester": read(root / "pathways/semester-one.json")["courses"]}

def build(root=ROOT, out=None):
    validate(root)
    validate_framework(root)
    validate_content(root)
    out = Path(out) if out is not None else root / "dist"
    out.mkdir(parents=True, exist_ok=True)
    for filename in ("index.html", "style.css", "app.js", "state.mjs", "tutor.mjs", "portfolio.mjs"):
        shutil.copyfile(root / "platform" / filename, out / filename)
    data = compile_data(root)
    (out / "curriculum.json").write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"Built Ultimo {data['version']}: {len(data['courses'])} courses, {len(data['frameworks'])} draft frameworks.")
    return data

if __name__ == "__main__":
    build()

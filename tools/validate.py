"""Validate canonical v0.1 records (stdlib only; not full JSON Schema validation)."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def load(root, path):
    return json.loads((root / path).read_text(encoding="utf-8"))

def indexed(records):
    result = {}
    for record in records:
        key = record["id"]
        if key in result:
            raise ValueError(f"Duplicate ID: {key}")
        result[key] = record
    return result

def validate(root=ROOT):
    faculties = indexed(load(root, "framework/faculties.json"))
    catalog = indexed(load(root, "framework/catalogue.json"))
    competencies = indexed(load(root, "framework/competencies.json"))
    sources = indexed(load(root, "library/sources.json"))
    levels = load(root, "framework/levels.json")
    if len(faculties) != 16 or [x["level"] for x in levels] != list(range(7)):
        raise ValueError("Expected sixteen faculties and levels 0–6")
    for key, row in catalog.items():
        if not re.fullmatch(r"[A-Z]{3}-\d{3}", key) or row["faculty"] not in faculties or not key.startswith(row["faculty"] + "-"):
            raise ValueError(f"Invalid catalogue entry: {key}")
    for comp in competencies.values():
        if comp["faculty"] not in faculties or len(comp["levels"]) != 7:
            raise ValueError("Invalid competency")
    courses = indexed([json.loads(p.read_text(encoding="utf-8")) for p in sorted((root / "curriculum").glob("*/course.json"))])
    if not courses:
        raise ValueError("No courses")
    required = set(load(root, "schemas/course.schema.json")["required"])
    for key, course in courses.items():
        if set(course) != required or key not in catalog or course["faculty"] != catalog[key]["faculty"] or course["title"] != catalog[key]["title"]:
            raise ValueError(f"Invalid course metadata: {key}")
        if type(course["target_level"]) is not int or not 0 <= course["target_level"] <= 6 or course["estimated_hours"] <= 0:
            raise ValueError("Invalid level or hours")
        if course["status"] not in load(root, "schemas/course.schema.json")["properties"]["status"]["enum"] or course["status"] != catalog[key]["status"]:
            raise ValueError("Invalid or mismatched status")
        for field, allowed in (("prerequisites", catalog), ("competencies", competencies), ("reading", sources)):
            values = course[field]
            if (field != "prerequisites" and not values) or len(set(values)) != len(values) or any(v not in allowed for v in values):
                raise ValueError(f"Invalid {field}: {key}")
        folder = root / "curriculum" / key
        for filename in ("README.md", "assessment.md"):
            if not (folder / filename).is_file():
                raise ValueError(f"Missing {filename}: {key}")
        lessons = indexed(course["lessons"])
        if not lessons:
            raise ValueError("No lessons")
        for lid, lesson in lessons.items():
            if not re.fullmatch(r"L\d{2}", lid) or lesson["path"] != lid + ".md" or not (folder / lesson["path"]).is_file():
                raise ValueError(f"Missing or invalid lesson: {key}/{lid}")
    def visit(key, stack, done):
        if key in stack:
            raise ValueError("Prerequisite cycle: " + key)
        if key in done or key not in courses:
            return
        for dep in courses[key]["prerequisites"]:
            visit(dep, stack | {key}, done)
        done.add(key)
    done = set()
    for key in courses:
        visit(key, set(), done)
    return len(catalog), len(courses)

if __name__ == "__main__":
    planned, authored = validate()
    print(f"Validated {planned} catalogue entries; {authored} authored course(s).")

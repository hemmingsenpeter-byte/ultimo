"""Cross-record checks for the v0.2 educational framework; no third-party dependencies."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def read(root, path):
    return json.loads((root / path).read_text(encoding="utf-8"))

def index(records):
    result = {}
    for row in records:
        if row["id"] in result:
            raise ValueError("Duplicate ID: " + row["id"])
        result[row["id"]] = row
    return result

def require(condition, message):
    if not condition:
        raise ValueError(message)

def validate_framework(root=ROOT):
    cat = index(read(root, "framework/catalogue.json"))
    fac = index(read(root, "framework/faculties.json"))
    comp = index(read(root, "framework/competencies.json"))
    sources = index(read(root, "library/sources.json"))
    require(len(fac) == 16, "Faculty coverage")
    for f in fac.values():
        require(bool(f["mission"] and f["reviewer_profile"] and f["reading"]), "Faculty incomplete")
        require(set(f["reading"]) <= sources.keys(), "Unknown faculty reading")
    syllabus = index([json.loads(p.read_text(encoding="utf-8")) for p in sorted((root / "curriculum").glob("*/syllabus.json"))])
    require(syllabus.keys() == cat.keys(), "Catalogue and syllabus coverage differ")
    linked = set()
    lesson_count = 0
    schema_required = set(read(root, "schemas/syllabus.schema.json")["required"])
    for cid, s in syllabus.items():
        row = cat[cid]
        require(schema_required <= s.keys(), "Missing syllabus fields: " + cid)
        require(s["schema_version"] == "0.2.0" and s["framework_status"] == "defined", "Framework version/status: " + cid)
        require((s["title"], s["faculty"], s["content_status"], s["year"]) == (row["title"], row["faculty"], row["status"], row["year"]), "Catalogue mismatch: " + cid)
        require(s["faculty"] in fac and type(s["year"]) is int and 1 <= s["year"] <= 5, "Bad faculty/year: " + cid)
        require(s["target_level"] == 2 and s["extension_target_level"] == 3 and s["estimated_hours"] > 0, "Bad study target: " + cid)
        folder = root / "curriculum" / cid
        require(row["syllabus"] == f"curriculum/{cid}/syllabus.json" and (folder / "syllabus.md").is_file(), "Missing course blueprint: " + cid)
        require(len(set(s["prerequisites"])) == len(s["prerequisites"]) and set(s["prerequisites"]) <= syllabus.keys(), "Unknown/duplicate prerequisites: " + cid)
        require(bool(s["reading"]) and set(s["reading"]) <= sources.keys() and len(set(s["reading"])) == len(s["reading"]), "Unknown/duplicate reading: " + cid)
        require(len(s["lessons"]) == 4, "Four lesson blueprints required: " + cid)
        lesson_ids = []
        for i, lesson in enumerate(s["lessons"], 1):
            lid = f"L{i:02}"
            require(lesson["id"] == lid and lesson["sequence"] == i, "Lesson sequence: " + cid)
            require(lesson["prerequisite_lessons"] == lesson_ids[-1:], "Lesson prerequisites: " + cid)
            lesson_ids.append(lid)
            key = cid + "." + lid
            require(lesson["competency"] == key and key in comp and key not in linked, "Competency mapping: " + key)
            record = comp[key]
            require(record["faculty"] == s["faculty"] and record["course"] == cid and record["lesson"] == lid and len(record["levels"]) == 7 and all(record["levels"]), "Rubric mismatch: " + key)
            require(bool(lesson["reading"]) and set(lesson["reading"]) <= sources.keys(), "Lesson reading: " + key)
            require(lesson["estimated_minutes"] > 0 and all(lesson[field].strip() for field in ("outcome", "teaching_focus", "worked_example_brief", "practice", "knowledge_check", "evidence_criterion")), "Empty lesson blueprint: " + key)
            authored = (folder / (lid + ".md")).is_file()
            require((lesson["content_status"] != "not_authored") == authored, "Lesson content status differs from files: " + key)
            linked.add(key)
            lesson_count += 1
        keys = [x["competency"] for x in s["lessons"]]
        require(s["competencies"] == keys and s["learning_outcomes"] == [x["outcome"] for x in s["lessons"]], "Outcome mapping: " + cid)
        criteria = s["assessment"]["criteria"]
        require([x["competency"] for x in criteria] == keys and all(x["criterion"] for x in criteria), "Assessment coverage: " + cid)
        require(all(s["assessment"][k] for k in ("artifact", "mode", "threshold", "alternate_evidence", "reviewer")), "Assessment incomplete: " + cid)
        require(type(s["safety"]["review_required"]) is bool and bool(s["safety"]["notes"]), "Safety incomplete: " + cid)
    require(linked | {"INT.learning"} == comp.keys(), "Unmapped or missing competencies")
    done = set()
    active = set()
    def visit(cid):
        require(cid not in active, "Prerequisite cycle: " + cid)
        if cid in done:
            return
        active.add(cid)
        for dep in syllabus[cid]["prerequisites"]:
            visit(dep)
            require(syllabus[dep]["year"] <= syllabus[cid]["year"], "Prerequisite scheduled too late: " + cid)
        active.remove(cid)
        done.add(cid)
    for cid in syllabus:
        visit(cid)
    years = read(root, "pathways/five-year.json")
    require([y["year"] for y in years] == list(range(1, 6)), "Pathway years")
    scheduled = set()
    for y in years:
        require(bool(y["capstone"]), "Missing annual capstone")
        for cid in y["courses"]:
            require(cid in syllabus and cid not in scheduled and syllabus[cid]["year"] == y["year"], "Pathway mismatch: " + cid)
            require(set(syllabus[cid]["prerequisites"]) <= scheduled, "Pathway ordering: " + cid)
            scheduled.add(cid)
        require(y["estimated_hours"] == sum(syllabus[cid]["estimated_hours"] for cid in y["courses"]), "Hours mismatch")
    require(scheduled == syllabus.keys(), "Pathway coverage")
    return len(syllabus), lesson_count, len(comp)

if __name__ == "__main__":
    courses, lessons, competencies = validate_framework()
    print(f"Framework: {courses} courses, {lessons} lesson blueprints, {competencies} competencies.")

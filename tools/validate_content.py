"""Structural validation of authored Ultimo lessons (not academic review)."""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
SECTIONS = (
    "## Orientation and retrieval", "## Core teaching", "## Framework",
    "## Worked example", "### Contrasting case", "## Guided practice",
    "## Independent transfer", "## Knowledge check",
    "## Review and further reading", "## Safety and accessibility",
)

def read(path):
    return json.loads(path.read_text(encoding="utf-8"))

def require(ok, message):
    if not ok:
        raise ValueError(message)

def validate_content(root=ROOT):
    catalogue = {x["id"]: x for x in read(root / "framework/catalogue.json")}
    sources = {x["id"] for x in read(root / "library/sources.json")}
    semester = read(root / "pathways/semester-one.json")["courses"]
    require(len(semester) == len(set(semester)) == 10, "Semester coverage")
    seen = set()
    for cid in semester:
        s = read(root / "curriculum" / cid / "syllabus.json")
        require(set(s["prerequisites"]) <= seen, "Semester prerequisite order: " + cid)
        seen.add(cid)
    count = 0
    questions = set()
    authored = set()
    for p in sorted((root / "curriculum").glob("*/course.json")):
        c = read(p)
        cid = c["id"]
        authored.add(cid)
        s = read(p.parent / "syllabus.json")
        require(c["status"] == s["content_status"] == catalogue[cid]["status"], "Content status mismatch: " + cid)
        require(c["prerequisites"] == s["prerequisites"] and c["reading"] == s["reading"], "Metadata mismatch: " + cid)
        require([l["id"] for l in c["lessons"]] == [l["id"] for l in s["lessons"]], "Lesson coverage: " + cid)
        require((p.parent / "assessment.md").is_file(), "Missing capstone: " + cid)
        for l in s["lessons"]:
            lid = l["id"]
            key = cid + "." + lid
            body = (p.parent / (lid + ".md")).read_text(encoding="utf-8")
            require(all(h in body for h in SECTIONS), "Missing lesson component: " + key)
            require(len(body.split()) >= 180, "Suspiciously short lesson: " + key)
            a = read(p.parent / (lid + ".assessment.json"))
            r = read(p.parent / (lid + ".sources.json"))
            require(a["lesson"] == r["lesson"] == key and a["competency"] == l["competency"], "Companion record mismatch: " + key)
            require(len(a["questions"]) >= 3, "Insufficient questions: " + key)
            for q in a["questions"]:
                require(q["id"] not in questions and q["competency"] == l["competency"] and q["prompt"].strip() and q["answer"].strip() and q["points"] > 0 and q["feedback"], "Question mismatch: " + key)
                questions.add(q["id"])
            require(bool(r["claims"]), "Missing reference map: " + key)
            for claim in r["claims"]:
                require(bool(claim["claim"]) and bool(claim["source_ids"]) and set(claim["source_ids"]) <= sources, "Unknown source: " + key)
                require({x["source_id"] for x in claim["locators"]} == set(claim["source_ids"]) and all(x["locator"] and x["limitations"] for x in claim["locators"]), "Missing source locator: " + key)
            if c["status"] == "draft":
                require(r["review_required"] and r["status"] == "draft_reference_mapping", "Draft source review mismatch: " + key)
            count += 1
    require(set(semester) <= authored, "Missing semester course")
    require(authored == {cid for cid, row in catalogue.items() if row["status"] != "planned"}, "Catalogue authorship mismatch")
    return len(authored), count, len(questions)

if __name__ == "__main__":
    c, l, q = validate_content()
    print(f"Authored content: {c} courses, {l} lessons, {q} knowledge-check questions.")
